import { APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { getMessage } from '../../utils/errorMessages';
import { changeLeadStatusService } from '../services';
import { checkPermission } from '../../utils/checkPermission';
import { checkLeadCompletion } from '../../utils/checkLeadCompletion';

export const changeLeadStatusHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('changeLeadStatusHandler event:', { event });

    try {
        const payload = JSON.parse(event.body || '{}');
        const { lead_id, new_status } = payload;
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        const checkLeadCompionResult = await checkLeadCompletion(lead_id as string, tenant);
        if (checkLeadCompionResult.isCompleted) {
            return ResponseHandler.notFoundResponse({ message: getMessage('LEAD_ALREADY_COMPLETED') });
        }
        const hasPermission = await checkPermission(
            user.role,
            'Lead',
            'update',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }

        // Validate the input
        if (!lead_id || !new_status) {
            return ResponseHandler.badRequestResponse({ message: 'Missing required fields: lead_id or new_status' });
        }
        ['COMPLETED', 'JOB'].includes(new_status) ||
            ResponseHandler.badRequestResponse({
                message: 'Invalid status. Please provide one of the following: COMPLETED, JOB',
            });

        // Call the service to change lead status
        const result = await changeLeadStatusService(lead_id, new_status, tenant, user);

        return ResponseHandler.successResponse({ message: getMessage('LEAD_STATUS_UPDATED'), data: result });
    } catch (error: any) {
        logger.error('Error in changeLeadStatusHandler:', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
