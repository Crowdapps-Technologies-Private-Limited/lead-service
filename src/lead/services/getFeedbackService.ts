import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';
import { GET_FEEDBACK } from '../../sql/sqlScript';
// Service to get feedback responses by lead_id
export const getFeedbackResponseByLead = async (lead_id: string, tenant: any) => {
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

        const result = await client.query(GET_FEEDBACK, [lead_id]);

        if (result.rows.length === 0) {
            throw new Error(`No feedback responses found for lead ID ${lead_id}`);
        }

        return result.rows;
    } catch (error: any) {
        logger.error('Error fetching feedback responses:', { error });
        throw new Error(error.message);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
