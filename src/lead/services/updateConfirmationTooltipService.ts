import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { CHECK_TABLE_EXISTS, GET_LEAD_BY_ID, MARK_SEEN_CONFIRMATION_TOOLTIP } from '../../sql/sqlScript';
import { getMessage } from '../../utils/errorMessages';

export const updateConfirmationTooltipDetails = async (leadId: string, tenant: any) => {
    const client = await connectToDatabase();
    try {
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        const schema = tenant?.schema || tenant?.tenant?.schema;
        logger.info('Schema:', { schema });
        await client.query(`SET search_path TO ${schema}`);
        // Check if the leads table exists
        let tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
        let checkTableExists = tableCheckRes.rows[0].exists;
        if (!checkTableExists) {
            logger.info('Leads table does not exist');
        }
        // Check if the lead id exists
        const leadResult = await client.query(GET_LEAD_BY_ID, [leadId]);
        if (leadResult.rows.length === 0) {
            logger.info('Lead does not exist');
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'confirmations']);
        checkTableExists = tableCheckRes.rows[0].exists;
        if (!checkTableExists) {
            logger.info('Confirmations table does not exist');
        }

        const confirmationResult = await client.query(MARK_SEEN_CONFIRMATION_TOOLTIP, [tenant.email, leadId]);
        const confirmation = confirmationResult.rows[0];
        return confirmation;
    } catch (error: any) {
        logger.error(`Failed to update tooltip confirmation: ${error.message}`);
        throw new Error(`${error.message}`);
    } finally {
        try {
            await client.end();
            logger.info('Database connection closed successfully');
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
            throw new Error('Failed to close database connection');
        }
    }
};
