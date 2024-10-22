import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';
import { UPDATE_LEAD_STATUS } from '../../sql/sqlScript';

export const changeLeadStatusService = async (lead_id: string, new_status: string, tenant: any, user: any) => {
    const schema = tenant?.schema;
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released

    try {
        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        if (!schema) {
            throw new Error('Tenant schema is undefined');
        }

        await client.query(`SET search_path TO ${schema}`);

        // Update the lead status

        const result = await client.query(UPDATE_LEAD_STATUS, [new_status, lead_id]);

        if (result.rowCount === 0) {
            throw new Error(`No lead found with the id ${lead_id}`);
        }

        return result.rows[0];
    } catch (error: any) {
        throw new Error(error.message);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
