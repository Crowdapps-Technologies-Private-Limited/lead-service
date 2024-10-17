import {
    INSERT_ESTIMATE,
    UPDATE_ESTIMATE,
    INSERT_SERVICE,
    INSERT_MATERIAL,
    INSERT_COST,
    INSERT_GENERAL_INFO,
    INSERT_ANCILLARY,
    INSERT_ESTIMATE_SERVICE,
    INSERT_ESTIMATE_MATERIAL,
    INSERT_ESTIMATE_COST,
    INSERT_ESTIMATE_GENERAL_INFO,
    INSERT_ESTIMATE_ANCILLARY,
    INSERT_LOG,
    UPDATE_LEAD_STATUS,
    DELETE_ESTIMATE_SERVICES,
    DELETE_ESTIMATE_MATERIALS,
    DELETE_ESTIMATE_COSTS,
    DELETE_ESTIMATE_GENERAL_INFO,
    DELETE_ESTIMATE_ANCILLARIES,
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { getMessage } from '../../utils/errorMessages';
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

    const estimateId = payload.estimateId;
    logger.info('estimateId:', { estimateId });

    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant.schema;
    logger.info('Schema:', { schema });

    try {
        await client.query('BEGIN'); // Start transaction

        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        await client.query(`SET search_path TO ${schema}`);
        const leadCheckResult = await client.query(
            `
            SELECT * FROM leads WHERE generated_id = $1
        `,
            [leadId],
        );

        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }
        const status = ['NEW', 'ESTIMATES', 'NEW LEAD'];
        if (!status.includes(leadCheckResult.rows[0].status)) {
            throw new Error(getMessage('LEAD_STATUS_NOT_ALLOWED'));
        }

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
                estimateId,
            ]);
            logger.info('Estimate updated successfully', { estimateId });

            // Delete existing services, materials, costs, general info, and ancillaries
            await client.query(DELETE_ESTIMATE_SERVICES, [estimateId]);
            await client.query(DELETE_ESTIMATE_MATERIALS, [estimateId]);
            await client.query(DELETE_ESTIMATE_COSTS, [estimateId]);
            await client.query(DELETE_ESTIMATE_GENERAL_INFO, [estimateId]);
            await client.query(DELETE_ESTIMATE_ANCILLARIES, [estimateId]);
            logger.info('Existing services, materials, costs, general info, and ancillaries deleted successfully');
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
            const serviceResult = await client.query(INSERT_SERVICE, [
                service.typeName,
                service.description || null,
                service.price,
            ]);
            const serviceId = serviceResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_SERVICE, [finalEstimateId, serviceId]);
        }
        logger.info('Services processed successfully');

        // Handle Materials
        for (const material of materials) {
            const materialResult = await client.query(INSERT_MATERIAL, [
                material.name,
                material.dimensions || null,
                material.surveyedQty || 0,
                material.chargeQty || 0,
                material.price || 0,
                material.total || 0,
                material.volume || 0,
                material.cost || 0,
            ]);
            const materialId = materialResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_MATERIAL, [finalEstimateId, materialId]);
        }
        logger.info('Materials processed successfully');

        // Handle Costs
        for (const cost of costs) {
            const costResult = await client.query(INSERT_COST, [
                cost.driverQty || 0,
                cost.porterQty || 0,
                cost.packerQty || 0,
                cost.vehicleQty || 0,
                cost.vehicleTypeId || null,
                cost.wageCharge || 0,
                cost.fuelCharge || 0,
            ]);
            const costId = costResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_COST, [finalEstimateId, costId]);
        }
        logger.info('Costs processed successfully');

        // Handle General Info
        for (const info of generalInfo) {
            const infoResult = await client.query(INSERT_GENERAL_INFO, [
                info.driverWage || 0,
                info.porterWage || 0,
                info.packerWage || 0,
                info.contentsValue || null,
                info.paymentMethod || null,
                info.insuranceAmount || null,
                info.insurancePercentage || null,
                info.insuranceType || null,
            ]);
            const infoId = infoResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_GENERAL_INFO, [finalEstimateId, infoId]);
        }
        logger.info('General Info processed successfully');

        // Handle Ancillaries
        for (const ancillary of ancillaries) {
            const ancillaryResult = await client.query(INSERT_ANCILLARY, [
                ancillary.name,
                ancillary.charge || 0,
                ancillary.isChargeable || null,
            ]);
            const ancillaryId = ancillaryResult.rows[0].id;
            await client.query(INSERT_ESTIMATE_ANCILLARY, [finalEstimateId, ancillaryId]);
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

        await client.query('COMMIT'); // Commit transaction
        return {
            message: estimateId ? 'Estimate updated successfully' : 'Estimate added successfully',
            estimateId: finalEstimateId,
        };
    } catch (error: any) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        logger.error('Failed to process estimate', { error });
        throw new Error(`${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
