import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import AWS from 'aws-sdk';
const s3 = new AWS.S3();
import {
    INSERT_LOG,
    GET_LEAD_BY_ID,
    GET_EMAIL_TEMPLATE_BY_EVENT,
    GET_TERMS_DOC,
    GET_PACKING_DOC,
    CREATE_DOC_TABLE_IF_NOT_EXISTS,
} from '../../sql/sqlScript';
import { getLatestEstimates } from './getLatestEstimates ';
import { generatePdfAndUploadToS3 } from './generatePdf';
import generateEstimateHtml from './generateEstimateHtml';
import { generateEmail } from '../../utils/generateEmailService';
import { getMessage } from '../../utils/errorMessages';
import { getconfigSecrets } from '../../utils/getConfig';
import { sendAttachmentEmail } from '../../utils/sendAttachmentEmail';

export const sendEstimateEmail = async (leadId: string, estimateId: string, tenant: any, action: string) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant.schema;

    try {
        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        await client.query(`SET search_path TO ${schema}`);
        await client.query(CREATE_DOC_TABLE_IF_NOT_EXISTS);

        // Check if lead exists
        const leadCheckResult = await client.query(GET_LEAD_BY_ID, [leadId]);

        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }
        // Get estimate data
        const estimateData = await getLatestEstimates(leadId, tenant);

        const html = await generateEstimateHtml({
            client: tenant,
            lead: leadCheckResult.rows[0],
            estimate: estimateData,
        });
        // Generate PDF
        const { pdfUrl, file, s3FileUrl } = await generatePdfAndUploadToS3({
            html,
            key: 'estimation',
            leadId,
            tenantId: tenant.id,
            folderName: 'estimate',
        });
        if (action === 'pdf') {
            return { message: getMessage('PDF_GENERATED'), data: { pdfUrl } };
        }
        const clientLogin = 'https://mmym-client-dev.crowdapps.info/';

        let termPDF = '';
        const termDocsResult = await client.query(GET_TERMS_DOC);
        const termDocs = termDocsResult?.rows;
        if (!termDocs?.length) {
            logger.info('No terms and conditions found');
        } else {
            logger.info('Terms and conditions found:', { termDocs });
            termPDF = termDocs[0].s3key;
        }

        if (termPDF) {
            const config = await getconfigSecrets();

            // Generate signed URL for the photo
            termPDF = s3.getSignedUrl('getObject', {
                Bucket: config.s3BucketName,
                Key: termPDF,
                Expires: 60 * 60, // URL expires in 1 hour
            });
        }

        let packingGuidePDF = '';
        const packingDocsResult = await client.query(GET_PACKING_DOC);
        const packingDocs = packingDocsResult?.rows;
        if (!packingDocs?.length) {
            logger.info('No packing guide found');
        } else {
            logger.info('Packing guide found:', { packingDocs });
            packingGuidePDF = packingDocs[0].s3key;
        }

        if (packingGuidePDF) {
            const config = await getconfigSecrets();

            // Generate signed URL for the photo
            packingGuidePDF = s3.getSignedUrl('getObject', {
                Bucket: config.s3BucketName,
                Key: packingGuidePDF,
                Expires: 60 * 60, // URL expires in 1 hour
            });
        }
        // Prepare the email attachment (PDF file as a buffer)
        const attachments = [
            {
                Name: `${leadId}.pdf`, // Name the file appropriately
                Content: file.toString('base64'), // Convert file buffer to base64
                ContentType: 'application/pdf', // PDF content type
            },
        ];

        // Send email

        await sendAttachmentEmail(
            'Estimate Email',
            leadCheckResult.rows[0]?.customer_email,
            {
                username: leadCheckResult.rows[0]?.customer_name,
                leadid: leadId,
                pdfurl: pdfUrl,
                clientlogin: clientLogin,
                termsdoc: termPDF,
                packingguidedoc: packingGuidePDF,
            },
            attachments,
        );
        const templateRes = await client.query(GET_EMAIL_TEMPLATE_BY_EVENT, ['Estimate Email']);
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            `Email sent to you with subject: ${templateRes.rows[0].subject}`,
            'LEAD',
            leadCheckResult.rows[0].status,
            leadId,
        ]);
        return { message: getMessage('EMAIL_SENT'), data: null };
    } catch (error: any) {
        logger.error('Failed to send lead email or pdf', { error });
        throw new Error(`${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
