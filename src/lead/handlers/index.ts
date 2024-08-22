import { addLeadHandler } from './addLeadHandler';
import { assignSurveyorHandler } from './assignSurveyorHandler';
import { editEstimateHandler } from './editEstimateHandler';
import { editLeadHandler } from './editLeadHandler';
import { addEstimateHandler } from './estimateHandler';
import { estimateSendEmailHandler } from './estimateSendEmailHandler';
import { getAllSurveysHandler } from './getAllSurveysHandler';
import { getDistanceHandler } from './getDistanceHandler';
import { getItemListBySurveyHandler } from './getItemListBySurveyHandler';
import { getLatestEstimatesHandler } from './getLatestEstimatesHandler';
import { getLeadListForSurveyHandler } from './getLeadListForSurveyHandler';
import { getLeadListHandler } from './getLeadListHandler';
import { getLinkedItemListHandler } from './getLinkedItemListHandler';
import { getLogListByLeadHandler } from './getLogListByLeadHandler';
import { getMaterialItemsHandler } from './getMaterialItemsHandler';
import { getReferrerListHandler } from './getReferrerListHandler';
import { getRoomListHandler } from './getRoomListHandler';
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
    editLeadHandler,
    getDistanceHandler,
    addEstimateHandler,
    getLatestEstimatesHandler,
    editEstimateHandler,
    sendEmailHandler,
    estimateSendEmailHandler,
    getRoomListHandler,
    getLinkedItemListHandler,
    getItemListBySurveyHandler,
    getMaterialItemsHandler,
    assignSurveyorHandler,
    getSurveyorListHandler,
    getLeadListForSurveyHandler, 
    getAllSurveysHandler,
    getSurveyByIdHandler,
};

export default authHandlers;
