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

export interface Service {
    id?: string;
    typeName: string;
    description?: string;
    price: number;
}

export interface Material {
    id?: string;
    name: string;
    dimensions?: string;
    surveyedQty?: number;
    chargeQty?: number;
    price?: number;
    total?: number;
    volumeCost?: number;
}

export interface Cost {
    id?: string;
    driverQty?: number;
    porterQty?: number;
    packerQty?: number;
    vehicleQty?: number;
    vehicleTypeId?: string;
    fuelQty?: number;
    fuelCharge?: number;
}

export interface GeneralInfo {
    id?: string;
    driverWage?: number;
    porterWage?: number;
    packerWage?: number;
    contentsValue?: number;
    paymentMethod?: string;
    insurance?: number;
    insurancePercentage?: number;
    insuranceType?: string;
}

export interface Ancillary {
    id?: string;
    name: string;
    charge?: number;
    isChargeable?: boolean;
}

export interface EditEstimatePayload {
    leadId: string;
    quoteTotal: number;
    costTotal: number;
    quoteExpiresOn: string; // Use string for date to simplify JSON parsing
    notes?: string;
    vatIncluded: boolean;
    materialPriceChargeable: boolean;
    services: Service[];
    materials: Material[];
    costs: Cost[];
    generalInfo: GeneralInfo[];
    ancillaries: Ancillary[];
}


export interface AddEstimatePayload {
    leadId: string;
    quoteTotal: number;
    costTotal: number;
    quoteExpiresOn: string; // Use string for date to simplify JSON parsing
    notes?: string;
    vatIncluded: boolean;
    materialPriceChargeable: boolean;
    services: Service[];
    materials: Material[];
    costs: Cost[];
    generalInfo: GeneralInfo[];
    ancillaries: Ancillary[];
}
