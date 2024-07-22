import { ResponseHandler } from '../../utils/ResponseHandler';
import { addLeadDTO } from '../validator';
import { addLead } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const addLeadHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('addLeadHandler event ', { event });  
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const user = (event.requestContext as any).user;
        logger.info('user:', { user });
        // Validate payload
        await addLeadDTO(payload);

        // Update user profile, including handling the photo file
        const result = await addLead(tenant, payload);
        logger.info('User profile updated successfully', { result });

        return ResponseHandler.createdResponse(result);
    }  catch (error: any) {
        logger.error('Error occurred add lead handler', { error });
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
