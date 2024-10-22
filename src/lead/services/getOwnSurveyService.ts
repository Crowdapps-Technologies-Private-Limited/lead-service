import { GET_SURVEYS_LIST_BASE, GET_SURVEYS_LIST_TENANT } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';

export const getOwnSurveys = async (tenant: any, isTenant: boolean, filterBy: string) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released

    try {
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }

        const schema = tenant?.schema || tenant?.tenant?.schema;

        await client.query(`SET search_path TO ${schema}`);

        let result: any;

        if (isTenant) {
            // Logic for client

            // Construct the final query with time filter
            const finalQuery = `
                ${GET_SURVEYS_LIST_TENANT}
            `;

            // Fetch surveys list
            const res = await client.query(finalQuery);

            logger.info('Fetching surveys list');

            result = {
                list: res.rows || [],
            };
        } else {
            // Logic for surveyor

            // Construct the final query with time filter
            const finalQuery = `
                ${GET_SURVEYS_LIST_BASE}
                AND s.surveyor_id = $1
            `;

            // Fetch surveys list
            const res = await client.query(finalQuery, [tenant?.staff_id]);

            logger.info('Fetching surveys list');

            result = {
                list: res.rows || [],
            };
        }
        return result;
    } catch (error: any) {
        logger.error(`Failed to fetch surveys list: ${error.message}`);
        throw new Error(`Failed to fetch surveys list: ${error.message}`);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
            throw new Error('Failed to close database connection');
        }
    }
};
