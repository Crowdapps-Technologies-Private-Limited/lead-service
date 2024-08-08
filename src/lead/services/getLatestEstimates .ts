import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { generatePdfAndUploadToS3 } from './generatePdf';

export const getLatestEstimates = async (leadId: string, tenant: any) => {
    const client = await connectToDatabase();
    if (tenant?.is_suspended) {
        throw new Error('Tenant is suspended');
    }
    const schema = tenant.schema;
    logger.info('Schema:', { schema });
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    logger.info('Schema created successfully');
    await client.query(`SET search_path TO ${schema}`);
    logger.info('Schema set successfully');

    const query = `
        SELECT 
            e.id AS estimate_id,
            e.lead_id,
            e.quote_total,
            e.cost_total,
            e.quote_expires_on,
            e.notes,
            e.vat_included,
            e.material_price_chargeable,
            (
                SELECT json_agg(json_build_object(
                    'service_id', s.id,
                    'typeName', s.service_name,
                    'description', s.description,
                    'price', s.price
                ))
                FROM ${schema}.estimate_services es
                JOIN ${schema}.services s ON es.service_id = s.id
                WHERE es.estimate_id = e.id
            ) AS services,
            (
                SELECT json_agg(json_build_object(
                    'material_id', m.id,
                    'name', m.name,
                    'dimensions', m.dimensions,
                    'surveyedQty', m.surveyed_qty,
                    'chargeQty', m.charge_qty,
                    'price', m.price,
                    'total', m.total,
                    'volume', m.volume,
                    'cost', m.cost
                ))
                FROM ${schema}.estimate_materials em
                JOIN ${schema}.materials m ON em.material_id = m.id
                WHERE em.estimate_id = e.id
            ) AS materials,
            (
                SELECT json_agg(json_build_object(
                    'cost_id', c.id,
                    'driverQty', c.driver_qty,
                    'porterQty', c.porter_qty,
                    'packerQty', c.packer_qty,
                    'vehicleQty', c.vehicle_qty,
                    'vehicleTypeId', c.vehicle_type_id,
                    'fuelCharge', c.fuel_charge,
                    'wageCharge', c.wage_charge
                ))
                FROM ${schema}.estimate_costs ec
                JOIN ${schema}.costs c ON ec.cost_id = c.id
                WHERE ec.estimate_id = e.id
            ) AS costs,
            (
                SELECT json_agg(json_build_object(
                    'general_info_id', gi.id,
                    'driverWage', gi.driver_wage,
                    'porterWage', gi.porter_wage,
                    'packerWage', gi.packer_wage,
                    'contentsValue', gi.contents_value,
                    'paymentMethod', gi.payment_method,
                    'insuranceAmount', gi.insurance_amount,
                    'insurancePercentage', gi.insurance_percentage,
                    'insuranceType', gi.insurance_type
                ))
                FROM ${schema}.estimate_general_info eg
                JOIN ${schema}.general_information gi ON eg.general_info_id = gi.id
                WHERE eg.estimate_id = e.id
            ) AS general_info,
            (
                SELECT json_agg(json_build_object(
                    'ancillary_id', a.id,
                    'name', a.name,
                    'charge', a.charge,
                    'isChargeable', a.isChargeable
                ))
                FROM ${schema}.estimate_ancillaries ea
                JOIN ${schema}.ancillaries a ON ea.ancillary_id = a.id
                WHERE ea.estimate_id = e.id
            ) AS ancillaries,
            e.created_at
        FROM 
            ${schema}.estimates e
        WHERE 
            e.lead_id = $1
        ORDER BY 
            e.created_at DESC
        LIMIT 1;
    `;

    try {
        const res = await client.query(query, [leadId]);
        return res.rows[0];
    } catch (error: any) {
        logger.error('Failed to get latest estimates', { error });
        throw new Error(`Failed to get latest estimates: ${error.message}`);
    } finally {
        client.end();
    }
};
