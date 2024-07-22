import { APIGatewayProxyResult } from 'aws-lambda';

export class ResponseHandler {
  static successResponse(payload: { message: string; data?: any }, statusCode = 200): APIGatewayProxyResult {
    const data = {
      success: true,
      statusCode,
      message: payload.message,
      data: payload.data,
    };

    return {
      statusCode,
      isBase64Encoded: false,
      body: JSON.stringify(data),
    };
  }

  static failureResponse(payload: { message: string; details?: any }, statusCode = 400): APIGatewayProxyResult {
    const data = {
      success: false,
      statusCode,
      message: payload.message,
      details: payload.details,
    };

    return {
      statusCode,
      isBase64Encoded: false,
      body: JSON.stringify(data),
    };
  }

  static createdResponse(payload: { message: string; data?: any }): APIGatewayProxyResult {
    return this.successResponse(payload, 201);
  }

  static acceptedResponse(payload: { message: string; data?: any }): APIGatewayProxyResult {
    return this.successResponse(payload, 202);
  }

  static noContentResponse(): APIGatewayProxyResult {
    return {
      statusCode: 204,
      isBase64Encoded: false,
      body: '', // Return an empty string instead of null
    };
  }

  static badRequestResponse(payload: { message: string; details?: any }): APIGatewayProxyResult {
    return this.failureResponse(payload, 400);
  }

  static unauthorizedResponse(payload: { message: string; details?: any }): APIGatewayProxyResult {
    return this.failureResponse(payload, 401);
  }

  static forbiddenResponse(payload: { message: string; details?: any }): APIGatewayProxyResult {
    return this.failureResponse(payload, 403);
  }

  static notFoundResponse(payload: { message: string; details?: any }): APIGatewayProxyResult {
    return this.failureResponse(payload, 404);
  }

  static conflictResponse(payload: { message: string; details?: any }): APIGatewayProxyResult {
    return this.failureResponse(payload, 409);
  }

  static internalServerErrorResponse(payload: { message: string; details?: any }): APIGatewayProxyResult {
    return this.failureResponse(payload, 500);
  }

  static notImplementedResponse(payload: { message: string; details?: any }): APIGatewayProxyResult {
    return this.failureResponse(payload, 501);
  }

  static serviceUnavailableResponse(payload: { message: string; details?: any }): APIGatewayProxyResult {
    return this.failureResponse(payload, 503);
  }
}
