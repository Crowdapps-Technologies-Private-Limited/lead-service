import { ResponseHandler } from '../../utils/ResponseHandler';
import { sendEmailDTO } from '../validator';
import { sendLeadEmail } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const sendEmailHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('sendEmailHandler event ', { event });  
    try {
        let payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const leadId = event.pathParameters?.id;
        logger.info('leadId:', { leadId });
        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: 'Lead ID is required' });
        }
        // Validate payload
        await sendEmailDTO(payload);
        const result = await sendLeadEmail(leadId, payload, tenant);

        return ResponseHandler.createdResponse({ message: result.message });
    } catch (error: any) {
        logger.error('Error occurred send lead email handler', { error });
        if (error?.message?.includes('Payload Validation Failed')) {
            return ResponseHandler.notFoundResponse({ message: error.message });
        } else if (error?.message?.includes('Tenant is suspended')) {
            return ResponseHandler.badRequestResponse({ message: "Your account is suspended. Kindly ask the admin to reactivate your account!" });
        } else {
            return ResponseHandler.notFoundResponse({ message: error.message });
            //return ResponseHandler.badRequestResponse({ message: "Something went wrong. Please try later!" });
        }
    }
};
