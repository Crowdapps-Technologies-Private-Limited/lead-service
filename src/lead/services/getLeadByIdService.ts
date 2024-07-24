import { GET_USER_BY_ID } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';

export const getLeadById = async (userId: string) => {
  // Connect to PostgreSQL database
  const client = await connectToDatabase();
  try {
    // Fetch client data
    const res = await client.query(GET_USER_BY_ID,[userId]);
    if(res.rows.length === 0) {
      throw new Error(`No data found.`);
    }
    // if(res.rows[0].is_deleted) {
    //   throw new Error(`No data found.`);
    // }
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
