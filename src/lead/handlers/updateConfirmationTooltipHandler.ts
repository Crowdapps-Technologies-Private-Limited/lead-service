import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { updateConfirmationTooltipDetails } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const updateConfirmationTooltipHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('Received event at updateConfirmationTooltipHandler', { event });
    const payload = JSON.parse(event.body || '{}');
    const leadId = event.pathParameters?.id;
    // const confirmationId = event.queryStringParameters?.confirmationId;
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
    // if (!confirmationId) {
    //     return ResponseHandler.badRequestResponse({ message: getMessage('CONFIRMATION_ID_REQUIRED') });
    // }

    try {
        // Update data
        await updateConfirmationTooltipDetails(leadId, tenant);
        return ResponseHandler.successResponse({ message: getMessage('CONFIRMATION_TOOLTIP_UPDATED') });
    } catch (error: any) {
        logger.error('Failed to update confirmation tooltip data at handler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
