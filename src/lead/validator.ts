import * as yup from 'yup';
import { AddEstimatePayload, AddLeadPayload, EditEstimatePayload, EditLeadPayload } from './interface';
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
    collectionAddress: yup.object().shape({
        street: yup.string().nullable().max(300),
        town: yup.string().nullable().max(300),
        county: yup.string().nullable().max(300),
        postcode: yup.string().nullable().max(50),
        country: yup.string().nullable().max(100),
    }).required('Collection address is required').default({}),
    deliveryAddress: yup.object().shape({
        street: yup.string().nullable().max(300),
        town: yup.string().nullable().max(300),
        county: yup.string().nullable().max(300),
        postcode: yup.string().nullable().max(50),
        country: yup.string().nullable().max(100),
    }).required('Delivery address is required').default({}),
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
    batch: yup.string().required('Batch is required'),
    inceptBatch: yup.string().required('Incept Batch is required'),
    leadDate: yup.string().required('Lead date is required'),
    customer: yup.object().shape({
        name: yup.string().nullable().max(100),
        phone: yup.string()
            .transform((value, originalValue) => originalValue.trim() === '' ? null : value)
            .matches(/^\d{10, 11}$/, { message: 'Mobile number must be 10 or 11 digits long', excludeEmptyString: true })
            .nullable(),
        email: yup.string().required('Customer email is required').email('Invalid email format').max(100),
    }).required('Customer information is required').default({}),
});


export const addLeadDTO = async (payload: AddLeadPayload): Promise<void> => {
    try {
        await addLeadSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err.errors.join(', ')}`);
    }
};



// Validate the edit lead payload
export const validateEditLeadDTO = async (payload: any): Promise<void> => {
    try {
        await addLeadSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};

export const getDistanceDTO = async (payload: { postcode1: string, postcode2: string }): Promise<void> => {
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
export const addEstimateSchema = yup.object().shape({
    quoteTotal: yup.number().required('Quote total is required'),
    costTotal: yup.number().required('Cost total is required'),
    quoteExpiresOn: yup.string().required('Quote expiry date is required'),
    notes: yup.string().nullable(),
    vatIncluded: yup.boolean().required('VAT inclusion status is required'),
    materialPriceChargeable: yup.boolean().required('Material price chargeable status is required'),
    services: yup.array().of(
        yup.object().shape({
            typeName: yup.string().required('Service type name is required'),
            description: yup.string().nullable(),
            price: yup.number().required('Service price is required')
        })
    ).required('Services are required'),
    materials: yup.array().of(
        yup.object().shape({
            name: yup.string().required('Material name is required'),
            dimensions: yup.string().nullable(),
            surveyedQty: yup.number().nullable(),
            chargeQty: yup.number().nullable(),
            price: yup.number().nullable(),
            total: yup.number().nullable(),
            volumeCost: yup.number().nullable()
        })
    ).required('Materials are required'),
    costs: yup.array().of(
        yup.object().shape({
            driverQty: yup.number().nullable(),
            porterQty: yup.number().nullable(),
            packerQty: yup.number().nullable(),
            vehicleQty: yup.number().nullable(),
            vehicleTypeId: yup.string().nullable(),
            fuelQty: yup.number().nullable(),
            fuelCharge: yup.number().nullable()
        })
    ).required('Costs are required'),
    generalInfo: yup.array().of(
        yup.object().shape({
            driverWage: yup.number().nullable(),
            porterWage: yup.number().nullable(),
            packerWage: yup.number().nullable(),
            contentsValue: yup.number().nullable(),
            paymentMethod: yup.string().nullable(),
            insurance_amount: yup.number().nullable(),
            insurancePercentage: yup.number().nullable(),
            insuranceType: yup.string().nullable()
        })
    ).required('General Information is required'),
    ancillaries: yup.array().of(
        yup.object().shape({
            name: yup.string().required('Ancillary name is required'),
            charge: yup.number().nullable(),
            isChargeable: yup.boolean().nullable()
        })
    ).required('Ancillaries are required'),
}).noUnknown(true, 'Unknown field in payload');

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
    services: yup.array().of(
        yup.object().shape({
            id: yup.string().nullable(),
            typeName: yup.string().required('Service type name is required'),
            description: yup.string().nullable(),
            price: yup.number().required('Service price is required')
        })
    ).required('Services are required'),
    materials: yup.array().of(
        yup.object().shape({
            id: yup.string().nullable(),
            name: yup.string().required('Material name is required'),
            dimensions: yup.string().nullable(),
            surveyedQty: yup.number().nullable(),
            chargeQty: yup.number().nullable(),
            price: yup.number().nullable(),
            total: yup.number().nullable(),
            volumeCost: yup.number().nullable()
        })
    ).required('Materials are required'),
    costs: yup.array().of(
        yup.object().shape({
            id: yup.string().nullable(),
            driverQty: yup.number().nullable(),
            porterQty: yup.number().nullable(),
            packerQty: yup.number().nullable(),
            vehicleQty: yup.number().nullable(),
            vehicleTypeId: yup.string().nullable(),
            fuelQty: yup.number().nullable(),
            fuelCharge: yup.number().nullable()
        })
    ).required('Costs are required'),
    generalInfo: yup.array().of(
        yup.object().shape({
            id: yup.string().nullable(),
            driverWage: yup.number().nullable(),
            porterWage: yup.number().nullable(),
            packerWage: yup.number().nullable(),
            contentsValue: yup.number().nullable(),
            paymentMethod: yup.string().nullable(),
            insurance_amount: yup.number().nullable(),
            insurancePercentage: yup.number().nullable(),
            insuranceType: yup.string().nullable()
        })
    ).required('General Information is required'),
    ancillaries: yup.array().of(
        yup.object().shape({
            id: yup.string().nullable(),
            name: yup.string().required('Ancillary name is required'),
            charge: yup.number().nullable(),
            isChargeable: yup.boolean().nullable()
        })
    ).required('Ancillaries are required'),
}).noUnknown(true, 'Unknown field in payload');

// Validate the edit estimate payload
export const editEstimateDTO = async (payload: EditEstimatePayload): Promise<void> => {
    try {
        await editEstimateSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};





