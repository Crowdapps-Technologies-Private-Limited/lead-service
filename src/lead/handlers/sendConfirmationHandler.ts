import { ResponseHandler } from '../../utils/ResponseHandler';
import { sendEmailDTO } from '../validator';
import { sendConfirmationEmail, sendEstimateEmail } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const sendConfirmationHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('sendConfirmationHandler event ', { event });
    try {
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });

        const user = (event.requestContext as any).user;
        logger.info('user:', { user });

        const hasPermission = await checkPermission(user.role, 'Confirmation', 'create', tenant?.schema || tenant?.tenant?.schema);
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        const leadId = event.pathParameters?.id;
      
        logger.info('leadId:', { leadId });
        if ( !leadId) {
            return ResponseHandler.badRequestResponse({
                message: getMessage('LEAD_ID_REQUIRED'),
            });
        }
       
        const result = await sendConfirmationEmail(leadId, tenant, user);

        return ResponseHandler.createdResponse({ message: getMessage('EMAIL_SENT') });
    } catch (error: any) {
        return ResponseHandler.notFoundResponse({ message: error.message });
    }
};
