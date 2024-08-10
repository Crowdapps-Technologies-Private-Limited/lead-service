import {
    INSERT_SURVEY_FOR_TAB2,
    INSERT_LOG,
    CHECK_TABLE_EXISTS,
    GET_SURVEY_BY_ID
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { AddSurveyTab2Payload } from '../interface';

export const addSurveyTab2 = async (leadId: string, payload: AddSurveyTab2Payload, tenant: any) => {
    logger.info('addSurvey service is running:');
    logger.info('payload:', { payload });
    logger.info('tenant:', { tenant });

    const {
        surveyId,
        notes
    } = payload;

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
       // Check if leads table exists
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'surveys']);
        if (!tableCheckRes.rows[0].exists) {
            logger.info('Surveys table does not exist');
            throw new Error('Survey not found');
        }
        const surveyRes = await client.query(GET_SURVEY_BY_ID, [surveyId]);
        if (surveyRes.rows.length === 0) {
            logger.info('Survey not found');
            throw new Error('Survey not found');
        }
        // Update survey
        await client.query(INSERT_SURVEY_FOR_TAB2, [notes, surveyId]);

        // Insert log
        // await client.query(INSERT_LOG, [
        //     tenant.id,
        //     tenant.name,
        //     tenant.email,
        //     'You have added a new survey',
        //     'LEAD',
        //     'SURVEY',
        //     leadId,
        // ]);
        // logger.info('Log inserted successfully');

        await client.query('COMMIT');
        return { 
            message: 'Survey notes added successfully',
            data: { surveyId}
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
