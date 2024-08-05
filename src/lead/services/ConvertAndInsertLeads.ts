import logger from '../../utils/logger';
import { AddLeadPayload } from '../interface';
import { addLead } from './addLeadService';

export const importLeads = async (importedData: any, tenant: any) => {
    try {
        for (const key in importedData) {
            if (!isNaN(Number(key))) {
                const leadData = importedData[key];
                const payload: AddLeadPayload = {
                    generatedId: leadData.lead_id,
                    referrerId: leadData.lead_referrerID,
                    customer: {
                        name: leadData.cust_name,
                        phone: leadData.cust_mobile,
                        email: leadData.cust_CEmail,
                    },
                    collectionAddress: {
                        street: leadData.collection_street,
                        town: leadData.collection_town,
                        county: leadData.collection_county,
                        postcode: leadData.collection_postcode,
                        country: leadData.collection_country,
                    },
                    deliveryAddress: {
                        street: leadData.delivery_street,
                        town: leadData.delivery_town,
                        county: leadData.delivery_county,
                        postcode: leadData.delivery_postcode,
                        country: leadData.delivery_country,
                    },
                    followUpDate: null, // Set as needed
                    movingOnDate: leadData.move_date !== '0000-00-00 00:00:00' ? leadData.move_date : null,
                    packingOnDate: null, // Set as needed
                    surveyDate: null, // Set as needed
                    collectionPurchaseStatus: leadData.collection_type,
                    collectionHouseSize: leadData.bedrooms,
                    collectionDistance: null, // Not provided in imported data
                    collectionVolume: leadData.volume !== '0' ? parseFloat(leadData.volume) : null,
                    collectionVolumeUnit: null, // Not provided in imported data
                    deliveryPurchaseStatus: leadData.delivery_type,
                    deliveryHouseSize: leadData.bedrooms,
                    deliveryDistance: null, // Not provided in imported data
                    deliveryVolume: leadData.volume !== '0' ? parseFloat(leadData.volume) : null,
                    deliveryVolumeUnit: null, // Not provided in imported data
                    status: 'NEW', // Default to NEW
                    customerNotes: leadData.notes,
                    batch: leadData.Batch,
                    inceptBatch: leadData.InceptBatch,
                    leadId: leadData.lead_id,
                    leadDate: leadData.lead_date,
                };

                await addLead(payload, tenant);
            }
        }
        logger.info('Leads imported successfully');
        return { message: 'Leads imported successfully' };
    } catch (error: any) {
        logger.error('Failed to import leads', { error });
        throw new Error(`Failed to import leads: ${error.message}`);
    }
};
