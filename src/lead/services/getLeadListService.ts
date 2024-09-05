import { CHECK_TABLE_EXISTS } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';

const allowedOrderFields: { [key: string]: string } = {
  leadId: 's.lead_id',
  customerName: 'c.name',
  created_at: 's.created_at',
  status: 's.status'
};

export const getAllLeads = async (
  pageSize: number, 
  pageNumber: number, 
  orderBy: string,
  orderIn: string,
  search: string,
  surveyor: any,
  isTenant: boolean
) => {
  logger.info('getAllLeads service is running:');

  // Validate and set defaults for orderBy and orderIn
  const orderByField = allowedOrderFields[orderBy] || allowedOrderFields['updatedAt']; // Default to updatedAt if orderBy is invalid
  const orderDirection = ['ASC', 'DESC'].includes(orderIn.toUpperCase()) ? orderIn.toUpperCase() : 'ASC';

  // Connect to PostgreSQL database
  const client = await connectToDatabase();
  const offset = pageSize * (pageNumber - 1);
  const searchQuery = `%${search}%`; // For partial matching
  logger.info('Fetching lead list', { pageSize, pageNumber, orderBy, orderDirection, searchQuery, offset });
  logger.info('Surveyor:', { surveyor });
  
  try {
    await client.query('BEGIN');

    const schema = surveyor?.tenant?.schema || surveyor?.schema;
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
        list: [],
        pagination: setPaginationData(0, pageSize, 0, pageNumber)
      };
    }

    let surveyorId = '';
    if (isTenant) {
      surveyorId = surveyor?.id;
    } else {
      surveyorId = surveyor?.staff_id;
    }
    logger.info('Surveyor ID:', { surveyorId });

    // Fetch lead count
    const query = `SELECT COUNT(*) FROM surveys WHERE surveyor_id = $1`;
    const resultCount = await client.query(query, [surveyorId]);

    // Fetch lead list
    const res = await client.query(`
      WITH LatestSurvey AS (
        SELECT 
          s.id, 
          s.status, 
          s.lead_id, 
          s.created_at, 
          s.updated_at,
          ROW_NUMBER() OVER (PARTITION BY s.lead_id ORDER BY s.created_at DESC) AS row_num
        FROM 
          surveys s
        WHERE 
          s.surveyor_id = $4
      )
      SELECT
        s.id AS survey_id,
        s.status AS status,
        s.lead_id AS generated_id,
        s.created_at AS created_at,
        s.updated_at AS updated_at,
        l.customer_id AS customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        l.collection_address_id AS collection_address_id,
        ca.street AS collection_street,
        ca.town AS collection_town,
        ca.county AS collection_county,
        ca.postcode AS collection_postcode,
        ca.country AS collection_country
      FROM 
        LatestSurvey s
        LEFT JOIN leads l ON s.lead_id = l.generated_id
        LEFT JOIN customers c ON l.customer_id = c.id
        LEFT JOIN addresses ca ON l.collection_address_id = ca.id
      WHERE
        s.row_num = 1 AND 
        (c.name ILIKE $3 OR s.status ILIKE $3 OR s.lead_id::text ILIKE $3) -- Search condition
      ORDER BY 
        ${orderByField} ${orderDirection},
        s.status DESC
      LIMIT $1 
      OFFSET $2`, [pageSize, offset, searchQuery, surveyorId]);

    const pagination = setPaginationData(resultCount.rows[0].count, pageSize, res?.rows?.length, pageNumber);
    const result = {
      list: res?.rows || [],
      pagination
    };
    return result;
  } catch (error: any) {
    logger.error('Failed to fetch lead list', { error });
    throw new Error(`${error.message}`);
  } finally {
    try {
      await client.end();
    } catch (endError: any) {
      logger.error('Failed to close database connection', { endError });
      throw new Error(`Failed to close database connection: ${endError.message}`);
    }
  }
};
