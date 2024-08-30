import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { addQuoteDTO } from '../validator';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { addOrUpdateQuote } from '../services';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const addQuoteHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>
): Promise<APIGatewayProxyResult> => {
    logger.info('addQuoteHandler event', { event });
    
    try {
        const payload = JSON.parse(event.body || '{}');
        logger.info('payload:', { payload });
        const leadId = event.pathParameters?.id;
        logger.info('leadId:', { leadId });
        
        if (!leadId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: getMessage('LEAD_ID_REQUIRED') }),
            };
        }

        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const user = (event.requestContext as any).user;
        logger.info('user:', { user });
        
        const hasPermission = await checkPermission(
            user.role, 'Quotation', 
            'create', tenant?.schema || tenant?.tenant?.schema
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
        logger.info('addQuoteDTO success:');
        const result = await addOrUpdateQuote(leadId, payload, tenant);
        logger.info('add or edit quote success:', { result });
        if(payload?.quoteId){
            return ResponseHandler.successResponse({ message: getMessage('QUOTE_UPDATED') });
        }
        else {
            return ResponseHandler.createdResponse({ message: getMessage('QUOTE_ADDED') });
        }
      
    } catch (error: any) {
        logger.error('Error occurred in addQuoteHandler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
