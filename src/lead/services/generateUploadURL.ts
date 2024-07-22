import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { getconfigSecrets } from '../../utils/getConfig';

const s3 = new AWS.S3();

export const generateUploadURL = async (fileName: string, fileType: string) => {
    try {
        const config = await getconfigSecrets();

        // Extract directory and file parts from the filename
        const lastSlashIndex = fileName.lastIndexOf('/');
        const directory = fileName.substring(0, lastSlashIndex + 1); // includes the slash
        const file = fileName.substring(lastSlashIndex + 1);

        // Generate a unique filename
        const uniqueFileName = `${uuidv4()}-${file}`;
        const key = `uploads/${directory}${uniqueFileName}`;

        const params = {
            Bucket: config.s3BucketName,
            Key: key,
            Expires: 300, // 5 minutes in seconds
            ContentType: fileType,
        };

        const uploadURL = s3.getSignedUrl('putObject', params);
        return { uploadURL, key };
    } catch (error: any) {
        logger.error('Error generating signed URL', { error });
        throw error;
    }
};
