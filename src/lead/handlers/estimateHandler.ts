import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { addEstimateDTO } from '../validator';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { addOrUpdateEstimate } from '../services';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';
import { get } from 'http';

export const addEstimateHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('addEstimateHandler event', { event });

    try {
        const payload = JSON.parse(event.body || '{}');
        const leadId = event.pathParameters?.id;
        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Lead ID is required in path parameters' }),
            };
        }
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        const hasPermission = await checkPermission(
            user.role,
            'Lead:Estimate',
            'update',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        // Validate payload
        try {
            await addEstimateDTO(payload);
        } catch (error: any) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        }
        const result = await addOrUpdateEstimate(leadId, payload, tenant);

        if (payload?.estimateId) {
            return ResponseHandler.successResponse({ message: getMessage('ESTIMATE_UPDATED') });
        } else {
            return ResponseHandler.createdResponse({ message: getMessage('ESTIMATE_ADDED') });
        }
    } catch (error: any) {
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
