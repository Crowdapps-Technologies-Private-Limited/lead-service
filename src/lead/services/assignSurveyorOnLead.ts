import {
    CHECK_TABLE_EXISTS,
    CREATE_SURVEY_AND_RELATED_TABLE,
    INSERT_LOG,
    INSERT_SURVEY
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { toFloat } from '../../utils/utility';
import { AssignSurveyorPayload } from '../interface';

export const assignSurveyor = async (leadId: string, payload: AssignSurveyorPayload, tenant: any) => {
    logger.info('addSurvey service is running:');
    logger.info('payload:', { payload });
    logger.info('leadId:', { leadId });
    logger.info('tenant:', { tenant });

    const {
        surveyorId,
        surveyType,
        remarks,
        startTime,
        endTime,
        description
    } = payload;

    const client = await connectToDatabase();
    const schema = tenant.schema;
    logger.info('Schema:', { schema });

    try {
        await client.query('BEGIN');

        if (tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }
        // Insert survey items
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
        await client.query(CREATE_SURVEY_AND_RELATED_TABLE);
        logger.info('Survey and related tables created successfully');
        // Assign Surveyor
        await client.query(INSERT_SURVEY, [
            leadId,
            surveyorId,
            surveyType,
            remarks || null,
            startTime,
            endTime,
            description || null
        ]);

        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            'Surveyor assigned',
            'LEAD',
            'ESTIMATES',
            leadId
        ]);
        await client.query('COMMIT');
        return { 
            message: 'Surveyor assigned successfully'
        };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to add survey', { error });
        throw new Error(`Failed to add survey: ${error.message}`);
    } finally {
        try {
            await client.end();
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
