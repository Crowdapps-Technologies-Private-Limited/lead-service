import { UpdateConfirmationPayload } from './../interface';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { CHECK_TABLE_EXISTS, GET_CONFIRMATION_BY_ID,  GET_LEAD_BY_ID,  INSERT_CONFIRMATION_SERVICE, INSERT_LOG, UPDATE_CONFIRMATION_BY_CLIENT, UPDATE_CONFIRMATION_SERVICE} from '../../sql/sqlScript';
import { getMessage } from '../../utils/errorMessages';

export const updateConfirmationByClient = async (leadId: string, payload: UpdateConfirmationPayload, tenant: any, user:any) => {
    const client = await connectToDatabase();
    const {
        confirmationId,
        movingDate,
        packingDate,
        isDepositeRecieved,
        services,
        vatIncluded
    } = payload;
    try {
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        const schema = tenant?.schema || tenant?.tenant?.schema;
        logger.info('Schema:', { schema });
        await client.query(`SET search_path TO ${schema}`);
        let confirmRes: any;
        if(confirmationId) {
            confirmRes  = await client.query(
                GET_CONFIRMATION_BY_ID,
                [confirmationId]
            );
            if(!confirmRes?.rows?.length) {
                throw new Error(getMessage('CONFIRMATION_NOT_FOUND'));
            }
        }
       
        const leadRes = await client.query(
            GET_LEAD_BY_ID,
            [confirmRes?.rows[0]?.lead_id]
        );
        let toolTipContent = '';
        if(movingDate?.status === 'fixed') { 
            toolTipContent = 'Accepted';
        } else {
            toolTipContent = 'Declined';
        }
        // Update confirmation
        await client.query(
            UPDATE_CONFIRMATION_BY_CLIENT,
            [
                movingDate?.date,
                movingDate?.time || null,
                movingDate?.status,
                packingDate?.date || null,
                packingDate?.time || null,
                packingDate?.status || null,        
                isDepositeRecieved,
                user.email,
                confirmationId
            ]
        );
        // Update confirmation services
        for(const service of services) {
            if(service.serviceId) {
                const serviceRes = await client.query(
                    UPDATE_CONFIRMATION_SERVICE,
                    [
                        service.name,
                        service.cost,
                        service.status,
                        confirmationId,
                        service.serviceId
                    ]
                );
                logger.info('Service updated successfully:', { service: serviceRes.rows[0] });
            } 
        }
        // Insert log entry
        await client.query(INSERT_LOG, [
            tenant.id,
            tenant.name,
            tenant.email,
            `Customer confirmation added / updated.`,
            'LEAD',
            leadRes?.rows[0]?.status,
            confirmRes?.rows[0]?.lead_id,
        ]);
        logger.info('Log entry created successfully');

        await client.query('COMMIT'); // Commit transaction
        return { message: getMessage('CONFIRMATION_UPDATED') };
    } catch (error: any) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        logger.error('Failed to update confirmation', { error });
        throw new Error(`${error.message}`);
    } finally {
        client.end();
    }
};
