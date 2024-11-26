import { RouteHandler } from '../types/interfaces';
import adminHandlers from './handlers';

export const adminRoutes: { [key: string]: { [key: string]: RouteHandler } } = {
    GET: {
        '/leads/referrers': adminHandlers.getReferrerListHandler,
        '/leads': adminHandlers.getLeadListHandler,
        '/leads/{id}': adminHandlers.getSingleLeadHandler,
        '/leads/{id}/audit': adminHandlers.getLogListByLeadHandler,
        '/leads/{id}/estimates': adminHandlers.getLatestEstimatesHandler,
        '/leads/{id}/estimate-send-email/{estimateId}': adminHandlers.estimateSendEmailHandler,
        '/leads/surveyors': adminHandlers.getSurveyorListHandler,
        '/leads/surveys': adminHandlers.getAllSurveysHandler,
        '/leads/surveys/{id}': adminHandlers.getSurveyByIdHandler,
        '/leads/{id}/quotes': adminHandlers.getLatestQuotesHandler,
        '/leads/{id}/previous-quotes': adminHandlers.getSecondLatestQuotesHandler,
        '/leads/{id}/quote-send-email/{quoteId}': adminHandlers.quoteSendEmailHandler,
        '/leads/{id}/confirmation-tooltip': adminHandlers.getConfirmationTooltipHandler,
        '/leads/{id}/confirmation': adminHandlers.getConfirmationHandler,
        '/leads/jobs': adminHandlers.jobsListHandler,
        '/leads/{id}/feedback': adminHandlers.getFeedbackResponseHandler,
        '/leads/{id}/notes': adminHandlers.getAllNotesHandler,
    },
    PUT: {
        '/leads/{id}': adminHandlers.editLeadHandler,
        '/leads/{id}/send-email': adminHandlers.sendEmailHandler,
    },
    POST: {
        '/leads/{id}/audit': adminHandlers.addManualLogHandler,
        '/leads/{id}/feedback': adminHandlers.sendFeedbackEmailHandler,
        '/leads/change-status': adminHandlers.changeLeadStatusHandler,
        '/leads/{id}/confirmation': adminHandlers.updateConfirmationHandler,
        '/leads/{id}/confirmation-tooltip': adminHandlers.updateConfirmationTooltipHandler,
        '/leads': adminHandlers.addLeadHandler,
        '/leads/bulk-import': adminHandlers.importLeadHandler,
        '/leads/{id}/estimates': adminHandlers.addEstimateHandler,
        '/leads/distance': adminHandlers.getDistanceHandler,
        '/leads/{id}/assign-surveyor': adminHandlers.assignSurveyorHandler,
        '/leads/{id}/quotes': adminHandlers.addQuoteHandler,
    },
};
