import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { AddLeadPayload } from '../interface';
import { generateEmail } from '../../utils/generateEmailService';
import {  CREATE_LOG_TABLE, INSERT_LOG } from '../../sql/sqlScript';

export const editLead = async (leadId: string, payload: AddLeadPayload, tenant: any) => {
    const {
        referrerId,
        customer,
        collectionAddress,
        deliveryAddress,
        followUpDate,
        movingOnDate,
        packingOnDate,
        surveyDate,
        collectionPurchaseStatus,
        collectionHouseSize,
        collectionDistance,
        collectionVolume,
        collectionVolumeUnit,
        deliveryPurchaseStatus,
        deliveryHouseSize,
        deliveryDistance,
        deliveryVolume,
        deliveryVolumeUnit,
        status,
        customerNotes,
        batch,
        inceptBatch,
        leadDate
    } = payload;

    const client = await connectToDatabase();
    const schema = tenant.schema;

    try {
        await client.query('BEGIN');

        if (tenant?.is_suspended) {
            throw new Error('Tenant is suspended');
        }

        await client.query(`SET search_path TO ${schema}`);

        // Check if lead exists
        const leadCheckResult = await client.query(`
            SELECT * FROM leads WHERE generated_id = $1
        `, [leadId]);

        if (leadCheckResult.rows.length === 0) {
            throw new Error('Lead not found');
        }

        // Check if customer exists
        let customerId;
        const customerCheckResult = await client.query(`
            SELECT id FROM customers WHERE email = $1 OR phone = $2
        `, [customer.email, customer.phone]);

        if (customerCheckResult.rows.length > 0) {
            customerId = customerCheckResult.rows[0].id;
        } else {
            const customerResult = await client.query(`
                INSERT INTO customers (name, phone, email)
                VALUES ($1, $2, $3) RETURNING id
            `, [customer.name, customer.phone, customer.email]);
            customerId = customerResult.rows[0].id;
        }

        // Check if collection address exists
        let collectionAddressId;
        const collectionAddressCheckResult = await client.query(`
            SELECT id FROM addresses WHERE street = $1 AND town = $2 AND postcode = $3
        `, [collectionAddress.street, collectionAddress.town, collectionAddress.postcode]);

        if (collectionAddressCheckResult.rows.length > 0) {
            collectionAddressId = collectionAddressCheckResult.rows[0].id;
        } else {
            const collectionAddressResult = await client.query(`
                INSERT INTO addresses (street, town, county, postcode, country)
                VALUES ($1, $2, $3, $4, $5) RETURNING id
            `, [
                collectionAddress.street,
                collectionAddress.town,
                collectionAddress.county,
                collectionAddress.postcode,
                collectionAddress.country
            ]);
            collectionAddressId = collectionAddressResult.rows[0].id;
        }

        // Check if delivery address exists
        let deliveryAddressId;
        const deliveryAddressCheckResult = await client.query(`
            SELECT id FROM addresses WHERE street = $1 AND town = $2 AND postcode = $3
        `, [deliveryAddress.street, deliveryAddress.town, deliveryAddress.postcode]);

        if (deliveryAddressCheckResult.rows.length > 0) {
            deliveryAddressId = deliveryAddressCheckResult.rows[0].id;
        } else {
            const deliveryAddressResult = await client.query(`
                INSERT INTO addresses (street, town, county, postcode, country)
                VALUES ($1, $2, $3, $4, $5) RETURNING id
            `, [
                deliveryAddress.street,
                deliveryAddress.town,
                deliveryAddress.county,
                deliveryAddress.postcode,
                deliveryAddress.country
            ]);
            deliveryAddressId = deliveryAddressResult.rows[0].id;
        }

        // Update lead
        await client.query(`
            UPDATE leads
            SET 
                referrer_id = $1,
                customer_id = $2,
                collection_address_id = $3,
                delivery_address_id = $4,
                follow_up_date = $5,
                moving_on_date = $6,
                packing_on_date = $7,
                survey_date = $8,
                collection_purchase_status = $9,
                collection_house_size = $10,
                collection_distance = $11,
                collection_volume = $12,
                collection_volume_unit = $13,
                delivery_purchase_status = $14,
                delivery_house_size = $15,
                delivery_distance = $16,
                delivery_volume = $17,
                delivery_volume_unit = $18,
                status = $19,
                customer_notes = $20,
                batch = $21,
                incept_batch = $22,
                lead_date = $23,
                updated_at = NOW()
            WHERE generated_id = $24
        `, [
            referrerId, customerId, collectionAddressId, deliveryAddressId,
            followUpDate, movingOnDate, packingOnDate, surveyDate,
            collectionPurchaseStatus, collectionHouseSize, collectionDistance, collectionVolume, collectionVolumeUnit,
            deliveryPurchaseStatus, deliveryHouseSize, deliveryDistance, deliveryVolume, deliveryVolumeUnit,
            status, customerNotes, batch, inceptBatch, leadDate, leadId
        ]);

        // Insert log
        await client.query(CREATE_LOG_TABLE);
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            'You have edited a lead',
            'LEAD',
            'NEW',
            leadId
        ]);

        await client.query('COMMIT');
        return { message: 'Lead updated successfully' };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to edit lead', { error });
        throw new Error(`Failed to edit lead: ${error.message}`);
    } finally {
        client.end();
    }
};
