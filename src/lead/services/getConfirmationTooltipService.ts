import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { CHECK_TABLE_EXISTS, GET_CONFIRMATION_TOOLTIP_DETAILS, GET_LEAD_BY_ID } from '../../sql/sqlScript';
import { getMessage } from '../../utils/errorMessages';

export const getConfirmationTooltipDetails = async (leadId: string, tenant: any) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released

    try {
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        const schema = tenant?.schema || tenant?.tenant?.schema;

        await client.query(`SET search_path TO ${schema}`);
        // Check if the leads table exists
        let tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
        let checkTableExists = tableCheckRes.rows[0].exists;
        if (!checkTableExists) {
            logger.info('Leads table does not exist');
            return {};
        }
        // Check if the lead id exists
        const leadResult = await client.query(GET_LEAD_BY_ID, [leadId]);
        if (leadResult.rows.length === 0) {
            logger.info('Lead does not exist');
            return {};
        }
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'confirmations']);
        checkTableExists = tableCheckRes.rows[0].exists;
        if (!checkTableExists) {
            logger.info('Confirmations table does not exist');
            return {};
        }
        const confirmationResult = await client.query(GET_CONFIRMATION_TOOLTIP_DETAILS, [leadId]);
        const confirmation = confirmationResult.rows[0] || {};
        return confirmation;
    } catch (error: any) {
        logger.error(`Failed to fetch tooltip confirmation: ${error.message}`);
        throw new Error(`${error.message}`);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
            logger.info('Database connection closed successfully');
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
            throw new Error('Failed to close database connection');
        }
    }
};
