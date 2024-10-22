import { CHECK_TABLE_EXISTS, GET_LATEST_QUOTES, GET_TERMS_DOC } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { getMessage } from '../../utils/errorMessages';
import logger from '../../utils/logger';

export const getLatestQuote = async (leadId: string, tenant: any) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant.schema;

    await client.query(`SET search_path TO ${schema}`);

    const tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'quotes']);

    const checkTableExists = tableCheckRes.rows[0].exists;

    if (!checkTableExists) {
        logger.info('Quotes table does not exist');
        return {
            message: getMessage('QUOTE_NOT_FOUND'),
            data: {},
        };
    }
    try {
        const countQuery = `SELECT COUNT(*) FROM ${schema}.quotes WHERE lead_id = $1;`;
        const totalCount = await client.query(countQuery, [leadId]);
        const res = await client.query(GET_LATEST_QUOTES, [leadId]);
        const data = res.rows[0];
        if (!data) {
            return {
                message: getMessage('QUOTE_NOT_FOUND'),
                data: {},
            };
        }

        data.quoteId = data?.quoteid;
        data.quoteTotal = data?.quotetotal ? parseFloat(data?.quotetotal) : 0;
        data.costTotal = data?.quotetotal ? parseFloat(data?.costtotal) : 0;
        data.quoteId = data?.quoteid;
        data.leadId = data?.leadid;
        data.quoteExpiresOn = data?.quoteexpireson;
        data.vatIncluded = data?.vatincluded;
        data.materialPriceChargeable = data?.materialpricechargeable;
        data.generalInfo = data?.generalinfo;
        delete data.quotetotal;
        delete data.costtotal;
        delete data.quoteid;
        delete data.leadid;
        delete data.quoteexpireson;
        delete data.vatincluded;
        delete data.materialpricechargeable;
        delete data.generalinfo;

        let isTermConditonPdf = false;
        const docsResult = await client.query(GET_TERMS_DOC);
        const docs = docsResult?.rows;
        if (!docs?.length) {
            logger.info('No terms and conditions found');
        } else {
            logger.info('Terms and conditions found:', { docs });
            //   termPDF = docs[0].s3key;
            isTermConditonPdf = true;
        }

        return {
            data: {
                ...data,
                isTermConditonPdf,
                count: totalCount?.rows[0].count,
            },
        };
    } catch (error: any) {
        logger.error('Failed to get latest quote', { error });
        throw new Error(`${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
