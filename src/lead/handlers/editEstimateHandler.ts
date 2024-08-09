import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { editEstimateDTO } from '../validator';
import { editEstimate } from '../services';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';

export const editEstimateHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('editEstimateHandler event', { event });

    try {
        const payload = JSON.parse(event.body || '{}');
        const estimateId = event.pathParameters?.estimateId;
        const leadId = event.pathParameters?.id;

        if (!estimateId || !leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Estimate ID and Lead ID are required in path parameters' }),
            };
        }

        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        // const user = (event.requestContext as any).user;
        // logger.info('user:', { user });

        // Validate payload
        try {
            await editEstimateDTO(payload);
        } catch (error: any) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        }

        const result = await editEstimate(estimateId, leadId, payload, tenant);
        return ResponseHandler.successResponse({ message: 'Estimate  updated successfully', data: null });
    } catch (error: any) {
        logger.error('Error occurred in editEstimateHandler', { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
