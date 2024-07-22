import { ResponseHandler } from '../../utils/ResponseHandler';
import { getUserProfile } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';

export const getProfile: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('Fetching user profile');
    // Extract user payload from context (if needed)
    const user = (event.requestContext as any).user;
    logger.info('User:', { user });
    try {
        if (!user) {
            return ResponseHandler.unauthorizedResponse({ message: 'User not authenticated' });
        }

        // Fetch user profile
        const userProfile = await getUserProfile(user.sub);

        return ResponseHandler.successResponse({ message: 'User profile fetched successfully', data: userProfile });
    } catch (error: any) {
        logger.error('Error occurred', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
