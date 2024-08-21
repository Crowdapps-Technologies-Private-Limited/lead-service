import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { addEstimateDTO } from '../validator';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { addOrUpdateEstimate } from '../services';

export const addEstimateHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>
): Promise<APIGatewayProxyResult> => {
    logger.info('addEstimateHandler event', { event });
    
    try {
        const payload = JSON.parse(event.body || '{}');
        logger.info('payload:', { payload });
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
        try {
            const result = await addOrUpdateEstimate(leadId, payload, tenant);
            logger.info('addEstimate success:', { result });
            if(payload?.estimateId){
                return ResponseHandler.successResponse({ message: 'Estimate updated successfully' });
            }
            else {
            return ResponseHandler.createdResponse({ message: 'Estimate added successfully' });
        }
        }
        catch (error: any) {
            logger.info('addEstimate error:', { error });
            return ResponseHandler.internalServerErrorResponse({ message: error.message });

        }
      
    } catch (error: any) {
        logger.error('Error occurred in addEstimateHandler', { error });
        if(error?.message?.includes('Payload Validation Failed')) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '').trim();
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        } else {
            return ResponseHandler.badRequestResponse({ message: error.message });
        }
    }
};
