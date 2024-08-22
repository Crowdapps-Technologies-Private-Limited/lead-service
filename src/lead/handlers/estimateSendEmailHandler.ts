import { ResponseHandler } from '../../utils/ResponseHandler';
import { sendEmailDTO } from '../validator';
import { sendEstimateEmail } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';

export const estimateSendEmailHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('estimateSendEmailHandler event ', { event });
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });

        const user = (event.requestContext as any).user;
        logger.info('user:', { user });

        const hasPermission = await checkPermission(user.role, 'Estimate', 'create', tenant.schema);
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: 'Permission denied' });
        }
        const leadId = event.pathParameters?.id;
        const estimateId = event.pathParameters?.estimateId;
        const action = event.queryStringParameters?.action as string;
        logger.info('action:', { action });
        logger.info('leadId:', { leadId });
        if (!estimateId || !leadId) {
            return ResponseHandler.badRequestResponse({
                message: 'Estimate ID and Lead ID are required in path parameters',
            });
        }
        const array = ["pdf", "email"];
        if (action && !array.includes(action)) {
            logger.error('Invalid action. Please provide valid action (pdf or email)', { action });
            return ResponseHandler.badRequestResponse({
                message: 'Invalid action. Please provide valid action (pdf or email)',
            });
        }
        const result = await sendEstimateEmail(leadId, estimateId, tenant, action);

        return ResponseHandler.createdResponse({ message: result?.message, data: result?.data });
    } catch (error: any) {
        logger.error('Error occurred send lead email handler', { error });
        if (error?.message?.includes('Payload Validation Failed')) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '').trim();
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        } else if (error?.message?.includes('Tenant is suspended')) {
            return ResponseHandler.badRequestResponse({
                message: 'Your account is suspended. Kindly ask the admin to reactivate your account!',
            });
        } else {
            return ResponseHandler.notFoundResponse({ message: error.message });
            //return ResponseHandler.badRequestResponse({ message: "Something went wrong. Please try later!" });
        }
    }
};
