import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { AddLeadPayload } from '../interface';
import { generateEmail } from '../../utils/generateEmailService';
import { CREATE_LOG_TABLE, INSERT_LOG } from '../../sql/sqlScript';
import { isEmptyString, toFloat } from '../../utils/utility';
import { getMessage } from '../../utils/errorMessages';

const isAddressEmpty = (address: any) => {
    return isEmptyString(address.street) &&
        isEmptyString(address.town) &&
        isEmptyString(address.county) &&
        isEmptyString(address.postcode) &&
        isEmptyString(address.country);
};

export const editLead = async (leadId: string, payload: AddLeadPayload, tenant: any) => {
    logger.info(`EDIT LEAD (${leadId}) payload`, { payload });
    const {
        referrerId,
        customer,
        collectionAddress,
        deliveryAddress,
        followUpDate,
        movingOnDate,
        packingOnDate,
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
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        await client.query(`SET search_path TO ${schema}`);

        // Check if lead exists
        const leadCheckResult = await client.query(`
            SELECT * FROM leads WHERE generated_id = $1
        `, [leadId]);

        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }
        logger.info('leadCheckResult', { leadCheckResult });

        // Update customer information
        let customerId = leadCheckResult.rows[0].customer_id;
        if (customerId) {
            await client.query(`
                UPDATE customers 
                SET name = $1, phone = $2, email = $3 
                WHERE id = $4
            `, [customer.name, customer.phone, customer.email, customerId]);
        } else {
            const customerResult = await client.query(`
                INSERT INTO customers (name, phone, email)
                VALUES ($1, $2, $3) RETURNING id
            `, [customer.name, customer.phone, customer.email]);
            customerId = customerResult.rows[0].id;
        }

        // Update or insert collection address if not empty
        let collectionAddressId = leadCheckResult.rows[0].collection_address_id;
        if (!isAddressEmpty(collectionAddress)) {
            if (collectionAddressId) {
                await client.query(`
                    UPDATE addresses 
                    SET 
                        county = $1, 
                        country = $2, 
                        street = $3, 
                        town = $4, 
                        postcode = $5 
                    WHERE id = $6
                `, [
                    collectionAddress.county, 
                    collectionAddress.country, 
                    collectionAddress.street, 
                    collectionAddress.town, 
                    collectionAddress.postcode, 
                    collectionAddressId
                ]);
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
        } else {
            logger.warn('Collection address is empty, no address record created or updated.');
            collectionAddressId = null; // Set to null if no valid address
        }

        // Update or insert delivery address if not empty
        let deliveryAddressId = leadCheckResult.rows[0].delivery_address_id;
        if (!isAddressEmpty(deliveryAddress)) {
            if (deliveryAddressId) {
                await client.query(`
                    UPDATE addresses 
                    SET 
                        county = $1, 
                        country = $2, 
                        street = $3, 
                        town = $4, 
                        postcode = $5 
                    WHERE id = $6
                `, [
                    deliveryAddress.county, 
                    deliveryAddress.country, 
                    deliveryAddress.street, 
                    deliveryAddress.town, 
                    deliveryAddress.postcode, 
                    deliveryAddressId
                ]);
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
        } else {
            logger.warn('Delivery address is empty, no address record created or updated.');
            deliveryAddressId = null; // Set to null if no valid address
        }

        // Update lead
        await client.query(`
            UPDATE leads
            SET 
                referrer_id = $1,
                follow_up_date = $2,
                moving_on_date = $3,
                packing_on_date = $4,
                collection_purchase_status = $5,
                collection_house_size = $6,
                collection_distance = $7,
                collection_volume = $8,
                collection_volume_unit = $9,
                delivery_purchase_status = $10,
                delivery_house_size = $11,
                delivery_distance = $12,
                delivery_volume = $13,
                delivery_volume_unit = $14,
                customer_notes = $15,
                batch = $16,
                incept_batch = $17,
                lead_date = $18,
                collection_address_id = $19,
                delivery_address_id = $20,
                customer_id = $21,
                updated_at = NOW()
            WHERE generated_id = $22
        `, [
            isEmptyString(referrerId) ? null : referrerId,
            isEmptyString(followUpDate) ? null : followUpDate, 
            isEmptyString(movingOnDate) ? null : movingOnDate, 
            isEmptyString(packingOnDate) ? null : packingOnDate, 
            collectionPurchaseStatus, 
            collectionHouseSize, 
            toFloat(collectionDistance), 
            toFloat(collectionVolume), 
            collectionVolumeUnit,
            deliveryPurchaseStatus, 
            deliveryHouseSize, 
            toFloat(deliveryDistance), 
            toFloat(deliveryVolume), 
            deliveryVolumeUnit,
            customerNotes, 
            batch, 
            inceptBatch, 
            isEmptyString(leadDate) ? null : leadDate,
            collectionAddressId,
            deliveryAddressId,
            customerId,
            leadId
        ]);

        // Insert log
        await client.query(CREATE_LOG_TABLE);
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            'You have edited a lead',
            'LEAD',
            leadCheckResult.rows[0].status,
            leadId
        ]);

        await client.query('COMMIT');
        return { message: getMessage('LEAD_UPDATED') };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to edit lead', { error });
        throw new Error(`${error.message}`);
    } finally {
        client.end();
    }
};
