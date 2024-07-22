import * as yup from 'yup';
import {  ActivateAccountPayload, ChangePasswordPayload, CreateFeaturePayload, ProfilePayload } from './interface';
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
export const updateProfileSchema = yup.object().shape({
  firstName: yup.string().nullable(),
  lastName: yup.string().nullable(),
  phone: yup.string().nullable(),
  photo: yup.string().nullable(),
  socialNumber: yup.string().nullable(),
  status: yup.string().nullable(),
  signature: yup.string().nullable()
}).noUnknown(true, 'Unknown field in payload');



// Define the change password schema
const changePasswordSchema = yup
    .object()
    .shape({
        previousPassword: passwordSchema,
        proposedPassword: passwordSchema,
    })
    .noUnknown(true, 'Unknown field in payload');

    const activateAccountSchema = yup
    .object()
    .shape({
        username: yup.string().required('username is required'),
        previousPassword: passwordSchema,
        proposedPassword: passwordSchema,
    })
    .noUnknown(true, 'Unknown field in payload');

export const createFeatureSchema = yup
    .object()
    .shape({
        feature_name: yup.string().required('Feature name is required'),
    })
    .noUnknown(true, 'Unknown field in payload');

// Validate change password payload
export const changePasswordDTO = async (payload: ChangePasswordPayload): Promise<void> => {
    try {
        await changePasswordSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};

// Validate change password payload
export const activateAccountDTO = async (payload: ActivateAccountPayload): Promise<void> => {
    try {
        await activateAccountSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};

// Validate create feature payload
export const createFeautureDTO = async (payload: CreateFeaturePayload): Promise<void> => {
    try {
        await createFeatureSchema.validate(payload, { abortEarly: false, strict: true });
    } catch (err: any) {
        throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
    }
};


export const updateProfileDTO = async (payload: ProfilePayload): Promise<void> => {
  logger.info('PayloadToupdate:', { payload });
  try {
    await updateProfileSchema.validate(payload, { abortEarly: false, strict: true });
  } catch (err:any) {
    throw new Error(`Payload Validation Failed: ${err?.errors?.join()}`);
  }
};


