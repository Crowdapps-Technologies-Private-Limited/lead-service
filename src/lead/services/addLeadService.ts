import { 
    CREATE_LEAD_TABLE, 
    INSERT_LEAD, 
    GET_ALL_LEADS,
    CREATE_LOG_TABLE,
    INSERT_LOG
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import AWS from 'aws-sdk';
import { getconfigSecrets } from '../../utils/getConfig';
import logger from '../../utils/logger';
import { log } from 'console';
import { AddLeadPayload } from '../interface';
import { generateEmail } from '../../utils/generateEmailService';

const s3 = new AWS.S3();

export const addLead = async (payload: AddLeadPayload, tenant: any) => {
    logger.info('addLead payload:', { payload });
    const {
        name,
        phone,
        email,
        followUp,
        movingOn,
        collectionAddress,
        collectionPurchaseStatus,
        collectionHouseSize,
        collectionVolumeMeter,
        collectionVolumeFeet,
        collectionVolumeUnit,
        collectionDistance,
        deliveryAddress,
        deliveryPurchaseStatus,
        deliveryHouseSize,
        deliveryVolumeMeter,
        deliveryVolumeFeet,
        deliveryVolumeUnit,
        deliveryDistance,
        customerNotes,
        referrerId,
        collectionPostcode,
        deliveryPostcode
    } = payload;
    const client = await connectToDatabase();

    try {
        await client.query('BEGIN');
        if(tenant?.is_suspended){
            throw new Error('Tenant is suspended');
        }
        const schema = tenant.schema;
        logger.info('Schema:', { schema });
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
        logger.info('Schema created successfully');
        await client.query(`SET search_path TO ${schema}`);
        logger.info('Schema set successfully');
        // await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA ${schema}`);
        // logger.info('Extension created successfully');
        await client.query(CREATE_LEAD_TABLE);
        logger.info('Lead table created successfully');
        let generatedId: any;
        const idArray = await client.query(GET_ALL_LEADS);
        if (idArray?.rows.length === 0) {
            generatedId = 10000000;
        } else {
            const ids = idArray?.rows.map((item: any) => item.generated_id);
            const maxId = Math.max(...ids);
            generatedId = maxId + 1;
        }
        const result = await client.query(INSERT_LEAD, [
            name,
            phone || null,
            email,
            followUp || null,
            movingOn || null,
            collectionAddress || null,
            collectionPurchaseStatus || null,
            collectionHouseSize || null,
            collectionDistance ?? null,
            collectionVolumeMeter ?? null,
            collectionVolumeFeet ?? null,
            collectionVolumeUnit || null,
            deliveryAddress || null,
            deliveryPurchaseStatus || null,
            deliveryHouseSize || null,
            deliveryDistance ?? null,
            deliveryVolumeMeter ?? null,
            deliveryVolumeFeet ?? null,
            deliveryVolumeUnit || null,
            customerNotes || null,
            referrerId || null,
            generatedId,
            collectionPostcode || null,
            deliveryPostcode || null
        ]);
        await client.query(CREATE_LOG_TABLE);
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            'You have added a new lead',
            'LEAD',
            'NEW',
            result?.rows[0].id
        ]);
        await generateEmail('Add Lead', email, { username: name });
        logger.info('Lead added successfully', { result: result?.rows[0] });
        await client.query('COMMIT');
        return result?.rows[0];
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to add lead', { error });
        throw new Error(`Failed to add lead: ${error.message}`);
    } finally {
        client.end();
    }
};
