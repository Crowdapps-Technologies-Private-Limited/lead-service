import * as multipart from 'aws-lambda-multipart-parser';

export interface AddLeadPayload {
    name: string;
    phone?: string | null;
    email: string;
    followUp?: string | null;
    movingOn?: string | null;
    collectionAddress?: string | null;
    collectionCounty?: string | null;
    collectionState?: string | null;
    collectionCity?: string | null;
    collectionPurchaseStatus?: string | null;
    collectionHouseSize?: string | null;
    collectionVolume?: number | null;
    collectionVolumeUnit?: string | null;
    collectionDistance?: number | null;
    deliveryAddress?: string | null;
    deliveryCounty?: string | null;
    deliveryState?: string | null;
    deliveryCity?: string | null;
    deliveryPurchaseStatus?: string | null;
    deliveryHouseSize?: string | null;
    deliveryVolume?: number | null;
    deliveryVolumeUnit?: string | null;
    deliveryDistance?: number | null;
    customerNotes?: string | null;
    referrerId?: string | null;
    collectionPostcode?: string | null;
    deliveryPostcode?: string | null;
}

export interface EditLeadPayload {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    followUp?: string | null;
    movingOn?: string | null;
    packingOn?: string | null;
    collectionAddress?: string | null;
    collectionCounty?: string | null;
    collectionState?: string | null;
    collectionCity?: string | null;
    collectionPurchaseStatus?: string | null;
    collectionHouseSize?: string | null;
    collectionVolume?: number | null;
    collectionVolumeUnit?: string | null;
    collectionDistance?: number | null;
    deliveryAddress?: string | null;
    deliveryCounty?: string | null;
    deliveryState?: string | null;
    deliveryCity?: string | null;
    deliveryPurchaseStatus?: string | null;
    deliveryHouseSize?: string | null;
    deliveryVolume?: number | null;
    deliveryVolumeUnit?: string | null;
    deliveryDistance?: number | null;
    customerNotes?: string | null;
    referrerId?: string | null;
    collectionPostcode?: string | null;
    deliveryPostcode?: string | null;
}
