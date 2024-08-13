import * as yup from 'yup';
import {
    AddEstimatePayload,
    AddLeadPayload,
    EditEstimatePayload,
    EditLeadPayload,
    SendEmailPayload,
    AddSurveyTab1Payload,
    AddSurveyTab2Payload,
    AddSurveyTab3Payload,
} from './interface';
import logger from '../utils/logger';

// Define the password schema
const passwordSchema = yup
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
    .required('Password is required');

// Define the add lead schema
export const addLeadSchema = yup.object().shape({
    referrerId: yup.string().nullable(),
    followUpDate: yup.string().nullable(),
    movingOnDate: yup.string().nullable(),
    packingOnDate: yup.string().nullable(),
    //surveyDate: yup.string().nullable(),
    collectionAddress: yup
        .object()
        .shape({
            street: yup.string().nullable().max(300),
            town: yup.string().nullable().max(300),
            county: yup.string().nullable().max(300),
            postcode: yup.string().nullable().max(50),
            country: yup.string().nullable().max(100),
        })
        .required('Collection address is required')
        .default({}),
    deliveryAddress: yup
        .object()
        .shape({
            street: yup.string().nullable().max(300),
            town: yup.string().nullable().max(300),
            county: yup.string().nullable().max(300),
            postcode: yup.string().nullable().max(50),
            country: yup.string().nullable().max(100),
        })
        .required('Delivery address is required')
        .default({}),
    collectionPurchaseStatus: yup.string().nullable().max(100),
    collectionHouseSize: yup.string().nullable().max(100),
    collectionDistance: yup.number().nullable().max(99999999.99),
    collectionVolume: yup.number().nullable().max(99999999.99),
    collectionVolumeUnit: yup.string().nullable().max(20),
    deliveryPurchaseStatus: yup.string().nullable().max(100),
    deliveryHouseSize: yup.string().nullable().max(100),
    deliveryDistance: yup.number().nullable().max(99999999.99),
    deliveryVolume: yup.number().nullable().max(99999999.99),
    deliveryVolumeUnit: yup.string().nullable().max(20),
    //status: yup.string().required('Status is required').oneOf(['NEW', 'ESTIMATES', 'SURVEY', 'QUOTE', 'CONFIRMED', 'COMPLETED'], 'Invalid status value'),
    customerNotes: yup.string().nullable(),
    batch: yup.string().nullable(),
    inceptBatch: yup.string().nullable(),
    leadDate: yup.string().nullable(),
    customer: yup
        .object()
        .shape({
            name: yup.string().nullable().max(100),
            phone: yup
                .string()
                .transform((value, originalValue) => (originalValue.trim() === '' ? null : value))
                .matches(/^\d{11}$/, {
                    message: 'Mobile number must be 11 digits long',
                    excludeEmptyString: true,
                })
                .nullable(),
            email: yup.string().required('Customer email is required').email('Invalid email format').max(100),
        })
        .required('Customer information is required')
        .default({}),
});

export const addLeadDTO = async (payload: AddLeadPayload): Promise<void> => {
    try {
        await addLeadSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err.errors.join(', ')}`);
    }
};

// Validate the edit lead payload
export const validateEditLeadDTO = async (payload: AddLeadPayload): Promise<void> => {
    try {
        await addLeadSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join(', ')}`);
    }
};

export const getDistanceDTO = async (payload: { postcode1: string; postcode2: string }): Promise<void> => {
    try {
        if (!payload.postcode1) {
            throw new Error('Postcode1 is required');
        }
        if (!payload.postcode2) {
            throw new Error('Postcode2 is required');
        }
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};

// Define the add estimate schema
export const addEstimateSchema = yup
    .object()
    .shape({
        quoteTotal: yup.number().required('Quote total is required'),
        costTotal: yup.number().required('Cost total is required'),
        quoteExpiresOn: yup.string().required('Quote expiry date is required'),
        notes: yup.string().nullable(),
        vatIncluded: yup.boolean().required('VAT inclusion status is required'),
        materialPriceChargeable: yup.boolean().required('Material price chargeable status is required'),
        services: yup
            .array()
            .of(
                yup.object().shape({
                    typeName: yup.string().required('Service type name is required'),
                    description: yup.string().nullable(),
                    price: yup.number().required('Service price is required'),
                }),
            )
            .required('Services are required'),
        materials: yup
            .array()
            .of(
                yup.object().shape({
                    name: yup.string().required('Material name is required'),
                    dimensions: yup.string().nullable(),
                    surveyedQty: yup.number().nullable(),
                    chargeQty: yup.number().nullable(),
                    price: yup.number().nullable(),
                    total: yup.number().nullable(),
                    volume: yup.number().nullable(),
                    cost: yup.number().nullable(),
                }),
            )
            .required('Materials are required'),
        costs: yup
            .array()
            .of(
                yup.object().shape({
                    driverQty: yup.number().nullable(),
                    porterQty: yup.number().nullable(),
                    packerQty: yup.number().nullable(),
                    vehicleQty: yup.number().nullable(),
                    vehicleTypeId: yup.string().nullable(),
                    wageCharge: yup.number().nullable(),
                    fuelCharge: yup.number().nullable(),
                }),
            )
            .required('Costs are required'),
        generalInfo: yup
            .array()
            .of(
                yup.object().shape({
                    driverWage: yup.number().nullable(),
                    porterWage: yup.number().nullable(),
                    packerWage: yup.number().nullable(),
                    contentsValue: yup.number().nullable(),
                    paymentMethod: yup.string().nullable(),
                    insurance_amount: yup.number().nullable(),
                    insurancePercentage: yup.number().nullable(),
                    insuranceType: yup.string().nullable(),
                }),
            )
            .required('General Information is required'),
        ancillaries: yup
            .array()
            .of(
                yup.object().shape({
                    name: yup.string().required('Ancillary name is required'),
                    charge: yup.number().nullable(),
                    isChargeable: yup.boolean().nullable(),
                }),
            )
            .required('Ancillaries are required'),
    })
    .noUnknown(true, 'Unknown field in payload');

// Validate the add estimate payload
export const addEstimateDTO = async (payload: AddEstimatePayload): Promise<void> => {
    try {
        await addEstimateSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};

// Define the edit estimate schema
export const editEstimateSchema = yup.object().shape({
        quoteTotal: yup.number().required('Quote total is required'),
        costTotal: yup.number().required('Cost total is required'),
        quoteExpiresOn: yup.string().required('Quote expiry date is required'),
        notes: yup.string().nullable(),
        vatIncluded: yup.boolean().required('VAT inclusion status is required'),
        materialPriceChargeable: yup.boolean().required('Material price chargeable status is required'),
        services: yup
            .array()
            .of(
                yup.object().shape({
                    id: yup.string().nullable(),
                    typeName: yup.string().required('Service type name is required'),
                    description: yup.string().nullable(),
                    price: yup.number().required('Service price is required'),
                }),
            )
            .required('Services are required'),
        materials: yup
            .array()
            .of(
                yup.object().shape({
                    id: yup.string().nullable(),
                    name: yup.string().required('Material name is required'),
                    dimensions: yup.string().nullable(),
                    surveyedQty: yup.number().nullable(),
                    chargeQty: yup.number().nullable(),
                    price: yup.number().nullable(),
                    total: yup.number().nullable(),
                    cost: yup.number().nullable(),
                    volume: yup.number().nullable(),
                }),
            )
            .required('Materials are required'),
        costs: yup
            .array()
            .of(
                yup.object().shape({
                    id: yup.string().nullable(),
                    driverQty: yup.number().nullable(),
                    porterQty: yup.number().nullable(),
                    packerQty: yup.number().nullable(),
                    vehicleQty: yup.number().nullable(),
                    vehicleTypeId: yup.string().nullable(),
                    wageCharge: yup.number().nullable(),
                    fuelCharge: yup.number().nullable(),
                }),
            )
            .required('Costs are required'),
        generalInfo: yup
            .array()
            .of(
                yup.object().shape({
                    id: yup.string().nullable(),
                    driverWage: yup.number().nullable(),
                    porterWage: yup.number().nullable(),
                    packerWage: yup.number().nullable(),
                    contentsValue: yup.number().nullable(),
                    paymentMethod: yup.string().nullable(),
                    insurance_amount: yup.number().nullable(),
                    insurancePercentage: yup.number().nullable(),
                    insuranceType: yup.string().nullable(),
                }),
            )
            .required('General Information is required'),
        ancillaries: yup
            .array()
            .of(
                yup.object().shape({
                    id: yup.string().nullable(),
                    name: yup.string().required('Ancillary name is required'),
                    charge: yup.number().nullable(),
                    isChargeable: yup.boolean().nullable(),
                }),
            )
            .required('Ancillaries are required'),
    })
    .noUnknown(true, 'Unknown field in payload');

// Validate the edit estimate payload
export const editEstimateDTO = async (payload: EditEstimatePayload): Promise<void> => {
    try {
        await editEstimateSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};

// Define the send email payload schema
export const sendEmailSchema = yup.object().shape({
        from: yup.string().email('Invalid email format').required('From email is required'),
        to: yup.string().email('Invalid email format').required('To email is required'),
        subject: yup.string().required('Subject is required'),
        body: yup.string().required('Body is required'),
        addClientSignature: yup.boolean().required('Client signature status is required'),
        templateId: yup.string().required('Template ID is required'),
})
    .noUnknown(true, 'Unknown field in payload');

// Validate the send email payload
export const sendEmailDTO = async (payload: SendEmailPayload): Promise<void> => {
    try {
        await sendEmailSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};

// Define the validation schema for a single SurveyItem
const addsurveyItemTab1Schema = yup.object().shape({
    room: yup.string().required('Room is required').max(100, 'Room name cannot exceed 100 characters'),
    item: yup.string().required('Item is required').max(100, 'Item name cannot exceed 100 characters'),
    ft3: yup.number().required('ft3 is required')
        .min(0, 'ft3 must be greater than or equal to 0').max(999.99, 'ft3 must be less than or equal to 999.99'),
    quantity: yup.number().required('Quantity is required')
        .integer('Quantity must be an integer').min(1, 'Quantity must be greater than or equal to 1'),
    isLeave: yup.boolean().required('isLeave is required'),
    isWeee: yup.boolean().required('isWeee is required'),
    isCust: yup.boolean().required('isCust is required'),
    isClear: yup.boolean().required('isClear is required'),
    materialId: yup.string().nullable().max(100, 'Material ID cannot exceed 100 characters'),
});

// Define the validation schema for the AddSurveyPayload
export const addSurveyTab1PayloadSchema = yup.object().shape({
    surveyorId: yup.string().required('Surveyor ID is required'),
    surveyItems: yup.array().of(addsurveyItemTab1Schema)
        .required('Survey items are required').min(1, 'There must be at least one survey item')
});

// Function to validate the payload
export const validateAddSurveyTab1Payload = async (payload: AddSurveyTab1Payload) => {
    try {
        await addSurveyTab1PayloadSchema.validate(payload, { abortEarly: false });
    } catch (err: any) {
        throw new Error(`Validation failed: ${err.errors.join(', ')}`);
    }
};

const addsurveyItemTab3Schema = yup.object().shape({
    surveyItemId: yup.string().required('Survey item ID is required'),
    room: yup.string().required('Room is required').max(100, 'Room name cannot exceed 100 characters'),
    item: yup.string().required('Item is required').max(100, 'Item name cannot exceed 100 characters'),
    ft3: yup.number().required('ft3 is required')
        .min(0, 'ft3 must be greater than or equal to 0').max(999.99, 'ft3 must be less than or equal to 999.99'),
    dismantleCharges: yup.number().required('Dismantle Charges is required')
        .min(0, 'Dismantle Charges must be greater than or equal to 0'),
    sortOrder: yup.number().required('Sort Order is required')
        .integer('Quantity must be an integer').min(1, 'Sort Order must be greater than or equal to 1'),
    linkedItem: yup.string().nullable().max(100, 'Linked Item name cannot exceed 100 characters'),
});

// Define the validation schema for the AddSurveyPayload
export const addSurveyTab3PayloadSchema = yup.object().shape({
    surveyId: yup.string().required('Surveyor ID is required'),
    surveyItems: yup.array().of(addsurveyItemTab3Schema)
        .required('Survey items are required').min(1, 'There must be at least one survey item')
});

// Function to validate the payload
export const validateAddSurveyTab3Payload = async (payload: AddSurveyTab3Payload) => {
    try {
        await addSurveyTab3PayloadSchema.validate(payload, { abortEarly: false });
    } catch (err: any) {
        throw new Error(`Validation failed: ${err.errors.join(', ')}`);
    }
};

// Define the validation schema for the AddSurveyPayload
export const addSurveyTab2PayloadSchema = yup.object().shape({
    surveyId: yup.string().required('Surveyor ID is required'),
    notes: yup.string().nullable()
});

// Function to validate the payload
export const validateAddSurveyTab2Payload = async (payload: AddSurveyTab2Payload) => {
    try {
        await addSurveyTab2PayloadSchema.validate(payload, { abortEarly: false });
    } catch (err: any) {
        throw new Error(`Validation failed: ${err.errors.join(', ')}`);
    }
};
