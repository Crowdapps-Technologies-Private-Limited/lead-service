import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { SendEmailPayload } from '../interface';
import { INSERT_LOG, GET_CUSTOMER_BY_ID, GET_LEAD_BY_ID, GET_EMAIL_TEMPLATE_BY_EVENT } from '../../sql/sqlScript';
import { initializeEmailService } from '../../utils/emailService';
import { getLatestEstimates } from './getLatestEstimates ';
import { generatePdfAndUploadToS3 } from './generatePdf';
import generateEstimateHtml from './generateEstimateHtml';
import { generateEmail } from '../../utils/generateEmailService';

export const sendEstimateEmail = async (leadId: string, estimateId: string, tenant: any, action: string) => {
    const client = await connectToDatabase();
    const schema = tenant.schema;

    try {
        if (tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }

        await client.query(`SET search_path TO ${schema}`);

        // Check if lead exists
        const leadCheckResult = await client.query(GET_LEAD_BY_ID, [leadId]);

        if (leadCheckResult.rows.length === 0) {
            throw new Error('Lead not found');
        }
        //const custRes = await client.query(GET_CUSTOMER_BY_ID, [leadCheckResult.rows[0].customer_id]);
        const estimationDoc = 'estimation.pdf';
        const estimateData = await getLatestEstimates(leadId, tenant);
        const html = await generateEstimateHtml({ client: tenant, lead: leadCheckResult.rows[0], estimate: estimateData });
        const pdfUrl = await generatePdfAndUploadToS3({ html, key: estimationDoc });
        if(action === 'pdf') {
            return { message: 'PDF generated successfully', data: { pdfUrl } };
        }
        const clientLogin = 'https://mmym-client-dev.crowdapps.info/'
        const subject = 'Lead Estimate';

        const termsDoc = 'terms_and_conditions.pdf';
        const packingGuideDoc = 'trunk_packing_guide.pdf';
        
        // const htmlBody = `
        //     <p>Dear ${leadCheckResult.rows[0]?.customer_name},</p>
        //     <p>Reference Number: ${leadId}</p>
        //     <p>Please click <a href="${pdfUrl}">here</a> to view your estimation. As well as the estimation, you will also find some useful information and FAQ’s that we hope can ease some of the stress around moving.</p>
        //     <p>We do require you to confirm your job with us online, you can do this by clicking <a href="{ClientLogin}">here</a>. Please note that this DOES NOT secure your booking with us and once you have confirmed online a member of staff will be in touch to agree the date.</p>
        //     <p>Our aim is to make the whole moving process as easy and stress free as possible. If there's anything we can do to further assist you, please let us know.</p>
        //     <p>To view our Terms and Conditions please click <a href="${termsDoc}">here</a>.</p>
        //     <p>A Guide to Packing Your Property: Click <a href="${packingGuideDoc}">here</a>.</p>
        // `;
        // const emailService = await initializeEmailService();
        // await emailService.sendEmail(leadCheckResult.rows[0]?.customer_email, subject, '', htmlBody);
        await generateEmail(
            'Estimate Email', 
            leadCheckResult.rows[0]?.customer_email, 
            { 
                username: leadCheckResult.rows[0]?.customer_name,
                leadid: leadId,
                pdfurl: pdfUrl,
                clientlogin: clientLogin,
                termsdoc:  termsDoc,
                packingguidedoc: packingGuideDoc
            }
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
        return { message: 'Email sent successfully', data: null };
    } catch (error: any) {
        logger.error('Failed to send lead email', { error });
        throw new Error(`Failed to send lead email: ${error.message}`);
    } finally {
        client.end();
    }
};
