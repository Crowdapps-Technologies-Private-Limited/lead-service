import * as multipart from 'aws-lambda-multipart-parser';

export interface ProfilePayload {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    photo?: string | null;
    socialNumber?: string | null;
    signature?: string | null;
    status?: string | null;
  }

export interface ChangePasswordPayload {
    previousPassword: string;
    proposedPassword: string;
}

export interface ActivateAccountPayload {
    username: string;
    previousPassword: string;
    proposedPassword: string;
}

export interface CreateFeaturePayload {
    feature_name: string;
}

export interface Feature {
    id: string;
    feature_name: string;
}
