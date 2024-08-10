import { ResponseHandler } from '../../utils/ResponseHandler';
import { validateAddSurveyTab3Payload } from '../validator';
import { addSurveyTab3 } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const addSurveyTab3Handler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('addSurveyTab2Handler event ', { event });  
    try {
        let payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const leadId = event.pathParameters?.id as string;
        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Lead ID is required in path parameters' }),
            };
        }
        // Validate payload
        try {
            await validateAddSurveyTab3Payload(payload);
        } catch (error: any) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        }
    
        const result = await addSurveyTab3(leadId, payload, tenant);
        return ResponseHandler.createdResponse({ message: result?.message, data: result?.data});
    } catch (error: any) {
        logger.error('Error occurred handler', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
    }
};
