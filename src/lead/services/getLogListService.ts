import { GET_LOG_COUNT, GET_LEAD_BY_ID, CHECK_TABLE_EXISTS } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';

const allowedOrderFields: { [key: string]: string } = {
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  created_at: 'created_at' 
};

export const getAllLogsByLead = async (
  pageSize: number, 
  pageNumber: number, 
  orderBy: string,
  orderIn: string,
  tenant: any,
  leadId: string,
) => {
  // Connect to PostgreSQL database
  const client = await connectToDatabase();
  const offset = pageSize * (pageNumber - 1);
  try {
    await client.query('BEGIN');
    // if(tenant?.is_suspended){
    //   throw new Error('Tenant is suspended');
    // }
    const schema = tenant.schema;
    logger.info('Schema:', { schema });
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    logger.info('Schema created successfully');
    await client.query(`SET search_path TO ${schema}`);
    logger.info('Schema set successfully');
    let tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);

    const leadsTableExists = tableCheckRes.rows[0].exists;
    if (!leadsTableExists) {
      logger.info('Leads table does not exist');
      return {
        list: [],
        pagination: setPaginationData(0, pageSize, 0, pageNumber)
      };
    }
    // Fetch user count
    let lead = await client.query(GET_LEAD_BY_ID,[leadId]);
    if(lead.rows.length === 0) {
      throw new Error(`No data found.`);
    }
    tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'audit_trails']);

    const logsTableExists = tableCheckRes.rows[0].exists;
    if (!logsTableExists) {
      logger.info('Logs table does not exist');
      return {
        list: [],
        pagination: setPaginationData(0, pageSize, 0, pageNumber)
      };
    }
    const resultCount = await client.query(GET_LOG_COUNT, [leadId]);
    // Fetch user list
    let res: any;
        res = await client.query(`SELECT 
          id,
          action,
          actor_name,
          actor_email,
          actor_id,
          created_at
      FROM audit_trails
      WHERE lead_id = $3
      ORDER BY created_at DESC, ${allowedOrderFields[orderBy]} ${orderIn.toUpperCase()}
      LIMIT $1 
      OFFSET $2`, [pageSize, offset, leadId]);

    const pagination = setPaginationData(resultCount.rows[0].count, pageSize, res?.rows?.length, pageNumber);
    const result = {
      list: res.rows || [],
      pagination
    };
    return result;
  } catch (error: any) {
    logger.error('Failed to fetch log list', { error });
    throw new Error(`Failed to fetch log list: ${error.message}`);
  } finally {
    try {
      await client.end();
    } catch (endError: any) {
      logger.error('Failed to close database connection', { endError });
      throw new Error(`Failed to close database connection: ${endError.message}`);
    }
  }
};