import AWS from 'aws-sdk';
import { ActivateAccountPayload } from '../interface';
import { connectToDatabase } from '../../utils/database';
import { ACTIVATE_TENANT } from '../../sql/sqlScript';
import logger from '../../utils/logger';
import { getconfigSecrets } from '../../utils/getConfig';

const { CognitoIdentityServiceProvider } = AWS;
const cognito = new CognitoIdentityServiceProvider();

export const activateUserAccount = async (
  accessToken: string,
  payload: ActivateAccountPayload,
  tenant: any
) => {
  const client = await connectToDatabase();
  const config = await getconfigSecrets();
  const { previousPassword, proposedPassword, username } = payload;
  try {
    await client.query('BEGIN');

    if(tenant?.is_suspended){
      throw new Error('Tenant is suspended');
    }

    logger.info('Activating user account', { payload, tenant });
    

    // Change user password in Cognito
    try {
      await cognito
      .changePassword({
        AccessToken: accessToken,
        PreviousPassword: previousPassword,
        ProposedPassword: proposedPassword,
      })
      .promise();
    } catch (error: any) {
      throw new Error(`Please! check your current password and try again`);
    }

    const userPoolId = config.cognitoUserPoolId;

    // Update username and email verified attribute
    await cognito
      .adminUpdateUserAttributes({
        UserPoolId: userPoolId,
        Username: tenant.username,
        UserAttributes: [
          {
            Name: 'name',
            Value: username,
          },
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
      })
      .promise();

    // Update tenant status in the database
    await client.query(ACTIVATE_TENANT, [username ? username : tenant?.username, tenant.cognito_sub]);

    await client.query('COMMIT');

    return { message: 'Password changed and user attributes updated successfully' };
  } catch (error: any) {
    await client.query('ROLLBACK');

    // Rollback Cognito operations
    if (error.message.includes('Please! check your current password and try again')) {
      try {
        await cognito.changePassword({
          AccessToken: accessToken,
          PreviousPassword: proposedPassword,
          ProposedPassword: previousPassword,
        }).promise();
      } catch (rollbackError) {
        logger.error('Failed to rollback password change', { rollbackError });
      }
    }

    if (error.message.includes('user attributes update')) {
      try {
        await cognito.adminUpdateUserAttributes({
          UserPoolId: config.cognitoUserPoolId,
          Username: tenant.email,
          UserAttributes: [
            {
              Name: 'preferred_username',
              Value: '', // reset to previous username if available
            },
            {
              Name: 'email_verified',
              Value: 'false',
            },
          ],
        }).promise();
      } catch (rollbackError) {
        logger.error('Failed to rollback user attributes', { rollbackError });
      }
    }

    logger.error('Failed to activate user account', { error });
    throw new Error(`Failed to activate user account: ${error.message}`);
  } finally {
    client.end();
  }
};
