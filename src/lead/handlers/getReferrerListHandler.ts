import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllReferrers } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const getReferrerListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getReferrerListHandler event ', { event });  
    try {
        // Fetch referrer list
        const result = await getAllReferrers();
        return ResponseHandler.successResponse({ message: 'Referrer list fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
        // return ResponseHandler.badRequestResponse({ message: "Something went wrong. Please try later!", details: error.errors });
    }
};
