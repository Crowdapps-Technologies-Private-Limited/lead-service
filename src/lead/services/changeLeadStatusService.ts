import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';

export const changeLeadStatusService = async (lead_id: string, new_status: string, tenant: any, user: any) => {
    const schema = tenant?.schema;
    const client = await connectToDatabase();

    try {
        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        if (!schema) {
            throw new Error('Tenant schema is undefined');
        }

        await client.query(`SET search_path TO ${schema}`);

        // Update the lead status
        const updateLeadStatusQuery = `
            UPDATE leads
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE generated_id = $2
            RETURNING generated_id as lead_id, status, updated_at;
        `;

        const result = await client.query(updateLeadStatusQuery, [new_status, lead_id]);

        if (result.rowCount === 0) {
            throw new Error(`No lead found with the id ${lead_id}`);
        }

        logger.info('Lead status updated successfully:', { lead_id, new_status });

        return result.rows[0];
    } catch (error: any) {
        logger.error('Error updating lead status:', { error });
        throw new Error(error.message);
    } finally {
        client.end();
    }
};
