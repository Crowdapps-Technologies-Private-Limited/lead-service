import { ResponseHandler } from '../../utils/ResponseHandler';
import { editLead } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import {  validateEditLeadDTO } from '../validator';

export const editLeadHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('editLeadHandler event ', { event });  
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const user = (event.requestContext as any).user;
        logger.info('user:', { user });
        const leadId = event.pathParameters?.id;
        logger.info('leadId:', { leadId });

        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: 'Lead ID is required' });
        }

        // Validate payload
        validateEditLeadDTO(payload);

        const result = await editLead(leadId, payload, tenant);

        return ResponseHandler.successResponse({ message: 'Lead updated successfully' });
    }  catch (error: any) {
        logger.error('Error occurred in edit lead handler', { error });
        if(error?.message?.includes('Payload Validation Failed')) {
            return ResponseHandler.badRequestResponse({ message: error.message });
        } else if (error?.message?.includes('Lead not found')) {
            return ResponseHandler.notFoundResponse({ message: "Lead not found!" });
        } else if(error?.message?.includes('Tenant is suspended')) {
            return ResponseHandler.badRequestResponse({ message: "Your account is suspended. Kindly ask the admin to reactivate your account!" });
        } else {
            return ResponseHandler.badRequestResponse({ message: error.message });
        }
    }
};
