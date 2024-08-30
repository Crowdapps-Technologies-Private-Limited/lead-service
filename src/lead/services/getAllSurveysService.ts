import { GET_SURVEYS_COUNT, GET_SURVEYS_COUNT_SURVEYOR, GET_SURVEYS_LIST_BASE, GET_SURVEYS_LIST_TENANT, GET_TENANT_SURVEYS_COUNT } from "../../sql/sqlScript";
import { connectToDatabase } from "../../utils/database";
import { getMessage } from "../../utils/errorMessages";
import logger from "../../utils/logger";

export const getAllSurveys = async (
    tenant: any,
    isTenant: boolean,
    filterBy: string
) => {
    const client = await connectToDatabase();
    
    try {
        // if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
        //     throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        // }

        const schema = tenant?.schema || tenant?.tenant?.schema;
        logger.info('Schema:', { schema });
        await client.query(`SET search_path TO ${schema}`);

        // Define time filter conditions
        let timeFilter = '';
        if (filterBy === 'monthly') {
            timeFilter = `AND date_trunc('month', s.start_time) = date_trunc('month', current_date)`;
        } else if (filterBy === 'weekly') {
            timeFilter = `AND date_trunc('week', s.start_time) = date_trunc('week', current_date)`;
        } else if (filterBy === 'daily') {
            timeFilter = `AND date_trunc('day', s.start_time) = current_date`;
        }

        let result: any;
        
        if (isTenant) {
            // Logic for client

            // Fetch surveys count
            const resultCount = await client.query(`${GET_TENANT_SURVEYS_COUNT} ${timeFilter}`);

            // Construct the final query with time filter
            const finalQuery = `
                ${GET_SURVEYS_LIST_TENANT}
                ${timeFilter}
            `;

            // Fetch surveys list
            const res = await client.query(finalQuery);

            logger.info('Fetching surveys list');

            result = {
                list: res.rows || []
            };
        } else {
            // Logic for surveyor

            // Fetch surveys count
            const resultCount = await client.query(`${GET_SURVEYS_COUNT_SURVEYOR} ${timeFilter}`, [tenant?.staff_id]);

            // Construct the final query with time filter
            const finalQuery = `
                ${GET_SURVEYS_LIST_BASE}
                ${timeFilter}
                AND s.surveyor_id = $1
            `;

            // Fetch surveys list
            const res = await client.query(finalQuery, [tenant?.staff_id]);

            logger.info('Fetching surveys list');

            result = {
                list: res.rows || []
            };
        }
        return result;
    } catch (error: any) {
        logger.error(`Failed to fetch surveys list: ${error.message}`);
        throw new Error(`${error.message}`);
    } finally {
        try {
            await client.end();
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
            throw new Error('Failed to close database connection');
        }
    }
};
