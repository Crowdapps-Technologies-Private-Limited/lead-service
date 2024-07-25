import * as multipart from 'aws-lambda-multipart-parser';

export interface AddLeadPayload {
    name: string;
    phone?: string | null;
    email: string;
    followUp?: string | null;
    movingOn?: string | null;
    collectionAddress?: string | null;
    collectionPurchaseStatus?: string | null;
    collectionHouseSize?: string | null;
    collectionVolume?: number | null;
    collectionDistance?: number | null;
    deliveryAddress?: string | null;
    deliveryPurchaseStatus?: string | null;
    deliveryHouseSize?: string | null;
    deliveryVolume?: number | null;
    deliveryDistance?: number | null;
    customerNotes?: string | null;
    referrerId?: string | null;
    collectionPostcode?: string | null;
    deliveryPostcode?: string | null;
}
