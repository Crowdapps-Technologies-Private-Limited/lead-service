import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { updateLead } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { editLeadDTO } from '../validator';

export const editLeadHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('editLeadHandler event ', { event });  
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const leadId = event?.pathParameters?.id as string;
        logger.info('Lead ID', { leadId });
        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: `Lead ID not provided` });
        }
        await editLeadDTO(payload);
        const result = await updateLead(payload, leadId, tenant);
        return ResponseHandler.successResponse({ message: result?.message, data: result?.data });
    } catch (error: any) {
        logger.error('Error occurred at get signle lead', { error });
        if (error?.message?.includes('No data found')) {
            return ResponseHandler.notFoundResponse({ message: "Lead not found." });
        } else if(error?.message?.includes('Payload Validation Failed')) {
            return ResponseHandler.notFoundResponse({ message: error.message });
        } else if(error?.message?.includes('Tenant is suspended')) {
            return ResponseHandler.badRequestResponse({ message: "Your account is suspended. Kindly ask the admin to reactivate your account!" });
        } else {
            return ResponseHandler.notFoundResponse({ message: error.message });
            // return ResponseHandler.internalServerErrorResponse({ message: "Something went wrong. Please try later!" });
        }
    }
};
