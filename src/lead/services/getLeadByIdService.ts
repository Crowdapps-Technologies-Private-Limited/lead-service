import { GET_LEAD_BY_ID, GET_REFERRER_BY_ID, CHECK_TABLE_EXISTS, GET_SURVEY_BY_LEAD } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';

export const getLeadById = async (leadId: string, tenant: any) => {
    // Connect to PostgreSQL database
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    try {
        await client.query('BEGIN');
        const schema = tenant?.schema || tenant?.tenant?.schema;
        logger.info('Schema:', { schema });

        await client.query(`SET search_path TO ${schema}`);
        logger.info('Schema set successfully');

        // Check if the leads table exists
        let tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
        const leadsTableExists = tableCheckRes.rows[0].exists;
        if (!leadsTableExists) {
            logger.info('Leads table does not exist');
            return {
                message: getMessage('LEAD_NOT_FOUND'),
                data: {},
            };
        }

        // Get the lead by ID
        const leadResult = await client.query(GET_LEAD_BY_ID, [leadId]);
        const lead = leadResult.rows[0] || {};
        let surveyId = null;
        let surveyStatus = null;
        // Check survey table exists
        tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'surveys']);
        const checkTableExists = tableCheckRes.rows[0].exists;
        if (!checkTableExists) {
            logger.info('Surveys table does not exist');
            surveyId = null;
            surveyStatus = null;
        } else {
            //Get survey by lead id
            const surveyResult = await client.query(GET_SURVEY_BY_LEAD, [leadId]);
            if (surveyResult.rows.length > 0) {
                surveyId = surveyResult.rows[0].id;
                surveyStatus = surveyResult.rows[0].status;
            }
        }
        lead.survey_id = surveyId;
        lead.survey_status = surveyStatus;
        // Get the referrer by ID
        const referrerResult = await client.query(GET_REFERRER_BY_ID, [lead.referrer_id]);
        const referrer = referrerResult.rows[0] || {};

        // Prepare company information
        const company = {
            logo: tenant.logo,
            companyName: tenant.companyName,
            postCode: tenant.postCode,
        };

        await client.query('COMMIT');
        return {
            message: 'Lead data fetched successfully',
            data: {
                lead,
                referrer,
                company,
            },
        };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to fetch data', { error });
        throw new Error(`${error.message}`);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
        } catch (endError: any) {
            throw new Error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
