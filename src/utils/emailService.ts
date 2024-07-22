import * as postmark from 'postmark';
import { Config } from '../types/interfaces';
import { getconfigSecrets } from './getConfig';

interface EmailService {
  sendEmail: (
    to: string,
    subject: string,
    textBody: string,
    htmlBody: string
  ) => Promise<postmark.Models.MessageSendingResponse>;
}

const createEmailService = async (): Promise<EmailService> => {
  const config: Config = await getconfigSecrets();
  console.log('Creating email service with config', config);

  // Ensure the postmark client is correctly initialized
  const client = new postmark.ServerClient(config.postmarkApiKey);

  const sendEmail = async (
    to: string,
    subject: string,
    textBody: string,
    htmlBody: string
  ): Promise<postmark.Models.MessageSendingResponse> => {
    try {
      const response = await client.sendEmail({
        From: config.emailSenderAddress,
        To: to,
        Subject: subject,
        TextBody: textBody,
        HtmlBody: htmlBody,
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