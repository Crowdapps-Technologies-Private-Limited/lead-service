import {
    INSERT_SURVEY_FOR_TAB1,
    INSERT_SURVEY_ITEM_FOR_TAB1,
    CREATE_SURVEY_AND_RELATED_TABLE,
    INSERT_LOG,
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { AddSurveyTab1Payload } from '../interface';

export const addSurveyTab1 = async (leadId: string, payload: AddSurveyTab1Payload, tenant: any) => {
    logger.info('addSurvey service is running:');
    logger.info('payload:', { payload });
    logger.info('leadId:', { leadId });
    logger.info('tenant:', { tenant });

    const {
        surveyorId,
        surveyItems,
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
        const leadCheckResult = await client.query(`
            SELECT * FROM leads WHERE generated_id = $1
        `, [leadId]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error('Lead not found');
        }
        await client.query(CREATE_SURVEY_AND_RELATED_TABLE);
        logger.info('Survey and related tables created successfully');

        // Insert survey
        const surveyResult = await client.query(INSERT_SURVEY_FOR_TAB1, [
            leadId,
            surveyorId
        ]);

        const surveyId = surveyResult.rows[0].id;
        logger.info('surveyId:', { surveyId });

        // Insert survey items
        for (const item of surveyItems) {
            const surveyItemResult = await client.query(INSERT_SURVEY_ITEM_FOR_TAB1, [
                surveyId,
                item.room,
                item.item,
                item.ft3,
                item.quantity,
                item.isLeave,
                item.isWeee,
                item.isCust,
                item.isClear
            ]);
            logger.info('Survey item inserted:', { surveyItemId: surveyItemResult.rows[0].id });
        }
        logger.info('Survey items inserted successfully');

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
            message: 'Inital Survey added successfully',
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
