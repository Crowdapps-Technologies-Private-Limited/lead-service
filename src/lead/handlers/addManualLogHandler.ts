import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { addManualLogAndChangeLeadStatus } from '../services';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';
import { validateAddManualLogPayload } from '../validator';

export const addManualLogHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        const leadId = event.pathParameters?.id;
        logger.info('leadId:', { leadId });

        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: getMessage('LEAD_ID_REQUIRED') }),
            };
        }

        // Ensure user has permission to add a manual log
        const hasPermission = await checkPermission(user.role, 'Log', 'create', tenant.schema);
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }

        logger.info('Manual log payload:', { payload });

        // Validate payload
        try {
            await validateAddManualLogPayload(payload);
        } catch (validationError: any) {
            return ResponseHandler.badRequestResponse({ message: validationError.message });
        }
        logger.info('Manual log validated payload:', { payload });
        // Call service to add manual log entry
        logger.info('Manual log entry started:');
        const logEntry = await addManualLogAndChangeLeadStatus(payload, leadId, tenant, user);
        logger.info('Manual log entry completed:', { logEntry });
        return ResponseHandler.successResponse({
            message: getMessage('LOG_ENTRY_ADDED'),
            data: logEntry,
        });
    } catch (error: any) {
        logger.error('Error in addManualLogHandler:', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
