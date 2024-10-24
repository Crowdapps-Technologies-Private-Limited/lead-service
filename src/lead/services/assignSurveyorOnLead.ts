import {
    CHECK_TABLE_EXISTS,
    INSERT_LOG,
    INSERT_SURVEY,
    CHECK_SURVEY,
    CHECK_SURVEYOR_AVAILABILITY,
    UPDATE_LEAD_STATUS,
    GET_CUSTOMER_ADRESS_BY_LEAD_ID,
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { getMessage } from '../../utils/errorMessages';
import { generateEmail } from '../../utils/generateEmailService';
import logger from '../../utils/logger';
import { AssignSurveyorPayload } from '../interface';

export const assignSurveyor = async (
    leadId: string,
    payload: AssignSurveyorPayload,
    tenant: any,
    isTenant: boolean,
    user: any,
) => {
    const { surveyorId, surveyType, surveyDate, remarks, startTime, endTime, description } = payload;

    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant.schema;

    try {
        await client.query('BEGIN');
        // Check if tenant is suspended
        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }
        await client.query(`SET search_path TO ${schema}`);
        let tableCheckRes: any;
        // Check if leads table exists
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
        if (!tableCheckRes.rows[0].exists) {
            logger.info('Leads table does not exist');
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }
        // CHECK IF LEAD EXISTS
        const leadCheckResult = await client.query(GET_CUSTOMER_ADRESS_BY_LEAD_ID, [leadId]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }
        const lead = leadCheckResult.rows[0];
        logger.info('lead', lead);
        // Check if surveyor table exists
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'staffs']);
        if (!tableCheckRes.rows[0].exists) {
            logger.info('Staffs table does not exist');
            throw new Error(getMessage('SURVEYOR_NOT_FOUND'));
        }
        // CHECK IF SURVEYOR EXISTS
        let surveyorCheckResult;
        if (surveyorId.startsWith('EMP')) {
            surveyorCheckResult = await client.query(
                `
            SELECT * FROM staffs WHERE staff_id = $1
        `,
                [surveyorId],
            );
            if (surveyorCheckResult.rows.length === 0) {
                throw new Error(getMessage('SURVEYOR_NOT_FOUND'));
            }
        } else if (surveyorId !== tenant.id) {
            throw new Error(getMessage('SURVEYOR_NOT_FOUND'));
        }

        //Check if an incomplete survey exists for that lead
        const surveyCheckResult = await client.query(CHECK_SURVEY, [leadId]);
        if (surveyCheckResult.rows.length > 0) {
            throw new Error(getMessage('LEAD_SURVEY_EXIST'));
        }
        logger.info('surveyCheckResult', surveyCheckResult.rows[0]);
        // Check if the surveyor is available in the given time range
        const surveyorAvailabilityResult = await client.query(CHECK_SURVEYOR_AVAILABILITY, [
            surveyorId,
            startTime,
            endTime,
        ]);
        if (surveyorAvailabilityResult.rows[0].has_conflict) {
            throw new Error(getMessage('NO_SURVEYOR_AVAILABILITY'));
        }
        // Check if the survey date (start and end time) is before the lead's packing_on or moving_on date
        const leadPackingOn = new Date(leadCheckResult.rows[0].packing_on);
        const leadMovingOn = new Date(leadCheckResult.rows[0].moving_on);

        if (new Date(startTime as string) > leadPackingOn || new Date(startTime as string) > leadMovingOn) {
            throw new Error(getMessage('NOT_VALID_START_TIME'));
        }
        if (new Date(endTime as string) > leadPackingOn || new Date(endTime as string) > leadMovingOn) {
            throw new Error(getMessage('NOT_VALID_END_TIME'));
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
            isTenantAssigned,
        ]);
        // Update lead status
        await client.query(UPDATE_LEAD_STATUS, ['SURVEY', leadId]);

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

        // Send nofitication to surveyor on email
        if (surveyorId.startsWith('EMP')) {
            let jobAddress = '__';
            if (lead?.collection_street) {
                jobAddress += 'street- ' + lead.collection_street;
            }
            if (lead?.collection_town) {
                jobAddress += 'town- ' + lead.collection_town;
            }
            if (lead?.collection_county) {
                jobAddress += 'county- ' + lead.collection_county;
            }
            if (lead?.collection_postcode) {
                jobAddress += 'postcode- ' + lead.collection_postcode;
            }
            await generateEmail('Survey Confirmation for Surveyor', surveyorCheckResult?.rows[0]?.email, {
                username: surveyorCheckResult?.rows[0]?.name,
                jobaddress: jobAddress,
                customername: lead.customer_name,
                surveydatetime: `${surveyDate}-${startTime}`,
                surveytype: surveyType,
            });
            // Insert log
            await client.query(INSERT_LOG, [
                tenant.id,
                tenant.name,
                tenant.email,
                `Survey Confirmation  email sent to Surveyor ${leadId}`,
                'LEAD',
                'SURVEY',
                leadId,
            ]);
            await generateEmail('Booked Survey Email for Customer', lead.customer_email, {
                username: lead.customer_name,
                lead: leadId,
                surveyorname: surveyorCheckResult?.rows[0]?.name,
                surveydate: surveyDate,
                surveytime: startTime,
                customerphone: lead.customer_phone ? lead.customer_phone : '__',
            });
        } else {
            await generateEmail('Booked Survey Email for Customer', lead.customer_email, {
                username: lead.customer_name,
                lead: leadId,
                surveyorname: user?.name,
                surveydate: surveyDate,
                surveytime: startTime,
                customerphone: lead.customer_phone ? lead.customer_phone : '__',
            });
        }
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            `Survey Booking  email sent to customer  ${lead.customer_name}`,
            'LEAD',
            'SURVEY',
            leadId,
        ]);

        await client.query('COMMIT');
        return {
            message: getMessage('SURVEYOR_ASSIGNED'),
        };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to add survey', { error });
        throw new Error(`${error.message}`);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
