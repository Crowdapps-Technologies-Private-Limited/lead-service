import { SELECT_COMPANY_INFO, GET_TENANT_BY_ID, GET_STAFF_BY_SUB } from '../sql/sqlScript';
import { connectToDatabase } from './database';
import AWS from 'aws-sdk';
import { getconfigSecrets } from './getConfig';
import logger from './logger';

const s3 = new AWS.S3();

export const getUserProfile = async (tenantId: string, userSub: string) => {
    logger.info('tenantId', { tenantId });
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released

    try {
        const result = await client.query(GET_TENANT_BY_ID, [tenantId]);
        logger.info('User profile fetched successfully', { result: result.rows[0] });
        if (result.rows.length === 0) {
            throw new Error('Tenant not found');
        }
        const tenant = result.rows[0];
        const company = await client.query(SELECT_COMPANY_INFO, [result.rows[0].id]);
        if (company.rows.length === 0) {
            throw new Error('Tenant company not found');
        }
        tenant.logo = company.rows[0].logo;
        tenant.phoneNumber = company.rows[0].phone_number;
        tenant.companyName = company.rows[0].company_name;
        tenant.postCode = company.rows[0].post_code;
        tenant.address = company.rows[0].address;
        tenant.general_website = company.rows[0].general_website;

        logger.info('Tenant profile:', { tenant });

        if (tenant.logo) {
            const config = await getconfigSecrets();

            // Generate signed URL for the photo
            tenant.logo = s3.getSignedUrl('getObject', {
                Bucket: config.s3BucketName,
                Key: tenant.logo,
                Expires: 60 * 60, // URL expires in 1 hour
            });
        }
        logger.info('Tenant profile final  :', { tenant });
        await client.query(`SET search_path TO ${result.rows[0].schema}`);
        const staffCheck = await client.query(GET_STAFF_BY_SUB, [userSub]);
        const staff = staffCheck.rows[0];
        logger.info('Staff:', { staff });
        return {
            tenant,
            ...staff,
        };
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
