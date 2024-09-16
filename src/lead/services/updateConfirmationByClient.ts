import { UpdateConfirmationPayload } from './../interface';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import {
    CREATE_JOB_SCHEDULE_TABLE_IF_NOT_EXIST,
    GET_CONFIRMATION_AND_CUSTOMER_BY_ID,
    GET_QUOTE_BY_ID_FOR_CONFIRMATION,
    INSERT_JOB_SCHEDULE,
    INSERT_LOG,
    UPDATE_CONFIRMATION_BY_CLIENT,
    UPDATE_CONFIRMATION_SERVICE,
    UPDATE_LEAD_STATUS,
} from '../../sql/sqlScript';
import { getMessage } from '../../utils/errorMessages';

export const updateConfirmationByClient = async (
    leadId: string,
    payload: UpdateConfirmationPayload,
    tenant: any,
    user: any,
) => {
    const client = await connectToDatabase();
    const { confirmationId, movingDate, packingDate, isDepositeRecieved, services, vatIncluded } = payload;

    try {
        // Ensure tenant is not suspended
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        const schema = tenant?.schema || tenant?.tenant?.schema;
        logger.info('Schema:', { schema });
        await client.query(`SET search_path TO ${schema}`);

        // Start transaction
        await client.query('BEGIN');

        let confirmRes: any;
        if (confirmationId) {
            confirmRes = await client.query(GET_CONFIRMATION_AND_CUSTOMER_BY_ID, [confirmationId]);
            if (!confirmRes?.rows?.length) {
                throw new Error(getMessage('CONFIRMATION_NOT_FOUND'));
            }
        }

        logger.info('Confirmation:', { confirmation: confirmRes?.rows[0] });

        // Fetch Quote Information
        const quoteRes = await client.query(GET_QUOTE_BY_ID_FOR_CONFIRMATION, [confirmRes?.rows[0]?.quote_id]);
        logger.info('Quote:', { quoteRes });

        // Check and process the job scheduling
        if (movingDate?.status === 'fixed' && packingDate?.status === 'fixed') {
            if (isDepositeRecieved) {
                const cost = confirmRes?.rows[0]?.costs ? confirmRes?.rows[0]?.costs[0] : null;
                logger.info('Cost:', { cost });

                let totalWorker = 0;
                if (cost) {
                    totalWorker = cost?.driverQty + cost?.packerQty + cost?.porterQty;
                }

                const startDateTime = new Date(`${movingDate?.date}T${movingDate?.time}:00`);
                const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // Adds 30 minutes

                logger.info('Start date time:', { startDateTime });
                logger.info('End date time:', { endDateTime });
                logger.info('Total workers assigned:', { totalWorker });

                await client.query(CREATE_JOB_SCHEDULE_TABLE_IF_NOT_EXIST);
                await client.query(INSERT_JOB_SCHEDULE, [
                    'Moving', // job title
                    totalWorker, // assigned workers
                    confirmRes?.rows[0]?.customer_id, // customer ID
                    confirmRes?.rows[0]?.collection_address_id, // collection address ID
                    confirmRes?.rows[0]?.delivery_address_id, // delivery address ID
                    startDateTime, // start time
                    endDateTime, // end time
                    '', // note
                    'Scheduled', // status
                    user.email, // created by
                    new Date(), // created_at
                    user.email, // updated_by
                    new Date(), // updated_at
                    confirmRes?.rows[0]?.lead_id, // lead ID
                ]);

                await client.query(UPDATE_LEAD_STATUS, ['JOB', confirmRes?.rows[0]?.lead_id]);

                logger.info('Job schedule created successfully');
            }
        }

        // Update confirmation
        await client.query(UPDATE_CONFIRMATION_BY_CLIENT, [
            movingDate?.date,
            movingDate?.time || null,
            movingDate?.status,
            packingDate?.date || null,
            packingDate?.time || null,
            packingDate?.status || null,
            isDepositeRecieved,
            user.email,
            confirmationId,
        ]);

        // Update confirmation services
        for (const service of services) {
            if (service.serviceId) {
                const serviceRes = await client.query(UPDATE_CONFIRMATION_SERVICE, [
                    service.name,
                    service.cost,
                    service.status,
                    confirmationId,
                    service.serviceId,
                ]);
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
            'CONFIRMATION',
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
