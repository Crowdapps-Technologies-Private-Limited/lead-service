import { 
    GET_SURVEYS_COUNT, 
    GET_SURVEYS_LIST_BASE, 
    GET_SURVEYS_LIST_TENANT, 
} from "../../sql/sqlScript";
import { connectToDatabase } from "../../utils/database";
import logger from "../../utils/logger";

export const getAllSurveys = async (
    tenant: any,
    isTenant: boolean,
    filterBy: string
) => {
    const client = await connectToDatabase();
    
    try {
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }

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

        // Fetch surveys count
        const countResult = await client.query(`${GET_SURVEYS_COUNT} ${timeFilter}`);
        const count = countResult.rows[0]?.count || 0;

        // Fetch surveys list for tenant
        const tenantQuery = `
            ${GET_SURVEYS_LIST_TENANT}
            ${timeFilter}
        `;
        const tenantSurveys = await client.query(tenantQuery);
        const result1 = tenantSurveys.rows || [];
 
        // Fetch surveys list for surveyor or other roles
        const surveyorQuery = `
            ${GET_SURVEYS_LIST_BASE}
            ${timeFilter}
        `;
        const surveyorSurveys = await client.query(surveyorQuery);
        const result2 = surveyorSurveys.rows || [];

        // Combine the results
        const combinedResult = {
            count: count,
            list: [...result1, ...result2]
        };

        return combinedResult;
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
