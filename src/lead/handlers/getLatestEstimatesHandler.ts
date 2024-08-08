import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { getLatestEstimates } from '../services';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { generatePdfAndUploadToS3 } from '../services/generatePdf';

export const getLatestEstimatesHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getLatestEstimatesHandler event', { event });

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

        const result = await getLatestEstimates(leadId, tenant);
        // const url = await generatePdfAndUploadToS3({ html: '<p>Hello, World</p>', key: 'test.pdf' });
        return ResponseHandler.successResponse({ message: 'Estimate fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Error occurred in getLatestEstimatesHandler', { error });
        return ResponseHandler.failureResponse({ message: error.message });
    }
};
