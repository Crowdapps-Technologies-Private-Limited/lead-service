import { addLeadHandler } from './addLeadHandler';
import { assignSurveyorHandler } from './assignSurveyorHandler';
import { editLeadHandler } from './editLeadHandler';
import { addEstimateHandler } from './estimateHandler';
import { estimateSendEmailHandler } from './estimateSendEmailHandler';
import { getAllSurveysHandler } from './getAllSurveysHandler';
import { getDistanceHandler } from './getDistanceHandler';
import { getLatestEstimatesHandler } from './getLatestEstimatesHandler';
import { getLeadListHandler } from './getLeadListHandler';
import { getLogListByLeadHandler } from './getLogListByLeadHandler';
import { getReferrerListHandler } from './getReferrerListHandler';
import { getSingleLeadHandler } from './getSingleLeadHandler';
import { getSurveyByIdHandler } from './getSurveyByIdHandler';
import { getSurveyorListHandler } from './getSurveyorListHandler';
import { sendEmailHandler } from './sendEmailHandler';

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
    editLeadHandler
};

export default authHandlers;
