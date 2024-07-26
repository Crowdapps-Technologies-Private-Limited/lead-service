import { getDistanceHandler } from './handlers/getDistanceHandler';
import { getDistanceBetweenPostcodes } from './../utils/googlemap';
import { RouteHandler, Routes } from '../types/interfaces';
import admiinHandlers from './handlers';

export const adminRoutes: { [key: string]: { [key: string]: RouteHandler } } = {
    GET: {
       '/leads/referrers': admiinHandlers.getReferrerListHandler, 
       '/leads': admiinHandlers.getLeadListHandler,
       '/leads/{id}': admiinHandlers.getSingleLeadHandler,
       '/leads/{id}/audit': admiinHandlers.getLogListByLeadHandler,
    },
    PUT: {
        '/leads/{id}': admiinHandlers.editLeadHandler,
    },
    POST: {
        '/leads': admiinHandlers.addLeadHandler,
        '/leads/distance': admiinHandlers.getDistanceHandler,
    },
    
};
