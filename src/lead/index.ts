import { getDistanceHandler } from './handlers/getDistanceHandler';
import { RouteHandler } from '../types/interfaces';
import admiinHandlers from './handlers';

export const adminRoutes: { [key: string]: { [key: string]: RouteHandler } } = {
    GET: {
        '/leads/referrers': admiinHandlers.getReferrerListHandler,
        '/leads': admiinHandlers.getLeadListHandler,
        '/leads/{id}': admiinHandlers.getSingleLeadHandler,
        '/leads/{id}/audit': admiinHandlers.getLogListByLeadHandler,
        '/leads/{id}/estimates': admiinHandlers.getLatestEstimatesHandler,
    },
    PUT: {
        '/leads/{id}': admiinHandlers.editLeadHandler,
        '/leads/{id}/estimates/{estimateId}': admiinHandlers.editEstimateHandler,
        '/leads/{id}/send-email': admiinHandlers.sendEmailHandler,
    },
    POST: {
        '/leads': admiinHandlers.addLeadHandler,
        '/leads/{id}/estimates': admiinHandlers.addEstimateHandler,
        '/leads/distance': admiinHandlers.getDistanceHandler,
    },
};
