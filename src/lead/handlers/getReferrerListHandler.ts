import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllReferrers } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { getMessage } from '../../utils/errorMessages';

export const getReferrerListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getReferrerListHandler event ', { event });  
    try {
        // Fetch referrer list
        const result = await getAllReferrers();
        return ResponseHandler.successResponse({ message: getMessage('REFERRER_LIST_FETCHED'), data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
    }
};
