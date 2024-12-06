import { ResponseHandler } from '../../utils/ResponseHandler';
import { addLeadDTO } from '../validator';
import { addLead } from '../services';
import { APIGatewayProxyResult, APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { RouteHandler } from '../../types/interfaces';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/checkPermission';
import { getMessage } from '../../utils/errorMessages';
import { AddLeadPayload } from '../interface';

export const importLeadJsonHandler: RouteHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('addLeadHandler event ', { event });
    try {
        const payload = JSON.parse(event.body || '{}');
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;

        const hasPermission = await checkPermission(
            user.role,
            'Lead',
            'create',
            tenant?.schema || tenant?.tenant?.schema,
        );
        logger.info('hasPermission: -----------', { hasPermission });
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }
        // Validate payload
        const results: any[] = [];

        for (const item of payload.leads) {
           
            // Map payload to DTO
            const mappedPayload: AddLeadPayload = {
                referrerId: item.referrerId || null,
                followUpDate: item.followUpDate || null,
                movingOnDate: item.movingOnDate || null,
                packingOnDate: null,
                surveyDate: null,
                collectionAddress: {
                    street: item.collection_street || '',
                    town: item.collection_town || '',
                    county: item.collection_county || null,
                    postcode: item.collection_postcode || '',
                    country: item.collection_country || null,
                },
                deliveryAddress: {
                    street: item.delivery_street || '',
                    town: item.delivery_town || '',
                    county: item.delivery_county || null,
                    postcode: item.delivery_postcode || '',
                    country: item.delivery_country || null,
                },
                collectionPurchaseStatus: null,
                collectionHouseSize:  null,
                collectionDistance: null,
                collectionVolume: item.volume || null,
                collectionVolumeUnit: null,
                deliveryPurchaseStatus: null,
                deliveryHouseSize: null,
                deliveryDistance: null,
                deliveryVolume: null,
                deliveryVolumeUnit: null,
                status: 'NEW', // Default status, change if necessary
                customerNotes: item.notes || null,
                batch: item.Batch || null,
                inceptBatch: item.InceptBatch || null,
                leadId: item.lead_id || null,
                leadDate: item.lead_date || null,
                customer: {
                    name: item.cust_name || '',
                    phone: item.cust_mobile? item.cust_mobile?.toString() : null,
                    email: item.cust_email || '',
                },
            };

            try {
                // await addLeadDTO(mappedPayload);
                try {
                    const result = await addLead(mappedPayload, tenant);
                    results.push({ success: true, message: result?.message });
                } catch (error: any) {
                    logger.error('Error processing lead item', { error, item });
                    results.push({ success: false, message: error.message });
                }
            } catch (error: any) {
                results.push({ success: false, message: error.message });
            }
        }
        return ResponseHandler.createdResponse({ message: 'Processing completed', data: results });
    } catch (error: any) {
        logger.error('Error occurred add lead handler', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
