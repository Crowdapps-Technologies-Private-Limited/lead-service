import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { GET_SURVEYS_LIST_BASE, GET_SURVEYS_COUNT, GET_SURVEYS_COUNT_SURVEYOR } from '../../sql/sqlScript';
import { setPaginationData } from '../../utils/utility';
import { escape } from 'querystring';

const allowedOrderFields: { [key: string]: string } = {
    start_time: 's.start_time',
    end_time: 's.end_time',
    survey_type: 's.survey_type',
    status: 's.status',
};

export const getAllSurveys = async (
    pageSize: number,
    pageNumber: number,
    orderBy: string,
    orderIn: string,
    search: string,
    status: string,   // Status parameter
    tenant: any,
    isTenant: boolean
) => {
    const client = await connectToDatabase();
    const offset = pageSize * (pageNumber - 1);
    const searchQuery = `%${search}%`; // For partial matching

    try {
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }

        const schema = tenant?.schema || tenant?.tenant?.schema;
        logger.info('Schema:', { schema });
        await client.query(`SET search_path TO ${schema}`);
        let result: any;
        let pagination: any;
        if(isTenant) {
            // Logic for client

            // Fetch surveys count
            const resultCount = await client.query(GET_SURVEYS_COUNT, [status]);

            // Validate orderBy and orderIn, and construct the ORDER BY clause
            const orderField = allowedOrderFields[orderBy] || allowedOrderFields['start_time'];
            const orderDirection = orderIn.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Construct the final query
            const finalQuery = `
                ${GET_SURVEYS_LIST_BASE}
                AND (s.survey_type ILIKE $2 OR s.remarks ILIKE $2 OR c.name ILIKE $2)
                ORDER BY ${orderField} ${orderDirection}
                LIMIT $3 
                OFFSET $4
            `;

            // Fetch surveys list
            const res = await client.query(finalQuery, [status, searchQuery, pageSize, offset]);

            logger.info('Fetching surveys list');

            pagination = setPaginationData(resultCount.rows[0].count, pageSize, res.rows.length, pageNumber);

            result = {
                list: res.rows || [],
                pagination,
            };
        } else {
            // Logic for surveyor
            
            // Fetch surveys count
            const resultCount = await client.query(GET_SURVEYS_COUNT_SURVEYOR, [status, tenant?.staff_id]);

            // Validate orderBy and orderIn, and construct the ORDER BY clause
            const orderField = allowedOrderFields[orderBy] || allowedOrderFields['start_time'];
            const orderDirection = orderIn.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Construct the final query
            const finalQuery = `
                ${GET_SURVEYS_LIST_BASE}
                AND s.surveyor_id = $5
                AND (s.survey_type ILIKE $2 OR s.remarks ILIKE $2 OR c.name ILIKE $2)
                ORDER BY ${orderField} ${orderDirection}
                LIMIT $3 
                OFFSET $4
            `;

            // Fetch surveys list
            const res = await client.query(finalQuery, [status, searchQuery, pageSize, offset, tenant?.staff_id]);

            logger.info('Fetching surveys list');

            pagination = setPaginationData(resultCount.rows[0].count, pageSize, res.rows.length, pageNumber);

            result = {
                list: res.rows || [],
                pagination,
            };
        }
        return result;
    } catch (error: any) {
        logger.error(`Failed to fetch surveys list: ${error.message}`);
        throw new Error(`Failed to fetch surveys list: ${error.message}`);
    } finally {
        try {
            await client.end();
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
            throw new Error('Failed to close database connection');
        }
    }
};
