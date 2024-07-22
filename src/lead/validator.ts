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
  firstName: yup.string().nullable(),
  lastName: yup.string().nullable(),
  phone: yup.string().nullable(),
  photo: yup.string().nullable(),
  socialNumber: yup.string().nullable(),
  status: yup.string().nullable(),
  signature: yup.string().nullable()
}).noUnknown(true, 'Unknown field in payload');



// Validate change password payload
export const addLeadDTO = async (payload: AddLeadPayload): Promise<void> => {
    try {
        await addLeadSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};






