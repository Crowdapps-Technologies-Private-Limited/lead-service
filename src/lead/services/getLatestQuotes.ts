import { connectToDatabase } from '../../utils/database';
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
        LIMIT 1;
    `;

    const countQuery = `SELECT COUNT(*) FROM ${schema}.quotes WHERE lead_id = $1;`;

    try {
        const res = await client.query(query, [leadId]);
        // Manually convert string fields to numbers, if necessary
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
        return {
            data: {
                record: data,
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
