import { addLeadHandler } from './addLeadHandler';
import { getLeadListHandler } from './getLeadListHandler';
import { getReferrerListHandler } from './getReferrerListHandler';
import { getSingleLeadHandler } from './getSingleLeadHandler';

const authHandlers = {
    addLeadHandler,
    getReferrerListHandler,
    getLeadListHandler,
    getSingleLeadHandler,
};

export default authHandlers;
