import { connectToDatabase } from '../../utils/database';
import logger from '../../utils/logger';
import { CREATE_JOB_SCHEDULE_TABLE_IF_NOT_EXIST } from '../../sql/sqlScript';

// Service to fetch jobs list with details of customers, addresses, and vehicles
export const getJobsList = async (tenant: any) => {
    logger.info('Fetching jobs list for tenant:', { tenant });

    const client = await connectToDatabase();
    const schema = tenant.schema;

    try {
        if (tenant?.is_suspended) {
            throw new Error('Account is suspended');
        }

        await client.query(`SET search_path TO ${schema}`);
        await client.query(CREATE_JOB_SCHEDULE_TABLE_IF_NOT_EXIST); // Ensure the job_schedules table exists

        const jobsQuery = `
            SELECT 
                js.job_id,
                js.job_title,
                js.lead_id,
                js.start_date_time,
                js.end_date_time,
                js.note,
                js.job_type,
                js.status,
                c.name AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone,
                ca.street AS collection_street,
                ca.town AS collection_town,
                ca.postcode AS collection_postcode,
                ca.country AS collection_country,
                da.street AS delivery_street,
                da.town AS delivery_town,
                da.postcode AS delivery_postcode,
                da.country AS delivery_country,
                vt.type_name AS vehicle_type, 
                jv.vehicle_count
            FROM job_schedules js
            LEFT JOIN customers c ON js.customer_id = c.id
            LEFT JOIN addresses ca ON js.collection_address_id = ca.id
            LEFT JOIN addresses da ON js.delivery_address_id = da.id
            LEFT JOIN job_vehicles jv ON js.job_id = jv.job_id
            LEFT JOIN public.vehicle_types vt ON jv.vehicle_type_id::UUID = vt.id
            ORDER BY js.start_date_time DESC;
        `;

        const jobsResult = await client.query(jobsQuery);
        logger.info('Jobs fetched successfully:', { rowCount: jobsResult.rowCount });

        return jobsResult.rows;

    } catch (error: any) {
        logger.error('Error fetching jobs list:', { error });
        throw new Error(error.message);
    } finally {
        client.end();
    }
};
