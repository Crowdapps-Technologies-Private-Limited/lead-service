import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { getLatestQuote } from '../services';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { generatePdfAndUploadToS3 } from '../services/generatePdf';
import { checkPermission } from '../../utils/checkPermission';

export const getLatestQuotesHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getLatestQuotesHandler event', { event });

    try {
        const leadId = event.pathParameters?.id;

        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Lead ID is required in path parameters' }),
            };
        }

        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const user = (event.requestContext as any).user;
        logger.info('user:', { user });

        const hasPermission = await checkPermission(user.role, 'Quotation', 'read', tenant?.schema || tenant?.tenant?.schema);
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: 'Permission denied' });
        }
        const result = await getLatestQuote(leadId, tenant);
        // const url = await generatePdfAndUploadToS3({ html: '<p>Hello, World</p>', key: 'test.pdf' });
        if (result) {
            return ResponseHandler.successResponse({ message: 'Quote fetched successfully', data: result });
        } else {
            return ResponseHandler.notFoundResponse({ message: 'No quote found' });
        }
    } catch (error: any) {
        logger.error('Error occurred in getLatestEstimatesHandler', { error });
        return ResponseHandler.failureResponse({ message: error.message });
    }
};
