import { addLeadHandler } from './addLeadHandler';
import { editEstimateHandler } from './editEstimateHandler';
import { editLeadHandler } from './editLeadHandler';
import { addEstimateHandler } from './estimateHandler';
import { getDistanceHandler } from './getDistanceHandler';
import { getLatestEstimatesHandler } from './getLatestEstimatesHandler';
import { getLeadListHandler } from './getLeadListHandler';
import { getLogListByLeadHandler } from './getLogListByLeadHandler';
import { getReferrerListHandler } from './getReferrerListHandler';
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
    sendEmailHandler
};

export default authHandlers;
