import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllLogsByLead } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getLogListByLeadHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getLogListByLeadHandler event ', { event });
    try {
        const leadId = event?.pathParameters?.id as string;
        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: getMessage('LEAD_ID_REQUIRED') });
        }
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        const hasPermission = await checkPermission(
            user.role,
            'Lead:Log',
            'read',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        const queryParams = event.queryStringParameters;
        const pageNumber = queryParams?.page ? parseInt(queryParams?.page as string) : 1;
        const pageSize = queryParams?.limit ? parseInt(queryParams?.limit as string) : 10;
        const orderBy = (queryParams?.orderBy as string) || 'created_at';
        const orderIn = (queryParams?.orderIn as string) || 'DESC';

        // Fetch user list
        const result = await getAllLogsByLead(pageSize, pageNumber, orderBy, orderIn, tenant, leadId);
        return ResponseHandler.successResponse({ message: getMessage('LEAD_LOG_LIST_FETCHED'), data: result });
    } catch (error: any) {
        logger.error('Error occurred at handler', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
    }
};
