import axios from 'axios';
import * as AWS from 'aws-sdk';
import logger from '../../utils/logger';
const s3 = new AWS.S3();

interface GeneratePdfOptions {
    html: string;
    key: string;
}

const API2PDF_ENDPOINT = 'https://v2.api2pdf.com/chrome/pdf/html';
const API2PDF_API_KEY = '3490e411-fdcd-4620-a174-8f2e5a952f44'; // Replace with your actual API key

export const generatePdfAndUploadToS3 = async (options: GeneratePdfOptions): Promise<string> => {
    const { html, key } = options;

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
