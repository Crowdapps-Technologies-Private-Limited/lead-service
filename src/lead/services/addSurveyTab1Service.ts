import {
    INSERT_SURVEY_ITEM_FOR_TAB1,
    CREATE_SURVEY_AND_RELATED_TABLE,
    INSERT_LOG,
    UPDATE_MATERIAL_BY_SURVEY
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { toFloat } from '../../utils/utility';
import { AddSurveyTab1Payload } from '../interface';

export const addSurveyTab1 = async (surveyId: string, payload: AddSurveyTab1Payload, tenant: any) => {
    logger.info('addSurvey service is running:');
    logger.info('payload:', { payload });
    logger.info('surveyId:', { surveyId });
    logger.info('tenant:', { tenant });

    const {
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
        // Insert survey items
        for (const item of surveyItems) {
            if(!item.isLeave || !item.isWeee || !item.isCust || !item.isClear) {
                throw new Error('One radio button should be selected');
            }
            if(item.room?.toLowerCase() === 'materials') {
                if(!item.materialId || !item.quantity || !item.ft3 || !item.price) {
                    throw new Error('Material details are required');
                }
                const materialResult = await client.query(UPDATE_MATERIAL_BY_SURVEY, [
                    item.quantity,
                    item.ft3,
                    toFloat(item.price) * parseInt(item.quantity?.toString()),
                    item.materialId
                ]);
                logger.info('Material updated:', { materialId: materialResult.rows[0].id });
            }
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
