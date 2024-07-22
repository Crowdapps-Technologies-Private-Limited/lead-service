import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { updateUserProfile } from '../services';
import { RouteHandler } from '../../types/interfaces';
import { ResponseHandler } from '../../utils/ResponseHandler';
import logger from '../../utils/logger';
import { updateProfileDTO } from '../validator';

export const updateProfile: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    try {
       
        const payload = JSON.parse(event.body || '{}');

        // Log the event body for debugging
        logger.info('payload:', { payload });
 

        const tenant = (event.requestContext as any).tenant;
        logger.info('User:', { tenant });

        // Validate payload
          await updateProfileDTO(payload);

        // Update user profile, including handling the photo file
        const result = await updateUserProfile(tenant, payload);
        logger.info('User profile updated successfully', { result });

        return ResponseHandler.createdResponse(result);
    }  catch (error: any) {
        logger.error('Error occurred', { error });
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
