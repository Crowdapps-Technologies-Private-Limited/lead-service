import { getDistanceHandler } from './handlers/getDistanceHandler';
import { RouteHandler } from '../types/interfaces';
import admiinHandlers from './handlers';

export const adminRoutes: { [key: string]: { [key: string]: RouteHandler } } = {
    GET: {
        '/leads/referrers': admiinHandlers.getReferrerListHandler,
        '/leads/rooms': admiinHandlers.getRoomListHandler,
        '/leads/linked-items': admiinHandlers.getLinkedItemListHandler,
        '/leads': admiinHandlers.getLeadListHandler,
        '/leads/{id}': admiinHandlers.getSingleLeadHandler,
        '/leads/{id}/audit': admiinHandlers.getLogListByLeadHandler,
        '/leads/{id}/estimates': admiinHandlers.getLatestEstimatesHandler,
        '/leads/{id}/estimate-send-email/{estimateId}': admiinHandlers.estimateSendEmailHandler,
        // '/leads/{id}/get-items/{surveyId}': admiinHandlers.getItemListBySurveyHandler,
        // '/leads/{id}/material-items': admiinHandlers.getMaterialItemsHandler,
        '/leads/surveyors': admiinHandlers.getSurveyorListHandler,
        '/leads/surveys': admiinHandlers.getAllSurveysHandler,
        '/leads/surveys/{id}': admiinHandlers.getSurveyByIdHandler,
    },
    PUT: {
        // '/leads/{id}': admiinHandlers.editLeadHandler,
        '/leads/{id}': admiinHandlers.editLeadHandler,
        '/leads/estimates/{estimateId}': admiinHandlers.editEstimateHandler,
        '/leads/{id}/estimates': admiinHandlers.editEstimateHandler,
        '/leads/{id}/send-email': admiinHandlers.sendEmailHandler,
    },
    POST: {
        '/leads': admiinHandlers.addLeadHandler,
        '/leads/{id}/estimates': admiinHandlers.addEstimateHandler,
        '/leads/distance': admiinHandlers.getDistanceHandler,
        // '/leads/{id}/add-survey-tab1': admiinHandlers.addSurveyTab1Handler,
        // '/leads/{id}/add-survey-tab2': admiinHandlers.addSurveyTab2Handler,
        // '/leads/{id}/add-survey-tab3': admiinHandlers.addSurveyTab3Handler,
        '/leads/{id}/assign-surveyor': admiinHandlers.assignSurveyorHandler,
    },
};
