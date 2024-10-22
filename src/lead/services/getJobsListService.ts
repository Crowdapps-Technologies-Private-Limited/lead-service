import { GET_JOB_LIST } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';

// Service to fetch jobs list with details of customers, addresses, and vehicles
export const getJobsList = async (tenant: any) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant.schema;

    try {
        if (tenant?.is_suspended) {
            throw new Error('Account is suspended');
        }

        await client.query(`SET search_path TO ${schema}`);

        const jobsResult = await client.query(GET_JOB_LIST);

        return jobsResult.rows;
    } catch (error: any) {
        logger.error('Error fetching jobs list:', { error });
        throw new Error(error.message);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
