import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllSurveyors } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getSurveyorListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getSurveyorListHandler event ', { event });
    try {
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        const hasPermission = await checkPermission(
            user.role,
            'Lead:Surveyor',
            'read',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        // Fetch user list
        const result = await getAllSurveyors(tenant);
        return ResponseHandler.successResponse({ message: getMessage('SURVEYOR_LIST_FETCHED'), data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
