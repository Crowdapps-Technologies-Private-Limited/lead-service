import axios from 'axios';
import * as AWS from 'aws-sdk';
import logger from '../../utils/logger';
const s3 = new AWS.S3();

interface GeneratePdfOptions {
    html: string;
    key: string;
    leadId: string;
    tenantId: string;
    folderName: string;
}

const API2PDF_ENDPOINT = 'https://v2.api2pdf.com/chrome/pdf/html';
const API2PDF_API_KEY = '3490e411-fdcd-4620-a174-8f2e5a952f44'; // Replace with your actual API key

export const generatePdfAndUploadToS3 = async (
    options: GeneratePdfOptions,
): Promise<{ pdfUrl: string; file: Buffer }> => {
    const { html, key, leadId, tenantId, folderName = 'general' } = options;

    // Use ISO string to ensure date format works well for filenames
    const dt = new Date().toISOString().replace(/[:.]/g, '-');

    // Extract YYYY-MM-DD from the ISO string
    const dateFolderName = dt.substring(0, 10); // Extract 'YYYY-MM-DD'

    // Construct the final S3 key
    const finalKey = `${tenantId}/${dateFolderName}/${leadId}/${folderName}/${key}-${dt}.pdf`;

    if (!html) {
        throw new Error('HTML content must be provided');
    }

    try {
        // Step 1: Generate the PDF using the API
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

        // Step 2: Download the PDF file from the provided URL
        const pdfResponse = await axios.get(pdfUrl, {
            responseType: 'arraybuffer', // Get the file in binary format
        });

        const pdfFileBuffer = Buffer.from(pdfResponse.data); // Create a Buffer from the arraybuffer

        // Step 3: Upload the downloaded PDF file to S3
        const uploadParams = {
            Bucket: 'dev-mmym-files', // Replace with your bucket name or use env var
            Key: finalKey, // The key for the uploaded file (finalKey now has a properly formatted path)
            Body: pdfFileBuffer, // The downloaded file content in Buffer format
            ContentType: 'application/pdf', // MIME type for PDF
        };

        const s3UploadResponse = await s3.upload(uploadParams).promise();

        logger.info('Successfully uploaded PDF to S3', { s3Url: s3UploadResponse.Location });

        // Step 4: Generate a signed URL valid for 30 days (30 days = 2592000 seconds)
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: 'dev-mmym-files', // Replace with your bucket name or use env var
            Key: finalKey, // The key of the file
            Expires: 604800, // 7 days in seconds
        });

        // Step 5: Return both the original PDF URL, the S3 file URL, the signed URL, and the file content (as a Buffer)
        return {
            pdfUrl: signedUrl, // The original PDF URL from API2PDF
            file: pdfFileBuffer, // The actual file content in Buffer format
        };
    } catch (error: any) {
        logger.error('Failed to generate, download, or upload PDF', { error });
        throw new Error(`Failed to generate, download, or upload PDF: ${error.message}`);
    }
};
