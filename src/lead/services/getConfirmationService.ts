import { 
    CHECK_TABLE_EXISTS, 
    GET_LEAD_DETAILS_FOR_CUSTOMER,
    GET_CONFIRMATION_DETAILS,
    GET_LEAD_SURVEY,
    GET_LEAD_QUOTES_CONFIRMATION,
  } from '../../sql/sqlScript';
  import { connectToDatabase } from '../../utils/database';
  import { setPaginationData } from '../../utils/utility';
  import logger from '../../utils/logger';
  import { getMessage } from '../../utils/errorMessages';
  import { getconfigSecrets } from '../../utils/getConfig';
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

      const quotesResult = await client.query(GET_LEAD_QUOTES_CONFIRMATION, [leadId]);
        if (!quotesResult?.rows?.length) {
            logger.info('No quotes found');
        }
        const quoteDetails = quotesResult?.rows[0];
        
 
 
      let collectionFrom = leadDetails?.collectionStreet ? leadDetails?.collectionStreet : '';
      if(leadDetails?.collectionTown) {
        collectionFrom === '' ? collectionFrom += `${leadDetails?.collectionTown}` : collectionFrom += `, ${leadDetails?.collectionTown}`;
      }
      if(leadDetails?.collectionCounty) {
        collectionFrom === '' ? collectionFrom += `${leadDetails?.collectionCounty}` : collectionFrom += `, ${leadDetails?.collectionCounty}`;
      }
      if(leadDetails?.collectionPostcode) {
        collectionFrom === '' ? collectionFrom += `${leadDetails?.collectionPostcode}` : collectionFrom += `, ${leadDetails?.collectionPostcode}`;
      }
      if(leadDetails?.collectionCountry) {
        collectionFrom === '' ? collectionFrom += `${leadDetails?.collectionCountry}` : collectionFrom += `, ${leadDetails?.collectionCountry}`;
      }
      let deliveryTo = leadDetails?.deliveryStreet ? leadDetails?.deliveryStreet : '';
      if(leadDetails?.deliveryTown) {
        deliveryTo === '' ? deliveryTo += `${leadDetails?.deliveryTown}` : deliveryTo += `, ${leadDetails?.deliveryTown}`;
      }
      if(leadDetails?.deliveryCounty) {
        deliveryTo === '' ? deliveryTo += `${leadDetails?.deliveryCounty}` : deliveryTo += `, ${leadDetails?.deliveryCounty}`;
      }
      if(leadDetails?.deliveryPostcode) {
        deliveryTo === '' ? deliveryTo += `${leadDetails?.deliveryPostcode}` : deliveryTo += `, ${leadDetails?.deliveryPostcode}`;
      }
      if(leadDetails?.deliveryCountry) {
        deliveryTo === '' ? deliveryTo += `${leadDetails?.deliveryCountry}` : deliveryTo += `, ${leadDetails?.deliveryCountry}`;
      }
  
      const data = {
        name: leadDetails?.name,
        collectFrom: collectionFrom,
        deliveryTo,
        services: confirmationDetails?.services,
        comments: confirmationDetails?.comments,
        confirmedOn: confirmationDetails?.confirmed_on,
        isDepositeRecieved: confirmationDetails?.is_deposit_received,
        movingDate: {
          date: confirmationDetails?.movingOnDate,
          time: confirmationDetails?.movingOnTime,
          status: confirmationDetails?.movingOnStatus
        },
        packingDate: {
          date: confirmationDetails?.packingOnDate,
          time: confirmationDetails?.packingOnTime,
          status: confirmationDetails?.packingOnStatus
        },
        isAcceptLiabilityCover: confirmationDetails?.isAcceptLiabilityCover,
        liabilityCover: confirmationDetails?.liabilityCover,
        isTerm: confirmationDetails?.isTermsAccepted,
        isAccepted: confirmationDetails?.isQuotationAccepted,
        isSubmitted: confirmationDetails?.isSubmitted,
        confirmationId: confirmationDetails?.confirmationId,
        ...quoteDetails
      }
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
  