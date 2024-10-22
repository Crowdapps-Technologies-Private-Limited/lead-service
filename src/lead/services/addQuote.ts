import {
    INSERT_QUOTE,
    UPDATE_QUOTE,
    INSERT_SERVICE,
    INSERT_MATERIAL,
    INSERT_COST,
    INSERT_GENERAL_INFO,
    INSERT_ANCILLARY,
    INSERT_QUOTE_SERVICE,
    INSERT_QUOTE_MATERIAL,
    INSERT_QUOTE_COST,
    INSERT_QUOTE_GENERAL_INFO,
    INSERT_QUOTE_ANCILLARY,
    INSERT_LOG,
    UPDATE_LEAD_STATUS,
    DELETE_QUOTE_SERVICES,
    DELETE_QUOTE_MATERIALS,
    DELETE_QUOTE_COSTS,
    DELETE_QUOTE_GENERAL_INFO,
    DELETE_QUOTE_ANCILLARIES,
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { getMessage } from '../../utils/errorMessages';
import logger from '../../utils/logger';
import { AddQuotePayload } from '../interface';

export const addOrUpdateQuote = async (leadId: string, payload: AddQuotePayload, tenant: any) => {
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

    const quoteId = payload.quoteId;

    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant.schema;

    try {
        await client.query('BEGIN'); // Start transaction

        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        await client.query(`SET search_path TO ${schema}`);

        let finalQuoteId = quoteId;

        if (quoteId) {
            // Update existing quote
            await client.query(UPDATE_QUOTE, [
                leadId,
                quoteTotal,
                costTotal,
                quoteExpiresOn,
                notes || null,
                vatIncluded,
                materialPriceChargeable,
                quoteId,
            ]);
            // Delete existing services, materials, costs, general info, and ancillaries
            await client.query(DELETE_QUOTE_SERVICES, [quoteId]);
            await client.query(DELETE_QUOTE_MATERIALS, [quoteId]);
            await client.query(DELETE_QUOTE_COSTS, [quoteId]);
            await client.query(DELETE_QUOTE_GENERAL_INFO, [quoteId]);
            await client.query(DELETE_QUOTE_ANCILLARIES, [quoteId]);
        } else {
            // Insert new estimate
            const result = await client.query(INSERT_QUOTE, [
                leadId,
                quoteTotal,
                costTotal,
                quoteExpiresOn,
                notes || null,
                vatIncluded,
                materialPriceChargeable,
            ]);
            finalQuoteId = result.rows[0].id;
        }

        // Handle Services
        for (const service of services) {
            const serviceResult = await client.query(INSERT_SERVICE, [
                service.typeName,
                service.description || null,
                service.price,
            ]);
            const serviceId = serviceResult.rows[0].id;
            await client.query(INSERT_QUOTE_SERVICE, [finalQuoteId, serviceId]);
        }

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
            await client.query(INSERT_QUOTE_MATERIAL, [finalQuoteId, materialId]);
        }

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
            await client.query(INSERT_QUOTE_COST, [finalQuoteId, costId]);
        }

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
            await client.query(INSERT_QUOTE_GENERAL_INFO, [finalQuoteId, infoId]);
        }

        // Handle Ancillaries
        for (const ancillary of ancillaries) {
            const ancillaryResult = await client.query(INSERT_ANCILLARY, [
                ancillary.name,
                ancillary.charge || 0,
                ancillary.isChargeable || null,
            ]);
            const ancillaryId = ancillaryResult.rows[0].id;
            await client.query(INSERT_QUOTE_ANCILLARY, [finalQuoteId, ancillaryId]);
        }

        // Update lead status
        await client.query(UPDATE_LEAD_STATUS, ['QUOTE', leadId]);

        // Insert log entry
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            quoteId ? 'Updated quotation' : 'Added a new quatation',
            'LEAD',
            'QUOTE',
            leadId,
        ]);

        await client.query('COMMIT'); // Commit transaction
        return { message: quoteId ? 'Quote updated successfully' : 'Quote added successfully', quoteId: finalQuoteId };
    } catch (error: any) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        logger.error('Failed to process quote', { error });
        throw new Error(`${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
