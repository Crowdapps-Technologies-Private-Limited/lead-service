import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { getJobsList } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const jobsListHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('jobsListHandler event', { event });

    try {
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;

        // Check permission
        const hasPermission = await checkPermission(user.role, 'Lead:Job', 'read', tenant.schema);
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }

        const jobs = await getJobsList(tenant);
        return ResponseHandler.successResponse({
            message: 'Job list fetched successfully',
            data: jobs,
        });
    } catch (error: any) {
        logger.error('Error in jobsListHandler:', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
