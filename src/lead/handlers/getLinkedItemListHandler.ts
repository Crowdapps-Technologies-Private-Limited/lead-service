import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllLinkedItems } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const getLinkedItemListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getLinkedItemListHandler event ', { event });  
    try {
        const tenant = (event.requestContext as any).tenant;

        // Fetch list
        const result = await getAllLinkedItems(tenant);
        return ResponseHandler.successResponse({ message: 'Linked item list fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
    }
};
