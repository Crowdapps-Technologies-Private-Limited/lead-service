import { APIGatewayProxyEventBase, APIGatewayProxyResult, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { getSurveyById } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';

export const getSurveyByIdHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('Received event at getSurveyByIdHandler', { event });

    const surveyId = event.pathParameters?.id;
    const tenant = (event.requestContext as any).tenant;
    const user = (event.requestContext as any).user;
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
    if (!surveyId) {
        return ResponseHandler.badRequestResponse({ message: getMessage('SURVEY_ID_REQUIRED') });
    }

    try {
        // Fetch survey by ID
        const survey = await getSurveyById(surveyId, tenant);

        if (!survey) {
            return ResponseHandler.notFoundResponse({ message: `Survey with ID ${surveyId} not found` });
        }

        return ResponseHandler.successResponse({ message: getMessage('SURVEY_FETCHED'), data: survey });
    } catch (error: any) {
        logger.error('Failed to fetch survey by ID', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
