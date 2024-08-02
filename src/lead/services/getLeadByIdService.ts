import { GET_LEAD_BY_ID, GET_REFERRER_BY_ID, CHECK_TABLE_EXISTS } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';

export const getLeadById = async (leadId: string, tenant: any) => {
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
    
    // Check if the leads table exists
    const tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
    const leadsTableExists = tableCheckRes.rows[0].exists;
    if (!leadsTableExists) {
      logger.info('Leads table does not exist');
      return {
        message: 'Lead data fetched successfully',
        data: {}
      };
    }

    // Get the lead by ID
    const leadResult = await client.query(GET_LEAD_BY_ID, [leadId]);
    const lead = leadResult.rows[0] || {};
    
    // Get the referrer by ID
    const referrerResult = await client.query(GET_REFERRER_BY_ID, [lead.referrer_id]);
    const referrer = referrerResult.rows[0] || {};
    
    // Prepare company information
    const company = {
      logo: tenant.logo,
      companyName: tenant.companyName,
      postCode: tenant.postCode
    };

    await client.query('COMMIT');
    return {
      message: 'Lead data fetched successfully',
      data: {
        lead,
        referrer,
        company
      }
    };
  } catch (error: any) {
    await client.query('ROLLBACK');
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
