import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';
import { CREATE_FEEDBACK_RELATED_TABLE } from '../../sql/sqlScript';

// Service to get feedback responses by lead_id
export const getFeedbackResponseByLead = async (lead_id: string, tenant: any) => {
    const schema = tenant?.schema;
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    logger.info('Fetching feedback responses for lead:', { lead_id });

    try {
        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        if (!schema) {
            throw new Error('Tenant schema is undefined');
        }

        await client.query(`SET search_path TO ${schema}`);
        await client.query(CREATE_FEEDBACK_RELATED_TABLE); // Ensure feedback tables exist
        logger.info('Feedback tables checked/created successfully');

        const query = `
            SELECT 
                fr.response_id,
                fr.question_id,
                fq.question_text,
                fq.category,
                fr.rating,
                fr.comment,
                fr.created_at
            FROM feedback_responses fr
            LEFT JOIN feedback_questions fq ON fr.question_id = fq.question_id
            WHERE fr.lead_id = $1
            ORDER BY fr.created_at DESC;
        `;

        const result = await client.query(query, [lead_id]);

        if (result.rows.length === 0) {
            throw new Error(`No feedback responses found for lead ID ${lead_id}`);
        }

        logger.info('Feedback responses fetched successfully for lead:', { lead_id });
        return result.rows;
    } catch (error: any) {
        logger.error('Error fetching feedback responses:', { error });
        throw new Error(error.message);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
