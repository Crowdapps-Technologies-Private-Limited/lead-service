import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import AWS from 'aws-sdk';
import { generatePdfAndUploadToS3 } from './generatePdf';
import { getLatestQuote } from './getLatestQuotes';
import generateQuoteHtml from './generateQuoteHtml';
import { getErrorMessage, getMessage } from '../../utils/errorMessages';
import { getconfigSecrets } from '../../utils/getConfig';
import { encryptPassword, decryptPassword } from '../../utils/encryptionAndDecryption';
import { generateRandomPassword, generateRandomString } from '../../utils/generateRandomPassword';
import {
    INSERT_LOG,
    GET_TERMS_DOC,
    GET_PACKING_DOC,
    GET_LEAD_CUSTOMER_BY_LEAD_ID,
    UPDATE_CUSTOMER_WITH_CREDENTIAL,
    INSERT_CONFIRMATION,
    GET_QUOTE_SERVICES,
    INSERT_CONFIRMATION_SERVICES,
    DELETE_CONFIRMATION_BY_LEAD_ID,
    GET_CONFIRMATION_BY_LEAD_ID,
    GET_CUSTOMER_BY_EMAIL,
    UPDATE_LEAD_STATUS,
    GET_QUOTE_GENERAL_INFO_BY_QUOTE_ID,
    UPDATE_CONFIRMATION_TABLE,
} from '../../sql/sqlScript';
import { sendAttachmentEmail } from '../../utils/sendAttachmentEmail';

const s3 = new AWS.S3();
const { CognitoIdentityServiceProvider } = AWS;
const cognito = new CognitoIdentityServiceProvider();

export const sendQuoteEmailOrPdf = async (leadId: string, quoteId: string, tenant: any, user: any, action: string) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant.schema;
    const cognitoSub: string | null = null;

    logger.info('action:', { action });
    logger.info('leadId:', { leadId });
    const config = await getconfigSecrets();

    try {
        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        await client.query(`SET search_path TO ${schema}`);
        // await client.query(UPDATE_CONFIRMATION_TABLE);
        // Check if lead exists
        const leadCheckResult = await client.query(GET_LEAD_CUSTOMER_BY_LEAD_ID, [leadId]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }

        const leadData = leadCheckResult.rows[0];
        logger.info('Lead data:', { leadData });

        if (leadData.status === 'JOB') {
            throw new Error('Lead status is JOB so cannot send confirmation email');
        }

        const quoteData = await getLatestQuote(leadId, tenant);
        logger.info('quote data', { quoteData });
        const html = await generateQuoteHtml({ client: tenant, lead: leadData, quote: quoteData.data });

        const { pdfUrl, file } = await generatePdfAndUploadToS3({
            html,
            key: 'quotation',
            leadId,
            tenantId: tenant.id,
            folderName: 'quotation',
        });
        if (action === 'pdf') {
            return { message: getMessage('PDF_GENERATED'), data: { pdfUrl } };
        }

        // Load terms and packing documents
        const termPDF = await getSignedDocumentUrl(client, GET_TERMS_DOC, config.s3BucketName);
        const packingGuidePDF = await getSignedDocumentUrl(client, GET_PACKING_DOC, config.s3BucketName);

        const email = leadData?.customer_email;
        if (!email) {
            throw new Error(getErrorMessage('CUSTOMER_NOT_FOUND', 'Email not found'));
        }

        const { customer, password } = await findOrCreateCognitoUser(client, config, leadData, email, tenant);

        // Start transaction
        await client.query('BEGIN');

        // Log, create confirmation, and update lead
        await createConfirmation(
            client,
            leadData,
            leadId,
            quoteId,
            user,
            tenant,
            customer,
            password,
            pdfUrl,
            termPDF,
            packingGuidePDF,
            file,
        );
        // Commit transaction
        await client.query('COMMIT');

        return { message: getMessage('EMAIL_SENT'), data: null };
    } catch (error: any) {
        logger.error('Failed to send confirmation email', { error });
        await client.query('ROLLBACK');

        // Rollback Cognito user creation if necessary
        if (cognitoSub) {
            await rollbackCognitoUser(config, cognitoSub);
        }
        throw new Error(error.message);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};

const getSignedDocumentUrl = async (client: any, query: string, bucketName: string) => {
    const result = await client.query(query);
    const docs = result?.rows;
    if (!docs?.length) {
        logger.info('No document found');
        return '';
    }

    const docKey = docs[0].s3key;
    return s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: docKey,
        Expires: 60 * 60, // 1 hour expiration
    });
};

const findOrCreateCognitoUser = async (client: any, config: any, leadData: any, email: string, tenant: any) => {
    let password = '';
    let cognitoSub: string | null = null;

    // get customer
    const customerResult = await client.query(GET_CUSTOMER_BY_EMAIL, [email]);
    logger.info('customer detail', { customerResult });
    const customer = customerResult.rows[0];

    const usersByUsername = await cognito
        .listUsers({
            UserPoolId: config.cognitoUserPoolId,
            Filter: `name = "${customer?.username}"`,
        })
        .promise();

    if (usersByUsername.Users?.length) {
        password = customer.password ? decryptPassword(customer.password) : '';
    } else {
        password = generateRandomPassword();
        const username = leadData?.customer_name?.replace(/\s+/g, '').toLowerCase() + generateRandomString();
        const signUpResult = await cognito
            .signUp({
                ClientId: config.cognitoAppClientId as string,
                Username: username,
                Password: password,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'name', Value: username },
                    { Name: 'custom:role', Value: 'CUSTOMER' },
                    { Name: 'custom:tenant_id', Value: tenant.id },
                ],
            })
            .promise();

        cognitoSub = signUpResult.UserSub || null;
        await confirmAndVerifyUser(config, username);
        customer.username = username;
        const encryptedPassword = encryptPassword(password);
        await client.query(UPDATE_CUSTOMER_WITH_CREDENTIAL, [
            encryptedPassword,
            cognitoSub,
            tenant.id,
            username,
            tenant.id,
            leadData.customer_id,
        ]);
    }

    return { customer, password };
};

const confirmAndVerifyUser = async (config: any, userName: string) => {
    await cognito
        .adminConfirmSignUp({
            UserPoolId: config.cognitoUserPoolId,
            Username: userName,
        })
        .promise();

    await cognito
        .adminUpdateUserAttributes({
            UserPoolId: config.cognitoUserPoolId,
            Username: userName,
            UserAttributes: [{ Name: 'email_verified', Value: 'true' }],
        })
        .promise();
};

const createConfirmation = async (
    client: any,
    leadData: any,
    leadId: string,
    quoteId: string,
    user: any,
    tenant: any,
    customer: any,
    password: string,
    pdfUrl: string,
    termPDF: string,
    packingGuidePDF: string,
    file: any,
) => {
    logger.info('customer', { customer });
    logger.info('password', { password });
    await client.query(INSERT_LOG, [
        tenant.id,
        leadData?.customer_name,
        leadData?.customer_email,
        `Confirmation Email sent to customer`,
        'CONFIRMATION',
        leadData.status,
        leadId,
    ]);

    const confirmationCheckResult = await client.query(GET_CONFIRMATION_BY_LEAD_ID, [leadId]);
    if (confirmationCheckResult.rows.length > 0 && confirmationCheckResult.rows[0].moving_on_status !== 'fixed') {
        await client.query(DELETE_CONFIRMATION_BY_LEAD_ID, [leadId]);
    }

    const quoteDataResult = await client.query(GET_QUOTE_SERVICES, [quoteId]);
    if (quoteDataResult.rows.length === 0) {
        throw new Error(getMessage('QUOTE_NOT_FOUND'));
    }
    let insurance_amount = 0;
    let insurance_percentage = null;
    let insurance_type = null;
    const generalInfoResult = await client.query(GET_QUOTE_GENERAL_INFO_BY_QUOTE_ID, [quoteId]);
    if (generalInfoResult.rows.length === 0) {
        logger.info('No general info found');
    } else {
        const generalInfo = generalInfoResult.rows[0];
        logger.info('general info', { generalInfo });
        insurance_amount = generalInfo.insurance_amount;
        insurance_percentage = generalInfo.insurance_percentage;
        insurance_type = generalInfo.insurance_type;
    }
    const { services, notes: quoteNotes, quoteid: quote_id } = quoteDataResult.rows[0];
    const confirmationResult = await client.query(INSERT_CONFIRMATION, [
        leadData.customer_id,
        leadId,
        leadData.moving_on_date,
        leadData.packing_on_date,
        false,
        false,
        false,
        false,
        false,
        quoteNotes,
        user.email,
        insurance_amount,
        insurance_percentage,
        insurance_type,
        quote_id,
    ]);

    const confirmationId = confirmationResult.rows[0].confirmation_id;
    for (const service of services) {
        await client.query(INSERT_CONFIRMATION_SERVICES, [confirmationId, service.serviceName, service.price, null]);
    }

    await client.query(UPDATE_LEAD_STATUS, ['QUOTE', leadId]);
    // Prepare the email attachment (PDF file as a buffer)
    const attachments = [
        {
            Name: `${leadId}.pdf`, // Name the file appropriately
            Content: file.toString('base64'), // Convert file buffer to base64
            ContentType: 'application/pdf', // PDF content type
        },
    ];
    await sendAttachmentEmail(
        'Quotation Email',
        leadData?.customer_email,
        {
            name: leadData?.customer_name,
            leadid: leadId,
            pdfurl: pdfUrl,
            clientlogin: 'https://mmym-client-dev.crowdapps.info/',
            termsdoc: termPDF,
            packingguidedoc: packingGuidePDF,
            username: customer.username,
            password,
        },
        attachments,
    );
};

const rollbackCognitoUser = async (config: any, cognitoSub: string) => {
    try {
        await cognito
            .adminDeleteUser({
                UserPoolId: config.cognitoUserPoolId,
                Username: cognitoSub,
            })
            .promise();
        logger.info('Cognito user deleted due to rollback');
    } catch (cognitoDeleteError: any) {
        logger.error('Failed to delete Cognito user during rollback', { cognitoDeleteError });
    }
};
