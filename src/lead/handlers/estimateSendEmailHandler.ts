import { ResponseHandler } from '../../utils/ResponseHandler';
import { sendEmailDTO } from '../validator';
import { sendEstimateEmail } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';
import { get } from 'http';

export const estimateSendEmailHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('estimateSendEmailHandler event ', { event });
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;

        const user = (event.requestContext as any).user;

        const hasPermission = await checkPermission(
            user.role,
            'Lead:Estimate',
            'create',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        const leadId = event.pathParameters?.id;
        const estimateId = event.pathParameters?.estimateId;
        const action = event.queryStringParameters?.action as string;

        if (!estimateId || !leadId) {
            return ResponseHandler.badRequestResponse({
                message: getMessage('ESTIMATE_ID_LEAD_ID_REQUIRED'),
            });
        }
        const array = ['pdf', 'email'];
        if (action && !array.includes(action)) {
            return ResponseHandler.badRequestResponse({
                message: 'Invalid action. Please provide valid action (pdf or email)',
            });
        }
        const result = await sendEstimateEmail(leadId, estimateId, tenant, action);

        return ResponseHandler.createdResponse({ message: result?.message, data: result?.data });
    } catch (error: any) {
        return ResponseHandler.notFoundResponse({ message: error.message });
    }
};
