declare module 'aws-lambda-multipart-parser' {
    import { APIGatewayProxyEvent } from 'aws-lambda';
  
    export interface File {
      filename: string;
      content: Buffer;
      contentType: string;
      mimetype: string;
      filepath: string;
    }
  
    export interface ParsedData {
      [key: string]: string | File | null;
    }
  
    export function parse(event: APIGatewayProxyEvent, spotText?: boolean): ParsedData;
  }
  