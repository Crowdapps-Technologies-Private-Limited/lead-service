import {
    CHECK_TABLE_EXISTS,
    GET_LEAD_DETAILS_FOR_CUSTOMER,
    GET_CONFIRMATION_DETAILS,
    GET_LEAD_QUOTES_CONFIRMATION,
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import AWS from 'aws-sdk';
const s3 = new AWS.S3();
export const getConfirmation = async (tenant: any, leadId: string) => {
    // Connect to PostgreSQL database
    const client = await connectToDatabase();
    const schema = tenant?.schema;
    logger.info('Schema:', { schema });
    try {
        await client.query(`SET search_path TO ${schema}`);
        // Fetch list
        const tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'confirmations']);
        const checkTableExists = tableCheckRes.rows[0].exists;
        if (!checkTableExists) {
            logger.info('Confirmations table does not exist');
            return {};
        }
        const confirmationDetailsRes = await client.query(GET_CONFIRMATION_DETAILS, [leadId]);
        if (!confirmationDetailsRes?.rows?.length) {
            logger.info('No confirmation details found');
            return {};
        }
        const confirmationDetails = confirmationDetailsRes?.rows[0];
        logger.info('Confirmation details:', { confirmationDetails });
        const leadDetailsRes = await client.query(GET_LEAD_DETAILS_FOR_CUSTOMER, [leadId]);
        if (!leadDetailsRes?.rows?.length) {
            logger.info('No lead details found');
            return {};
        }
        const leadDetails = leadDetailsRes?.rows[0];
        logger.info('Lead details:', { leadDetails });

        const quotesResult = await client.query(GET_LEAD_QUOTES_CONFIRMATION, [confirmationDetails?.quoteId]);
        if (!quotesResult?.rows?.length) {
            logger.info('No quotes found');
        }
        const quoteDetails = quotesResult?.rows[0];
        logger.info('Quote details:', { quoteDetails });
        const data = {
            colectionVolume: leadDetails?.collection_volume,
            collectionVolumeUnit: leadDetails?.collection_volume_unit,
            deliveryVolume: leadDetails?.delivery_volume,
            deliveryVolumeUnit: leadDetails?.delivery_volume_unit,
            services: confirmationDetails?.services,
            comments: confirmationDetails?.comments,
            confirmedOn: confirmationDetails?.confirmedOn,
            isDepositeRecieved: confirmationDetails?.isDepositReceived,
            movingDate: {
                date: confirmationDetails?.movingOnDate,
                time: confirmationDetails?.movingOnTime,
                status: confirmationDetails?.movingOnStatus,
            },
            packingDate: {
                date: confirmationDetails?.packingOnDate,
                time: confirmationDetails?.packingOnTime,
                status: confirmationDetails?.packingOnStatus,
            },
            confirmationId: confirmationDetails?.confirmationId,
            ...quoteDetails,
        };
        logger.info('Data:', { data });
        return data;
    } catch (error: any) {
        logger.error('Failed to fetch data', { error });
        throw new Error(`${error.message}`);
    } finally {
        try {
            await client.end();
        } catch (endError: any) {
            logger.error('Failed to close database connection', { endError });
            throw new Error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
