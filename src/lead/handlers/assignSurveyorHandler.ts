import { ResponseHandler } from '../../utils/ResponseHandler';
import { assignSurveyorDTO } from '../validator';
import { assignSurveyor } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';

export const assignSurveyorHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('assignSurveyorHandler event ', { event });  
    try {
        let payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const user = (event.requestContext as any).user;
        logger.info('user:', { user });

        const hasPermission = await checkPermission(user.role, 'Survey', 'create', tenant.schema);
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: 'Permission denied' });
        }

        const leadId = event.pathParameters?.id;
        logger.info('leadId:', { leadId });
        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: 'Lead ID is required' });
        }
        try {
            await assignSurveyorDTO(payload);
        } catch (error: any) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        }
      

        const result = await assignSurveyor(leadId, payload, tenant);

        return ResponseHandler.createdResponse({ message: result?.message });
    } catch (error: any) {
        logger.error('Error occurred assign surveyor handler', { error });
        if (error?.message?.includes('Payload Validation Failed')) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
            logger.error('Error occurred add lead handler message', { cleanedMessage });
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        } else if (error?.message?.includes('Tenant is suspended')) {
            return ResponseHandler.badRequestResponse({ message: "Your account is suspended. Kindly ask the admin to reactivate your account!" });
        } else {
            return ResponseHandler.notFoundResponse({ message: error.message });
            //return ResponseHandler.badRequestResponse({ message: "Something went wrong. Please try later!" });
        }
    }
};
