import { 
    INSERT_SERVICE,
    UPDATE_SERVICE,
    INSERT_MATERIAL,
    UPDATE_MATERIAL,
    INSERT_COST,
    UPDATE_COST,
    INSERT_GENERAL_INFO,
    UPDATE_GENERAL_INFO,
    INSERT_ANCILLARY,
    UPDATE_ANCILLARY,
    UPDATE_ESTIMATE,
    INSERT_ESTIMATE_SERVICE,
    INSERT_ESTIMATE_MATERIAL,
    INSERT_ESTIMATE_COST,
    INSERT_ESTIMATE_GENERAL_INFO,
    INSERT_ESTIMATE_ANCILLARY
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { EditEstimatePayload } from '../interface';

export const editEstimate = async (estimateId: string, leadId: string, payload: EditEstimatePayload, tenant: any) => {
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

    try {
        await client.query('BEGIN');

        if (tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }
        
        await client.query(`SET search_path TO ${schema}`);

        // Update estimate
        await client.query(UPDATE_ESTIMATE, [
            leadId,
            quoteTotal,
            costTotal,
            quoteExpiresOn,
            notes || null,
            vatIncluded,
            materialPriceChargeable,
            estimateId
        ]);

        // Update or insert services
        for (const service of services) {
            let serviceId = service.id;
            if (!serviceId) {
                const result = await client.query(INSERT_SERVICE, [
                    service.typeName,
                    service.description || null,
                    service.price
                ]);
                serviceId = result.rows[0].id;
            } else {
                await client.query(UPDATE_SERVICE, [
                    service.typeName,
                    service.description || null,
                    service.price,
                    serviceId
                ]);
            }
            await client.query(INSERT_ESTIMATE_SERVICE, [estimateId, serviceId]);
        }

        // Update or insert materials
        for (const material of materials) {
            let materialId = material.id;
            if (!materialId) {
                const result = await client.query(INSERT_MATERIAL, [
                    material.name,
                    material.dimensions || null,
                    material.surveyedQty || null,
                    material.chargeQty || null,
                    material.price || null,
                    material.total || null,
                    material.volumeCost || null
                ]);
                materialId = result.rows[0].id;
            } else {
                await client.query(UPDATE_MATERIAL, [
                    material.name,
                    material.dimensions || null,
                    material.surveyedQty || null,
                    material.chargeQty || null,
                    material.price || null,
                    material.total || null,
                    material.volumeCost || null,
                    materialId
                ]);
            }
            await client.query(INSERT_ESTIMATE_MATERIAL, [estimateId, materialId]);
        }

        // Update or insert costs
        for (const cost of costs) {
            let costId = cost.id;
            if (!costId) {
                const result = await client.query(INSERT_COST, [
                    cost.driverQty || null,
                    cost.porterQty || null,
                    cost.packerQty || null,
                    cost.vehicleQty || null,
                    cost.vehicleTypeId || null,
                    cost.fuelQty || null,
                    cost.fuelCharge || null
                ]);
                costId = result.rows[0].id;
            } else {
                await client.query(UPDATE_COST, [
                    cost.driverQty || null,
                    cost.porterQty || null,
                    cost.packerQty || null,
                    cost.vehicleQty || null,
                    cost.vehicleTypeId || null,
                    cost.fuelQty || null,
                    cost.fuelCharge || null,
                    costId
                ]);
            }
            await client.query(INSERT_ESTIMATE_COST, [estimateId, costId]);
        }

        // Update or insert general info
        for (const info of generalInfo) {
            let infoId = info.id;
            if (!infoId) {
                const result = await client.query(INSERT_GENERAL_INFO, [
                    info.driverWage || null,
                    info.porterWage || null,
                    info.packerWage || null,
                    info.contentsValue || null,
                    info.paymentMethod || null,
                    info.insurance || null,
                    info.insurancePercentage || null,
                    info.insuranceType || null
                ]);
                infoId = result.rows[0].id;
            } else {
                await client.query(UPDATE_GENERAL_INFO, [
                    info.driverWage || null,
                    info.porterWage || null,
                    info.packerWage || null,
                    info.contentsValue || null,
                    info.paymentMethod || null,
                    info.insurance || null,
                    info.insurancePercentage || null,
                    info.insuranceType || null,
                    infoId
                ]);
            }
            await client.query(INSERT_ESTIMATE_GENERAL_INFO, [estimateId, infoId]);
        }

        // Update or insert ancillaries
        for (const ancillary of ancillaries) {
            let ancillaryId = ancillary.id;
            if (!ancillaryId) {
                const result = await client.query(INSERT_ANCILLARY, [
                    ancillary.name,
                    ancillary.charge || null,
                    ancillary.isChargeable || null
                ]);
                ancillaryId = result.rows[0].id;
            } else {
                await client.query(UPDATE_ANCILLARY, [
                    ancillary.name,
                    ancillary.charge || null,
                    ancillary.isChargeable || null,
                    ancillaryId
                ]);
            }
            await client.query(INSERT_ESTIMATE_ANCILLARY, [estimateId, ancillaryId]);
        }

        await client.query('COMMIT');
        return { message: 'Estimate updated successfully' };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to edit estimate', { error });
        throw new Error(`Failed to edit estimate: ${error.message}`);
    } finally {
        client.end();
    }
};