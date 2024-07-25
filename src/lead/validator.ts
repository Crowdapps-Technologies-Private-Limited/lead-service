import * as yup from 'yup';
import { AddLeadPayload } from './interface';
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

// Define the update profile schema
export const addLeadSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    phone: yup.string().matches(/^\d{10}$/, 'Mobile number must be exactly 10 digits').nullable(),
    email: yup.string().email('Invalid email').required('Email is required'),
    followUp: yup.string().nullable(),
    movingOn: yup.string().nullable(),
    collectionAddress: yup.string().nullable(),
    collectionPostcode: yup.string().nullable(),
    collectionPurchaseStatus: yup.string().nullable(),
    collectionHouseSize: yup.string().nullable(),
    collectionVolume: yup.number().nullable(),
    collectionDistance: yup.number().nullable(),
    deliveryAddress: yup.string().nullable(),
    deliveryPostcode: yup.string().nullable(),
    deliveryPurchaseStatus: yup.string().nullable(),
    deliveryHouseSize: yup.string().nullable(),
    deliveryVolume: yup.number().nullable(),
    deliveryDistance: yup.number().nullable(),
    customerNotes: yup.string().nullable(),
    referrerId: yup.string().nullable()
}).noUnknown(true, 'Unknown field in payload');



// Validate change password payload
export const addLeadDTO = async (payload: AddLeadPayload): Promise<void> => {
    try {
        await addLeadSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};






