import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { AddLeadPayload } from '../interface';
import { INSERT_ADDRESS, INSERT_LOG, UPDATE_ADDRESS, UPDATE_LEAD } from '../../sql/sqlScript';
import { isEmptyString, toFloat } from '../../utils/utility';
import { getMessage } from '../../utils/errorMessages';

const isAddressEmpty = (address: any) => {
    return (
        isEmptyString(address.street) &&
        isEmptyString(address.town) &&
        isEmptyString(address.county) &&
        isEmptyString(address.postcode) &&
        isEmptyString(address.country)
    );
};

export const editLead = async (leadId: string, payload: AddLeadPayload, tenant: any) => {
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
        customerNotes,
        batch,
        inceptBatch,
        leadDate,
    } = payload;

    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const schema = tenant.schema;

    try {
        await client.query('BEGIN');

        if (tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        await client.query(`SET search_path TO ${schema}`);

        // Check if lead exists
        const leadCheckResult = await client.query(
            `
            SELECT * FROM leads WHERE generated_id = $1
        `,
            [leadId],
        );

        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }

        // Update customer information
        let customerId = leadCheckResult.rows[0].customer_id;
        if (customerId) {
            await client.query(
                `
                UPDATE customers 
                SET name = $1, phone = $2, email = $3 
                WHERE id = $4
            `,
                [customer.name, customer.phone, customer.email, customerId],
            );
        } else {
            const customerResult = await client.query(
                `
                INSERT INTO customers (name, phone, email)
                VALUES ($1, $2, $3) RETURNING id
            `,
                [customer.name, customer.phone, customer.email],
            );
            customerId = customerResult.rows[0].id;
        }

        // Update or insert collection address if not empty
        let collectionAddressId = leadCheckResult.rows[0].collection_address_id;
        if (!isAddressEmpty(collectionAddress)) {
            if (collectionAddressId) {
                await client.query(UPDATE_ADDRESS, [
                    collectionAddress.county,
                    collectionAddress.country,
                    collectionAddress.street,
                    collectionAddress.town,
                    collectionAddress.postcode,
                    collectionAddressId,
                ]);
            } else {
                const collectionAddressResult = await client.query(INSERT_ADDRESS, [
                    collectionAddress.street,
                    collectionAddress.town,
                    collectionAddress.county,
                    collectionAddress.postcode,
                    collectionAddress.country,
                ]);
                collectionAddressId = collectionAddressResult.rows[0].id;
            }
        } else {
            collectionAddressId = null; // Set to null if no valid address
        }

        // Update or insert delivery address if not empty
        let deliveryAddressId = leadCheckResult.rows[0].delivery_address_id;
        if (!isAddressEmpty(deliveryAddress)) {
            if (deliveryAddressId) {
                await client.query(UPDATE_ADDRESS, [
                    deliveryAddress.county,
                    deliveryAddress.country,
                    deliveryAddress.street,
                    deliveryAddress.town,
                    deliveryAddress.postcode,
                    deliveryAddressId,
                ]);
            } else {
                const deliveryAddressResult = await client.query(INSERT_ADDRESS, [
                    deliveryAddress.street,
                    deliveryAddress.town,
                    deliveryAddress.county,
                    deliveryAddress.postcode,
                    deliveryAddress.country,
                ]);
                deliveryAddressId = deliveryAddressResult.rows[0].id;
            }
        } else {
            logger.warn('Delivery address is empty, no address record created or updated.');
            deliveryAddressId = null; // Set to null if no valid address
        }

        // Update lead
        await client.query(UPDATE_LEAD, [
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
            leadId,
        ]);

        // Insert log
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            'You have edited a lead',
            'LEAD',
            leadCheckResult.rows[0].status,
            leadId,
        ]);

        await client.query('COMMIT');
        return { message: getMessage('LEAD_UPDATED') };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to edit lead', { error });
        throw new Error(`${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
