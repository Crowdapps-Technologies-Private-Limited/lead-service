import { ResponseHandler } from '../../utils/ResponseHandler';
import { changePasswordDTO } from '../validator';
import { changeUserPassword } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const changePassword: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('changePassword event ', { event });  
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        // Validate payload
        await changePasswordDTO(payload);
        const { previousPassword, proposedPassword } = payload;
        const accessToken = event.headers.Authorization?.split(' ')[1];

        if (!accessToken || !previousPassword || !proposedPassword) {
            return ResponseHandler.badRequestResponse({ message: 'Missing required parameters' });
        }

        // Change user password
        const result = await changeUserPassword(accessToken, previousPassword, proposedPassword, tenant);

        return ResponseHandler.createdResponse({ message: 'Password updated successfully!', data: null });
    }  catch (error: any) {
        logger.error('Error occurred change password handler', { error });
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
