import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { SendEmailPayload } from '../interface';
import {
    INSERT_LOG, 
    GET_CUSTOMER_BY_ID,
 } from '../../sql/sqlScript';
import { initializeEmailService } from '../../utils/emailService';

export const sendEstimateEmail = async (leadId: string, estimateId: string, tenant: any) => {
    const client = await connectToDatabase();
    const schema = tenant.schema;

    try {
        if (tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }

        await client.query(`SET search_path TO ${schema}`);

        // Check if lead exists
        const leadCheckResult = await client.query(`
            SELECT * FROM leads WHERE generated_id = $1
        `, [leadId]);

        if (leadCheckResult.rows.length === 0) {
            throw new Error('Lead not found');
        }
        const subject = 'Lead Estimate';
        const estimationDoc = 'estimation.pdf';
        const termsDoc = 'terms_and_conditions.pdf';
        const packingGuideDoc = 'trunk_packing_guide.pdf';
        const custRes = await client.query(GET_CUSTOMER_BY_ID, [leadCheckResult.rows[0].customer_id]);
        const htmlBody = `
            <p>Dear ${custRes.rows[0]?.name},</p>
            <p>Reference Number: ${leadId}</p>
            <p>Please click <a href="${estimationDoc}">here</a> to view your estimation. As well as the estimation, you will also find some useful information and FAQ’s that we hope can ease some of the stress around moving.</p>
            <p>We do require you to confirm your job with us online, you can do this by clicking <a href="{ClientLogin}">here</a>. Please note that this DOES NOT secure your booking with us and once you have confirmed online a member of staff will be in touch to agree the date.</p>
            <p>Our aim is to make the whole moving process as easy and stress free as possible. If there's anything we can do to further assist you, please let us know.</p>
            <p>To view our Terms and Conditions please click <a href="${termsDoc}">here</a>.</p>
            <p>A Guide to Packing Your Property: Click <a href="${packingGuideDoc}">here</a>.</p>
        `;
        const emailService = await initializeEmailService();
        await emailService.sendEmail(
            custRes.rows[0].email,
            subject,
            '',
            htmlBody
        );
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            `Email sent to you with subject: ${subject}`,
            'LEAD',
            leadCheckResult.rows[0].status,
            leadId,
        ]);
        return { message: 'Email sent successfully' };
    } catch (error: any) {
        logger.error('Failed to send lead email', { error });
        throw new Error(`Failed to send lead email: ${error.message}`);
    } finally {
        client.end();
    }
};
