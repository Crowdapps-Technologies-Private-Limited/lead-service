import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { getLatestEstimates } from '../services';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getLatestEstimatesHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getLatestEstimatesHandler event', { event });

    try {
        const leadId = event.pathParameters?.id;

        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: getMessage('LEAD_ID_REQUIRED') }),
            };
        }

        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });

        const user = (event.requestContext as any).user;
        logger.info('user:', { user });

        const hasPermission = await checkPermission(
            user.role,
            'Estimate',
            'read',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        const result = await getLatestEstimates(leadId, tenant);

        if (result) {
            return ResponseHandler.successResponse({ message: getMessage('ESTIMATE_FETCHED'), data: result });
        } else {
            return ResponseHandler.notFoundResponse({ message: getMessage('ESTIMATE_NOT_FOUND') });
        }
    } catch (error: any) {
        logger.error('Error occurred in getLatestEstimatesHandler', { error });
        return ResponseHandler.failureResponse({ message: error.message });
    }
};
