import { ResponseHandler } from '../../utils/ResponseHandler';
import { sendEmailDTO } from '../validator';
import { sendLeadEmail } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';
import { checkLeadCompletion } from '../../utils/checkLeadCompletion';
import { getMessage } from '../../utils/errorMessages';

export const sendEmailHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('sendEmailHandler event ', { event });
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        const leadId = event.pathParameters?.id;
        const user = (event.requestContext as any).user;
        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: 'Lead ID is required' });
        }
        const checkLeadCompionResult = await checkLeadCompletion(leadId, tenant);
        if (checkLeadCompionResult.isCompleted) {
            return ResponseHandler.notFoundResponse({ message: getMessage('LEAD_ALREADY_COMPLETED') });
        }
        const hasPermission = await checkPermission(
            user.role,
            'Email',
            'create',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: 'Permission denied' });
        }
        // Validate payload
        try {
            await sendEmailDTO(payload);
        } catch (error: any) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
            return ResponseHandler.badRequestResponse({ message: cleanedMessage });
        }
        const result = await sendLeadEmail(leadId, payload, tenant);

        return ResponseHandler.createdResponse({ message: result.message });
    } catch (error: any) {
        logger.error('Error occurred send lead email handler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
