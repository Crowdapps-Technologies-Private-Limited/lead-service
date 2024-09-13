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
    serviceId?: string;
    typeName: string;
    description?: string;
    price: number;
}

export interface Material {
    materialId?: string;
    name: string;
    dimensions?: string;
    surveyedQty?: number;
    chargeQty?: number;
    price?: number;
    total?: number;
    volume?: number;
    cost?: number;
}

export interface Cost {
    costId?: string;
    driverQty?: number;
    porterQty?: number;
    packerQty?: number;
    vehicleQty?: number;
    vehicleTypeId?: string;
    vehicleTypeName?: string;
    wageCharge?: number;
    fuelCharge?: number;
}

export interface GeneralInfo {
    generalInfoId?: string;
    driverWage?: number;
    porterWage?: number;
    packerWage?: number;
    contentsValue?: number;
    paymentMethod?: string;
    insuranceAmount?: number;
    insurancePercentage?: number;
    insuranceType?: string;
}

export interface Ancillary {
    ancillaryId?: string;
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
    estimateId?: string;
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
    from: string;
    to: string;
    subject: string;
    body: string;
    addClientSignature: boolean;
    templateId: string;
}

export interface AddSurveyItemTab1 {
    room: string; 
    item: string; 
    ft3: number; 
    quantity: number; 
    isLeave: boolean; 
    isWeee: boolean; 
    isCust: boolean; 
    isClear: boolean; 
    materialId?: string | null;
    price?: number | null;
}

export interface AddSurveyTab1Payload {
    surveyItems: AddSurveyItemTab1[]; 
}

export interface AddSurveyItemTab3 {
    surveyItemId: string;
    room: string; 
    item: string; 
    ft3: number; 
    dismantleCharges: number; 
    sortOrder: number; 
    linkedItem?: string | null;
}

export interface AddSurveyTab2Payload {
    surveyId: string;
    notes?: string | null; 
}

export interface AddSurveyTab3Payload {
    surveyId: string;
    surveyItems: AddSurveyItemTab3[]; 
}

export interface AssignSurveyorPayload {
    surveyorId: string;
    surveyType: string;
    remarks?: string | null;
    startTime: string;
    endTime?: string | null;
    surveyDate?: string | null;
    description: string;
}

export interface AddQuotePayload {
    quoteId?: string;
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

export interface TooltipConfirmationPayload {
    confirmationId: string;
    isSeen: boolean;
    isNewResponse: boolean;
}

export interface ServiceType {
    serviceId?: string;
    name: string;
    status: string;
    cost?: number;
}

export interface DateStruct {
    date: string;
    time?: string;
    status: string;
}


export interface UpdateConfirmationPayload {
    confirmationId?: string | null;
    movingDate?: DateStruct;
    packingDate?: DateStruct;
    isDepositeRecieved?: boolean;
    services: ServiceType[];
    vatIncluded?: boolean;
}
