import { addLeadHandler } from './addLeadHandler';
import { addQuoteHandler } from './addQuoteHandler';
import { assignSurveyorHandler } from './assignSurveyorHandler';
import { editLeadHandler } from './editLeadHandler';
import { addEstimateHandler } from './estimateHandler';
import { estimateSendEmailHandler } from './estimateSendEmailHandler';
import { getAllSurveysHandler } from './getAllSurveysHandler';
import { getConfirmationTooltipHandler } from './getConfirmationTooltipHandler';
import { getDistanceHandler } from './getDistanceHandler';
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
import { sendConfirmationHandler } from './sendConfirmationHandler';
import { sendEmailHandler } from './sendEmailHandler';
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
    sendConfirmationHandler,
    getConfirmationTooltipHandler,
    updateConfirmationTooltipHandler
};

export default authHandlers;
