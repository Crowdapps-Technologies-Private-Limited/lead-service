import {
    CHECK_TABLE_EXISTS,
    CREATE_SURVEY_AND_RELATED_TABLE,
    INSERT_LOG,
    INSERT_SURVEY,
    CHECK_SURVEY,
    CHECK_SURVEYOR_AVAILABILITY,
    UPDATE_LEAD_STATUS
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { generateEmail } from '../../utils/generateEmailService';
import logger from '../../utils/logger';
import { toFloat } from '../../utils/utility';
import { AssignSurveyorPayload } from '../interface';

export const assignSurveyor = async (leadId: string, payload: AssignSurveyorPayload, tenant: any, isTenant: boolean) => {
    logger.info('addSurvey service is running:');
    logger.info('payload:', { payload });
    logger.info('leadId:', { leadId });
    logger.info('tenant:', { tenant });

    const {
        surveyorId,
        surveyType,
        surveyDate,
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
        // Check if tenant is suspended
        if (tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }
        await client.query(`SET search_path TO ${schema}`);
        let tableCheckRes: any;
        // Check if leads table exists
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
        if (!tableCheckRes.rows[0].exists) {
            logger.info('Leads table does not exist');
            throw new Error('Lead not found');
        }
        // CHECK IF LEAD EXISTS
        const leadCheckResult = await client.query(`
            SELECT * FROM leads WHERE generated_id = $1
        `, [leadId]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error('Lead not found');
        }
        // Check if surveyor table exists
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'staffs']);
        if (!tableCheckRes.rows[0].exists) {
            logger.info('Staffs table does not exist');
            throw new Error('Surveyor not found');
        }
        // CHECK IF SURVEYOR EXISTS
        let surveyorCheckResult
        if(surveyorId.startsWith('EMP')){
         surveyorCheckResult = await client.query(`
            SELECT * FROM staffs WHERE staff_id = $1
        `, [surveyorId]);
        if (surveyorCheckResult.rows.length === 0) {
            throw new Error('Surveyor not found');
        }
    }
    else if(surveyorId !== tenant.id){
        throw new Error('Surveyor not found');
    }
        await client.query(CREATE_SURVEY_AND_RELATED_TABLE);
        logger.info('Survey and related tables created successfully');

        //Check if an incomplete survey exists for that lead
        const surveyCheckResult = await client.query(CHECK_SURVEY, [leadId]);
        if (surveyCheckResult.rows.length > 0) {
            throw new Error('Survey already exists');
        }
        // Check if the surveyor is available in the given time range
        const surveyorAvailabilityResult = await client.query(CHECK_SURVEYOR_AVAILABILITY, [
            surveyorId,
            startTime,
            endTime
        ]);
        if (surveyorAvailabilityResult.rows[0].has_conflict) {
            throw new Error('Surveyor already has a survey in the given time range');
        }
        // Assign Surveyor
        // Determine if the surveyor is assigned to the tenant
        const isTenantAssigned = !surveyorId.startsWith('EMP');
        await client.query(INSERT_SURVEY, [
            leadId,
            surveyorId,
            surveyType,
            remarks || null,
            startTime,
            endTime || null,
            description,
            surveyDate || null,
            isTenantAssigned
        ]);
        // Update lead status
        await client.query(UPDATE_LEAD_STATUS, ['SURVEY', leadId]);
        logger.info('Lead status updated successfully');
        // Insert log
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            `You have added a survey for lead ${leadId}`,
            'LEAD',
            'SURVEY',
            leadId,
        ]);
        logger.info('Log inserted successfully');
        // Send nofitication to surveyor on email
        if(surveyorId.startsWith('EMP'))
        {
        await generateEmail('Assign Survey', surveyorCheckResult?.rows[0]?.email, { username: surveyorCheckResult?.rows[0]?.name });
    }
   
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
