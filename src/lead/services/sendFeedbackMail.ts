import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { generateEmail } from '../../utils/generateEmailService';
import { getMessage } from '../../utils/errorMessages';
import { decryptPassword } from '../../utils/encryptionAndDecryption';

import {
    GET_LEAD_CUSTOMER_BY_LEAD_ID,
    GET_CUSTOMER_BY_EMAIL,
    CREATE_FEEDBACK_RELATED_TABLE,
} from '../../sql/sqlScript';

export const sendFeedbackEmail = async (leadId: string, tenant: any, user: any) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant.schema;
    logger.info('leadId:', { leadId });

    try {
        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        // Set schema for the tenant
        await client.query(`SET search_path TO ${schema}`);

        // Ensure feedback-related tables exist
        await client.query(CREATE_FEEDBACK_RELATED_TABLE);
        logger.info('Feedback tables checked/created successfully');

        // Fetch lead and customer details based on lead ID
        const leadCheckResult = await client.query(GET_LEAD_CUSTOMER_BY_LEAD_ID, [leadId]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }

        const leadData = leadCheckResult.rows[0];
        logger.info('Lead data:', { leadData });

        // Delete any existing feedback responses for the lead
        const deleteExistingResponsesQuery = `
            DELETE FROM feedback_responses 
            WHERE lead_id = $1;
        `;
        await client.query(deleteExistingResponsesQuery, [leadId]);

        // Fetch customer details
        const customerResult = await client.query(GET_CUSTOMER_BY_EMAIL, [leadData?.customer_email]);
        if (customerResult.rows.length === 0) {
            throw new Error(getMessage('CUSTOMER_NOT_FOUND'));
        }

        const customer = customerResult.rows[0];
        if (!customer.password) {
            throw new Error(getMessage('PASSWORD_NOT_FOUND'));
        }

        // Decrypt customer password
        const password = decryptPassword(customer.password);

        // Prepare and send feedback email
        await generateEmail('Feedback Email', leadData?.customer_email, {
            name: leadData?.customer_name,
            leadid: leadId,
            link: 'https://mmym-client-dev.crowdapps.info/',
            username: customer.username,
            password,
        });

        logger.info('Feedback email sent successfully', { email: leadData?.customer_email });
        return { message: getMessage('EMAIL_SENT'), data: null };
    } catch (error: any) {
        logger.error('Failed to send feedback email', { error });
        throw new Error(error.message);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
        } catch (endError: any) {
            logger.error('Failed to close database connection', { endError });
        }
    }
};
