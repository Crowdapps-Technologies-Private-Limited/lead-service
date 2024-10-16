import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { AddLeadPayload } from '../interface';
import { generateEmail } from '../../utils/generateEmailService';
import { CREATE_LEAD_TABLE, CREATE_LOG_TABLE, INSERT_LOG, GET_ALL_LEADS } from '../../sql/sqlScript';
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

export const addLead = async (payload: AddLeadPayload, tenant: any) => {
    const {
        referrerId,
        customer,
        collectionAddress,
        deliveryAddress,
        followUpDate,
        movingOnDate,
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
        leadId,
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

        // Create leads table if it doesn't exist
        await client.query(CREATE_LEAD_TABLE);
        logger.info('Lead table created successfully');

        // Check if customer exists
        let customerId;
        const customerCheckResult = await client.query(
            `
            SELECT id FROM customers WHERE email = $1
        `,
            [customer?.email],
        );

        if (customerCheckResult.rows.length > 0) {
            customerId = customerCheckResult.rows[0].id;
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

        logger.info('Customer created successfully');
        logger.info('Customer ID:', { customerId });
        logger.info('Referrer ID:', { referrerId });
        logger.info('Collection Address:', { collectionAddress });
        logger.info('Delivery Address:', { deliveryAddress });

        // Check if collection address is not empty and exists
        let collectionAddressId = null;
        if (!isAddressEmpty(collectionAddress)) {
            const collectionAddressCheckResult = await client.query(
                `
                SELECT id FROM addresses WHERE street = $1 AND town = $2 AND postcode = $3 AND country = $4 AND county = $5
            `,
                [
                    collectionAddress.street,
                    collectionAddress.town,
                    collectionAddress.postcode,
                    collectionAddress.country,
                    collectionAddress.county,
                ],
            );

            if (collectionAddressCheckResult.rows.length > 0) {
                collectionAddressId = collectionAddressCheckResult.rows[0].id;
            } else {
                const collectionAddressResult = await client.query(
                    `
                    INSERT INTO addresses (street, town, county, postcode, country)
                    VALUES ($1, $2, $3, $4, $5) RETURNING id
                `,
                    [
                        collectionAddress.street,
                        collectionAddress.town,
                        collectionAddress.county,
                        collectionAddress.postcode,
                        collectionAddress.country,
                    ],
                );
                collectionAddressId = collectionAddressResult.rows[0].id;
            }
        } else {
            logger.warn('Collection address is empty, no address record created.');
        }

        // Check if delivery address is not empty and exists
        let deliveryAddressId = null;
        if (!isAddressEmpty(deliveryAddress)) {
            const deliveryAddressCheckResult = await client.query(
                `
                SELECT id FROM addresses WHERE street = $1 AND town = $2 AND postcode = $3 AND country = $4 AND county = $5
            `,
                [
                    deliveryAddress.street,
                    deliveryAddress.town,
                    deliveryAddress.postcode,
                    deliveryAddress.country,
                    deliveryAddress.county,
                ],
            );

            if (deliveryAddressCheckResult.rows.length > 0) {
                deliveryAddressId = deliveryAddressCheckResult.rows[0].id;
            } else {
                const deliveryAddressResult = await client.query(
                    `
                    INSERT INTO addresses (street, town, county, postcode, country)
                    VALUES ($1, $2, $3, $4, $5) RETURNING id
                `,
                    [
                        deliveryAddress.street,
                        deliveryAddress.town,
                        deliveryAddress.county,
                        deliveryAddress.postcode,
                        deliveryAddress.country,
                    ],
                );
                deliveryAddressId = deliveryAddressResult.rows[0].id;
            }
        } else {
            logger.warn('Delivery address is empty, no address record created.');
        }

        // Generate new lead ID
        let newGeneratedId;
        const idArray = await client.query(GET_ALL_LEADS);
        if (idArray?.rows.length === 0) {
            newGeneratedId = 10000000;
        } else {
            const ids = idArray?.rows.map((item: any) => item.generated_id);
            const maxId = Math.max(...ids);
            newGeneratedId = maxId + 1;
        }
        logger.info('New Generated ID:', { newGeneratedId });

        // Insert lead
        await client.query(
            `
            INSERT INTO leads (
                generated_id, referrer_id, customer_id, collection_address_id, delivery_address_id,
                follow_up_date, moving_on_date,
                collection_purchase_status, collection_house_size, collection_distance, collection_volume, collection_volume_unit,
                delivery_purchase_status, delivery_house_size, delivery_distance, delivery_volume, delivery_volume_unit,
                status, customer_notes, batch, incept_batch, lead_id, lead_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        `,
            [
                newGeneratedId,
                isEmptyString(referrerId) ? null : referrerId,
                customerId,
                collectionAddressId,
                deliveryAddressId,
                isEmptyString(followUpDate) ? null : followUpDate,
                isEmptyString(movingOnDate) ? null : movingOnDate,
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
                'NEW LEAD',
                customerNotes,
                batch || null,
                inceptBatch || null,
                leadId || null,
                isEmptyString(leadDate) ? null : leadDate,
            ],
        );

        logger.info('Lead added successfully');

        // Insert log
        await client.query(CREATE_LOG_TABLE);
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            'You have added a new lead',
            'LEAD',
            'NEW',
            newGeneratedId,
        ]);
        logger.info('Log added successfully');

        // Send email notification
        await generateEmail('Add Lead', customer.email, { username: customer.name });
        logger.info('Email sent successfully');

        await client.query('COMMIT');
        return { message: getMessage('LEAD_ADDED') };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to add lead', { error });
        throw new Error(`${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
