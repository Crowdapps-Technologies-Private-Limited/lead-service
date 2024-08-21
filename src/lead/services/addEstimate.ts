import {
    INSERT_ESTIMATE,
    UPDATE_ESTIMATE,
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
    INSERT_ESTIMATE_SERVICE,
    INSERT_ESTIMATE_MATERIAL,
    INSERT_ESTIMATE_COST,
    INSERT_ESTIMATE_GENERAL_INFO,
    INSERT_ESTIMATE_ANCILLARY,
    CREATE_ESTIMATE_AND_RELATED_TABLE,
    INSERT_LOG,
    UPDATE_LEAD_STATUS,
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { AddEstimatePayload } from '../interface';

export const addOrUpdateEstimate = async (leadId: string, payload: AddEstimatePayload, tenant: any) => {
    logger.info('addOrUpdateEstimate service is running:');
    logger.info('payload:', { payload });
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
        ancillaries,
    } = payload;

    const estimateId = "80c8cf6c-b810-4809-8ecd-1395b0303fbf" // payload.estimateId;  // Correctly referenced estimateId from payload
    logger.info('estimateId:', { estimateId });
    logger.info('payload', { payload });
    const client = await connectToDatabase();
    const schema = tenant.schema;
    logger.info('Schema:', { schema });

    try {
        await client.query('BEGIN');

        if (tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }

        await client.query(`SET search_path TO ${schema}`);
        await client.query(CREATE_ESTIMATE_AND_RELATED_TABLE);
        logger.info('Estimate and related tables created successfully');

        let finalEstimateId = estimateId;

        if (estimateId) {
            // Update existing estimate
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
            logger.info('Estimate updated successfully', { estimateId });
        } else {
            // Insert new estimate
            const result = await client.query(INSERT_ESTIMATE, [
                leadId,
                quoteTotal,
                costTotal,
                quoteExpiresOn,
                notes || null,
                vatIncluded,
                materialPriceChargeable,
            ]);
            finalEstimateId = result.rows[0].id;
            logger.info('New estimate inserted successfully', { finalEstimateId });
        }

        // Handle Services
        for (const service of services) {
            if (service.id) {
                await client.query(UPDATE_SERVICE, [
                    service.typeName,
                    service.description || null,
                    service.price,
                    service.id
                ]);
            } else {
                const serviceResult = await client.query(INSERT_SERVICE, [
                    service.typeName,
                    service.description || null,
                    service.price,
                ]);
                const serviceId = serviceResult.rows[0].id;
                await client.query(INSERT_ESTIMATE_SERVICE, [finalEstimateId, serviceId]);
            }
        }
        logger.info('Services processed successfully');

        // Handle Materials
        for (const material of materials) {
            if (material.id) {
                await client.query(UPDATE_MATERIAL, [
                    material.name,
                    material.dimensions || null,
                    material.surveyedQty || null,
                    material.chargeQty || null,
                    material.price || null,
                    material.total || null,
                    material.volume || null,
                    material.cost || null,
                    material.id
                ]);
            } else {
                const materialResult = await client.query(INSERT_MATERIAL, [
                    material.name,
                    material.dimensions || null,
                    material.surveyedQty || null,
                    material.chargeQty || null,
                    material.price || null,
                    material.total || null,
                    material.volume || null,
                    material.cost || null,
                ]);
                const materialId = materialResult.rows[0].id;
                await client.query(INSERT_ESTIMATE_MATERIAL, [finalEstimateId, materialId]);
            }
        }
        logger.info('Materials processed successfully');

        // Handle Costs
        for (const cost of costs) {
            if (cost.id) {
                await client.query(UPDATE_COST, [
                    cost.driverQty || null,
                    cost.porterQty || null,
                    cost.packerQty || null,
                    cost.vehicleQty || null,
                    cost.vehicleTypeId || null,
                    cost.wageCharge || null,
                    cost.fuelCharge || null,
                    cost.id
                ]);
            } else {
                const costResult = await client.query(INSERT_COST, [
                    cost.driverQty || null,
                    cost.porterQty || null,
                    cost.packerQty || null,
                    cost.vehicleQty || null,
                    cost.vehicleTypeId || null,
                    cost.wageCharge || null,
                    cost.fuelCharge || null,
                ]);
                const costId = costResult.rows[0].id;
                await client.query(INSERT_ESTIMATE_COST, [finalEstimateId, costId]);
            }
        }
        logger.info('Costs processed successfully');

        // Handle General Info
        for (const info of generalInfo) {
            if (info.id) {
                await client.query(UPDATE_GENERAL_INFO, [
                    info.driverWage || null,
                    info.porterWage || null,
                    info.packerWage || null,
                    info.contentsValue || null,
                    info.paymentMethod || null,
                    info.insurance_amount || null,
                    info.insurancePercentage || null,
                    info.insuranceType || null,
                    info.id
                ]);
            } else {
                const infoResult = await client.query(INSERT_GENERAL_INFO, [
                    info.driverWage || null,
                    info.porterWage || null,
                    info.packerWage || null,
                    info.contentsValue || null,
                    info.paymentMethod || null,
                    info.insurance_amount || null,
                    info.insurancePercentage || null,
                    info.insuranceType || null,
                ]);
                const infoId = infoResult.rows[0].id;
                await client.query(INSERT_ESTIMATE_GENERAL_INFO, [finalEstimateId, infoId]);
            }
        }
        logger.info('General Info processed successfully');

        // Handle Ancillaries
        for (const ancillary of ancillaries) {
            if (ancillary.id) {
                await client.query(UPDATE_ANCILLARY, [
                    ancillary.name,
                    ancillary.charge || null,
                    ancillary.isChargeable || null,
                    ancillary.id
                ]);
            } else {
                const ancillaryResult = await client.query(INSERT_ANCILLARY, [
                    ancillary.name,
                    ancillary.charge || null,
                    ancillary.isChargeable || null,
                ]);
                const ancillaryId = ancillaryResult.rows[0].id;
                await client.query(INSERT_ESTIMATE_ANCILLARY, [finalEstimateId, ancillaryId]);
            }
        }
        logger.info('Ancillaries processed successfully');

        // Update lead status
        await client.query(UPDATE_LEAD_STATUS, ['ESTIMATES', leadId]);
        logger.info('Lead status updated successfully');

        // Insert log entry
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            estimateId ? 'Updated estimation' : 'Added a new estimation',
            'LEAD',
            'ESTIMATES',
            leadId,
        ]);
        logger.info('Log entry created successfully');

        await client.query('COMMIT');
        return { message: estimateId ? 'Estimate updated successfully' : 'Estimate added successfully', estimateId: finalEstimateId };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to process estimate', { error });
        throw new Error(`Failed to process estimate: ${error.message}`);
    } finally {
        client.end();
    }
};
