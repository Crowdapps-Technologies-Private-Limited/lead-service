import { ResponseHandler } from '../../utils/ResponseHandler';
import { getConfirmation } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getConfirmationHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getCustomerConfirmationHandler event ', { event });
    try {
        const leadId = event.pathParameters?.id;

        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: getMessage('LEAD_ID_REQUIRED') }),
            };
        }
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;

        const hasPermission = await checkPermission(
            user.role,
            'Lead:Confirmation',
            'read',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        const result = await getConfirmation(tenant, leadId);
        return ResponseHandler.createdResponse({ message: getMessage('INFO_FETCHED'), data: result });
    } catch (error: any) {
        logger.error('Error occurred get Customer Confirmation Handler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
