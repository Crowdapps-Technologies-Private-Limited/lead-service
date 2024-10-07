import { connectToDatabase } from '../../utils/database';
import { INSERT_LOG } from '../../sql/sqlScript';
import logger from '../../utils/logger';

// Service to add a manual log entry
export const addManualLog = async (payload: any, lead_id: string, tenant: any, user: any) => {
    const { action, action_type, specific_detail, performed_on, lead_status } = payload;

    const client = await connectToDatabase();
    const schema = tenant?.schema;

    try {
        if (tenant?.is_suspended) {
            throw new Error('Account is suspended');
        }

        if (!schema) {
            throw new Error('Tenant schema is undefined');
        }

        await client.query(`SET search_path TO ${schema}`);

        // Prepare data for the log entry
        const actor_id = user.id;
        const actor_name = user.name;
        const actor_email = user.email;

        const result = await client.query(INSERT_LOG, [
            actor_id,
            actor_name,
            actor_email,
            action,
            action_type,
            specific_detail,
            performed_on,
            lead_status,
            lead_id,
        ]);

        logger.info('Manual log entry added:', { result: result.rows[0] });

        return result.rows[0];
    } catch (error: any) {
        logger.error('Error adding manual log:', { error });
        throw new Error(error.message);
    } finally {
        client.end();
    }
};
