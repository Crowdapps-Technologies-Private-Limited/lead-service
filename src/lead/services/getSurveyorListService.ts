import { GET_ALL_SURVEYORS } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';

export const getAllSurveyors = async (tenant: any) => {
  // Connect to PostgreSQL database
  const client = await connectToDatabase();
  const schema = tenant?.schema || tenant?.tenant?.schema;
    logger.info('Schema:', { schema });
  try {
    if (tenant?.is_suspended) {
      throw new Error('Tenant is suspended');
    }
    await client.query(`SET search_path TO ${schema}`);
    // Fetch list
    
    const res = await client.query(GET_ALL_SURVEYORS, ['Surveyor']);
    return res.rows || [];
  } catch (error: any) {
    logger.error('Failed to fetch list', { error });
    throw new Error(`Failed to fetch list: ${error.message}`);
  } finally {
    try {
      await client.end();
    } catch (endError: any) {
      logger.error('Failed to close database connection', { endError });
      throw new Error(`Failed to close database connection: ${endError.message}`);
    }
  }
};
