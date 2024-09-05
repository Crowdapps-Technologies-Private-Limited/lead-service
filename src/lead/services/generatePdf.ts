import axios from 'axios';
import * as AWS from 'aws-sdk';
import logger from '../../utils/logger';
const s3 = new AWS.S3();

interface GeneratePdfOptions {
    html: string;
    key: string;
}

const API2PDF_ENDPOINT = 'https://v2.api2pdf.com/chrome/pdf/html';
const API2PDF_API_KEY = '11d34aa8-9033-480e-80b1-7851fac23a04'; // Replace with your actual API key

export const generatePdfAndUploadToS3 = async (options: GeneratePdfOptions): Promise<string> => {
    const { html, key } = options;
    const bucketName = 'dev-mmym-files';

    if (!html) {
        throw new Error('HTML content must be provided');
    }

    try {
        const response = await axios.post(
            API2PDF_ENDPOINT,
            {
                html: html,
                inlinePdf: true,
                fileName: key,
            },
            {
                headers: {
                    Authorization: API2PDF_API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );

        logger.info('API2PDF response', { response: response.data });

        const pdfUrl = response.data.FileUrl;
        if (!pdfUrl) {
            throw new Error('No PDF URL returned from API2PDF');
        }

        return pdfUrl;
    } catch (error: any) {
        logger.error('Failed to generate or upload PDF', { error });
        throw new Error(`Failed to generate or upload PDF: ${error.message}`);
    }
};
