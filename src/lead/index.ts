import { RouteHandler, Routes } from '../types/interfaces';
import admiinHandlers from './handlers';

export const adminRoutes: { [key: string]: { [key: string]: RouteHandler } } = {
    GET: {
    },
    PUT: {
    },
    POST: {
        '/client/leads': admiinHandlers.addLeadHandler,
    },
    
};
