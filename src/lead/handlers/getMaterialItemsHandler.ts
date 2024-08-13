import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getMaterialItems } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const getMaterialItemsHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getMaterialItemsHandler event ', { event });  
    try {
        const leadId = event?.pathParameters?.id as string;
        const surveyId = event?.pathParameters?.surveyId as string;
        logger.info('Lead ID', { leadId });
        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: `Lead ID is required in path parameters` });
        }
        const tenant = (event.requestContext as any).tenant;

        // Fetch user list
        const result = await getMaterialItems(leadId, tenant);
        return ResponseHandler.successResponse({ message: 'Item list fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
        //return ResponseHandler.badRequestResponse({ message: "Something went wrong. Please try later!" });
    }
};
