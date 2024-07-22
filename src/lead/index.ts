import { RouteHandler, Routes } from '../types/interfaces';
import admiinHandlers from './handlers';

export const adminRoutes: { [key: string]: { [key: string]: RouteHandler } } = {
    GET: {
        '/client/me': admiinHandlers.getProfile,
        '/client/upload': admiinHandlers.getUploadKeyHandler,
        '/client/lead/referrers': admiinHandlers.getUploadKeyHandler,
    },
    PUT: {
        '/client/me': admiinHandlers.updateProfile,
    },
    POST: {
        '/client/me/change-password': admiinHandlers.changePassword,
        '/client/me/activate': admiinHandlers.activateAccount,
    },
    
};
