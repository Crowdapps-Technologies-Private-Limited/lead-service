import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { SendEmailPayload } from '../interface';
import {  
    CREATE_LOG_TABLE, 
    INSERT_LOG, 
    GET_EMAIL_TEMPLATE_BY_ID,
    SELECT_EMAIL_INFO
 } from '../../sql/sqlScript';
import { isEmptyString, toFloat } from '../../utils/utility';
import { initializeEmailService } from '../../utils/emailService';

export const sendLeadEmail = async (leadId: string, payload: SendEmailPayload, tenant: any) => {
    const {
        from,
        to,
        subject,
        body,
        templateId,
        addClientSignature // Add client's signature to email
    } = payload;

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
        let emailSignature = '';
        let emailDisclaimer = '';
        if(addClientSignature) {
            const emailInfo = await client.query(SELECT_EMAIL_INFO, [tenant.id]);
            if (emailInfo.rows.length === 0) {
                throw new Error('Email info not found');
            }
            emailSignature = emailInfo.rows[0].email_signature;
            emailDisclaimer = emailInfo.rows[0].email_disclaimer;
        } else {
            // default signature and disclaimer
            const templateRes = await client.query(GET_EMAIL_TEMPLATE_BY_ID, [templateId]);
            if(templateRes.rows.length === 0) {
                throw new Error('Email template not found');
            } 
            emailSignature = templateRes.rows[0].signature;
            emailDisclaimer = templateRes.rows[0].disclaimer;
        }
        const htmlBody = body + "<br/>" + emailSignature + "<br/>" + emailDisclaimer;
        // Send email
        const emailService = await initializeEmailService();
        await emailService.sendEmail(
            to,
            subject,
            body,
            htmlBody
        );
        // Insert log
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
