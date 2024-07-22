import AWS from 'aws-sdk';
import { SELECT_TENANT, UPDATE_TENANT, UPDATE_COMPANY_INFO } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { getconfigSecrets } from '../../utils/getConfig';
import { ProfilePayload } from '../interface';
import logger from '../../utils/logger';

const { CognitoIdentityServiceProvider, S3 } = AWS;
const cognito = new CognitoIdentityServiceProvider();
const s3 = new S3();

export const updateUserProfile = async (tenant: any, payload: ProfilePayload) => {
    const { firstName, phone, photo } = payload;
    const config = await getconfigSecrets();
    const client = await connectToDatabase();

    // Start a database transaction
    await client.query('BEGIN');

    try {
        if(tenant?.is_suspended){
            throw new Error('Tenant is suspended');
        }
        // If photo was updated, delete previous one from S3
        if (tenant.logo !== photo && tenant.logo) {
            await s3
                .deleteObject({
                    Bucket: config.s3BucketName,
                    Key: tenant.logo,
                })
                .promise();
        }

        // Update user attributes in Cognito
        const userPoolId = config.cognitoUserPoolId;
        const attributesToUpdate = [];
        if (firstName) attributesToUpdate.push({ Name: 'given_name', Value: firstName });
        if (phone) attributesToUpdate.push({ Name: 'phone_number', Value: phone });

        if (attributesToUpdate.length > 0) {
            await cognito
                .adminUpdateUserAttributes({
                    UserPoolId: userPoolId,
                    Username: tenant.username,
                    UserAttributes: attributesToUpdate,
                })
                .promise();
        }

        // Update user data in PostgreSQL, storing only the photo key
        await client.query(UPDATE_TENANT, [firstName, tenant.id]);
        await client.query(UPDATE_COMPANY_INFO, [phone, photo, tenant.id]);

        // Commit the transaction
        await client.query('COMMIT');

        return { message: 'User profile updated successfully' };
    } catch (error: any) {
        // Rollback the transaction in case of an error
        await client.query('ROLLBACK');

        logger.error(`Failed to update user profile: ${error.message}`);
        throw new Error(`Failed to update user profile: ${error.message}`);
    } finally {
        try {
            await client.end();
        } catch (endError: any) {
            logger.error(`Failed to close database connection: ${endError.message}`);
            throw new Error(`Failed to close database connection: ${endError.message}`);
        }
    }
};
