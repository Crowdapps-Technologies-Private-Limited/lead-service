import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';

export const getLatestEstimates = async (leadId: string, tenant: any) => {
    const client = await connectToDatabase();
    if(tenant?.is_suspended){
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
            s.id AS service_id,
            s.service_name,
            s.description AS service_description,
            s.price AS service_price,
            m.id AS material_id,
            m.name AS material_name,
            m.dimensions AS material_dimensions,
            m.surveyed_qty,
            m.charge_qty,
            m.price AS material_price,
            m.total AS material_total,
            m.volume_cost AS material_volume_cost,
            c.id AS cost_id,
            c.driver_qty,
            c.porter_qty,
            c.packer_qty,
            c.vehicle_qty,
            c.vehicle_type_id,
            c.fuel_qty,
            c.fuel_charge,
            gi.id AS general_info_id,
            gi.driver_wage,
            gi.porter_wage,
            gi.packer_wage,
            gi.contents_value,
            gi.payment_method,
            gi.insurance,
            gi.insurance_percentage,
            gi.insurance_type,
            a.id AS ancillary_id,
            a.name AS ancillary_name,
            a.charge AS ancillary_charge,
            a.isChargeable AS ancillary_is_chargeable
        FROM 
            ${schema}.estimates e
        LEFT JOIN 
            ${schema}.estimate_services es ON e.id = es.estimate_id
        LEFT JOIN 
            ${schema}.services s ON es.service_id = s.id
        LEFT JOIN 
            ${schema}.estimate_materials em ON e.id = em.estimate_id
        LEFT JOIN 
            ${schema}.materials m ON em.material_id = m.id
        LEFT JOIN 
            ${schema}.estimate_costs ec ON e.id = ec.estimate_id
        LEFT JOIN 
            ${schema}.costs c ON ec.cost_id = c.id
        LEFT JOIN 
            ${schema}.estimate_general_info eg ON e.id = eg.estimate_id
        LEFT JOIN 
            ${schema}.general_information gi ON eg.general_info_id = gi.id
        LEFT JOIN 
            ${schema}.estimate_ancillaries ea ON e.id = ea.estimate_id
        LEFT JOIN 
            ${schema}.ancillaries a ON ea.ancillary_id = a.id
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
