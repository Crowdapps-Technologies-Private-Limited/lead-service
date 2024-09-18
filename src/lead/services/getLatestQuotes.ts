import { CHECK_TABLE_EXISTS, CREATE_DOC_TABLE_IF_NOT_EXISTS, GET_LATEST_QUOTES, GET_TERMS_DOC } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { getMessage } from '../../utils/errorMessages';
import logger from '../../utils/logger';

export const getLatestQuote = async (leadId: string, tenant: any) => {
    const client = await connectToDatabase();
    // if (tenant?.is_suspended) {
    //     throw new Error('Tenant is suspended');
    // }
    const schema = tenant.schema;
    logger.info('Schema:', { schema });
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    logger.info('Schema created successfully');
    await client.query(`SET search_path TO ${schema}`);
    logger.info('Schema set successfully');

   
    let tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'quotes']);
 
    const checkTableExists = tableCheckRes.rows[0].exists;
    if (!checkTableExists) {
      logger.info('Quotes table does not exist');
      return {
        message: getMessage('QUOTE_NOT_FOUND'),
        data: {}
      };
    }

    const countQuery = `SELECT COUNT(*) FROM ${schema}.quotes WHERE lead_id = $1;`;

    try {
        await client.query(CREATE_DOC_TABLE_IF_NOT_EXISTS);
        const res = await client.query(GET_LATEST_QUOTES, [leadId]);
        const data = res.rows[0];
        data.quoteId = data.quoteid;
        data.quoteTotal = parseFloat(data.quotetotal);
        data.costTotal = parseFloat(data.costtotal);
        data.quoteId = data.quoteid;
        data.leadId = data.leadid;
        data.quoteExpiresOn = data.quoteexpireson;
        data.vatIncluded = data.vatincluded;
        data.materialPriceChargeable = data.materialpricechargeable;
        data.generalInfo = data.generalinfo;
        delete data.quotetotal;
        delete data.costtotal;
        delete data.quoteid;
        delete data.leadid;
        delete data.quoteexpireson;
        delete data.vatincluded;
        delete data.materialpricechargeable;
        delete data.generalinfo;
        // get total count of quotes
        const totalCount = await client.query(countQuery, [leadId]);
        let isTermConditonPdf = false ;
    const docsResult = await client.query(GET_TERMS_DOC);
    const docs = docsResult?.rows;
    if (!docs?.length) {
      logger.info('No terms and conditions found');

    }
    else {
      logger.info('Terms and conditions found:', { docs });
    //   termPDF = docs[0].s3key;
    isTermConditonPdf = true;
    }

   
        return {
            data: {
                ...data,
                isTermConditonPdf,
                count: totalCount.rows[0].count
            }
        };
    } catch (error: any) {
        logger.error('Failed to get latest quote', { error });
        throw new Error(`${error.message}`);
    } finally {
        client.end();
    }
};
