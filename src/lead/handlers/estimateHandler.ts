import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { addEstimateDTO } from '../validator';
import { addEstimate } from '../services';
import logger from '../../utils/logger';

export const addEstimateHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>
): Promise<APIGatewayProxyResult> => {
    logger.info('addEstimateHandler event', { event });
    
    try {
        const payload = JSON.parse(event.body || '{}');
        const leadId = event.pathParameters?.id;
        logger.info('leadId:', { leadId });
        
        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Lead ID is required in path parameters' })
            };
        }

        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const user = (event.requestContext as any).user;
        logger.info('user:', { user });

        // Validate payload
        await addEstimateDTO(payload);
logger.info('addEstimateDTO success:');
        const result = await addEstimate(leadId, payload, tenant);

        return {
            statusCode: 201,
            body: JSON.stringify(result)
        };
    } catch (error: any) {
        logger.error('Error occurred in addEstimateHandler', { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
};
