import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { downloadSecondLatestQuote } from '../services';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getSecondLatestQuotesHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getSecondLatestQuotesHandler event', { event });

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
            'Lead:Quotation',
            'read',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        const result = await downloadSecondLatestQuote(leadId, tenant);
        if (result) {
            return ResponseHandler.successResponse({ message: result?.message, data: result?.data });
        } else {
            return ResponseHandler.notFoundResponse({ message: getMessage('QUOTE_NOT_FOUND') });
        }
    } catch (error: any) {
        logger.error('Error occurred in getLatestEstimatesHandler', { error });
        return ResponseHandler.failureResponse({ message: error.message });
    }
};
