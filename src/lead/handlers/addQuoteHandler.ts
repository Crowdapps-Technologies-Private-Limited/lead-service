import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { addQuoteDTO } from '../validator';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { addOrUpdateQuote } from '../services';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';
import { checkLeadCompletion } from '../../utils/checkLeadCompletion';

export const addQuoteHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('addQuoteHandler event', { event });

    try {
        const payload = JSON.parse(event.body || '{}');
        const leadId = event.pathParameters?.id;

        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: getMessage('LEAD_ID_REQUIRED') }),
            };
        }

        const tenant = (event.requestContext as any).tenant;

        const user = (event.requestContext as any).user;
        const checkLeadCompionResult = await checkLeadCompletion(leadId as string, tenant);
        if (checkLeadCompionResult.isCompleted) {
            return ResponseHandler.notFoundResponse({ message: getMessage('LEAD_ALREADY_COMPLETED') });
        }
        const hasPermission = await checkPermission(
            user.role,
            'Lead:Quotation',
            'create',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        // Validate payload
        try {
            await addQuoteDTO(payload);
        } catch (error: any) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
            return ResponseHandler.badRequestResponse({ message: cleanedMessage });
        }

        await addOrUpdateQuote(leadId, payload, tenant);

        if (payload?.quoteId) {
            return ResponseHandler.successResponse({ message: getMessage('QUOTE_UPDATED') });
        } else {
            return ResponseHandler.createdResponse({ message: getMessage('QUOTE_ADDED') });
        }
    } catch (error: any) {
        logger.error('Error occurred in addQuoteHandler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
