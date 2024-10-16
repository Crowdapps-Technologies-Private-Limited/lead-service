import AWS from 'aws-sdk';
import logger from './logger';
import { connectToDatabase } from './database';
import { GET_TENANT_BY_ID, SELECT_COMPANY_INFO } from '../sql/sqlScript';
import { checkSubscriptionStatus } from './checkSubscription';
import { getconfigSecrets } from './getConfig';

const s3 = new AWS.S3();

export const getTenantProfile = async (userId: string) => {
    logger.info('Fetching tenant profile', { userId });
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released

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
        user.address = company.rows[0].address;
        user.postCode = company.rows[0].post_code;
        user.general_website = company.rows[0].general_website;
        if (user.logo) {
            const config = await getconfigSecrets();

            // Generate signed URL for the photo
            user.logo = s3.getSignedUrl('getObject', {
                Bucket: config.s3BucketName,
                Key: user.logo,
                Expires: 60 * 60, // URL expires in 1 hour
            });
        }

        logger.info('User profile final  :', { user });
        return user;
    } catch (error: any) {
        logger.error('Failed to fetch user profile', { error });
        throw new Error(`Failed to fetch user profile: ${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
