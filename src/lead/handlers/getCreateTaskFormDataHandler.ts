import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { getCreateTaskFormData } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getCreateTaskFormDataHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('Received event at getCreateTaskFormDataHandler', { event });
    const leadId = event.pathParameters?.id;
    const tenant = (event.requestContext as any).tenant;
    const user = (event.requestContext as any).user;
    const hasPermission = await checkPermission(
        user.role,
        'Job',
        'read',
        tenant?.schema || tenant?.tenant?.schema,
    );
    logger.info('hasPermission: -----------', { hasPermission });
    if (!hasPermission) {
        return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
    }
    if (!leadId) {
        return ResponseHandler.badRequestResponse({ message: getMessage('LEAD_ID_REQUIRED') });
    }
  
    try {
        // Update data
        const result = await getCreateTaskFormData(leadId, tenant, user);
        return ResponseHandler.successResponse({ message: "data fetched successfully", data: result });
    } catch (error: any) {
        logger.error('Failed to update confirmation', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
