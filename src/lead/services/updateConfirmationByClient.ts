import { INSERT_JOB_VEHICLE, UPDATE_VAT_INCLUDED_IN_QUOTE } from './../../sql/sqlScript';
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
import { generateEmail } from '../../utils/generateEmailService';

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

        // Fetch Confirmation Information
        let confirmRes: any;
        if (confirmationId) {
            confirmRes = await client.query(GET_CONFIRMATION_AND_CUSTOMER_BY_ID, [confirmationId]);
            if (!confirmRes?.rows?.length) {
                throw new Error(getMessage('CONFIRMATION_NOT_FOUND'));
            }
        } else {
            throw new Error(getMessage('CONFIRMATION_ID_REQUIRED'));
        }

        logger.info('Confirmation retrieved:', { confirmation: confirmRes?.rows[0] });
        if (confirmRes?.rows[0]?.status === 'JOB') {
            throw new Error("You can't update as lead status is JOB.");
        }

        // Fetch Quote Information
        const quoteRes = await client.query(GET_QUOTE_BY_ID_FOR_CONFIRMATION, [confirmRes?.rows[0]?.quote_id]);
        if (!quoteRes?.rows?.length) {
            throw new Error(getMessage('QUOTE_NOT_FOUND'));
        }
        logger.info('Quote retrieved:', { quote: quoteRes?.rows[0] });

        // Process Job Scheduling
        if (movingDate?.status === 'fixed') {
            if(isDepositeRecieved){

           
            logger.info('Processing job schedule');
            logger.info('Moving date:', { movingDate });
            logger.info('Packing date:', { packingDate });
            // Ensure movingDate and time are valid before using them
            if (!movingDate?.date || !movingDate?.time) {
                throw new Error(getMessage('INVALID_MOVING_DATE_OR_TIME'));
            }
          

            const cost = quoteRes?.rows[0]?.costs ? quoteRes?.rows[0]?.costs : [];
            logger.info('Cost details:', { cost });
            
    
            const vehicles =[]
            let totalWorker = 0;
            cost.forEach((c: any) => {
                vehicles.push({
                    vehicleTypeId : c.vehicleTypeId,
                    vehicleCount : c.vehicleQty
                });
                totalWorker = totalWorker + c.driverQty + c.packerQty + c.porterQty;
            });

           logger.info('Total worker:', { totalWorker });
           logger.info('Vehicles:', { vehicles });
            
            // Handling movingDate
            const movingDateObj = new Date(movingDate.date);
            const [movingHour, movingMinute] = movingDate.time.split(':'); // Extract hours and minutes from time
            movingDateObj.setUTCHours(parseInt(movingHour), parseInt(movingMinute)); // Update the time in the Date object

           const movingEndDateTime = new Date(movingDateObj.getTime() +  30 * 60 * 1000); // Add 30 minutes to the moving date time

            logger.info('Job schedule start time:', { movingDateObj });
           

            await client.query(CREATE_JOB_SCHEDULE_TABLE_IF_NOT_EXIST);
           const job = await client.query(INSERT_JOB_SCHEDULE, [
                'Moving', // job title
                totalWorker, // assigned workers
                confirmRes?.rows[0]?.customer_id, // customer ID
                confirmRes?.rows[0]?.collection_address_id, // collection address ID
                confirmRes?.rows[0]?.delivery_address_id, // delivery address ID
                movingDateObj, // start time (updated date object with time)
                movingEndDateTime, // end time (updated date object with time)
                '', // note
                'job', // type
                'Scheduled', // status
                user.email, // created by
                new Date(), // created_at
                user.email, // updated_by
                new Date(), // updated_at
                confirmRes?.rows[0]?.lead_id, // lead ID
            ]);
            
            logger.info('Job schedule created successfully:', { job });
            const job_id = job?.rows[0]?.job_id;
            logger.info('Job schedule id:', { job_id });
            for (const vehicle of vehicles) {
                if(vehicle && vehicle.vehicleCount > 0){
                    await client.query(INSERT_JOB_VEHICLE, [
                        vehicle.vehicleTypeId,
                        vehicle.vehicleCount,
                        job_id,
                        leadId
                    ]);

                }
               
            }
           

            // Generate job schedule email
            // await generateEmail('Job Email', leadData?.customer_email, {
            //     username: leadData?.customer_name,
            //     lead: leadId,
            //     email: leadData?.customer_email,
            //     password: password,
            // });
            // logger.info('Confirmation email sent');

            // // Insert log
            // await client.query(INSERT_LOG, [
            //     tenant.id,
            //     leadData?.customer_name,
            //     leadData?.customer_email,
            //     `Confirmation Email sent to customer`,
            //     'CONFIRMATION',
            //     leadCheckResult.rows[0].status,
            //     leadId,
            // ]);
            // logger.info('Log entry created successfully');


            if(packingDate && packingDate.status === 'fixed') {
                if (!packingDate?.date || !packingDate?.time) {
                    throw new Error(getMessage('INVALID_PACKAGING_DATE_OR_TIME'));
                }
                 // Handling packingDate
            const packingDateObj = new Date(packingDate.date);
            const [packingHour, packingMinute] = packingDate?.time.split(':');
            packingDateObj.setUTCHours(parseInt(packingHour), parseInt(packingMinute));
            logger.info('Job schedule end time:', { packingDateObj });
            const packingEndDateTime = new Date(movingDateObj.getTime() +  30 * 60 * 1000); // Add 30 minutes to the moving date time
            await client.query(INSERT_JOB_SCHEDULE, [
                'Packaging', // job title
                totalWorker, // assigned workers
                confirmRes?.rows[0]?.customer_id, // customer ID
                confirmRes?.rows[0]?.collection_address_id, // collection address ID
                confirmRes?.rows[0]?.delivery_address_id, // delivery address ID
                packingDateObj, // start time (updated date object with time)
                packingEndDateTime, // end time (updated date object with time)
                '', // note
                'job', // type
                'Scheduled', // status
                user.email, // created by
                new Date(), // created_at
                user.email, // updated_by
                new Date(), // updated_at
                confirmRes?.rows[0]?.lead_id, // lead ID
            ]);    

            // Generate job schedule email
            await generateEmail('Confirmed Job Email', confirmRes?.rows[0]?.customer_email, {
                username: confirmRes?.rows[0]?.customer_name,
                jobref: leadId,
                companyname: tenant?.name,
    
            });
            logger.info('Confirmation email sent');

            // Insert log
            await client.query(INSERT_LOG, [
                tenant.id,
                confirmRes?.rows[0]?.customer_name,
                confirmRes?.rows[0]?.customer_email,
                `Job Confirmation Email sent to customer`,
                Date.now(),
                'CONFIRMATION',
                leadId,
            ]);
            logger.info('Log entry created successfully');
        }
     

            // Update lead status to 'JOB'
            await client.query(UPDATE_LEAD_STATUS, ['JOB', confirmRes?.rows[0]?.lead_id]);

            logger.info('Job schedule and lead status updated successfully');
    }
    else{   
        logger.info('packing and moving date are fixed but deposite not recieved');
            
        }
    }
        else{
            for (const service of services) {
                if (service.name === "Full Pack" && service.status === 'accept') {
                    if (movingDate?.date && movingDate?.time) {
                        await client.query(UPDATE_LEAD_STATUS, ['CONFIRMED', confirmRes?.rows[0]?.lead_id]);  
                    }
                   
                }
            }

            // Update lead status to 'CONFIRMED'
          
            return { message: getMessage('CONFIRMATION_UPDATED') };

        }

       logger.info('Job schedule and lead status updated successfully');
        // Update VAT included in quote
        logger.info('Updating VAT included in quote:', { vatIncluded }); 
        logger.info('quoteId:', { quote_id: confirmRes?.rows[0]?.quote_id }); 
        await client.query(UPDATE_VAT_INCLUDED_IN_QUOTE, [vatIncluded, confirmRes?.rows[0]?.quote_id]);

        // Update confirmation details
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
            `Customer confirmation added/updated.`,
            'LEAD',
            'CONFIRMATION',
            confirmRes?.rows[0]?.lead_id,
        ]);

        logger.info('Log entry created successfully');

        // Commit transaction
        await client.query('COMMIT');
        return { message: getMessage('CONFIRMATION_UPDATED') };
    } catch (error: any) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        logger.error('Failed to update confirmation:', { error });
        throw new Error(`${error.message}`);
    } finally {
        await client.end(); // Close the database connection
    }
};
