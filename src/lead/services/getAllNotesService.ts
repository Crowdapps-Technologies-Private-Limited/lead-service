import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';
import {
    GET_CONFIRMATION_NOTES,
    GET_QUOTES_NOTE,
    GET_JOB_NOTES,
    GET_SURVEY_NOTE,
    GET_INVOICE_BY_LEAD_AND_TYPE,
} from '../../sql/sqlScript';

// Service to get all notes by lead_id
export const getAllNotesByLead = async (lead_id: string, tenant: any) => {
    const schema = tenant?.schema;
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released

    try {
        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        if (!schema) {
            throw new Error('Tenant schema is undefined');
        }

        await client.query(`SET search_path TO ${schema}`);

        const notes: Record<string, string | null> = {
            confirmation_note: null,
            quote_note: null,
            survey_note: null,
            job_note: null,
        };

        // Fetch confirmation notes
        const confirmationNotesResult = await client.query(GET_CONFIRMATION_NOTES, [lead_id]);
        if (confirmationNotesResult.rows.length > 0) {
            notes.confirmation_note = confirmationNotesResult.rows[0].confirmation_note || null;
        }

        // Fetch quote notes
        const quotesNotesResult = await client.query(GET_QUOTES_NOTE, [lead_id]);

        if (quotesNotesResult.rows.length > 0) {
            notes.quote_note = quotesNotesResult.rows[0].quote_note || null;
        }

        // Fetch survey notes
        const surveyNotesResult = await client.query(GET_SURVEY_NOTE, [lead_id]);

        if (surveyNotesResult.rows.length > 0) {
            notes.survey_note = surveyNotesResult.rows[0].survey_note || null;
        }

        // Fetch job notes
        const jobsNotesResult = await client.query(GET_JOB_NOTES, [lead_id]);

        if (jobsNotesResult.rows.length > 0) {
            notes.job_note = jobsNotesResult.rows[0].job_note || null;
        }

        let invoice_number = null;
        let invoice_type = null;

        const invoiceResult = await client.query(GET_INVOICE_BY_LEAD_AND_TYPE, [lead_id, 'final']);

        if (invoiceResult.rows.length === 0) {
            logger.info(`Invoice not found `);
        } else {
            invoice_number = invoiceResult.rows[0].invoice_number;
            invoice_type = invoiceResult.rows[0].invoice_type;
        }
        return { notes, invoice_number, invoice_type };
    } catch (error: any) {
        logger.error('Error fetching all notes:', { error });
        throw new Error(error.message);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
