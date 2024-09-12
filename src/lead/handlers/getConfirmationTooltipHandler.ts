import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { getConfirmationTooltipDetails, getSurveyById } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getConfirmationTooltipHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>
): Promise<APIGatewayProxyResult> => {
    logger.info('Received event at getConfirmationTooltipHandler', { event });

    const leadId = event.pathParameters?.id;
    const tenant = (event.requestContext as any).tenant;
    const user = (event.requestContext as any).user;
    const hasPermission = await checkPermission(user.role, 'Confirmation', 'read', tenant?.schema || tenant?.tenant?.schema);
    logger.info('hasPermission: -----------', { hasPermission });
    if (!hasPermission) {
        return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
    }
    if (!leadId) {
        return ResponseHandler.badRequestResponse({ message: getMessage('LEAD_ID_REQUIRED') });
    }

    try {
        // Fetch data
        const result = await getConfirmationTooltipDetails(leadId, tenant);

        return ResponseHandler.successResponse({ message: getMessage('CONFIRMATION_TOOLTIP_FETCHED'), data: result });
    } catch (error: any) {
        logger.error('Failed to fetch confirmation tooltip data at handler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
