import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getLeadById } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const getSingleLeadHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getSingleLeadHandler event ', { event });  
    try {
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const leadId = event?.pathParameters?.id as string;
        logger.info('Lead ID', { leadId });
        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: `Lead ID not provided` });
        }
        const result = await getLeadById(leadId, tenant);
        return ResponseHandler.successResponse({ message: result?.message, data: result?.data });
    } catch (error: any) {
        logger.error('Error occurred at get signle lead', { error });
        if (error?.message?.includes('No data found')) {
            return ResponseHandler.notFoundResponse({ message: "Lead not found." });
        } else {
            return ResponseHandler.notFoundResponse({ message: error.message });
            // return ResponseHandler.internalServerErrorResponse({ message: "Something went wrong. Please try later!" });
        }
    }
};
