import { GET_LEAD_BY_ID, GET_QUOTE_BY_LEAD_ID } from '../../sql/sqlScript';
import { connectToDatabase } from '../../utils/database';
import { getMessage } from '../../utils/errorMessages';
import logger from '../../utils/logger';
import { generatePdfAndUploadToS3 } from './generatePdf';
import generateQuoteHtml from './generateQuoteHtml';

export const downloadSecondLatestQuote = async (leadId: string, tenant: any) => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    if (tenant?.is_suspended) {
        throw new Error(getMessage('ACCOUNT_SUSPENDED'));
    }
    const schema = tenant.schema;
    logger.info('Schema:', { schema });

    await client.query(`SET search_path TO ${schema}`);
    logger.info('Schema set successfully');

    try {
        // Check if lead exists
        const leadCheckResult = await client.query(GET_LEAD_BY_ID, [leadId]);
        if (leadCheckResult.rows.length === 0) {
            throw new Error(getMessage('LEAD_NOT_FOUND'));
        }

        const res = await client.query(GET_QUOTE_BY_LEAD_ID, [leadId]);
        // Manually convert string fields to numbers, if necessary
        if (res.rows.length === 0) {
            throw new Error(getMessage('PREV_QUOTE_NOT_FOUND'));
        }
        const data = res.rows[0];
        data.quoteId = data?.quoteid;
        data.quoteTotal = parseFloat(data?.quotetotal);
        data.costTotal = parseFloat(data?.costtotal);
        data.quoteId = data?.quoteid;
        data.leadId = data?.leadid;
        data.quoteExpiresOn = data?.quoteexpireson;
        data.vatIncluded = data?.vatincluded;
        data.materialPriceChargeable = data?.materialpricechargeable;
        data.generalInfo = data?.generalinfo;
        delete data?.quotetotal;
        delete data?.costtotal;
        delete data?.quoteid;
        delete data?.leadid;
        delete data?.quoteexpireson;
        delete data?.vatincluded;
        delete data?.materialpricechargeable;
        delete data?.generalinfo;

        logger.info('quoteData:', { data });
        const html = await generateQuoteHtml({
            client: tenant,
            lead: leadCheckResult.rows[0],
            quote: data,
        });
        logger.info('html:', { html });
        // Generate PDF
        // Generate PDF
        const { pdfUrl } = await generatePdfAndUploadToS3({
            html,
            key: 'previous_quote',
            leadId,
            tenantId: tenant.id,
            folderName: 'quotation',
        });
        return { message: getMessage('PREV_QUOTE_PDF_GENERATED'), data: { pdfUrl } };
    } catch (error: any) {
        logger.error('Failed to download prevoius quote', { error });
        throw new Error(`${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
