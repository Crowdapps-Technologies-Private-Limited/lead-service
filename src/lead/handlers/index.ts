import { addLeadHandler } from './addLeadHandler';
import { addSurveyTab1Handler } from './addSurveyTab1Handler';
import { addSurveyTab2Handler } from './addSurveyTab2Handler';
import { addSurveyTab3Handler } from './addSurveyTab3Handler';
import { editEstimateHandler } from './editEstimateHandler';
import { editLeadHandler } from './editLeadHandler';
import { addEstimateHandler } from './estimateHandler';
import { estimateSendEmailHandler } from './estimateSendEmailHandler';
import { getDistanceHandler } from './getDistanceHandler';
import { getLatestEstimatesHandler } from './getLatestEstimatesHandler';
import { getLeadListHandler } from './getLeadListHandler';
import { getLinkedItemListHandler } from './getLinkedItemListHandler';
import { getLogListByLeadHandler } from './getLogListByLeadHandler';
import { getReferrerListHandler } from './getReferrerListHandler';
import { getRoomListHandler } from './getRoomListHandler';
import { getSingleLeadHandler } from './getSingleLeadHandler';
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
};

export default authHandlers;
