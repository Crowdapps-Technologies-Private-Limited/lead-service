import { 
    INSERT_ESTIMATE,
    INSERT_SERVICE,
    INSERT_MATERIAL,
    INSERT_COST,
    INSERT_GENERAL_INFO,
    INSERT_ANCILLARY,
    INSERT_ESTIMATE_SERVICE,
    INSERT_ESTIMATE_MATERIAL,
    INSERT_ESTIMATE_COST,
    INSERT_ESTIMATE_GENERAL_INFO,
    INSERT_ESTIMATE_ANCILLARY
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { AddEstimatePayload, EditEstimatePayload } from '../interface';

export const addEstimate = async (leadId: string, payload: AddEstimatePayload, tenant: any) => {
    logger.info('addEstimate service is running:');
    logger.info('leadId:', { leadId });
    logger.info('tenant:', { tenant });
    const {
        quoteTotal,
        costTotal,
        quoteExpiresOn,
        notes,
        vatIncluded,
        materialPriceChargeable,
        services,
        materials,
        costs,
        generalInfo,
        ancillaries
    } = payload;
    
    const client = await connectToDatabase();
    const schema = tenant.schema;
logger.info('Schema:', { schema });
    try {
        await client.query('BEGIN');

        if (tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }
        
        await client.query(`SET search_path TO ${schema}`);

        // Insert estimate
        const result = await client.query(INSERT_ESTIMATE, [
            leadId,
            quoteTotal,
            costTotal,
            quoteExpiresOn,
            notes || null,
            vatIncluded,
            materialPriceChargeable
        ]);

        const estimateId = result.rows[0].id;

        // Insert services
        for (const service of services) {
            const serviceResult = await client.query(INSERT_SERVICE, [
                service.typeName,
                service.description || null,
                service.price
            ]);
            const serviceId = serviceResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_SERVICE, [estimateId, serviceId]);
        }

        // Insert materials
        for (const material of materials) {
            const materialResult = await client.query(INSERT_MATERIAL, [
                material.name,
                material.dimensions || null,
                material.surveyedQty || null,
                material.chargeQty || null,
                material.price || null,
                material.total || null,
                material.volumeCost || null
            ]);
            const materialId = materialResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_MATERIAL, [estimateId, materialId]);
        }

        // Insert costs
        for (const cost of costs) {
            const costResult = await client.query(INSERT_COST, [
                cost.driverQty || null,
                cost.porterQty || null,
                cost.packerQty || null,
                cost.vehicleQty || null,
                cost.vehicleTypeId || null,
                cost.fuelQty || null,
                cost.fuelCharge || null
            ]);
            const costId = costResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_COST, [estimateId, costId]);
        }

        // Insert general info
        for (const info of generalInfo) {
            const infoResult = await client.query(INSERT_GENERAL_INFO, [
                info.driverWage || null,
                info.porterWage || null,
                info.packerWage || null,
                info.contentsValue || null,
                info.paymentMethod || null,
                info.insurance || null,
                info.insurancePercentage || null,
                info.insuranceType || null
            ]);
            const infoId = infoResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_GENERAL_INFO, [estimateId, infoId]);
        }

        // Insert ancillaries
        for (const ancillary of ancillaries) {
            const ancillaryResult = await client.query(INSERT_ANCILLARY, [
                ancillary.name,
                ancillary.charge || null,
                ancillary.isChargeable || null
            ]);
            const ancillaryId = ancillaryResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_ANCILLARY, [estimateId, ancillaryId]);
        }

        await client.query('COMMIT');
        return { message: 'Estimate added successfully', estimateId };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to add estimate', { error });
        throw new Error(`Failed to add estimate: ${error.message}`);
    } finally {
        client.end();
    }
};