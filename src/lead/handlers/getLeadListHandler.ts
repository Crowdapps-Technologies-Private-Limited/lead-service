import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { getAllLeads } from '../services';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const getLeadListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getLeadListHandler event ', { event });  
    try {
        const user = (event.requestContext as any).user;
        const queryParams = event.queryStringParameters;
        const pageNumber = queryParams?.page ? parseInt(queryParams?.page as string) : 1;
        const pageSize = queryParams?.limit ? parseInt(queryParams?.limit as string) : 10;
        const orderBy = queryParams?.orderBy as string || 'created_at';
        const orderIn = queryParams?.orderIn as string || 'DESC';
        const search = queryParams?.search || '';  // New search parameter

        // Fetch user list
        const result = await getAllLeads(pageSize, pageNumber, orderBy, orderIn, search, user);
        return ResponseHandler.successResponse({ message: 'Lead list fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.badRequestResponse({ message: "Something went wrong. Please try later!" });
    }
};
