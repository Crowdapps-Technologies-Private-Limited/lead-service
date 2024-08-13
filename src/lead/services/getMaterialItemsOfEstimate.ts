import {
    CHECK_TABLE_EXISTS,
    GET_MATERIALS_BY_ESTIMATE
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { AddSurveyTab2Payload } from '../interface';

export const getMaterialItems = async (leadId: string, tenant: any) => {
    logger.info('addSurvey service is running:');
    logger.info('tenant:', { tenant });

    const client = await connectToDatabase();
    const schema = tenant.schema;
    logger.info('Schema:', { schema });

    try {
        await client.query('BEGIN');

        if (tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }
        await client.query(`SET search_path TO ${schema}`);
        let tableCheckRes: any;
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
        if (!tableCheckRes.rows[0].exists) {
            logger.info('Leads table does not exist');
            throw new Error('Lead not found');
        }
        const leadCheckResult = await client.query(`
            SELECT * FROM leads WHERE generated_id = $1
        `, [leadId]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error('Lead not found');
        }
        
        const res = await client.query(GET_MATERIALS_BY_ESTIMATE, [leadId]);
        await client.query('COMMIT');
        return { 
           list: res?.rows[0]?.materials || [],
        };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to get survey', { error });
        throw new Error(`Failed to get survey: ${error.message}`);
    } finally {
        try {
            await client.end();
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
