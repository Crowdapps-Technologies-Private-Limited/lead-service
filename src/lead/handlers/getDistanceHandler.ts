import { ResponseHandler } from '../../utils/ResponseHandler';
import { getDistanceDTO } from '../validator';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { getDistanceBetweenPostcodes } from '../../utils/googlemap';
import { getMessage } from '../../utils/errorMessages';

export const getDistanceHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getDistanceHandler event', { event });

    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        logger.info('tenant:', { tenant });
        logger.info('user:', { user });

        // Validate payload
        await getDistanceDTO(payload);
        const { postcode1, postcode2 } = payload;

        // Calculate distance
        const distance = await getDistanceBetweenPostcodes(postcode1, postcode2);

        if (distance !== null) {
            logger.info(`Distance between ${postcode1} and ${postcode2} is ${distance.toFixed(2)} miles`);
            return ResponseHandler.createdResponse({
                message: getMessage('DISTANCE_CALCULATED'),
                data: { distance: distance.toFixed(2) },
            });
        } else {
            throw new Error(getMessage('DISTANCE_CALCULATION_FAILED'));
        }
    } catch (error: any) {
        logger.error('Error occurred in getDistanceHandler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
