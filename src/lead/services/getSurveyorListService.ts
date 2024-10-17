import { CHECK_TABLE_EXISTS, GET_ALL_SURVEYORS } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';

export const getAllSurveyors = async (tenant: any) => {
    // Connect to PostgreSQL database
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant?.schema || tenant?.tenant?.schema;
    logger.info('Schema:', { schema });
    try {
        await client.query(`SET search_path TO ${schema}`);
        // Fetch list
        const tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'staffs']);
        const checkTableExists = tableCheckRes.rows[0].exists;
        if (!checkTableExists) {
            logger.info('Staffs table does not exist');
            return [];
        }
        const res = await client.query(GET_ALL_SURVEYORS, ['Surveyor']);
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
