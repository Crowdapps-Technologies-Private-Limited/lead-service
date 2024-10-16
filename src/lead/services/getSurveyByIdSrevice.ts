import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { CHECK_TABLE_EXISTS, GET_SURVEY_DETAILS } from '../../sql/sqlScript';
import { getMessage } from '../../utils/errorMessages';

export const getSurveyById = async (surveyId: string, tenant: any) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released

    try {
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        const schema = tenant?.schema || tenant?.tenant?.schema;
        logger.info('Schema:', { schema });
        await client.query(`SET search_path TO ${schema}`);
        const tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'surveys']);
        const checkTableExists = tableCheckRes.rows[0].exists;
        if (!checkTableExists) {
            logger.info('Surveys table does not exist');
            return null;
        }
        // Fetch survey by ID
        const result = await client.query(GET_SURVEY_DETAILS, [surveyId]);

        logger.info('Survey fetched successfully', { surveyId, rowCount: result.rowCount });

        if (result.rowCount === 0) {
            return null; // Survey not found
        }
        const survey = result.rows[0];
        let description = `Client Email: ${survey?.customerEmail}`;
        if (survey?.collectionStreet) {
            description += `\nAddress: ${survey.collectionStreet}`;
        }
        if (survey?.collectionTown) {
            description += `\nTown: ${survey.collectionTown}`;
        }
        if (survey?.collectionCountry) {
            description += `\nCountry: ${survey.collectionCountry}`;
        }
        if (survey?.collectionPostcode) {
            description += `\nPostcode: ${survey.collectionPostcode}`;
        }
        if (survey?.customerPhone) {
            description += `\nMobile: ${survey.customerPhone}`;
        }
        survey.description = description;
        return survey;
    } catch (error: any) {
        logger.error(`Failed to fetch survey by ID: ${error.message}`);
        throw new Error(`${error.message}`);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
            logger.info('Database connection closed successfully');
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
            throw new Error('Failed to close database connection');
        }
    }
};
