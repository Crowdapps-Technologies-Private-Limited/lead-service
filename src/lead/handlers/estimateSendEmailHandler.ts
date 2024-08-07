import { ResponseHandler } from '../../utils/ResponseHandler';
import { sendEmailDTO } from '../validator';
import { sendEstimateEmail } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const estimateSendEmailHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('estimateSendEmailHandler event ', { event });
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        logger.info('tenant:', { tenant });
        const leadId = event.pathParameters?.id;
        const estimateId = event.pathParameters?.estimateId;
        logger.info('leadId:', { leadId });
        if (!estimateId || !leadId) {
            return ResponseHandler.badRequestResponse({
                message: 'Estimate ID and Lead ID are required in path parameters',
            });
        }
        const result = await sendEstimateEmail(leadId, estimateId, tenant);

        return ResponseHandler.createdResponse({ message: result.message });
    } catch (error: any) {
        logger.error('Error occurred send lead email handler', { error });
        if (error?.message?.includes('Payload Validation Failed')) {
            return ResponseHandler.notFoundResponse({ message: error.message });
        } else if (error?.message?.includes('Tenant is suspended')) {
            return ResponseHandler.badRequestResponse({
                message: 'Your account is suspended. Kindly ask the admin to reactivate your account!',
            });
        } else {
            return ResponseHandler.notFoundResponse({ message: error.message });
            //return ResponseHandler.badRequestResponse({ message: "Something went wrong. Please try later!" });
        }
    }
};
