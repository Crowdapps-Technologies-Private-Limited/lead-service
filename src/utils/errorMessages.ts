export const getMessage = (template: any, systemErr?: any): string => {
    // return systemErr;
    switch (template) {
        case 'TOKEN_INVALID':
            return 'Token not verified.';
        case 'PERMISSION_DENIED':
            return 'Permission denied.';
        case 'ACCOUNT_NOT_ACTIVE':
            return 'Your account is deactivated. Kindly ask the admin to reactivate your account!';
        case 'ACCOUNT_DELETED':
            return 'Your account is deleted. Kindly ask the admin!';
        case 'ACCOUNT_PENDING':
            return 'Please activate your acount!';
        case 'ACCOUNT_SUSPENDED':
            return 'Your account is suspended. Kindly ask the admin to reactivate your account!';
        case 'PASSWORD_CHANGED_ACTIVATE':
            return 'Password changed and user attributes updated successfully.';
        case 'PASSWORD_UPDATED':
            return 'Password updated successfully.';
        case 'LEAD_ADDED':
            return 'Lead added successfully.';
        case 'LEAD_UPDATED':
            return 'Lead updated successfully.';
        case 'LEAD_DELETED':
            return 'Lead deleted successfully.';
        case 'LEAD_FETCHED':
            return 'Lead data fetched successfully.';
        case 'LEAD_NOT_FOUND':
            return 'Lead not found.';
        case 'LEAD_LIST_FETCHED':
            return 'Lead list fetched successfully.';
        case 'LEAD_LOG_LIST_FETCHED':
            return 'Log list fetched successfully.';
        case 'REFERRER_LIST_FETCHED':
            return 'Referrer list fetched successfully.';
        case 'LEAD_ACTIVITY_FETCHED':
            return 'Lead activities fetched successfully.';
        case 'LEAD_ID_REQUIRED':
            return 'Lead ID is required in path parameters.';
        case 'LEAD_SURVEY_EXIST':
            return 'Survey already exists for this lead.';
        case 'DISTANCE_CALCULATED':
            return 'Distance calculated successfully.';
        case 'DISTANCE_CALCULATION_FAILED':
            return 'Error calculating distance.';

        case 'ESTIMATE_ADDED':
            return 'Estimate added successfully.';
        case 'ESTIMATE_UPDATED':
            return 'Estimate updated successfully.';
        case 'ESTIMATE_ID_LEAD_ID_REQUIRED':
            return 'Estimate ID and Lead ID are required in path parameters.';
        case 'PDF_GENERATED':
            return 'PDF generated successfully.';
        case 'EMAIL_SENT':
            return 'Email sent successfully.';
        case 'ESTIMATE_FETCHED':
            return 'Estimate fetched successfully.';
        case 'ESTIMATE_NOT_FOUND':
            return 'Estimate not found.';
        case 'QUOTE_ADDED':
            return 'Quote added successfully.';
        case 'QUOTE_UPDATED':
            return 'Quote updated successfully.';
        case 'QUOTE_ID_LEAD_ID_REQUIRED':
            return 'Quote ID and Lead ID are required in path parameters.';
        case 'QUOTE_FETCHED':
            return 'Quotation fetched successfully.';
        case 'QUOTE_NOT_FOUND':
            return 'Quotation not found.';
        case 'PREV_QUOTE_NOT_FOUND':
            return 'No previous quotation found.';
        case 'PREV_QUOTE_PDF_GENERATED':
            return 'Previous quotation PDF of the lead generated successfully.';
        case 'LEAD_STATUS_NOT_ALLOWED':
            return 'Lead is not allowed for this operation as stage already passed.';

        case 'SURVEYOR_NOT_FOUND':
            return 'Surveyor not found.';
        case 'SURVEYOR_LIST_FETCHED':
            return 'Surveyor list fetched successfully.';
        case 'NO_SURVEYOR_AVAILABILITY':
            return 'No surveyor available in the given time range.';
        case 'SURVEYOR_ASSIGNED':
            return 'Surveyor assigned successfully.';
        case 'SURVEY_LIST_FETCHED':
            return 'Survey list fetched successfully.';
        case 'SURVEY_ID_REQUIRED':
            return 'Survey ID is required in path parameters.';
        case 'TEMPLATE_NO_FOUND':
            return 'Email template not found.';
        case 'NOT_VALID_START_TIME':
            return `Survey start time must be before the lead's packing on date or moving on date`;
        case 'NOT_VALID_END_TIME':
            return `Survey end time must be before the lead's packing on date or moving on date`;
        case 'SURVEY_FETCHED':
            return 'Survey fetched successfully.';
        case 'CONFIRMATION_TOOLTIP_FETCHED':
            return 'Details fetched successfully.';
        case 'CONFIRMATION_TOOLTIP_UPDATED':
            return 'Details updated successfully.';
        case 'CONFIRMATION_NOT_FOUND':
            return 'Confirmation not found.';
        case 'CONFIRMATION_UPDATED':
            return 'Thankyou for submitting your confirmation.';
        case 'CONFIRMATION_SUBMITTED':
            return "Thankyou! Your confirmation is already submitted. You can't update it now.";
        case 'SERVICE_NOT_AVAILABLE':
            return 'Service unavailable.';
        case 'INCORRECT_CURRENT_PASSWORD':
            return 'Please! check your current password and try again.';
        case 'INFO_FETCHED':
            return 'Details fetched successfully.';
        case 'CUSTOMER_PASSWORD_NOT_FOUND':
            return 'Customer password not found.';
        case 'LEAD_IS_NOT_IN_QUOTE_STATUS':
            return 'Lead is not in quote state.';
        case 'JOB_NOT_FOUND':
            return 'Job not found.';
        case 'CONFIRMATION_ID_REQUIRED':
            return 'Confirmation ID is required in query parameters.';
        case 'PASSWORD_NOT_FOUND':
            return 'Password not found.';
        case 'FEEDBACK_EMAIL_SENT':
            return 'Feedback email sent successfully';
        case 'NOTES_FETCHED':
            return 'Notes fetched successfully';
        case 'LEAD_STATUS_UPDATED':
            return 'Lead status updated successfully.';
        case 'LOG_ENTRY_ADDED':
            return 'Log entry added successfully.';
        case 'INVALID_MOVING_DATE_OR_TIME':
            return 'Invalid moving date and time';
        case 'INVALID_PACKING_DATE_OR_TIME':
            return 'Invalid packing date and time';
        case 'LEAD_ALREADY_COMPLETED':
            return 'Lead already completed';
        case 'LATEST_LEAD_NOT_COMPLETED':
            return 'Latest lead of the customer is not completed yet';
        default:
            return '';
    }
};

export const getErrorMessage = (template: string, systemErr: string): string => {
    // return systemErr;
    switch (template) {
        case 'ADD_CLIENT':
            return `Failed to add client due to ${systemErr}`;
        case 'DELETE_CLIENT':
            return `Failed to delete client due to ${systemErr}`;
        case 'EDIT_CLIENT':
            return `Failed to update client due to ${systemErr}`;
        case 'CLIENT_FETCH':
            return `Failed to fetch client details due to ${systemErr}`;
        case 'CLIENT_FETCH_LIST':
            return `Failed to fetch client list due to ${systemErr}`;
        case 'CLIENT_FETCH_ACTIVITY':
            return `Failed to fetch client's activities due to ${systemErr}`;
        case 'CUSTOMER_NOT_FOUND':
            return 'Customer not found.';
        case 'NOTES_NOT_FETCHED':
            return `Failed to fetch notes due to ${systemErr}`;
        default:
            return '';
    }
};
