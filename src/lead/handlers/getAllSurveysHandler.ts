import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { getAllSurveys } from '../services';

export const getAllSurveysHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>
): Promise<APIGatewayProxyResult> => {
    logger.info('Received event at get surveys list', { event });
    const tenant = (event.requestContext as any).tenant;
    const isTenant = (event.requestContext as any).isTenant;
    logger.info('Tenant', { tenant });
    try {
        const queryParams = event.queryStringParameters;
        const pageNumber = queryParams?.page ? parseInt(queryParams.page as string) : 1;
        const pageSize = queryParams?.limit ? parseInt(queryParams.limit as string) : 10;
        const orderBy = queryParams?.orderBy as string || 'start_time';
        const orderIn = queryParams?.orderIn as string || 'DESC';
        const search = queryParams?.search || '';  // New search parameter
        const status = queryParams?.status || 'PENDING';  // New search parameter

        // Fetch surveys list
        const result = await getAllSurveys(pageSize, pageNumber, orderBy, orderIn, search,status, tenant, isTenant);

        return ResponseHandler.successResponse({ message: 'Surveys list fetched successfully', data: result });
    } catch (error: any) {
        logger.error('Failed to fetch surveys list', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
