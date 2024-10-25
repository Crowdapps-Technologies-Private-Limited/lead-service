import { ResponseHandler } from '../../utils/ResponseHandler';
import { assignSurveyorDTO } from '../validator';
import { assignSurveyor } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';
import { checkLeadCompletion } from '../../utils/checkLeadCompletion';

export const assignSurveyorHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('assignSurveyorHandler event ', { event });
    try {
        const payload = JSON.parse(event.body || '{}');
        const leadId = event.pathParameters?.id;

        if (!leadId) {
            return ResponseHandler.badRequestResponse({ message: getMessage('LEAD_ID_REQUIRED') });
        }
        const tenant = (event.requestContext as any).tenant;
        const isTenant = (event.requestContext as any).isTenant;

        const user = (event.requestContext as any).user;
        const checkLeadCompionResult = await checkLeadCompletion(leadId as string, tenant);
        if (checkLeadCompionResult.isCompleted) {
            return ResponseHandler.notFoundResponse({ message: getMessage('LEAD_ALREADY_COMPLETED') });
        }
        const hasPermission = await checkPermission(
            user.role,
            'Lead:Surveyor',
            'create',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }

        try {
            await assignSurveyorDTO(payload);
        } catch (error: any) {
            const cleanedMessage = error.message.replace('Payload Validation Failed: ', '');
            return ResponseHandler.notFoundResponse({ message: cleanedMessage });
        }

        const result = await assignSurveyor(leadId, payload, tenant, isTenant, user);

        return ResponseHandler.createdResponse({ message: result?.message });
    } catch (error: any) {
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
