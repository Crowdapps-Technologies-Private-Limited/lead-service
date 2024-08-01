import AWS from 'aws-sdk';
import {
    GET_LEAD_BY_ID,
    CHECK_TABLE_EXISTS,
    EDIT_LEAD,
    CREATE_LOG_TABLE,
    INSERT_LOG
} from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { EditLeadPayload } from '../interface';
import { getconfigSecrets } from '../../utils/getConfig';
import logger from '../../utils/logger';
import { isEmptyString } from '../../utils/utility';

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
            name,
            phone,
            email,
            isEmptyString(followUp)  ? null : followUp,
            isEmptyString(movingOn)  ? null : movingOn,
            collectionAddress,
            collectionCounty,
            collectionCity,
            collectionState,
            collectionPurchaseStatus,
            collectionHouseSize,
            collectionDistance,
            collectionVolume,
            collectionVolumeUnit,
            deliveryAddress,
            deliveryCounty,
            deliveryCity,
            deliveryState,
            deliveryPurchaseStatus,
            deliveryHouseSize,
            deliveryDistance,
            deliveryVolume,
            deliveryVolumeUnit,
            customerNotes,
            isEmptyString(referrerId) ? null : referrerId,
            collectionPostcode,
            deliveryPostcode,
            isEmptyString(packingOn) ? null : packingOn,
            leadId    
        ]);
        await client.query(CREATE_LOG_TABLE);
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            'You have updated a new lead',
            'LEAD',
            'NEW',
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
