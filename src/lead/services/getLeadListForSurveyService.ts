import { GET_LEAD_COUNT, CHECK_TABLE_EXISTS } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';

export const getAllLeadsForSurvey = async (
  tenant: any // New search parameter
) => {
  // Connect to PostgreSQL database
  const client = await connectToDatabase();
  
  try {
    await client.query('BEGIN');

    const schema = tenant.schema;
    logger.info('Schema:', { schema });
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    logger.info('Schema created successfully');
    await client.query(`SET search_path TO ${schema}`);
    logger.info('Schema set successfully');

    // Check if leads table exists
    const tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
    const leadsTableExists = tableCheckRes.rows[0].exists;
    if (!leadsTableExists) {
      logger.info('Leads table does not exist');
      return {
        list: []
      };
    }

    // Fetch lead count
    const resultCount = await client.query(GET_LEAD_COUNT);

    // Fetch lead list
    const res = await client.query(`
      SELECT 
        l.generated_id,
        l.customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        l.collection_address_id,
        ca.street AS collection_street,
        ca.town AS collection_town,
        ca.county AS collection_county,
        ca.postcode AS collection_postcode,
        ca.country AS collection_country,
        l.status
      FROM 
        leads l
      LEFT JOIN 
        customers c ON l.customer_id = c.id
      LEFT JOIN 
        addresses ca ON l.collection_address_id = ca.id
      WHERE l.status = 'ESTIMATES'`);
    const result = {
      list: res?.rows || []
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
