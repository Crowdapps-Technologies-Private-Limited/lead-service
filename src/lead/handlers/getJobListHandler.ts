import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { getJobsList } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';

export const jobsListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>
): Promise<APIGatewayProxyResult> => {
    logger.info('jobsListHandler event', { event });

    try {
        const tenant = (event.requestContext as any).tenant;
        logger.info('Tenant:', { tenant });

        const jobs = await getJobsList(tenant);
        return ResponseHandler.successResponse({
            message: 'Job list fetched successfully',
            data: jobs
        });

    } catch (error: any) {
        logger.error('Error in jobsListHandler:', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
