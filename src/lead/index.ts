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
        '/leads/{id}/estimate-send-email/{estimateId}': admiinHandlers.estimateSendEmailHandler,
        '/leads/surveyors': admiinHandlers.getSurveyorListHandler,
        '/leads/surveys': admiinHandlers.getAllSurveysHandler,
        '/leads/surveys/{id}': admiinHandlers.getSurveyByIdHandler,
        '/leads/{id}/quotes': admiinHandlers.getLatestQuotesHandler,
        '/leads/{id}/previous-quotes': admiinHandlers.getSecondLatestQuotesHandler,
        '/leads/{id}/quote-send-email/{quoteId}': admiinHandlers.sendConfirmationHandler,
        '/leads/{id}/confirmation-tooltip': admiinHandlers.getConfirmationTooltipHandler,
        '/leads/{id}/confirmation': admiinHandlers.getConfirmationHandler,
        '/leads/{id}/task-form-data': admiinHandlers.getCreateTaskFormDataHandler,
    },
    PUT: {
        '/leads/{id}': admiinHandlers.editLeadHandler,
        '/leads/{id}/send-email': admiinHandlers.sendEmailHandler,
    },
    POST: {
        '/leads/{id}/confirmation': admiinHandlers.updateConfirmationHandler,
        '/leads/{id}/confirmation-tooltip': admiinHandlers.updateConfirmationTooltipHandler,
        '/leads': admiinHandlers.addLeadHandler,
        '/leads/{id}/estimates': admiinHandlers.addEstimateHandler,
        '/leads/distance': admiinHandlers.getDistanceHandler,
        '/leads/{id}/assign-surveyor': admiinHandlers.assignSurveyorHandler,
        '/leads/{id}/quotes': admiinHandlers.addQuoteHandler,
    },
};
