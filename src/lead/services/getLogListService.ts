import { GET_LOG_COUNT, GET_LEAD_BY_ID, CHECK_TABLE_EXISTS } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';

const allowedOrderFields: { [key: string]: string } = {
    first_name: 'first_name',
    last_name: 'last_name',
    email: 'email',
    created_at: 'created_at',
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
    let clientReleased = false; // Track if client is released
    const offset = pageSize * (pageNumber - 1);
    try {
        await client.query('BEGIN');
        const schema = tenant?.schema || tenant?.tenant?.schema;

        await client.query(`SET search_path TO ${schema}`);

        // Check if leads table exists
        let tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
        const leadsTableExists = tableCheckRes.rows[0].exists;
        if (!leadsTableExists) {
            logger.info('Leads table does not exist');
            return {
                list: [],
                pagination: setPaginationData(0, pageSize, 0, pageNumber),
            };
        }
        // Check if lead exists
        const lead = await client.query(GET_LEAD_BY_ID, [leadId]);
        if (lead.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }
        // Check if logs table exists
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'lead_logs']);

        const logsTableExists = tableCheckRes.rows[0].exists;
        if (!logsTableExists) {
            logger.info('Logs table does not exist');
            return {
                list: [],
                pagination: setPaginationData(0, pageSize, 0, pageNumber),
            };
        }
        // Fetch total count of logs
        const resultCount = await client.query(GET_LOG_COUNT, [leadId]);
        // Fetch log list
        let res: any;
        res = await client.query(
            `SELECT 
          id,
          action,
          actor_name,
          actor_email,
          actor_id,
          created_at
      FROM lead_logs
      WHERE lead_id = $3
      ORDER BY created_at DESC, ${allowedOrderFields[orderBy]} ${orderIn.toUpperCase()}
      LIMIT $1 
      OFFSET $2`,
            [pageSize, offset, leadId],
        );
        // Set pagination data
        const pagination = setPaginationData(resultCount.rows[0].count, pageSize, res?.rows?.length, pageNumber);
        const result = {
            list: res.rows || [],
            pagination,
        };
        return result;
    } catch (error: any) {
        logger.error('Failed to fetch log list', { error });
        throw new Error(`${error.message}`);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
        } catch (endError: any) {
            logger.error('Failed to close database connection', { endError });
            throw new Error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
