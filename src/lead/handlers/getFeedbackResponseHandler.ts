import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { ResponseHandler } from '../../utils/ResponseHandler';

import { getMessage } from '../../utils/errorMessages';
import { getFeedbackResponseByLead } from '../services';
import { checkPermission } from '../../utils/checkPermission';

// Handler to fetch feedback responses by lead_id
export const getFeedbackResponseHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getFeedbackResponseByLeadHandler event:', { event });

    try {
        const lead_id = event.pathParameters?.lead_id;
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;

        if (!lead_id) {
            return ResponseHandler.badRequestResponse({ message: 'Lead ID is required.' });
        }

        // Check permission
        const hasPermission = await checkPermission(user.role, 'Feedback', 'read', tenant.schema);
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }

        // Call the service to get feedback responses
        const responses = await getFeedbackResponseByLead(lead_id, tenant);
        return ResponseHandler.successResponse({ message: getMessage('RESPONSES_FETCHED'), data: responses });
    } catch (error: any) {
        logger.error('Error in getFeedbackResponseByLeadHandler:', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
