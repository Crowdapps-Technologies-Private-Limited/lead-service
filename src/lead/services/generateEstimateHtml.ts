import logger from '../../utils/logger';
import dayjs from 'dayjs';

const generateEstimateHtml = async ({ client, lead, estimate }: { client: any; lead: any; estimate: any }) => {
    logger.info('Generating estimate html');
    logger.info('Client:', { client });
    logger.info('Lead:', { lead });
    logger.info('Estimate:', { estimate });

    const {
        estimate_id,
        lead_id,
        quote_total,
        cost_total,
        quote_expires_on,
        notes,
        vat_included,
        material_price_chargeable,
        services,
        materials,
        costs,
        general_info,
        ancillaries,
    } = estimate;

    let collection_addr = '';
    if(lead?.collection_street) {
        collection_addr += lead?.collection_street;
    }
    if(lead?.collection_town) {
        collection_addr += `, ${lead?.collection_town}`;
    }
    if(lead?.collection_county) {
        collection_addr += `, ${lead?.collection_county}`;
    }
    if(lead?.collection_country) {
        collection_addr += `, ${lead?.collection_country}`;
    }
    if(lead?.collection_postcode) {
        collection_addr += `, ${lead?.collection_postcode}`;
    }

    let delivery_addr = '';
    if(lead?.delivery_street) {
        delivery_addr += lead?.delivery_street;
    }
    if(lead?.delivery_town) {
        delivery_addr += `, ${lead?.delivery_town}`;
    }
    if(lead?.delivery_county) {
        delivery_addr += `, ${lead?.delivery_county}`;
    }
    if(lead?.delivery_country) {
        delivery_addr += `, ${lead?.delivery_country}`;
    }
    if(lead?.delivery_postcode) {
        delivery_addr += `, ${lead?.delivery_postcode}`;
    }

    const createdAtFormatted = dayjs(lead?.createdAt).format('DD-MM-YYYY');

    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            .container {
                width: 100%;
                padding: 20px;
            }
            .header, .footer {
                text-align: center;
            }
            .header {
                margin-bottom: 40px;
            }
            .footer {
                margin-top: 40px;
            }
            .logo {
                text-align: left;
            }
            .company-info, .quotation-info, .move-info {
                margin-bottom: 20px;
            }
            .table-container {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .table-container th, .table-container td {
                border: 1px solid #dddddd;
                text-align: left;
                padding: 8px;
            }
            .table-container th {
                background-color: #f2f2f2;
            }
        </style>
    </head>
    <body>
    
    <div class="container">
        <div class="header">
            <div class="logo">
                <p>Logo</p>
            </div>
            <div class="company-info">
                <p>${client?.name}</p>
                <p>${client?.address}, ${client?.postCode}</p>
                <p>Email: ${client?.email}</p>
                <p>Website: ${client?.general_website}</p>
            </div>
            <h1>E S T I M A T I O N</h1>
        </div>
    
        <div class="quotation-info">
            <p><strong>Prepared For:</strong></p>
            <p>${lead?.customer_name}</p>
            <p>${lead?.customer_email}</p>
            <p>${lead?.customer_phone}</p>
            <p><strong>Client ID:</strong> ${lead?.generated_id}</p>
            <p><strong>Date:</strong> ${createdAtFormatted}</p>
            <p><strong>Volume:</strong> ${lead?.collection_volume} m<sup>3</sup></p>
        </div>
    
        <div class="move-info">
            <p><strong>Moving From:</strong> ${collection_addr}</p>
            <p><strong>Moving To:</strong> ${delivery_addr}</p>
        </div>
    
        <p>Detailed below are prices and services on offer. If you have any questions or comments we would be pleased to take your call.</p>
        <p>Removal Door to door - #JRemD2DNote# - #JRemDoor2Door#</p>
        <p>Removal in to store - #JRemIn2StoreNote# - #JRemIn2Store#</p>
        <p>Removal from store - #JRemFromStoreNote# - #JRemFromStore#</p>
    
        <table class="table-container">
            <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
            <tr>
                <td>#PackType01#</td>
                <td>#PackQty01#</td>
                <td>#PackEach01#</td>
                <td>#PackPrice01#</td>
            </tr>
            <tr>
                <td>#PackType02#</td>
                <td>#PackQty02#</td>
                <td>#PackEach02#</td>
                <td>#PackPrice02#</td>
            </tr>
            <tr>
                <td>#PackType03#</td>
                <td>#PackQty03#</td>
                <td>#PackEach03#</td>
                <td>#PackPrice03#</td>
            </tr>
            <tr>
                <td>#PackType04#</td>
                <td>#PackQty04#</td>
                <td>#PackEach04#</td>
                <td>#PackPrice04#</td>
            </tr>
            <tr>
                <td>#PackType05#</td>
                <td>#PackQty05#</td>
                <td>#PackEach05#</td>
                <td>#PackPrice05#</td>
            </tr>
            <tr>
                <td>#PackType06#</td>
                <td>#PackQty06#</td>
                <td>#PackEach06#</td>
                <td>#PackPrice06#</td>
            </tr>
            <tr>
                <td>#PackType07#</td>
                <td>#PackQty07#</td>
                <td>#PackEach07#</td>
                <td>#PackPrice07#</td>
            </tr>
        </table>
    
        <h2>We can provide the following options:</h2>
        <p>Insurance: #JInsAmount#</p>
        <p>Storage: #JStoreCostNote# - #JStoreCost#</p>
        <p>Full Pack: #JPackFullNote# - #JPackFull#</p>
        <p>Dismantle / reassemble: #JDismatleNote# - #DisReas#</p>
        <p>Unpack: #JUnpackNote# - #Unpack#</p>
    
        <div class="footer">
            <p>We aim to provide a first-class professional service to you during the course of any agreement made with us. If there is anything that we can assist you with either now or in the future, please be assured of our very best attention.</p>
            <p>Many thanks.</p>
        </div>
    </div>
    
    </body>
    </html>`;
};

export default generateEstimateHtml;
