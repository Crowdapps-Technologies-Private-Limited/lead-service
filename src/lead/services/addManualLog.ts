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
};

// Function to validate the transition from one stage to another as per the rules specified
const isValidTransition = (fromStage: string, toStage: string): boolean => {
    const validTransitions: any = {
        'NEW LEAD': ['ESTIMATES', 'SURVEY'],
        ESTIMATES: ['SURVEY', 'NEW LEAD'],
        SURVEY: ['ESTIMATES', 'NEW LEAD'],
        QUOTE: ['SURVEY', 'ESTIMATES', 'NEW LEAD'],
    };

    // If the fromStage has valid transitions and toStage is included in those transitions
    return validTransitions[fromStage]?.includes(toStage) || false;
};

// Service to handle adding a manual log entry and changing the lead status
export const addManualLogAndChangeLeadStatus = async (payload: any, lead_id: string, tenant: any, user: any) => {
    const { action, action_type, specific_detail, follow_up_date } = payload;
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
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

        // Check if the lead exists
        const leadCheckResult = await client.query(GET_LEAD_STATUS_BY_ID, [lead_id]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }

        const lead = leadCheckResult.rows[0];

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

            // Update action note to include the follow-up date
            updatedActionNote += ` | Follow-up date set to: ${providedFollowUpDate.toISOString().split('T')[0]}`;
        }

        let updatedLeadStatus = lead.status;
        if (action_type) {
            if (!LEAD_STAGES.includes(action_type)) {
                throw new Error(`Invalid action type. Action type must be one of ${LEAD_STAGES.join(', ')}`);
            }

            // Validate the lead status transition as per the PDF rules
            if (!isValidTransition(lead.status, action_type)) {
                const errorMessage = ERROR_MESSAGES[lead.status]?.[action_type] || 'Invalid status transition.';
                throw new Error(errorMessage);
            }

            if (lead.status !== action_type) {
                const updatedLeadStatusResult = await client.query(UPDATE_LEAD_STATUS, [action_type, lead_id]);
                updatedLeadStatus = updatedLeadStatusResult.rows[0].status;
                logger.info(`Lead status changed successfully for lead ${lead_id} to ${action_type}`);
            }
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

        // Commit transaction
        await client.query('COMMIT');
        return logResult.rows[0];
    } catch (error: any) {
        // Rollback transaction in case of error
        await client.query('ROLLBACK');
        throw new Error(error.message);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
