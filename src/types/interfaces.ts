import { APIGatewayProxyEvent, APIGatewayProxyEventBase, APIGatewayProxyResult } from 'aws-lambda';

export type RouteHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export interface MethodRoutes {
    [path: string]: RouteHandler;
}

export interface Routes {
    GET?: MethodRoutes;
    POST?: MethodRoutes;
    PUT?: MethodRoutes;
    DELETE?: MethodRoutes;
    [method: string]: MethodRoutes | undefined; // Allow for other HTTP methods
}

export interface Config {
    host: string;
    user: string;
    password: string;
    database: string;
    port: string;
    cognitoAppClientId: string;
    cognitoUserPoolId: string;
    region: string;
    postmarkApiKey: string;
    emailSenderAddress: string;
    s3BucketName: string;
}

export interface UserPayload {
    username: string;
    email: string;
    password: string;
    role: string;
    tenantId?: number | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    photo?: string | null;
    socialNumber?: string | null;
    status?: string | null;
}

export interface UserAttributes {
    [key: string]: string;
}

export interface InputUser {
    Username: string;
    Attributes: { Name: string; Value: string }[];
    UserCreateDate: Date;
    UserLastModifiedDate: Date;
    Enabled: boolean;
    UserStatus: string;
}

export interface OutputUser {
    Enabled: boolean;
    UserStatus: string;
    email: string;
    email_verified: string;
    name: string;
    'custom:role': string;
    sub: string;
}
