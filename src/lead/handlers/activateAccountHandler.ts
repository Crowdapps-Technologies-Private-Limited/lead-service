import { ResponseHandler } from '../../utils/ResponseHandler';
import { activateAccountDTO, changePasswordDTO } from '../validator';
import { activateUserAccount } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const activateAccount: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('activateAccount event ', { event });  
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const user = (event.requestContext as any).user;
        logger.info('user:', { user });
        if( tenant.status === 'PENDING' || user.email_verified === false){
        

        // Validate payload
            await activateAccountDTO(payload);
            const { previousPassword, proposedPassword, username } = payload;
            const accessToken = event.headers.Authorization?.split(' ')[1];

            if (!username || !accessToken || !previousPassword || !proposedPassword) {
                return ResponseHandler.badRequestResponse({ message: 'Missing required parameters' });
            }

            // Change user password
            const result = await activateUserAccount(accessToken, payload, tenant);

            return ResponseHandler.createdResponse({ message: 'Password updated successfully!', data: null });
        } else {
            return ResponseHandler.badRequestResponse({ message: 'Your account is already active' });
        }
    }  catch (error: any) {
        logger.error('Error occurred activate handler', { error });
        if(error?.message?.includes('Payload Validation Failed')) {
            return ResponseHandler.notFoundResponse({ message: error.message });
        } else if (error?.message?.includes('Please! check your current password and try again')) {
            return ResponseHandler.notFoundResponse({ message: "Please! check your current password and try again" });
        } else if(error?.message?.includes('Tenant is suspended')) {
            return ResponseHandler.badRequestResponse({ message: "Your account is suspended. Kindly ask the admin to reactivate your account!" });
        } else {
            return ResponseHandler.badRequestResponse({ message: "Something went wrong. Please try later!" });
        }
    }
};
