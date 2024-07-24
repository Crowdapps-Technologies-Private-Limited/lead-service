import { RouteHandler, Routes } from '../types/interfaces';
import admiinHandlers from './handlers';

export const adminRoutes: { [key: string]: { [key: string]: RouteHandler } } = {
    GET: {
       '/leads/referrers': admiinHandlers.getReferrerListHandler, 
       '/leads': admiinHandlers.getLeadListHandler,
       '/leads/{id}': admiinHandlers.getSingleLeadHandler,
    },
    PUT: {
        '/leads/{id}': admiinHandlers.addLeadHandler,
    },
    POST: {
        '/leads': admiinHandlers.addLeadHandler,
    },
    
};
