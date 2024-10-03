import { APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../../utils/logger';
import { sendFeedbackEmail } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { getMessage } from '../../utils/errorMessages';

export const sendFeedbackEmailHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('sendFeedbackEmailHandler event:', { event });

    try {
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;

        // Get the leadId and action from the path parameters or body
        const leadId = event.pathParameters?.id;

        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: 'Lead ID is required.' });
        }

        // Call the service to send the feedback email
        await sendFeedbackEmail(leadId, tenant, user);

        return ResponseHandler.successResponse({ message: getMessage('FEEDBACK_EMAIL_SENT') });
    } catch (error: any) {
        logger.error('Error in sendFeedbackEmailHandler:', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
