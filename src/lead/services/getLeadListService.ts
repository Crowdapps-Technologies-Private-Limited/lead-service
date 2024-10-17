import { CHECK_TABLE_EXISTS } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { setPaginationData } from '../../utils/utility';
import logger from '../../utils/logger';

const allowedOrderFields: { [key: string]: string } = {
    generated_id: 'l.generated_id',
    customer_name: 'c.name',
    created_at: 'l.created_at', // Assuming created_at is in the leads table
};

export const getAllLeads = async (
    pageSize: number,
    pageNumber: number,
    orderBy: string,
    orderIn: string,
    search: string,
    filterStatus: string,
    tenant: any,
) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    const offset = pageSize * (pageNumber - 1);
    const searchQuery = `%${search}%`; // For partial matching
    logger.info('Fetching lead list', { pageSize, pageNumber, orderBy, orderIn, searchQuery, offset, filterStatus });

    try {
        await client.query('BEGIN');

        const schema = tenant.schema;
        logger.info('Schema:', { schema });

        await client.query(`SET search_path TO ${schema}`);
        logger.info('Schema set successfully');

        // Check if leads table exists
        const tableCheckRes = await client.query(CHECK_TABLE_EXISTS, [schema, 'leads']);
        const leadsTableExists = tableCheckRes.rows[0].exists;
        if (!leadsTableExists) {
            logger.info('Leads table does not exist');
            return {
                list: [],
                pagination: setPaginationData(0, pageSize, 0, pageNumber),
            };
        }

        // Fetch lead count with both filterStatus and search condition
        const resultCount = await client.query(
            `
            SELECT COUNT(*) 
            FROM leads l
            LEFT JOIN customers c ON l.customer_id = c.id
            WHERE 
                ($1::TEXT IS NULL OR l.status = $1::TEXT) AND 
                (c.name ILIKE $2 OR c.phone ILIKE $2 OR l.status ILIKE $2 OR l.generated_id::TEXT ILIKE $2)
            `,
            [filterStatus ? filterStatus : null, searchQuery],
        );

        // Fetch lead list with filterStatus and search condition
        const res = await client.query(
            `
            SELECT 
                l.generated_id,
                l.customer_id,
                c.name AS customer_name,
                c.phone AS customer_phone,
                c.email AS customer_email,
                l.collection_address_id,
                ca.street AS collection_street,
                ca.town AS collection_town,
                ca.county AS collection_county,
                ca.postcode AS collection_postcode,
                ca.country AS collection_country,
                l.follow_up_date,
                l.status,
                l.created_at
            FROM 
                leads l
            LEFT JOIN 
                customers c ON l.customer_id = c.id
            LEFT JOIN 
                addresses ca ON l.collection_address_id = ca.id
            WHERE 
                ($3::TEXT IS NULL OR l.status = $3::TEXT) AND 
                (c.name ILIKE $4 OR c.phone ILIKE $4 OR l.status ILIKE $4 OR l.generated_id::TEXT ILIKE $4)
            ORDER BY ${allowedOrderFields[orderBy]} ${orderIn.toUpperCase()}
            LIMIT $1 
            OFFSET $2`,
            [pageSize, offset, filterStatus ? filterStatus : null, searchQuery],
        );

        const pagination = setPaginationData(resultCount.rows[0].count, pageSize, res?.rows?.length, pageNumber);
        const result = {
            list: res?.rows || [],
            pagination,
        };
        return result;
    } catch (error: any) {
        logger.error('Failed to fetch lead list', { error });
        throw new Error(`${error.message}`);
    } finally {
        try {
            if (!clientReleased) {
                client.release();
                clientReleased = true;
            }
        } catch (endError: any) {
            logger.error('Failed to close database connection', { endError });
            throw new Error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
