import { GET_LEAD_BY_ID } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';

export const getLeadById = async (leadId: string) => {
  // Connect to PostgreSQL database
  const client = await connectToDatabase();
  try {
    // Fetch client data
    const res = await client.query(GET_LEAD_BY_ID,[leadId]);
    if(res.rows.length === 0) {
      throw new Error(`No data found.`);
    }
    return res.rows[0] || {};
  } catch (error: any) {
    logger.error('Failed to fetch data', { error });
    throw new Error(`Failed to fetch data: ${error.message}`);
  } finally {
    try {
      await client.end();
    } catch (endError: any) {
      throw new Error(`Failed to close database connection: ${endError.message}`);
    }
  }
};
