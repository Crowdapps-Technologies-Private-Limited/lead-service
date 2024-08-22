
import AWS from 'aws-sdk';
import logger from './logger';
import { connectToDatabase } from './database';
import { GET_TENANT_BY_ID, SELECT_COMPANY_INFO } from '../sql/sqlScript';

const s3 = new AWS.S3();

export const getTenantProfile = async (userId: string) => {
    logger.info('Fetching tenant profile', { userId });
    const client = await connectToDatabase();

    try {
        const result = await client.query(GET_TENANT_BY_ID, [userId]);
        logger.info('Tenant profile fetched successfully', { res: result.rows[0] });
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        const user = result.rows[0];
        const company = await client.query(SELECT_COMPANY_INFO, [result.rows[0].id]);
        if (company.rows.length === 0) {
            throw new Error('User company not found');
        }
        user.logo = company.rows[0].logo;
        user.phoneNumber = company.rows[0].phone_number;
        user.transportCode = company.rows[0].transport_code;

        logger.info('User profile final  :', { user });
        return user;
    } catch (error: any) {
        logger.error('Failed to fetch user profile', { error });
        throw new Error(`Failed to fetch user profile: ${error.message}`);
    } finally {
        client.end();
    }
};
