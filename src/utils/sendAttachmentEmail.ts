import { GET_EMAIL_TEMPLATE_BY_EVENT } from '../sql/sqlScript';
import { connectToDatabase } from './database';
import { initializeEmailService } from './emailService';
import logger from './logger';

interface Attachment {
    Name: string;
    Content: string; // Base64 encoded content should be a string, not Buffer here
    ContentType: string;
}

export const sendAttachmentEmail = async (event: string, to: string, data: any, attachments?: Attachment[]) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    logger.info('generateEmail event', { event });
    logger.info('to', { to });
    logger.info('data', { data });
    // logger.info('attachments', { attachments });

    try {
        // Fetch the email template by event
        const templateRes = await client.query(GET_EMAIL_TEMPLATE_BY_EVENT, [event]);
        logger.info('Email template query result:', { templateRes });
        if (templateRes.rows.length === 0) {
            logger.error('Email template not found for the given event');
            throw new Error('Email template not found for the given event');
        }

        const template: any = templateRes.rows[0];
        logger.info('Email template found:', { template });

        const placeholders = template?.placeholders || [];
        logger.info('Placeholders:', { placeholders });

        // Replace placeholders in salutation and body
        let { salutation, body, signature, disclaimer } = template;

        placeholders.forEach((placeholder: string) => {
            const ph = placeholder.toLowerCase(); // Convert to lowercase for case-insensitive matching
            const regex = new RegExp(`{{${ph}}}`, 'gi'); // Added 'i' flag for case-insensitive matching
            const value = data[ph] || `{{${ph}}}`;
            logger.info('regex and value', { regex, value }); // Use provided value or keep the placeholder
            salutation = salutation ? salutation.replace(regex, value) : salutation;
            body = body.replace(regex, value);
            signature = signature ? signature.replace(regex, value) : signature;
            disclaimer = disclaimer ? disclaimer.replace(regex, value) : disclaimer;
        });

        // Generate the final email content
        const emailContent = {
            subject: template.subject,
            salutation: salutation,
            body: body,
            links: template.links,
            signature: template.signature,
            disclaimer: template.disclaimer,
        };
        logger.info('Email content:', { emailContent });

        const htmlBody =
            (salutation ? salutation + '<br/>' : '') +
            body +
            '<br/>' +
            template.signature +
            '<br/>' +
            template.disclaimer;

        // Initialize email service
        const emailService = await initializeEmailService();

        // Send email with attachment if provided
        const emailRes = await emailService.sendEmail(
            to,
            emailContent.subject,
            emailContent.body,
            htmlBody,
            attachments || [], // Ensure attachments is an array, even if empty
        );
        logger.info('email response', emailRes);

        return {
            success: true,
            message: 'Email sent successfully',
            data: emailContent,
        };
    } catch (error: any) {
        logger.error('Failed to generate email content:', { error });
        throw new Error(`Failed to send email: ${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
