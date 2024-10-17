import * as postmark from 'postmark';
import { Config } from '../types/interfaces';
import { getconfigSecrets } from './getConfig';

interface Attachment {
    Name: string;
    Content: string; // Base64 encoded content
    ContentType: string;
    ContentID?: string; // Optional, can be undefined if not needed
}

interface EmailService {
    sendEmail: (
        to: string,
        subject: string,
        textBody: string,
        htmlBody: string,
        attachments: Attachment[],
    ) => Promise<postmark.Models.MessageSendingResponse>;
}

export const createEmailService = async (): Promise<EmailService> => {
    const config: Config = await getconfigSecrets();
    console.log('Creating email service with config', config);

    // Initialize the Postmark client
    const client = new postmark.ServerClient(config.postmarkApiKey);

    const sendEmail = async (
        to: string,
        subject: string,
        textBody: string,
        htmlBody: string,
        attachments: Attachment[] = [],
    ): Promise<postmark.Models.MessageSendingResponse> => {
        try {
            const response = await client.sendEmail({
                From: config.emailSenderAddress,
                To: to,
                Subject: subject,
                TextBody: textBody,
                HtmlBody: htmlBody,
                Attachments: attachments.map((attachment) => ({
                    Name: attachment.Name,
                    Content: attachment.Content, // Base64 encoded file content
                    ContentType: attachment.ContentType,
                    ContentID: attachment.ContentID || undefined, // Optional ContentID, use undefined if not provided
                })),
            });
            return response;
        } catch (error) {
            throw error;
        }
    };

    return { sendEmail };
};

// Example usage
export const initializeEmailService = async (): Promise<EmailService> => {
    const emailService = await createEmailService();
    return emailService;
};
