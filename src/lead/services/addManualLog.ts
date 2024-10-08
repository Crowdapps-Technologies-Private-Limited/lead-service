import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';
import { GET_LEAD_STATUS_BY_ID, INSERT_LOG, UPDATE_FOLLOWUP_DATE, UPDATE_LEAD_STATUS } from '../../sql/sqlScript';

// Possible lead stages as per the PDF
const LEAD_STAGES = ['NEW LEAD', 'ESTIMATES', 'SURVEY', 'QUOTE', 'CONFIRMED'];

// Error messages for invalid transitions as per the PDF details
const ERROR_MESSAGES: any = {
    'NEW LEAD': {
        ESTIMATES: 'You can move to ESTIMATES or SURVEY stage directly from NEW LEAD.',
        SURVEY: 'You can move to SURVEY stage directly from NEW LEAD.',
        QUOTE: 'Quotation needs to be submitted before proceeding. However, you can move the leads till survey stage and fill in the quotation then.',
        CONFIRMED:
            'Quote stage is required to proceed with confirmation. Kindly fill in quote details to proceed with confirmation.',
    },
    ESTIMATES: {
        SURVEY: 'You can move to SURVEY stage directly from ESTIMATES.',
        QUOTE: 'Quotation needs to be submitted before proceeding. However, you can move the leads till survey stage and fill in the quotation then.',
        CONFIRMED:
            'Quote stage is required to proceed with confirmation. Kindly fill in quote details to proceed with confirmation.',
    },
    SURVEY: {
        QUOTE: 'You need to create a QUOTE before confirming the lead.',
        CONFIRMED: 'Quotation needs to be submitted before proceeding.',
    },
    QUOTE: {
        CONFIRMED:
            'Quote stage is required to proceed with confirmation. Kindly fill in quote details to proceed with confirmation.',
    },
    CONFIRMED: {
        QUOTE: 'You cannot move back to QUOTE once you are in the CONFIRMED stage.',
        SURVEY: 'Moving back to SURVEY stage is not allowed once the lead is CONFIRMED.',
        ESTIMATES: 'Moving back to ESTIMATES stage is not allowed once the lead is CONFIRMED.',
        'NEW LEAD': 'Moving back to NEW LEAD is not allowed once the lead is CONFIRMED.',
    },
};

// Function to validate the transition from one stage to another as per the rules specified
const isValidTransition = (fromStage: string, toStage: string): boolean => {
    if (fromStage === 'NEW LEAD') {
        return ['ESTIMATES', 'SURVEY'].includes(toStage);
    } else if (fromStage === 'ESTIMATES') {
        return ['SURVEY', 'QUOTE'].includes(toStage);
    } else if (fromStage === 'SURVEY') {
        return ['QUOTE'].includes(toStage);
    } else if (fromStage === 'QUOTE') {
        return ['CONFIRMED'].includes(toStage);
    } else if (fromStage === 'CONFIRMED') {
        // Allow backward movement as specified, but should trigger specific error messages
        return false;
    }
    return false;
};

// Service to handle adding a manual log entry and changing the lead status
export const addManualLogAndChangeLeadStatus = async (payload: any, lead_id: string, tenant: any, user: any) => {
    const { action, action_type, specific_detail, follow_up_date } = payload;
    const client = await connectToDatabase();
    const schema = tenant?.schema;

    try {
        if (tenant?.is_suspended) {
            throw new Error('Account is suspended');
        }

        if (!schema) {
            throw new Error('Tenant schema is undefined');
        }

        await client.query(`SET search_path TO ${schema}`);

        // Start transaction
        await client.query('BEGIN');

        if (!LEAD_STAGES.includes(action_type)) {
            throw new Error(`Invalid action type. Action type must be one of ${LEAD_STAGES.join(', ')}`);
        }

        // Check if the lead exists
        const leadCheckResult = await client.query(GET_LEAD_STATUS_BY_ID, [lead_id]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }

        const lead = leadCheckResult.rows[0];
        logger.info('Lead data:', { lead });

        let updatedActionNote = `${action} ${specific_detail}`; // Default action note

        // Validate follow-up date to ensure it's a future date
        if (follow_up_date) {
            const currentDate = new Date();
            const providedFollowUpDate = new Date(follow_up_date);

            if (providedFollowUpDate <= currentDate) {
                throw new Error('Follow-up date must be a future date.');
            }

            // Update the lead's follow-up date
            await client.query(UPDATE_FOLLOWUP_DATE, [follow_up_date, lead_id]);
            logger.info('Lead follow-up date updated successfully:', { lead_id, follow_up_date });

            // Update action note to include the follow-up date
            updatedActionNote += ` | Follow-up date set to: ${providedFollowUpDate.toISOString().split('T')[0]}`;
        }

        // Validate the lead status transition as per the PDF rules
        if (action_type && !isValidTransition(lead.status, action_type)) {
            const errorMessage = ERROR_MESSAGES[lead.status]?.[action_type] || 'Invalid status transition.';
            throw new Error(errorMessage);
        }

        logger.info('action_type:', { action_type });

        // Update lead status if necessary
        let updatedLeadStatus = lead.status;
        if (action_type && lead.status !== action_type) {
            const updatedLeadStatusResult = await client.query(UPDATE_LEAD_STATUS, [action_type, lead_id]);
            updatedLeadStatus = updatedLeadStatusResult.rows[0].status;
            logger.info(`Lead status changed successfully for lead ${lead_id} to ${action_type}`);
        }

        // Prepare data for the log entry
        const actor_id = user.cognito_sub;
        const actor_name = user.name;
        const actor_email = user.email;

        // Insert the manual log entry into the lead_logs table
        const logResult = await client.query(INSERT_LOG, [
            actor_id,
            actor_name,
            actor_email,
            updatedActionNote, // Updated action note to include follow-up date if applicable
            action_type || 'N/A', // Default action type if not provided
            updatedLeadStatus, // Current status of the lead
            lead_id,
        ]);

        logger.info('Manual log entry added successfully:', { log: logResult.rows[0] });

        // Commit transaction
        await client.query('COMMIT');
        return logResult.rows[0];
    } catch (error: any) {
        // Rollback transaction in case of error
        await client.query('ROLLBACK');
        logger.error('Error adding manual log or changing lead status:', { error });
        throw new Error(error.message);
    } finally {
        client.end();
    }
};
