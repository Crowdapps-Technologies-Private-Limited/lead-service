import { decryptPassword } from './../../utils/encryptionAndDecryption';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import AWS from 'aws-sdk';
const { CognitoIdentityServiceProvider } = AWS;
const cognito = new CognitoIdentityServiceProvider();
import {
    INSERT_LOG,
    GET_LEAD_CUSTOMER_BY_LEAD_ID,
    UPDATE_CUSTOMER_WITH_CREDENTIAL,
    CREATE_CONFIRMATION_TABLES,
    INSERT_CONFIRMATION,
    GET_QUOTE_SERVICES,
    INSERT_CONFIRMATION_SERVICES,
    DELETE_CONFIRMATION_BY_LEAD_ID,
    GET_CONFIRMATION_BY_LEAD_ID,
    GET_CUSTOMER_BY_EMAIL, // Make sure this query is added to your SQL scripts
} from '../../sql/sqlScript';
import { getErrorMessage, getMessage } from '../../utils/errorMessages';
import { generateEmail } from '../../utils/generateEmailService';
import { generateRandomPassword, generateRandomString } from '../../utils/generateRandomPassword';
import { getconfigSecrets } from '../../utils/getConfig';
import { encryptPassword } from '../../utils/encryptionAndDecryption';

export const sendConfirmationEmail = async (leadId: string, tenant: any, user: any) => {
    logger.info('Sending confirmation email to customer');
    logger.info('leadId:', { leadId });
    logger.info('tenant:', { tenant });
    logger.info('user:', { user });

    const config = await getconfigSecrets();
    const client = await connectToDatabase();
    const schema = tenant.schema;
    let cognitoSub: string | null = null;

    try {
        // Check if tenant is suspended
        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        await client.query(`SET search_path TO ${schema}`);

        // Check if lead exists
        const leadCheckResult = await client.query(GET_LEAD_CUSTOMER_BY_LEAD_ID, [leadId]);

        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }

        const leadData = leadCheckResult.rows[0];
        logger.info('Lead check result:', { leadData });
        const userName = leadData?.customer_name?.replace(/\s+/g, '').toLowerCase() + generateRandomString();
        const email = leadData?.customer_email;
        logger.info('Customer email:', { email });
        logger.info('Customer username:', { userName });
        if (!email) {
            throw new Error(getErrorMessage('CUSTOMER_NOT_FOUND', 'Email not found'));
        }

        // Start transaction
        await client.query('BEGIN');

        // Check if the email already exists in AWS Cognito
        let password = '';
        let customer = null;

        try {
            const usersByEmail = await cognito
                .listUsers({
                    UserPoolId: config.cognitoUserPoolId,
                    Filter: `email = "${email}"`,
                })
                .promise();

            if (usersByEmail.Users?.length) {
                // Email already exists in Cognito;
                logger.info(`The email "${email}" is already registered in Cognito`);
                const customerResult = await client.query(GET_CUSTOMER_BY_EMAIL, [email]);
                logger.info('Customer result:', { customerResult });
                if (customerResult.rows.length > 0) {
                    customer = customerResult.rows[0] as any;
                    if (customer.password) {
                        password = decryptPassword(customer.password);
                    } else {
                        throw new Error(getMessage('CUSTOMER_PASSWORD_NOT_FOUND'));
                    }
                  
                } else {
                    throw new Error(getMessage('CUSTOMER_NOT_FOUND'));
                }
            } else {
                // If the email doesn't exist in Cognito, create a new user
                logger.info(`The email "${email}" is unique in Cognito`);
                password = generateRandomPassword();

                // Sign up user in Cognito
                let signUpResult;
                try {
                    signUpResult = await cognito
                        .signUp({
                            ClientId: config.cognitoAppClientId as string,
                            Username: userName,
                            Password: password,
                            UserAttributes: [
                                { Name: 'email', Value: email },
                                { Name: 'name', Value: userName },
                                { Name: 'custom:role', Value: 'CUSTOMER' },
                                { Name: 'custom:tenant_id', Value: tenant.id },
                            ],
                        })
                        .promise();
                    logger.info('User signed up in Cognito');
                } catch (signUpError) {
                    logger.error('Error during Cognito sign-up:', signUpError);
                    throw new Error(getMessage('COGNITO_SIGNUP_FAILED'));
                }

                // Get cognitoSub from signUpResult
                if (signUpResult && signUpResult.UserSub) {
                    cognitoSub = signUpResult.UserSub;
                } else {
                    throw new Error(getMessage('COGNITO_SIGNUP_NO_SUB'));
                }

                // Confirm the user in Cognito
                await cognito
                    .adminConfirmSignUp({
                        UserPoolId: config.cognitoUserPoolId,
                        Username: userName,
                    })
                    .promise();
                logger.info('User confirmed in Cognito');

                await cognito
                    .adminUpdateUserAttributes({
                        UserPoolId: config.cognitoUserPoolId,
                        Username: userName,
                        UserAttributes: [{ Name: 'email_verified', Value: 'true' }],
                    })
                    .promise();
                logger.info('User attributes updated successfully in Cognito');

                // Encrypt the password
                const encryptedPassword = encryptPassword(password);
                logger.info('Encrypted password generated');

                // Update customer with credentials
                await client.query(UPDATE_CUSTOMER_WITH_CREDENTIAL, [
                    encryptedPassword,
                    cognitoSub,
                    tenant.id,
                    userName,
                    user.sub,
                    leadData.customer_id, // Assuming you have customer id as result.id
                ]);
                logger.info('Customer updated with Cognito credentials');
            }

            // Generate confirmation email
            logger.info('Sending confirmation email to customer');
            await generateEmail('Confirmation Email', leadData?.customer_email, {
                username: leadData?.customer_name,
                lead: leadId,
                email: leadData?.customer_email,
                password: password,
            });
            logger.info('Confirmation email sent');

            // Insert log
            await client.query(INSERT_LOG, [
                tenant.id,
                leadData?.customer_name,
                leadData?.customer_email,
                `Confirmation Email sent to customer`,
                'CONFIRMATION',
                leadCheckResult.rows[0].status,
                leadId,
            ]);
            logger.info('Log entry created successfully');

            // Create confirmation tables if they don't exist
            await client.query(CREATE_CONFIRMATION_TABLES);
            logger.info('Confirmation tables created successfully');

            // Check if confirmation already exists and is not submitted
            const confirmationCheckResult = await client.query(GET_CONFIRMATION_BY_LEAD_ID, [leadId]);
            if (
                confirmationCheckResult.rows.length > 0 &&
                confirmationCheckResult.rows[0].moving_on_status !== 'fixed'
            ) {
                await client.query(DELETE_CONFIRMATION_BY_LEAD_ID, [leadId]);
                logger.info('Previous unsubmitted confirmation deleted');
            }

            // Insert new confirmation record
            const quoteDataResult = await client.query(GET_QUOTE_SERVICES, [leadId]);
            logger.info('Quote DataResult:', { quoteDataResult });

            if (quoteDataResult.rows.length === 0) {
                throw new Error(getMessage('QUOTE_NOT_FOUND'));
            }

            const { services, notes: quoteNotes, quoteid: quote_id } = quoteDataResult.rows[0];

            logger.info('Quote services retrieved successfully', { services });
            logger.info('Quote notes:', { quoteNotes });
            logger.info('Quote ID:', { quote_id });

            const confirmationResult = await client.query(INSERT_CONFIRMATION, [
                leadData.customer_id, // $1: customer_id
                leadId, // $2: lead_id
                leadData.moving_on_date, // $3: moving_on_date
                leadData.packing_on_date, // $4: packing_on_date
                false, // $5: is_accept_liability_cover
                false, // $6: is_terms_accepted
                false, // $7: is_quotation_accepted
                false, // $8: is_submitted
                false, // $9: is_seen
                quoteNotes, // $10: notes
                user.email, // $11: created_by
                quote_id, // $12: quote_id
            ]);

            const confirmationId = confirmationResult.rows[0].confirmation_id; // Retrieve confirmation_id
            logger.info('Confirmation inserted successfully:', { confirmationId });

            // Insert services into confirmation_services table
            // Custom order for specific services
            const customOrder = ['Door to Door', 'Full Pack'];

            // Custom sorting function
            const sortedServices = services.sort((a, b) => {
                const indexA = customOrder.indexOf(a.serviceName);
                const indexB = customOrder.indexOf(b.serviceName);

                // If both services are in the customOrder, compare their indices
                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }
                // If one of them is in customOrder, it should come first
                if (indexA !== -1) {
                    return -1;
                }
                if (indexB !== -1) {
                    return 1;
                }
                // If neither is in customOrder, maintain original order
                return 0;
            });

            logger.info('Services sorted:', { sortedServices });

            for (const service of sortedServices) {
                await client.query(INSERT_CONFIRMATION_SERVICES, [
                    confirmationId, // $1: confirmation_id
                    service.serviceName, // $2: service_name
                    service.price, // $3: service_cost
                    null, // $4: status (default)
                ]);
            }
            logger.info('Services inserted successfully');

            // Commit transaction
            await client.query('COMMIT');
            return { message: getMessage('EMAIL_SENT') };
        } catch (error: any) {
            logger.error('Failed to send confirmation email', { error });

            // Rollback database transaction
            await client.query('ROLLBACK');

            // Rollback Cognito user creation if Cognito signup succeeded but an error occurred afterward
            if (cognitoSub) {
                try {
                    await cognito
                        .adminDeleteUser({
                            UserPoolId: config.cognitoUserPoolId,
                            Username: cognitoSub,
                        })
                        .promise();
                    logger.info('Cognito user deleted due to rollback');
                } catch (cognitoDeleteError: any) {
                    if (cognitoDeleteError.code === 'UserNotFoundException') {
                        logger.info('Cognito user already deleted or did not exist:', cognitoDeleteError.message);
                    } else {
                        logger.error('Failed to delete Cognito user during rollback', { cognitoDeleteError });
                    }
                }
            }
            throw new Error(`${error.message}`);
        } finally {
            client.end();
        }
    } catch (error: any) {
        logger.error('Failed to send confirmation email due to an error', { error });
        throw new Error(`${error.message}`);
    }
};
