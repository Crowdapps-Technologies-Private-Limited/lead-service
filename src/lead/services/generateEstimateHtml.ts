import dayjs from '../../utils/dayjs';
import logger from '../../utils/logger';
import { Material, Cost, Service, Ancillary, GeneralInfo } from '../interface';

const generateEstimateHtml = async ({ client, lead, estimate }: { client: any; lead: any; estimate: any }) => {
    logger.info('Generating estimate html');
    logger.info('Client:', { client });
    logger.info('Lead:', { lead });
    logger.info('Estimate:', { estimate });

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
    const quoteExpiresOnFormatted = dayjs(estimate?.quote_expires_on).format('DD-MM-YYYY');

    const materialsHtml = estimate.materials
        .map(
            (material: Material) => `
        <tr>
            <td>${material.name}</td>
            <td>${material.chargeQty}</td>
            <td>${material.price}</td>
            <td>${material.total}</td>
        </tr>
    `,
        )
        .join('');

    const servicesHtml = estimate.services
        .map(
            (service: Service) => `
        <tr>
            <td>${service.typeName}</td>
            <td>${service.price}</td>
        </tr>
    `,
        )
        .join('');

    const costsHtml = estimate.costs
        .map(
            (cost: Cost) => `
        <tr>
            <td>${cost?.vehicleTypeName}</td>
            <td>${cost.vehicleQty}</td>
            <td>${cost.driverQty}</td>
            <td>${cost.packerQty}</td>
            <td>${cost.porterQty}</td>
            <td>${cost.fuelCharge}</td>
            <td>${cost.wageCharge}</td>
        </tr>
    `,
        )
        .join('');

    const ancillariesHtml = estimate.ancillaries
        .map(
            (ancillary: Ancillary) => `
        <tr>
            <td>${ancillary.name}</td>
            <td>${ancillary.charge}</td>
        </tr>
    `,
        )
        .join('');

    const generalInfoHtml = estimate.general_info
        .map(
            (info: GeneralInfo) => `
        <tr>
            <td>Contents Value</td>
            <td>${info.contentsValue}</td>
        </tr>
        <tr>
            <td>Driver Wage</td>
            <td>${info.driverWage}</td>
        </tr>
        <tr>
            <td>Packer Wage</td>
            <td>${info.packerWage}</td>
        </tr>
        <tr>
            <td>Porter Wage</td>
            <td>${info.porterWage}</td>
        </tr>
        <tr>
            <td>Insurance Type</td>
            <td>${info.insuranceType}</td>
        </tr>
        <tr>
            <td>Insurance Percentage</td>
            <td>${info.insurancePercentage}%</td>
        </tr>
        <tr>
            <td>Payment Method</td>
            <td>${info.paymentMethod}</td>
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
            .header, .footer {
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
            <h1>E S T I M A T I O N</h1>
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
        
        <h4>Materials</h4>
        <table class="table-container">
            <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
            ${materialsHtml}
        </table>

        <h4>Services</h4>
        <table class="table-container">
            <tr>
                <th>Description</th>
                <th>Price</th>
            </tr>
            ${servicesHtml}
        </table>

        <h4>Costs</h4>
        <table class="table-container">
            <tr>
                <th>Vehicle Type</th>
                <th>Vehicle Qty</th>
                <th>Driver Qty</th>
                <th>Packer Qty</th>
                <th>Porter Qty</th>
                <th>Fuel Charge</th>
                <th>Wage Charge</th>
            </tr>
            ${costsHtml}
        </table>

        <h4>Ancillaries</h4>
        <table class="table-container">
            <tr>
                <th>Description</th>
                <th>Charge</th>
            </tr>
            ${ancillariesHtml}
        </table>

        <h4>General Info</h4>
        <table class="table-container">
            ${generalInfoHtml}
        </table>

        <h4>Notes</h4>
        <p>${estimate.notes}</p>

        <div class="footer">
            <p>We aim to provide a first-class professional service to you during the course of any agreement made with us. If there is anything that we can assist you with either now or in the future, please be assured of our very best attention.</p>
            <p>Many thanks.</p>
        </div>
    </div>
    
    </body>
    </html>`;
};

export default generateEstimateHtml;
