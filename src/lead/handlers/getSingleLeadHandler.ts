import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getLeadById } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getSingleLeadHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getSingleLeadHandler event ', { event });
    try {
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const user = (event.requestContext as any).user;
        const hasPermission = await checkPermission(
            user.role,
            'Lead',
            'read',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        const leadId = event?.pathParameters?.id as string;
        logger.info('Lead ID', { leadId });
        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: getMessage('LEAD_ID_REQUIRED') });
        }
        const result = await getLeadById(leadId, tenant);
        return ResponseHandler.successResponse({ message: getMessage('LEAD_FETCHED'), data: result?.data });
    } catch (error: any) {
        logger.error('Error occurred at get single lead', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
