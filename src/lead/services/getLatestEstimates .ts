import { CHECK_TABLE_EXISTS, GET_ESTIMATE_BY_LEAD_ID } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { getMessage } from '../../utils/errorMessages';
import logger from '../../utils/logger';

export const getLatestEstimates = async (leadId: string, tenant: any) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released

    const schema = tenant.schema;
    logger.info('Schema:', { schema });
    await client.query(`SET search_path TO ${schema}`);
    logger.info('Schema set successfully');
    const tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'estimates']);
    const checkTableExists = tableCheckRes.rows[0].exists;
    if (!checkTableExists) {
        logger.info('Estimates table does not exist');
        return {
            message: getMessage('ESTIMATE_NOT_FOUND'),
            data: {},
        };
    }

    try {
        const res = await client.query(GET_ESTIMATE_BY_LEAD_ID, [leadId]);
        // Manually convert string fields to numbers, if necessary
        const data = res.rows[0];
        data.quoteTotal = data?.quotetotal ? parseFloat(data?.quotetotal) : 0;
        data.costTotal = data?.costtotal ? parseFloat(data?.costtotal) : 0;
        data.estimateId = data?.estimateid;
        data.leadId = data?.leadid;
        data.quoteExpiresOn = data?.quoteexpireson;
        data.vatIncluded = data?.vatincluded;
        data.materialPriceChargeable = data?.materialpricechargeable;
        data.generalInfo = data?.generalinfo;
        delete data.quotetotal;
        delete data.costtotal;
        delete data.estimateid;
        delete data.leadid;
        delete data.quoteexpireson;
        delete data.vatincluded;
        delete data.materialpricechargeable;
        delete data.generalinfo;

        return data;
    } catch (error: any) {
        logger.error('Failed to get latest estimates', { error });
        throw new Error(`${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
