import { ResponseHandler } from '../../utils/ResponseHandler';
import { generateUploadURL, getUserProfile } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const getUploadKeyHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getUploadKeyHandler', { event });
    // Extract user payload from context (if needed)
    const user = (event.requestContext as any).user;
    logger.info('User:', { user });
    try {
        if (!user) {
            return ResponseHandler.unauthorizedResponse({ message: 'User not authenticated' });
        }
        const { fileName, fileType } = event.queryStringParameters || {};

        if (!fileName || !fileType) {
            logger.warn('Missing filename or fileType');
            return ResponseHandler.badRequestResponse({ message: 'Filename and fileType are required' });
        }
        // Fetch user profile
        const awsKey = await generateUploadURL(fileName, fileType);
        return ResponseHandler.successResponse({ message: 'upload key generated successfully', data: awsKey });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
