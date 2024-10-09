import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { generateEmail } from '../../utils/generateEmailService';
import { getMessage } from '../../utils/errorMessages';

import { decryptPassword } from '../../utils/encryptionAndDecryption';

import { GET_LEAD_CUSTOMER_BY_LEAD_ID, GET_CUSTOMER_BY_EMAIL } from '../../sql/sqlScript';

export const sendFeedbackEmail = async (leadId: string, tenant: any, user: any) => {
    const client = await connectToDatabase();
    const schema = tenant.schema;
    logger.info('leadId:', { leadId });

    try {
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
        logger.info('Lead data:', { leadData });

        // if (leadData.status === 'JOB') {
        //     throw new Error('Lead status is JOB so cannot send confirmation email');
        // }

        const customerResult = await client.query(GET_CUSTOMER_BY_EMAIL, [leadData?.customer_email]);
        if (customerResult.rows.length == 0) {
            throw new Error(getMessage('CUSTOMER_NOT_FOUND'));
        }

        const customer = customerResult.rows[0];
        if (!customer.password) {
            throw new Error(getMessage('PASSWORD_NOT_FOUND'));
        }
        const password = customer.password ? decryptPassword(customer.password) : '';
        await generateEmail('Feedback Email', leadData?.customer_email, {
            name: leadData?.customer_name,
            leadid: leadId,
            link: 'https://mmym-client-dev.crowdapps.info/',
            username: customer.username,
            password,
        });

        return { message: getMessage('EMAIL_SENT'), data: null };
    } catch (error: any) {
        logger.error('Failed to send confirmation email', { error });
        throw new Error(error.message);
    } finally {
        client.end();
    }
};
