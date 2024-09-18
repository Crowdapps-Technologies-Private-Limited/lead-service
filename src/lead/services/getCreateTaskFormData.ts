import { GET_ALL_VEHICLE_TYPES, GET_JOB_SCHEDULE_BY_LEAD_ID, GET_JOB_VEHICLES_BY_JOB_ID, GET_JOB_VEHICLES_BY_LEAD_ID } from './../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';

export const getCreateTaskFormData = async (
    leadId: string,
    tenant: any,
    user: any,
) => {
    const client = await connectToDatabase();

    try {
        // Ensure tenant is not suspended
        if (tenant?.is_suspended || tenant?.tenant?.is_suspended) {
            throw new Error(getMessage('ACCOUNT_SUSPENDED'));
        }

        const schema = tenant?.schema || tenant?.tenant?.schema;
        logger.info('Schema:', { schema });

        // Set the schema to the tenant's schema
        await client.query(`SET search_path TO ${schema}`);

        // Check if the lead exists
        const leadCheckResult = await client.query(
            `SELECT * FROM leads WHERE generated_id = $1`, 
            [leadId]
        );

        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }

        logger.info('Lead found:', { lead: leadCheckResult.rows[0] });

        // Fetch Job Schedule Information by leadId
        const jobsRes = await client.query(GET_JOB_SCHEDULE_BY_LEAD_ID, [leadId]);

        if (!jobsRes?.rows?.length) {
            throw new Error(getMessage('JOB_NOT_FOUND'));
        }

        logger.info('Job schedule retrieved:', { job: jobsRes.rows });
        const jobVehicles =  await client.query(GET_JOB_VEHICLES_BY_LEAD_ID, [leadId]);
        logger.info('Job vehicles retrieved:', { jobVehicles: jobVehicles.rows });
        const vehiclesRes = await client.query(GET_ALL_VEHICLE_TYPES);
        logger.info('Vehicles retrieved:', { vehicles: vehiclesRes.rows });
        // Combine vehicles from jobVehicles and vehicle types, deduplicate by vehicle_type_id
        const allVehicles = [...vehiclesRes.rows, ...jobVehicles.rows];

        // Deduplicate the vehicle types based on vehicle_type_id
        const uniqueVehicles = allVehicles.reduce((acc, current) => {
            const x = acc.find((item: any) => item.vehicle_type_id === current.vehicle_type_id);
            if (!x) {
                acc.push(current);
            } else if (current.vehicle_count > x.vehicle_count) {
                // Update vehicle count if current vehicle has a higher count
                x.vehicle_count = current.vehicle_count;
            }
            return acc;
        }, []);

        return {...jobsRes.rows[0], vehicles: uniqueVehicles};
    } catch (error: any) {
        logger.error('Error fetching job schedule:', { error });
        throw new Error(error.message);
    } finally {
        // Close the database connection
        await client.end();
    }
};
