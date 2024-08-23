import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllSurveyors } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';

export const getSurveyorListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getSurveyorListHandler event ', { event });  
    try {
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        const hasPermission = await checkPermission(user.role, 'Lead', 'read', tenant?.schema || tenant?.tenant?.schema);
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: 'Permission denied' });
        }
        // Fetch user list
        const result = await getAllSurveyors(tenant);
        return ResponseHandler.successResponse({ message: 'Surveyor list fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
    }
};
