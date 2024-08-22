import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { GET_SURVEY_DETAILS } from '../../sql/sqlScript';

export const getSurveyById = async (surveyId: string, tenant: any) => {
    const client = await connectToDatabase();

    try {
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }

        const schema = tenant?.schema || tenant?.tenant?.schema;
        logger.info('Schema:', { schema });
        await client.query(`SET search_path TO ${schema}`);

        // Fetch survey by ID
        const result = await client.query(GET_SURVEY_DETAILS, [surveyId]);

        logger.info('Survey fetched successfully', { surveyId, rowCount: result.rowCount });

        if (result.rowCount === 0) {
            return null; // Survey not found
        }

        return result.rows[0];
    } catch (error: any) {
        logger.error(`Failed to fetch survey by ID: ${error.message}`);
        throw new Error(`Failed to fetch survey by ID: ${error.message}`);
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
