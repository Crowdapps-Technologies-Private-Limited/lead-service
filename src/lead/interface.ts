export interface Customer {
    name: string;
    phone?: string;
    email: string;
}

export interface Address {
    street: string;
    town: string;
    county?: string;
    postcode: string;
    country?: string;
}

export interface AddLeadPayload {
    generatedId: string;
    referrerId?: string;
    customer: Customer;
    collectionAddress: Address;
    deliveryAddress: Address;
    followUpDate?: string;
    movingOnDate?: string;
    packingOnDate?: string;
    surveyDate?: string;
    collectionPurchaseStatus?: string;
    collectionHouseSize?: string;
    collectionDistance?: number;
    collectionVolume?: number;
    collectionVolumeUnit?: string;
    deliveryPurchaseStatus?: string;
    deliveryHouseSize?: string;
    deliveryDistance?: number;
    deliveryVolume?: number;
    deliveryVolumeUnit?: string;
    status: string;
    customerNotes?: string;
    batch?: string;
    inceptBatch?: string;
    leadId?: string;
    leadDate?: string;
}

export interface EditLeadPayload {
    referrerId?: string;
    customer: Customer;
    collectionAddress: Address;
    deliveryAddress: Address;
    followUpDate?: string;
    movingOnDate?: string;
    packingOnDate?: string;
    surveyDate?: string;
    collectionPurchaseStatus?: string;
    collectionHouseSize?: string;
    collectionDistance?: number;
    collectionVolume?: number;
    collectionVolumeUnit?: string;
    deliveryPurchaseStatus?: string;
    deliveryHouseSize?: string;
    deliveryDistance?: number;
    deliveryVolume?: number;
    deliveryVolumeUnit?: string;
    status: 'NEW' | 'ESTIMATES' | 'SURVEY' | 'QUOTE' | 'CONFIRMED' | 'COMPLETED';
    customerNotes?: string;
    batch?: string;
    inceptBatch?: string;
    leadDate?: string;
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
    insurance_amount?: number;
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


export interface SendEmailPayload {
    street: string;
    town: string;
    county?: string;
    postcode: string;
    country?: string;
}