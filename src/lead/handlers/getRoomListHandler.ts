import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllRooms } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const getRoomListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getRoomListHandler event ', { event });  
    try {
        const tenant = (event.requestContext as any).tenant;

        // Fetch list
        const result = await getAllRooms(tenant);
        return ResponseHandler.successResponse({ message: 'Room list fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
    }
};
