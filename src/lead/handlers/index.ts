import { addLeadHandler } from './addLeadHandler';
import { addSurveyTab1Handler } from './addSurveyTab1Handler';
import { addSurveyTab2Handler } from './addSurveyTab2Handler';
import { addSurveyTab3Handler } from './addSurveyTab3Handler';
import { assignSurveyorHandler } from './assignSurveyorHandler';
import { editEstimateHandler } from './editEstimateHandler';
import { editLeadHandler } from './editLeadHandler';
import { addEstimateHandler } from './estimateHandler';
import { estimateSendEmailHandler } from './estimateSendEmailHandler';
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
    addSurveyTab1Handler,
    addSurveyTab2Handler,
    addSurveyTab3Handler,
    getItemListBySurveyHandler,
    getMaterialItemsHandler,
    assignSurveyorHandler,
    getSurveyorListHandler,
    getLeadListForSurveyHandler
};

export default authHandlers;
