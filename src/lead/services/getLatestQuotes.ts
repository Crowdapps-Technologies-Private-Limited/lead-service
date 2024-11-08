import {
    CHECK_TABLE_EXISTS,
    GET_ESTIMATE_BY_LEAD_ID,
    GET_ESTIMATE_BY_LEAD_ID_FOR_QUOTES,
    GET_LATEST_QUOTES,
    GET_SURVEY_ITEMS_BY_LEAD_ID,
    GET_TERMS_DOC,
} from '../../sql/sqlScript';
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
            //getData from estimate
            const resEstimate = await client.query(GET_ESTIMATE_BY_LEAD_ID_FOR_QUOTES, [leadId]);
            // Manually convert string fields to numbers, if necessary
            if (!resEstimate.rows.length) {
                return {
                    message: getMessage('QUOTE_NOT_FOUND'),
                    data: {},
                };
            }
            // Get existing survey items for the given room
            const existingSurveyItemsRes = await client.query(GET_SURVEY_ITEMS_BY_LEAD_ID, [leadId]);
            const existingSurveyItems = existingSurveyItemsRes.rows;

            logger.info('Existing survey items:', { existingSurveyItems });

            const data = resEstimate.rows[0];
            const updatedMaterials = updateMaterialsWithSurveyedQty(data.materials, existingSurveyItems);
            console.log(updatedMaterials);
            data.materials = updatedMaterials;
            data.quoteTotal = data?.quotetotal ? parseFloat(data?.quotetotal) : 0;
            data.costTotal = data?.quotetotal ? parseFloat(data?.costtotal) : 0;

            data.leadId = data?.leadid;
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
            delete data.estimatedid;
            delete data.notes;

            return {
                data: {
                    ...data,
                    isTermConditonPdf: false,
                    count: 0,
                },
            };
        }

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
        throw new Error(`Failed to get latest quote: ${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};

function updateMaterialsWithSurveyedQty(materials, existingSurveyItems) {
    const updatedMaterials = [...materials]; // Copy to avoid mutating original materials array

    // Create a lookup table for existing survey items by item name
    const surveyItemLookup = existingSurveyItems.reduce((lookup, item) => {
        lookup[item.item] = item.quantity; // Map item name to quantity
        return lookup;
    }, {});

    // Update existing materials with surveyed quantities or add new materials if not found
    updatedMaterials.forEach((material) => {
        if (surveyItemLookup[material.name] !== undefined) {
            // Update surveyedQty if item found in survey items
            material.surveyedQty = surveyItemLookup[material.name];
        } else {
            // Set default values if item not found
            material.surveyedQty = 0;
            material.chargeQty = 0;
            material.price = 0;
            material.total = 0;
            material.volume = 0;
            material.cost = 0;
            material.dimensions = null;
        }
    });

    // Add new items that are in existingSurveyItems but not in materials
    existingSurveyItems.forEach((surveyItem: any) => {
        if (!updatedMaterials.some((material) => material.name === surveyItem.item)) {
            updatedMaterials.push({
                name: surveyItem.item,
                dimensions: null,
                surveyedQty: surveyItem.quantity,
                chargeQty: null,
                price: null,
                total: null,
                volume: null,
                cost: null,
            });
        }
    });

    return updatedMaterials;
}
