import { GET_ALL_ROOM_LIST } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';

const allowedOrderFields: { [key: string]: string } = {
  generated_id: 'generated_id',
  customer_name: 'customer_name',
  created_at: 'created_at' // Assuming created_at is in leads table
};

export const getAllRooms = async (
  tenant: any // New search parameter
) => {
  // Connect to PostgreSQL database
  const client = await connectToDatabase();
  try {
    // Fetch lead count
    const res = await client.query(GET_ALL_ROOM_LIST);
    const result = {
      list: res?.rows || [],
    };
    return result;
  } catch (error: any) {
    logger.error('Failed to fetch room list', { error });
    throw new Error(`Failed to fetch room list: ${error.message}`);
  } finally {
    try {
      await client.end();
    } catch (endError: any) {
      logger.error('Failed to close database connection', { endError });
      throw new Error(`Failed to close database connection: ${endError.message}`);
    }
  }
};
