import { GET_LEAD_BY_ID } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { getMessage } from '../../utils/errorMessages';
import logger from '../../utils/logger';
import { generatePdfAndUploadToS3 } from './generatePdf';
import generateQuoteHtml from './generateQuoteHtml';

export const downloadSecondLatestQuote = async (leadId: string, tenant: any) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    if (tenant?.is_suspended) {
        throw new Error(getMessage('ACCOUNT_SUSPENDED'));
    }
    const schema = tenant.schema;
    logger.info('Schema:', { schema });

    await client.query(`SET search_path TO ${schema}`);
    logger.info('Schema set successfully');

    const query = `
        SELECT 
            e.id AS quoteId,
            e.lead_id AS leadId,
            e.quote_total AS quoteTotal,
            e.cost_total AS costTotal,
            e.quote_expires_on AS quoteExpiresOn,
            e.notes,
            e.vat_included AS vatIncluded,
            e.material_price_chargeable AS materialPriceChargeable,
            (
                SELECT json_agg(json_build_object(
                    'serviceId', s.id,
                    'typeName', s.service_name,
                    'description', s.description,
                    'price', s.price
                ))
                FROM ${schema}.quote_services es
                JOIN ${schema}.services s ON es.service_id = s.id
                WHERE es.quote_id = e.id
            ) AS services,
            (
                SELECT json_agg(json_build_object(
                    'materialId', m.id,
                    'name', m.name,
                    'dimensions', m.dimensions,
                    'surveyedQty', m.surveyed_qty,
                    'chargeQty', m.charge_qty,
                    'price', m.price,
                    'total', m.total,
                    'volume', m.volume,
                    'cost', m.cost
                ))
                FROM ${schema}.quote_materials em
                JOIN ${schema}.materials m ON em.material_id = m.id
                WHERE em.quote_id = e.id
            ) AS materials,
            (
                SELECT json_agg(json_build_object(
                    'costId', c.id,
                    'driverQty', c.driver_qty,
                    'porterQty', c.porter_qty,
                    'packerQty', c.packer_qty,
                    'vehicleQty', c.vehicle_qty,
                    'vehicleTypeId', c.vehicle_type_id,
                    'vehicleTypeName', vt.type_name,
                    'fuelCharge', c.fuel_charge,
                    'wageCharge', c.wage_charge
                ))
                FROM ${schema}.quote_costs ec
                JOIN ${schema}.costs c ON ec.cost_id = c.id
                JOIN public.vehicle_types vt ON c.vehicle_type_id = vt.id
                WHERE ec.quote_id = e.id
            ) AS costs,
            (
                SELECT json_agg(json_build_object(
                    'generalInfoId', gi.id,
                    'driverWage', gi.driver_wage,
                    'porterWage', gi.porter_wage,
                    'packerWage', gi.packer_wage,
                    'contentsValue', gi.contents_value,
                    'paymentMethod', gi.payment_method,
                    'insuranceAmount', gi.insurance_amount,
                    'insurancePercentage', gi.insurance_percentage,
                    'insuranceType', gi.insurance_type
                ))
                FROM ${schema}.quote_general_info eg
                JOIN ${schema}.general_information gi ON eg.general_info_id = gi.id
                WHERE eg.quote_id = e.id
            ) AS generalInfo,
            (
                SELECT json_agg(json_build_object(
                    'ancillaryId', a.id,
                    'name', a.name,
                    'charge', a.charge,
                    'isChargeable', a.ischargeable
                ))
                FROM ${schema}.quote_ancillaries ea
                JOIN ${schema}.ancillaries a ON ea.ancillary_id = a.id
                WHERE ea.quote_id = e.id
            ) AS ancillaries
        FROM 
            ${schema}.quotes e
        WHERE 
            e.lead_id = $1
        ORDER BY 
            e.created_at DESC
        OFFSET 1
        LIMIT 1;
    `;

    try {
        // Check if lead exists
        const leadCheckResult = await client.query(GET_LEAD_BY_ID, [leadId]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }
        const quotationDoc = 'Quote_previous';
        const res = await client.query(query, [leadId]);
        // Manually convert string fields to numbers, if necessary
        if (res.rows.length === 0) {
            throw new Error(getMessage('PREV_QUOTE_NOT_FOUND'));
        }
        const data = res.rows[0];
        data.quoteId = data?.quoteid;
        data.quoteTotal = parseFloat(data?.quotetotal);
        data.costTotal = parseFloat(data?.costtotal);
        data.quoteId = data?.quoteid;
        data.leadId = data?.leadid;
        data.quoteExpiresOn = data?.quoteexpireson;
        data.vatIncluded = data?.vatincluded;
        data.materialPriceChargeable = data?.materialpricechargeable;
        data.generalInfo = data?.generalinfo;
        delete data?.quotetotal;
        delete data?.costtotal;
        delete data?.quoteid;
        delete data?.leadid;
        delete data?.quoteexpireson;
        delete data?.vatincluded;
        delete data?.materialpricechargeable;
        delete data?.generalinfo;

        logger.info('quoteData:', { data });
        const html = await generateQuoteHtml({
            client: tenant,
            lead: leadCheckResult.rows[0],
            quote: data,
        });
        logger.info('html:', { html });
        // Generate PDF
        // Generate PDF
        const { pdfUrl, file } = await generatePdfAndUploadToS3({
            html,
            key: 'previous_quote',
            leadId,
            tenantId: tenant.id,
            folderName: 'quotation',
        });
        return { message: getMessage('PREV_QUOTE_PDF_GENERATED'), data: { pdfUrl } };
    } catch (error: any) {
        logger.error('Failed to download prevoius quote', { error });
        throw new Error(`${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
