import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllLeads } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';

export const getLeadListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getLeadListHandler event ', { event });  
    try {
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        const hasPermission = await checkPermission(user.role, 'Lead', 'read', tenant?.schema || tenant?.tenant?.schema);
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: 'Permission denied' });
        }
        const queryParams = event.queryStringParameters;
        const pageNumber = queryParams?.page ? parseInt(queryParams?.page as string) : 1;
        const pageSize = queryParams?.limit ? parseInt(queryParams?.limit as string) : 10;
        const orderBy = queryParams?.orderBy as string || 'created_at';
        const orderIn = queryParams?.orderIn as string || 'DESC';
        const search = queryParams?.search || '';  // New search parameter

        // Fetch user list
        const result = await getAllLeads(pageSize, pageNumber, orderBy, orderIn, search, tenant);
        return ResponseHandler.successResponse({ message: 'Lead list fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
    }
};
