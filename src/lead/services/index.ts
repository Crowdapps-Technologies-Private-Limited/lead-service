import { addManualLogAndChangeLeadStatus } from './addManualLog';
import { changeLeadStatusService } from './changeLeadStatusService';
import { getAllNotesByLead } from './getAllNotesService';
import { sendFeedbackEmail } from './sendFeedbackMail';
import { getFeedbackResponseByLead } from './getFeedbackService';
import { getJobsList } from './getJobsListService';
import { updateConfirmationByClient } from './updateConfirmationByClient';
import { getConfirmation } from './getConfirmationService';
import { getOwnSurveys } from './getOwnSurveyService';
import { getLatestEstimates } from './getLatestEstimates ';
import { addOrUpdateEstimate } from './addEstimate';
import { addLead } from './addLeadService';
import { getAllReferrers } from './getReferrerListService';
import { getAllLeads } from './getLeadListService';
import { getLeadById } from './getLeadByIdService';
import { getAllLogsByLead } from './getLogListService';
import { editLead } from './editLeadService';
import { sendLeadEmail } from './sendLeadEmailService';
import { sendEstimateEmail } from './estimateSendLeadEmailService';
import { assignSurveyor } from './assignSurveyorOnLead';
import { getAllSurveyors } from './getSurveyorListService';
import { getSurveyById } from './getSurveyByIdSrevice';
import { getAllSurveys } from './getAllSurveysService';
import { addOrUpdateQuote } from './addQuote';
import { getLatestQuote } from './getLatestQuotes';
import { sendQuoteEmailOrPdf } from './quoteSendLeadEmailOrPdfService';
import { downloadSecondLatestQuote } from './getSecondLatestQuotes';
import { getConfirmationTooltipDetails } from './getConfirmationTooltipService';
import { updateConfirmationTooltipDetails } from './updateConfirmationTooltipService';

// Removed incomplete import statement

export {
    addLead,
    getAllReferrers,
    getAllLeads,
    getLeadById,
    getAllLogsByLead,
    editLead,
    addOrUpdateEstimate,
    getLatestEstimates,
    sendLeadEmail,
    sendEstimateEmail,
    assignSurveyor,
    getAllSurveyors,
    getSurveyById,
    getAllSurveys,
    addOrUpdateQuote,
    getLatestQuote,
    sendQuoteEmailOrPdf,
    downloadSecondLatestQuote,
    getOwnSurveys,
    getConfirmationTooltipDetails,
    updateConfirmationTooltipDetails,
    getConfirmation,
    updateConfirmationByClient,
    getJobsList,
    getFeedbackResponseByLead,
    sendFeedbackEmail,
    getAllNotesByLead,
    changeLeadStatusService,
    addManualLogAndChangeLeadStatus,
};
