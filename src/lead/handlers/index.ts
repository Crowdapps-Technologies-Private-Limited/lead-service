import { addLeadHandler } from './addLeadHandler';
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
};

export default authHandlers;
