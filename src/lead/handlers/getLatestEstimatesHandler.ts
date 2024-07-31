import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { getLatestEstimates } from '../services';
import logger from '../../utils/logger';

export const getLatestEstimatesHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>
): Promise<APIGatewayProxyResult> => {
    logger.info('getLatestEstimatesHandler event', { event });
    
    try {
        const leadId = event.pathParameters?.id;

        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Lead ID is required in path parameters' })
            };
        }

        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });

        const result = await getLatestEstimates(leadId, tenant);

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error: any) {
        logger.error('Error occurred in getLatestEstimatesHandler', { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
};
