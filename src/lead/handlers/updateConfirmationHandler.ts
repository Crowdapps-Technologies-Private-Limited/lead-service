import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { updateConfirmationByClient, updateConfirmationTooltipDetails } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';
import { updateConfirmationDTO, updateConfirmationTooltipDTO } from '../validator';

export const updateConfirmationHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('Received event at updateConfirmationHandler', { event });
    const payload = JSON.parse(event.body || '{}');
    const leadId = event.pathParameters?.id;
    const tenant = (event.requestContext as any).tenant;
    const user = (event.requestContext as any).user;
    const hasPermission = await checkPermission(
        user.role,
        'Confirmation',
        'update',
        tenant?.schema || tenant?.tenant?.schema,
    );
    logger.info('hasPermission: -----------', { hasPermission });
    if (!hasPermission) {
        return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
    }
    if (!leadId) {
        return ResponseHandler.badRequestResponse({ message: getMessage('LEAD_ID_REQUIRED') });
    }
    // Validate payload
    try {
        await updateConfirmationDTO(payload);
    } catch (error: any) {
        const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
        return ResponseHandler.notFoundResponse({ message: cleanedMessage });
    }

    try {
        // Update data
        await updateConfirmationByClient(leadId, payload, tenant, user);
        return ResponseHandler.successResponse({ message: getMessage('CONFIRMATION_UPDATED') });
    } catch (error: any) {
        logger.error('Failed to update confirmation', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
