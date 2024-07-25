import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllLogsByLead } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const getLogListByLeadHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getLogListByLeadHandler event ', { event });  
    try {
        const leadId = event?.pathParameters?.id as string;
        logger.info('Lead ID', { leadId });
        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: `Lead ID not provided` });
        }
        const tenant = (event.requestContext as any).tenant;
        const queryParams = event.queryStringParameters;
        const pageNumber = queryParams?.page ? parseInt(queryParams?.page as string) : 1;
        const pageSize = queryParams?.limit ? parseInt(queryParams?.limit as string) : 10;
        const orderBy = queryParams?.orderBy as string || 'created_at';
        const orderIn = queryParams?.orderIn as string || 'DESC';

        // Fetch user list
        const result = await getAllLogsByLead(pageSize, pageNumber, orderBy, orderIn, tenant, leadId);
        return ResponseHandler.successResponse({ message: 'Log list fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.notFoundResponse({ message: error.message });
        //return ResponseHandler.badRequestResponse({ message: "Something went wrong. Please try later!" });
    }
};
