import AWS from 'aws-sdk';
import {
    GET_LEAD_BY_ID,
    CHECK_TABLE_EXISTS,
    EDIT_LEAD
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { EditLeadPayload } from '../interface';
import { getconfigSecrets } from '../../utils/getConfig';
import logger from '../../utils/logger';

const { CognitoIdentityServiceProvider } = AWS;
const cognito = new CognitoIdentityServiceProvider();

export const updateLead = async (payload: EditLeadPayload, leadId: string, tenant: any) => {
    const {
        name,
        phone,
        email,
        followUp,
        movingOn,
        packingOn,
        collectionAddress,
        collectionCity,
        collectionState,
        collectionCounty,
        collectionPurchaseStatus,
        collectionHouseSize,
        collectionVolume,
        collectionVolumeUnit,
        collectionDistance,
        deliveryAddress,
        deliveryCity,
        deliveryState,
        deliveryCounty,
        deliveryPurchaseStatus,
        deliveryHouseSize,
        deliveryVolume,
        deliveryVolumeUnit,
        deliveryDistance,
        customerNotes,
        referrerId,
        collectionPostcode,
        deliveryPostcode
    } = payload;
    const config = await getconfigSecrets();
    // Connect to PostgreSQL database
    const client = await connectToDatabase();
    try {
        if(tenant?.is_suspended){
            throw new Error('Tenant is suspended');
        }
        await client.query('BEGIN');
        const schema = tenant.schema;
        logger.info('Schema:', { schema });
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
        logger.info('Schema created successfully');
        await client.query(`SET search_path TO ${schema}`);
        logger.info('Schema set successfully');
        let tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);

        const leadsTableExists = tableCheckRes.rows[0].exists;
        if (!leadsTableExists) {
            logger.info('Leads table does not exist');
            return {
                message: 'No data found'
            };
        }
        let res = await client.query(GET_LEAD_BY_ID,[leadId]);
        if(res.rows.length === 0) {
        throw new Error(`No data found.`);
        }
        const lead = await client.query(EDIT_LEAD, [
            name || res.rows[0].name,
            phone || res.rows[0].phone,
            email || res.rows[0].email,
            followUp || res.rows[0].follow_up_date,
            movingOn || res.rows[0].moving_on_date,
            collectionAddress || res.rows[0].collection_address,
            collectionCounty || res.rows[0].collection_county,
            collectionCity  || res.rows[0].collection_city,
            collectionState || res.rows[0].collection_state,
            collectionPurchaseStatus || res.rows[0].collection_purchase_status,
            collectionHouseSize || res.rows[0].collection_house_size,
            collectionDistance ?? res.rows[0].collection_distance,
            collectionVolume ?? res.rows[0].collection_volume,
            collectionVolumeUnit || res.rows[0].collection_volume_unit,
            deliveryAddress || res.rows[0].delivery_address,
            deliveryCounty || res.rows[0].delivery_county,
            deliveryCity || res.rows[0].delivery_city,
            deliveryState || res.rows[0].delivery_state,
            deliveryPurchaseStatus || res.rows[0].delivery_purchase_status,
            deliveryHouseSize || res.rows[0].delivery_house_size,
            deliveryDistance ?? res.rows[0].delivery_distance,
            deliveryVolume ?? res.rows[0].delivery_volume,
            deliveryVolumeUnit || res.rows[0].delivery_volume_unit,
            customerNotes || res.rows[0].customerNotes,
            referrerId || res.rows[0].referrerId,
            collectionPostcode || res.rows[0].collection_postcode,
            deliveryPostcode || res.rows[0].delivery_postcode,
            packingOn || res.rows[0].packing_on_date,
            leadId    
        ]);
        await client.query('COMMIT');
        return {
            message: 'Lead updated successfully',
            data: lead.rows[0]
        };
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error('Failed to edit lead in service:', { error } );
        throw new Error(`Failed to edit lead: ${error.message}`);
    } finally {
        await client.end();
    }
};
