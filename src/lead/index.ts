import { RouteHandler, Routes } from '../types/interfaces';
import admiinHandlers from './handlers';

export const adminRoutes: { [key: string]: { [key: string]: RouteHandler } } = {
    GET: {
       '/leads/referrers': admiinHandlers.getReferrerListHandler, 
       '/leads': admiinHandlers.getLeadListHandler,
       '/leads/{id}': admiinHandlers.getLeadListHandler,
    },
    PUT: {
        '/leads/{id}': admiinHandlers.addLeadHandler,
    },
    POST: {
        '/leads': admiinHandlers.addLeadHandler,
    },
    
};
