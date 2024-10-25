import { checkLeadCompletion } from './../../utils/checkLeadCompletion';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { editLead } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { validateEditLeadDTO } from '../validator';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const editLeadHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('editLeadHandler event ', { event });
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        logger.info('user:', { user });
        const leadId = event.pathParameters?.id;
        logger.info('leadId:', { leadId });

        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: getMessage('LEAD_ID_REQUIRED') });
        }
        const checkLeadCompionResult = await checkLeadCompletion(leadId, tenant);
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

        // Validate payload
        try {
            await validateEditLeadDTO(payload);
        } catch (error: any) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        }

        const result = await editLead(leadId, payload, tenant);

        return ResponseHandler.successResponse({ message: result?.message });
    } catch (error: any) {
        logger.error('Error occurred in edit lead handler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
