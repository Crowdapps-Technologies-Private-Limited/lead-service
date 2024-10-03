import { APIGatewayProxyEventBase, APIGatewayEventDefaultAuthorizerContext, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../../utils/logger';
import { getAllNotesByLead } from '../services';
import { ResponseHandler } from '../../utils/ResponseHandler';
import { getMessage } from '../../utils/errorMessages';
import { checkPermission } from '../../utils/checkPermission';

export const getAllNotesHandler = async (
    event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>,
): Promise<APIGatewayProxyResult> => {
    logger.info('getAllNotesHandler event:', { event });

    try {
        const lead_id = event.pathParameters?.id;
        const tenant = (event.requestContext as any).tenant;
        const user = (event.requestContext as any).user;
        if (!lead_id) {
            return ResponseHandler.badRequestResponse({ message: 'Lead ID is required.' });
        }

        // Check permission
        const hasPermission = await checkPermission(user.role, 'Feedback', 'read', tenant.schema);
        if (!hasPermission) {
            return ResponseHandler.forbiddenResponse({ message: getMessage('PERMISSION_DENIED') });
        }

        // Fetch all notes by lead_id
        const notes = await getAllNotesByLead(lead_id, tenant);

        return ResponseHandler.successResponse({ message: getMessage('NOTES_FETCHED'), data: notes });
    } catch (error: any) {
        logger.error('Error in getAllNotesHandler:', { error });
        return ResponseHandler.badRequestResponse({ message: error.message });
    }
};
