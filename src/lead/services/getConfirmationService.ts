import {
    CHECK_TABLE_EXISTS,
    GET_LEAD_DETAILS_FOR_CUSTOMER,
    GET_CONFIRMATION_DETAILS,
    GET_LEAD_QUOTES_CONFIRMATION,
    GET_INVOICE_BY_LEAD_AND_TYPE,
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import AWS from 'aws-sdk';
const s3 = new AWS.S3();

export const getConfirmation = async (tenant: any, leadId: string) => {
    // Connect to PostgreSQL database
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant?.schema;
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
        const leadDetailsRes = await client.query(GET_LEAD_DETAILS_FOR_CUSTOMER, [leadId]);
        if (!leadDetailsRes?.rows?.length) {
            logger.info('No lead details found');
            return {};
        }
        const leadDetails = leadDetailsRes?.rows[0];

        const quotesResult = await client.query(GET_LEAD_QUOTES_CONFIRMATION, [confirmationDetails?.quoteId]);
        if (!quotesResult?.rows?.length) {
            logger.info('No quotes found');
        }
        const quoteDetails = quotesResult?.rows[0];

        const invoiceResult = await client.query(GET_INVOICE_BY_LEAD_AND_TYPE, [leadId, 'deposit']);
        if (!invoiceResult?.rows?.length) {
            logger.info('No invoice found');
        }
        const invoice = invoiceResult?.rows[0];

        // Sort services so that 'Door to Door' is at index 0 and 'Full Pack' is at index 1
        const sortedServices = confirmationDetails?.services?.sort((a: any, b: any) => {
            if (a.name === 'Door to Door') return -1;
            if (b.name === 'Door to Door') return 1;
            if (a.name === 'Full Pack') return -1;
            if (b.name === 'Full Pack') return 1;
            return 0; // Keep the rest in the same order
        });

        const data = {
            colectionVolume: leadDetails?.collection_volume,
            collectionVolumeUnit: leadDetails?.collection_volume_unit,
            deliveryVolume: leadDetails?.delivery_volume,
            deliveryVolumeUnit: leadDetails?.delivery_volume_unit,
            services: sortedServices, // Updated sorted services
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
            invoiceNumber: invoice?.invoice_number ? invoice?.invoice_number : null,
            invoiceType: invoice?.invoice_type ? invoice?.invoice_type : null,
        };

        return data;
    } catch (error: any) {
        logger.error('Failed to fetch data', { error });
        throw new Error(`${error.message}`);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
        } catch (endError: any) {
            logger.error('Failed to close database connection', { endError });
            throw new Error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
