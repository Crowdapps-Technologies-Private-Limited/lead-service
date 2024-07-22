import { SELECT_TENANT, SELECT_COMPANY_INFO } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import AWS from 'aws-sdk';
import { getconfigSecrets } from '../../utils/getConfig';
import logger from '../../utils/logger';
import { log } from 'console';

const s3 = new AWS.S3();

export const getUserProfile = async (userId: string) => {
    logger.info('Fetching user profile', { userId });
    const client = await connectToDatabase();

    try {
        const result = await client.query(SELECT_TENANT, [userId]);
        logger.info('User profile fetched successfully', { result });
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

        logger.info('User profile:', { user });

        if (user.logo) {
            const config = await getconfigSecrets();

            // Generate signed URL for the photo
            user.signedUrl = s3.getSignedUrl('getObject', {
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
        client.end();
    }
};
