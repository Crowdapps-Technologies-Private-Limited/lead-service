import { addLeadHandler } from './addLeadHandler';
import { addManualLogHandler } from './addManualLogHandler';
import { addQuoteHandler } from './addQuoteHandler';
import { assignSurveyorHandler } from './assignSurveyorHandler';
import { changeLeadStatusHandler } from './changeLeadStatusHandler';
import { editLeadHandler } from './editLeadHandler';
import { addEstimateHandler } from './estimateHandler';
import { estimateSendEmailHandler } from './estimateSendEmailHandler';
import { getAllNotesHandler } from './getAllNotesHandler';
import { getAllSurveysHandler } from './getAllSurveysHandler';
import { getConfirmationHandler } from './getConfirmationHandler';
import { getConfirmationTooltipHandler } from './getConfirmationTooltipHandler';
import { getDistanceHandler } from './getDistanceHandler';
import { getFeedbackResponseHandler } from './getFeedbackResponseHandler';
import { jobsListHandler } from './getJobListHandler';
import { getLatestEstimatesHandler } from './getLatestEstimatesHandler';
import { getLatestQuotesHandler } from './getLatestQuotesHandler';
import { getLeadListHandler } from './getLeadListHandler';
import { getLogListByLeadHandler } from './getLogListByLeadHandler';
import { getReferrerListHandler } from './getReferrerListHandler';
import { getSecondLatestQuotesHandler } from './getSecondLatestQuotesHandler';
import { getSingleLeadHandler } from './getSingleLeadHandler';
import { getSurveyByIdHandler } from './getSurveyByIdHandler';
import { getSurveyorListHandler } from './getSurveyorListHandler';
import { quoteSendEmailHandler } from './quoteSendEmailHandler';
import { sendEmailHandler } from './sendEmailHandler';
import { sendFeedbackEmailHandler } from './sendFeedbackEmailHandler';
import { updateConfirmationHandler } from './updateConfirmationHandler';
import { updateConfirmationTooltipHandler } from './updateConfirmationTooltipHandler';

const authHandlers = {
    addLeadHandler,
    getReferrerListHandler,
    getLeadListHandler,
    getSingleLeadHandler,
    getLogListByLeadHandler,
    getDistanceHandler,
    addEstimateHandler,
    getLatestEstimatesHandler,
    sendEmailHandler,
    estimateSendEmailHandler,
    assignSurveyorHandler,
    getSurveyorListHandler,
    getAllSurveysHandler,
    getSurveyByIdHandler,
    editLeadHandler,
    addQuoteHandler,
    getLatestQuotesHandler,
    quoteSendEmailHandler,
    getSecondLatestQuotesHandler,
    getConfirmationTooltipHandler,
    updateConfirmationTooltipHandler,
    getConfirmationHandler,
    updateConfirmationHandler,
    jobsListHandler,
    getFeedbackResponseHandler,
    sendFeedbackEmailHandler,
    getAllNotesHandler,
    changeLeadStatusHandler,
    addManualLogHandler,
};

export default authHandlers;
