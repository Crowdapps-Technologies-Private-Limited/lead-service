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
  tenant: any // New search parameter
) => {
  // Connect to PostgreSQL database
  const client = await connectToDatabase();
  const offset = pageSize * (pageNumber - 1);
  const searchQuery = `%${search}%`; // For partial matching
  logger.info('Fetching user list', { pageSize, pageNumber, orderBy, orderIn, searchQuery, offset });
  try {
    await client.query('BEGIN');
    if(tenant?.is_suspended){
      throw new Error('Tenant is suspended');
    }
    const schema = tenant.schema;
    logger.info('Schema:', { schema });
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    logger.info('Schema created successfully');
    await client.query(`SET search_path TO ${schema}`);
    logger.info('Schema set successfully');
    // Fetch user count
    const resultCount = await client.query(GET_LEAD_COUNT);
    // Fetch user list
    let res;
      res = await client.query(`SELECT 
        id,
        email,
        name,
        status,
        created_at
    FROM leads
    WHERE 
      (name ILIKE $3 OR status ILIKE $3) -- Search condition
    ORDER BY created_at DESC, ${allowedOrderFields[orderBy]} ${orderIn.toUpperCase()}
    LIMIT $1 
    OFFSET $2`, [pageSize, offset, searchQuery]);

    const pagination = setPaginationData(resultCount.rows[0].count, pageSize, res.rows.length, pageNumber);
    const result = {
      list: res.rows || [],
      pagination
    };
    return result;
  } catch (error: any) {
    logger.error('Failed to fetch lead list', { error });
    throw new Error(`Failed to fetch lead list: ${error.message}`);
  } finally {
    try {
      await client.end();
    } catch (endError: any) {
      logger.error('Failed to close database connection', { endError });
      throw new Error(`Failed to close database connection: ${endError.message}`);
    }
  }
};
