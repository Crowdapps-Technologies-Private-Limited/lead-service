import { ResponseHandler } from '../../utils/ResponseHandler';
import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { getAllSurveys, getOwnSurveys } from '../services';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getAllSurveysHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('Received event at get surveys list', { event });
    const tenant = (event.requestContext as any).tenant;
    const isTenant = (event.requestContext as any).isTenant;
    logger.info('Tenant', { tenant });

    const user = (event.requestContext as any).user;
    logger.info('user:', { user });

    const hasPermission = await checkPermission(
        user.role,
        'Lead:Survey',
        'read',
        tenant?.schema || tenant?.tenant?.schema,
    );
    logger.info('hasPermission: -----------', { hasPermission });
    if (!hasPermission) {
        return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
    }

    try {
        const queryParams = event.queryStringParameters;
        const filterBy = queryParams?.filterBy || 'monthly'; // New search parameter
        const all = queryParams?.all;

        // Fetch surveys list
        if (all) {
            const result = await getAllSurveys(tenant, isTenant, filterBy);
            return ResponseHandler.successResponse({ message: 'Surveys list fetched successfully', data: result });
        } else {
            const result = await getOwnSurveys(tenant, isTenant, filterBy);
            return ResponseHandler.successResponse({ message: 'Surveys list fetched successfully', data: result });
        }
    } catch (error: any) {
        logger.error('Failed to fetch surveys list', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
