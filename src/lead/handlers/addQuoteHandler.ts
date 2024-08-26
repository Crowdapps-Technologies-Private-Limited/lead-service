import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import { addQuoteDTO } from '../validator';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { addOrUpdateQuote } from '../services';
import { checkPermission } from '../../utils/checkPermission';

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
                body: JSON.stringify({ message: 'Lead ID is required in path parameters' })
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
            return ResponseHandler.forbiddenResponse({ message: 'Permission denied' });
        }
        // Validate payload
        await addQuoteDTO(payload);
        logger.info('addQuoteDTO success:');
        try {
            const result = await addOrUpdateQuote(leadId, payload, tenant);
            logger.info('add or edit quote success:', { result });
            if(payload?.quoteId){
                return ResponseHandler.successResponse({ message: 'Quote updated successfully' });
            }
            else {
            return ResponseHandler.createdResponse({ message: 'Quote added successfully' });
        }
        }
        catch (error: any) {
            logger.info('addQuote error:', { error });
            return ResponseHandler.internalServerErrorResponse({ message: error.message });

        }
      
    } catch (error: any) {
        logger.error('Error occurred in addQuoteHandler', { error });
        if(error?.message?.includes('Payload Validation Failed')) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '').trim();
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        } else {
            return ResponseHandler.badRequestResponse({ message: error.message });
        }
    }
};
