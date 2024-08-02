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
    referrer_id: yup.string().nullable(),
    name: yup.string().required('Name is required').max(100),
    phone: yup.string().required('Phone is required').max(20),
    email: yup.string().required('Email is required').email('Invalid email format').max(100),
    follow_up_date: yup.string().nullable(),
    moving_on_date: yup.string().nullable(),
    packing_on_date: yup.string().nullable(),
    survey_date: yup.string().nullable(),
    collection_address: yup.object().shape({
        street: yup.string().nullable().max(300),
        town: yup.string().nullable().max(300),
        county: yup.string().nullable().max(300),
        postcode: yup.string().nullable().max(50),
        country: yup.string().nullable().max(100),
    }).required('Collection address is required').default({}),
    delivery_address: yup.object().shape({
        street: yup.string().nullable().max(300),
        town: yup.string().nullable().max(300),
        county: yup.string().nullable().max(300),
        postcode: yup.string().nullable().max(50),
        country: yup.string().nullable().max(100),
    }).required('Delivery address is required').default({}),
    collection_purchase_status: yup.string().nullable().max(100),
    collection_house_size: yup.string().nullable().max(100),
    collection_distance: yup.number().nullable().max(99999999.99),
    collection_volume: yup.number().nullable().max(99999999.99),
    collection_volume_unit: yup.string().nullable().max(20),
    delivery_purchase_status: yup.string().nullable().max(100),
    delivery_house_size: yup.string().nullable().max(100),
    delivery_distance: yup.number().nullable().max(99999999.99),
    delivery_volume: yup.number().nullable().max(99999999.99),
    delivery_volume_unit: yup.string().nullable().max(20),
    status: yup.string().required('Status is required').oneOf(['NEW', 'ESTIMATES', 'SURVEY', 'QUOTE', 'CONFIRMED', 'COMPLETED'], 'Invalid status value'),
    customer_notes: yup.string().nullable(),
    batch: yup.string().required('Batch is required'),
    incept_batch: yup.string().required('Incept Batch is required'),
    lead_date: yup.string().required('Lead date is required'),
    customer: yup.object().shape({
        name: yup.string().nullable().max(100),
        phone: yup.string().required('Customer phone is required').max(20),
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





