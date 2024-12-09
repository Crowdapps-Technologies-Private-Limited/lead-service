import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { updateConfirmationTooltipDetails } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';
import { checkLeadCompletion } from '../../utils/checkLeadCompletion';

export const updateConfirmationTooltipHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('Received event at updateConfirmationTooltipHandler', { event });

    const leadId = event.pathParameters?.id;
    // const confirmationId = event.queryStringParameters?.confirmationId;
    const tenant = (event.requestContext as any).tenant;
    const user = (event.requestContext as any).user;
    const checkLeadCompionResult = await checkLeadCompletion(leadId as string, tenant);
    if (checkLeadCompionResult.isCompleted) {
        return ResponseHandler.notFoundResponse({ message: getMessage('LEAD_ALREADY_COMPLETED') });
    }
    const hasPermission = await checkPermission(
        user.role,
        'Lead:Confirmation',
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

    try {
        // Update data
        await updateConfirmationTooltipDetails(leadId, tenant);
        return ResponseHandler.successResponse({ message: getMessage('CONFIRMATION_TOOLTIP_UPDATED') });
    } catch (error: any) {
        logger.error('Failed to update confirmation tooltip data at handler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
