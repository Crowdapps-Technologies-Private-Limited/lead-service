import { GET_EMAIL_TEMPLATE_BY_EVENT } from '../sql/sqlScript';
import { connectToDatabase } from './database';
import { initializeEmailService } from './emailService';
import logger from './logger';

export const generateEmail = async (event: string, to: string, data: any) => {
    const client = await connectToDatabase();
    console.log('generateEmail event', event);
    console.log('to', to);
    console.log('data', data);
    
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
        let { salutation, body } = template;

        placeholders.forEach((placeholder: string) => {
            const regex = new RegExp(`{{${placeholder}}}`, 'g');
            const value = data[placeholder] || `{{${placeholder}}}`;  // Use provided value or keep the placeholder
            salutation = salutation ? salutation.replace(regex, value) : salutation;
            body = body.replace(regex, value);
        });

        // Generate the final email content
        const emailContent = {
            subject: template.subject,
            salutation: salutation,
            body: body,
            links: template.links,
            signature: template.signature,
            disclaimer: template.disclaimer
        };
        logger.info('Email content:', { emailContent });

        const htmlBody = (salutation ? salutation + "<br/>" : "") + body + "<br/>" + template.signature + "<br/>" + template.disclaimer;
        const emailService = await initializeEmailService();
        await emailService.sendEmail(
            to,
            emailContent.subject,
            emailContent.body,
            htmlBody
        );

        return {
            success: true,
            message: 'Email sent successfully',
            data: emailContent
        };
    } catch (error: any) {
        logger.error('Failed to generate email content:', { error });
        throw new Error(`Failed to send email: ${error.message}`);
    } finally {
        await client.end();
    }
};
