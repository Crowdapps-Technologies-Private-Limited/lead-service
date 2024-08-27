import { adminRoutes } from './lead/index';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { merge } from 'ts-deepmerge';
import { verifyToken } from './utils/verifyToken';
import { Config } from './types/interfaces';
import { getconfigSecrets } from './utils/getConfig';
import { ResponseHandler } from './utils/ResponseHandler';
import { getUserBySub } from './utils/getCognitoUserBySub';
import logger from './utils/logger';
import { getUserProfile } from './utils/getProfileService';
import { getTenantProfile } from './utils/getTenantProfile';

const routes = merge(adminRoutes);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Received event', { event });
    let response: APIGatewayProxyResult;

    const defaultHeaders = {
        'Access-Control-Allow-Origin': '*', // Change this to specific origin if needed
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
    };

    try {
        // Extract the accessToken from headers
        const token = event.headers.Authorization?.split(' ')[1];
        if (!token) {
            return {
                statusCode: 401,
                headers: defaultHeaders,
                body: JSON.stringify({ message: 'Unauthorized' }),
            };
        }
        
        const config: Config = await getconfigSecrets();

        // Validate the token and extract user payload
        const userPoolId = config.cognitoUserPoolId;
        const region = config.region;
        const userPayload = await verifyToken(token, userPoolId, region);
        const user: any = await getUserBySub({ userPoolId: config.cognitoUserPoolId, sub: userPayload.sub });
        logger.info('user:', { user });
        
        if (!user || user.role === 'SUPER_ADMIN') {
            return {
                statusCode: 401,
                headers: defaultHeaders,
                body: JSON.stringify({ message: 'Forbidden' })
            };
        }

        if (user.role === 'TENANT') {
            logger.info(' In if TenantAdmin:', { user });
            const clientDetail= await getTenantProfile(user.tenant_id);
            logger.info('TenantAdminDetail:', { clientDetail });
            if(clientDetail.is_deleted === true){   
                return {
                    statusCode: 401,
                    headers: defaultHeaders,
                    body: JSON.stringify({ message: 'Your account is deleted. Kindly ask the admin to reactivate your account!' })
                };
            }
            if(clientDetail.is_active === false ){   
                return {
                    statusCode: 401,
                    headers: defaultHeaders,
                    body: JSON.stringify({ message: 'Your account is deactvated. Kindly ask the admin to reactivate your account!' })
                };
            }
            if(clientDetail.is_suspended === true){   
                return {
                    statusCode: 401,
                    headers: defaultHeaders,
                    body: JSON.stringify({ message: 'Your account is suspended. Kindly ask the admin to reactivate your account!' })
                };
            }
            // Attach userPayload to the request context
            (event.requestContext as any).user = user;
            (event.requestContext as any).tenant = clientDetail;
            (event.requestContext as any).isTenant = true;
    
        }
        else {
            const clientDetail = await getUserProfile(user.tenant_id, user.sub);
            logger.info('clientStaffDetail:', { clientDetail });
            if(clientDetail.tenant.is_deleted === true){   
                return {
                    statusCode: 401,
                    headers: defaultHeaders,
                    body: JSON.stringify({ message: 'Your account is deleted. Kindly ask the admin to reactivate your account!' })
                };
            }
            if(clientDetail.tenant.is_active === false && clientDetail.tenant.status !== 'PENDING'){   
                return {
                    statusCode: 401,
                    headers: defaultHeaders,
                    body: JSON.stringify({ message: 'Your account is deactvated. Kindly ask the admin to reactivate your account!' })
                };
            }
            if(clientDetail.tenant.is_suspended === true){   
                return {
                    statusCode: 401,
                    headers: defaultHeaders,
                    body: JSON.stringify({ message: 'Your account is suspended. Kindly ask the admin to reactivate your account!' })
                };
            }

            if (clientDetail.status === 'PENDING' && user.email_verified === true) {
                return {
                    statusCode: 401,
                    headers: defaultHeaders,
                    body: JSON.stringify({
                        message: 'Your account is deactvated. Kindly ask the admin to reactivate your account!',
                    }),
                };
            }
            if (clientDetail.status === 'PENDING' && user.email_verified === false) {
                return {
                    statusCode: 401,
                    headers: defaultHeaders,
                    body: JSON.stringify({
                        message: 'please activate your acount',
                    }),
                };
            }

            // Attach userPayload to the request context
            (event.requestContext as any).user = user;
            (event.requestContext as any).tenant = clientDetail;
            (event.requestContext as any).isTenant = false;
        }
        
    } catch (error: any) {
        logger.error('Token not verified', { error });
        return {
            statusCode: 401,
            headers: defaultHeaders,
            body: JSON.stringify({ message: 'Token not verified', details: error.message }),
        };
    }

    try {
        const methodRoutes = routes[event.httpMethod];
        logger.info('method_Routes___:', { methodRoutes });
        if (methodRoutes) {
            logger.info('event.resource', { resource: event.resource });
            const routeHandler = methodRoutes[event.resource];
            if (routeHandler) {
                response = await routeHandler(event);
                response.headers = {
                    ...defaultHeaders,
                    ...response.headers,
                };
            } else {
                logger.error('Invalid request at line 91', { event });
                response = {
                    statusCode: 400,
                    headers: defaultHeaders,
                    body: JSON.stringify({ message: 'Invalid request' }),
                };
            }
        } else {
            logger.error('Invalid request at line 98', { event });
            response = {
                statusCode: 400,
                headers: defaultHeaders,
                body: JSON.stringify({ message: 'Invalid request' }),
            };
        }
    } catch (error: any) {
        logger.error('Error occurred', { error });
        response = {
            statusCode: 500,
            headers: defaultHeaders,
            body: JSON.stringify({ message: 'Internal server error', details: error.message }),
        };
    }

    logger.info('Response', { response });
    return response;
};
