import { CREATE_LEAD_TABLE, INSERT_LEAD, CHECK_LEAD_BY_EMAIL, CHECK_LEAD_BY_NAME } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import AWS from 'aws-sdk';
import { getconfigSecrets } from '../../utils/getConfig';
import logger from '../../utils/logger';
import { log } from 'console';
import { AddLeadPayload } from '../interface';

const s3 = new AWS.S3();

export const addLead = async (payload: AddLeadPayload, tenant: any) => {
    const {
        name,
        phone,
        email,
        followUp,
        movingOn,
        collectionAddress,
        collectionPurchaseStatus,
        collectionHouseSize,
        collectionVolume,
        collectionDistance,
        deliveryAddress,
        deliveryPurchaseStatus,
        deliveryHouseSize,
        deliveryVolume,
        deliveryDistance,
        customerNotes,
        referrerId
    } = payload;
    const client = await connectToDatabase();

    try {
        await client.query('BEGIN');
        if(tenant?.is_suspended){
            throw new Error('Tenant is suspended');
        }
        const schema = tenant.schema;
        await client.query(`SET search_path TO ${schema}`);
        await client.query(CREATE_LEAD_TABLE);
        // const checkLeadByName = await client.query(CHECK_LEAD_BY_NAME, [name]);
        // if(checkLeadByName.rows.length > 0){
        //     throw new Error('Lead already exists with this name');
        // }
        // const checkLeadByEmail = await client.query(CHECK_LEAD_BY_EMAIL, [email]);
        // if(checkLeadByEmail.rows.length > 0){
        //     throw new Error('Lead already exists with this email');
        // }
        const result = await client.query(INSERT_LEAD, [
            name,
            phone ?? null,
            email,
            followUp ?? null,
            movingOn ?? null,
            collectionAddress ?? null,
            collectionPurchaseStatus ?? null,
            collectionHouseSize ?? null,
            collectionVolume ?? null,
            collectionDistance ?? null,
            deliveryAddress ?? null,
            deliveryPurchaseStatus ?? null,
            deliveryHouseSize ?? null,
            deliveryVolume ?? null,
            deliveryDistance ?? null,
            customerNotes ?? null,
            referrerId ?? null
        ]);
        await client.query('COMMIT');
        return result?.rows[0];
    } catch (error: any) {
        logger.error('Failed to add lead', { error });
        throw new Error(`Failed to add lead: ${error.message}`);
    } finally {
        client.end();
    }
};
