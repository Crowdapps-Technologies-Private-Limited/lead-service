import dayjs from '../../utils/dayjs';
import logger from '../../utils/logger';
import { Material, Cost, Service, Ancillary, GeneralInfo } from '../interface';

const generateQuoteHtml = async ({ client, lead, quote }: { client: any; lead: any; quote: any }) => {
    logger.info('Generating quote html');
    logger.info('Client:', { client });
    logger.info('Lead:', { lead });
    logger.info('Quote:', { quote });

    let collection_addr = '';
    if (lead?.collection_street) {
        collection_addr += lead?.collection_street;
    }
    if (lead?.collection_town) {
        collection_addr += `, ${lead?.collection_town}`;
    }
    if (lead?.collection_county) {
        collection_addr += `, ${lead?.collection_county}`;
    }
    if (lead?.collection_country) {
        collection_addr += `, ${lead?.collection_country}`;
    }
    if (lead?.collection_postcode) {
        collection_addr += `, ${lead?.collection_postcode}`;
    }

    let delivery_addr = '';
    if (lead?.delivery_street) {
        delivery_addr += lead?.delivery_street;
    }
    if (lead?.delivery_town) {
        delivery_addr += `, ${lead?.delivery_town}`;
    }
    if (lead?.delivery_county) {
        delivery_addr += `, ${lead?.delivery_county}`;
    }
    if (lead?.delivery_country) {
        delivery_addr += `, ${lead?.delivery_country}`;
    }
    if (lead?.delivery_postcode) {
        delivery_addr += `, ${lead?.delivery_postcode}`;
    }

    const createdAtFormatted = dayjs(lead?.createdAt).format('DD-MM-YYYY');
    const quoteExpiresOnFormatted = dayjs(quote?.quote_expires_on).format('DD-MM-YYYY');

    const materialsHtml = quote?.materials
        ?.map(
            (material: Material) => `
        <tr>
            <td>${material.name}</td>
            <td>${material.chargeQty}</td>
            <td>£ ${material.price}</td>
            <td>£ ${material.total}</td>
        </tr>
    `,
        )
        .join('');

    const servicesHtml = quote?.services
        ?.map(
            (service: Service) => `
        <tr>
            <td>${service.typeName}</td>
            <td>£ ${service.price}</td>
        </tr>
    `,
        )
        .join('');

    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                margin: 10px;
            }
            .container {
                width: 100%;
                padding: 10px;
            }
            .header {
                text-align: center;
            }
            
            .header {
                margin-bottom: 20px;
            }
            .footer {
                margin-top: 20px;
            }
            .logo {
                text-align: left;
            }
            .company-info{
                text-align: left;
            }
            .company-info, .quotation-info, .move-info {
                margin-bottom: 10px;
            }
            .table-container {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .table-container th, .table-container td {
                border: 1px solid #dddddd;
                text-align: left;
                padding: 4px;
            }
            .table-container th {
                background-color: #f2f2f2;
            }
            .quotation-info {
                display: flex;
                justify-content: space-between;
            }
            .company_detail {
                display: flex;
                justify-content: space-between;
            }
        </style>
    </head>
    <body>
    
    <div class="container">
        <div class="header">
        <div class="company_detail">
            <div class="logo">
                <img src="${client?.logo}" alt="Company Logo" style="max-height: 60px;">
            </div>
            <div class="company-info">
                <p>${client?.name}</p>
                <p>${client?.address}, ${client?.postCode}</p>
                <p>Email: ${client?.email}</p>
                <p>Website: ${client?.general_website}</p>
            </div>
        </div>
            <h1>Q U O T A T I O N</h1>
        </div>
    
        <div class="quotation-info">
            <div>
                <p><strong>Prepared For:</strong></p>
                <p>${lead?.customer_name}</p>
                <p>${lead?.customer_email}</p>
                <p>${lead?.customer_phone}</p>
            </div>
            <div>
                <p><strong>Client ID:</strong> ${lead?.generated_id}</p>
                <p><strong>Date:</strong> ${createdAtFormatted}</p>
                <p><strong>Volume:</strong> ${lead?.collection_volume} m<sup>3</sup></p>
                <p><strong>Quote Expires On:</strong> ${quoteExpiresOnFormatted}</p>
            </div>
        </div>
    
        <div class="move-info">
            <p><strong>Moving From:</strong> ${collection_addr}</p>
            <p><strong>Moving To:</strong> ${delivery_addr}</p>
        </div>
    
        <p>Detailed below are prices and services on offer. If you have any questions or comments we would be pleased to take your call.</p>
        
        <table class="table-container">
            <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
            ${materialsHtml}
        </table>

        <h4>We can provide following options:</h4>
        <table class="table-container">
            <tr>
                <th>Description</th>
                <th>Price</th>
            </tr>
            ${servicesHtml}
        </table>

        <div class="footer">
            <p>We aim to provide a first-class professional service to you during the course of any agreement made with us. If there is anything that we can assist you with either now or in the future, please be assured of our very best attention.</p>
            <p>Many thanks.</p>
        </div>
    </div>
    
    </body>
    </html>`;
};

export default generateQuoteHtml;