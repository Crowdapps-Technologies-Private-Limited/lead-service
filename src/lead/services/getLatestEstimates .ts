import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';

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
                    'service_name', s.service_name,
                    'service_description', s.description,
                    'service_price', s.price
                ))
                FROM ${schema}.estimate_services es
                JOIN ${schema}.services s ON es.service_id = s.id
                WHERE es.estimate_id = e.id
            ) AS services,
            (
                SELECT json_agg(json_build_object(
                    'material_id', m.id,
                    'material_name', m.name,
                    'material_dimensions', m.dimensions,
                    'surveyed_qty', m.surveyed_qty,
                    'charge_qty', m.charge_qty,
                    'material_price', m.price,
                    'material_total', m.total,
                    'material_volume', m.volume,
                    'material_cost', m.cost
                ))
                FROM ${schema}.estimate_materials em
                JOIN ${schema}.materials m ON em.material_id = m.id
                WHERE em.estimate_id = e.id
            ) AS materials,
            (
                SELECT json_agg(json_build_object(
                    'cost_id', c.id,
                    'driver_qty', c.driver_qty,
                    'porter_qty', c.porter_qty,
                    'packer_qty', c.packer_qty,
                    'vehicle_qty', c.vehicle_qty,
                    'vehicle_type_id', c.vehicle_type_id,
                    'fuel_qty', c.fuel_qty,
                    'fuel_charge', c.fuel_charge
                ))
                FROM ${schema}.estimate_costs ec
                JOIN ${schema}.costs c ON ec.cost_id = c.id
                WHERE ec.estimate_id = e.id
            ) AS costs,
            (
                SELECT json_agg(json_build_object(
                    'general_info_id', gi.id,
                    'driver_wage', gi.driver_wage,
                    'porter_wage', gi.porter_wage,
                    'packer_wage', gi.packer_wage,
                    'contents_value', gi.contents_value,
                    'payment_method', gi.payment_method,
                    'insurance_amount', gi.insurance_amount,
                    'insurance_percentage', gi.insurance_percentage,
                    'insurance_type', gi.insurance_type
                ))
                FROM ${schema}.estimate_general_info eg
                JOIN ${schema}.general_information gi ON eg.general_info_id = gi.id
                WHERE eg.estimate_id = e.id
            ) AS general_info,
            (
                SELECT json_agg(json_build_object(
                    'ancillary_id', a.id,
                    'ancillary_name', a.name,
                    'ancillary_charge', a.charge,
                    'ancillary_is_chargeable', a.isChargeable
                ))
                FROM ${schema}.estimate_ancillaries ea
                JOIN ${schema}.ancillaries a ON ea.ancillary_id = a.id
                WHERE ea.estimate_id = e.id
            ) AS ancillaries
        FROM 
            ${schema}.estimates e
        WHERE 
            e.lead_id = $1
        ORDER BY 
            e.quote_expires_on DESC
        LIMIT 10;
    `;

    try {
        const res = await client.query(query, [leadId]);
        return res.rows;
    } catch (error: any) {
        logger.error('Failed to get latest estimates', { error });
        throw new Error(`Failed to get latest estimates: ${error.message}`);
    } finally {
        client.end();
    }
};
