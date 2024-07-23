import { GET_LEAD_COUNT } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';

const allowedOrderFields: { [key: string]: string } = {
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  created_at: 'created_at' // Assuming created_at is in super_admins table
};

export const getAllLeads = async (
  pageSize: number, 
  pageNumber: number, 
  orderBy: string,
  orderIn: string,
  search: string,
  user: any // New search parameter
) => {
  const orderField = allowedOrderFields[orderBy] || 'created_at';
  const orderDirection = orderIn.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  // Connect to PostgreSQL database
  const client = await connectToDatabase();
  const offset = pageSize * (pageNumber - 1);
  const searchQuery = `%${search}%`; // For partial matching
  logger.info('Fetching user list', { pageSize, pageNumber, orderBy, orderIn, searchQuery, offset });
  try {
    // Fetch user count
    const resultCount = await client.query(GET_LEAD_COUNT);
    // Fetch user list
    let res;
      res = await client.query(`SELECT 
        id,
        email,
        first_name,
        last_name,
        status,
        photo,
        employee_id,
        created_at,
        is_active,
        is_deleted
    FROM super_admins
    WHERE 
      (first_name ILIKE $3 OR last_name ILIKE $3 OR email ILIKE $3 OR employee_id ILIKE $3) -- Search condition
      AND email != $4 
    ORDER BY employee_id DESC, ${allowedOrderFields[orderBy]} ${orderIn.toUpperCase()}
    LIMIT $1 
    OFFSET $2`, [pageSize, offset, searchQuery, user.email]);

    const pagination = setPaginationData(resultCount.rows[0].count, pageSize, res.rows.length, pageNumber);
    const result = {
      list: res.rows || [],
      pagination
    };
    return result;
  } catch (error: any) {
    logger.error('Failed to fetch user list', { error });
    throw new Error(`Failed to fetch user list: ${error.message}`);
  } finally {
    try {
      await client.end();
    } catch (endError: any) {
      logger.error('Failed to close database connection', { endError });
      throw new Error(`Failed to close database connection: ${endError.message}`);
    }
  }
};
