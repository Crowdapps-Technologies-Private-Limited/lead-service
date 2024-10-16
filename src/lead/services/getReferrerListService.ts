import { GET_ALL_REFERRERS } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';

export const getAllReferrers = async () => {
    // Connect to PostgreSQL database
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    try {
        // Fetch list
        const res = await client.query(GET_ALL_REFERRERS);
        return res.rows || [];
    } catch (error: any) {
        logger.error('Failed to fetch list', { error });
        throw new Error(`${error.message}`);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
        } catch (endError: any) {
            logger.error('Failed to close database connection', { endError });
            throw new Error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
