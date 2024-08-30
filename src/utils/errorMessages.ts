export const getMessage = (template: any, systemErr?: any): string => {
    // return systemErr;
    switch (template) {
        case "TOKEN_INVALID":
            return 'Token not verified.';
        case "PERMISSION_DENIED":
            return 'Permission denied.';
        case "ACCOUNT_NOT_ACTIVE":
            return 'Your account is deactivated. Kindly ask the admin to reactivate your account!';
        case "ACCOUNT_DELETED":
            return 'Your account is deleted. Kindly ask the admin!';
        case "ACCOUNT_PENDING":
                return 'Please activate your acount!';
        case "ACCOUNT_SUSPENDED":
            return 'Your account is suspended. Kindly ask the admin to reactivate your account!';
        case "INCORRECT_CURRENT_PASSWORD":
            return 'Please! check your current password and try again.';
        case "PASSWORD_CHANGED_ACTIVATE":
            return 'Password changed and user attributes updated successfully.';
        case "PASSWORD_UPDATED":
                return 'Password updated successfully.';
        case "LEAD_ADDED":
            return "Lead added successfully.";
        case "LEAD_UPDATED":
            return "Lead updated successfully.";
        case "LEAD_DELETED":
            return "Lead deleted successfully.";
        case "LEAD_FETCHED":
            return "Lead data fetched successfully.";
        case "LEAD_NOT_FOUND":
            return "Lead not found.";
        case "LEAD_LIST_FETCHED":
            return "Lead list fetched successfully.";
        case "LEAD_ACTIVITY_FETCHED":
            return "Lead activities fetched successfully.";
        case "LEAD_ID_REQUIRED":
            return "Lead ID is required in path parameters.";

        case "QUOTE_ADDED":
            return "Quote added successfully.";
        case "QUOTE_UPDATED":
            return "Quote updated successfully.";



        case "USER_NOT_FOUND":
            return 'User not found.';
        case "USER_DELETED":
            return 'User is deleted successfully.';
        case "USER_ADDED":
            return 'User is added successfully.';
        case "USER_FETCHED":
            return 'User data fetched successfully.';
        case "USER_EDITED":
            return 'User is updated successfully.';
        case "USER_NOT_ACIVATED":
            return `User's account is not activated yet.`;
        case "USER_PROFILE_UPDATED":
            return `User profile updated successfully.`;
        case "USER_PROFILE_FETCHED":
            return `User profile fetched successfully.`;
        case "MISSING_REQUIRED_PARAMS":
            return 'Missing required parameters.';
        case "ACCOUNT_ALREADY_ACTIVE":
            return 'Account is already active.';
        case "EMAIL_TEMPLATE_ADDED":
            return 'Email template added successfully.';
        case "EMAIL_TEMPLATE_EDITED":
            return 'Email template updated successfully.';
        case "EMAIL_TEMPLATE_FETCHED":
            return 'Email template fetched successfully.';
        case "EMAIL_TEMPLATE_NOT_FOUND":
            return 'Email template not found.';
        case "EMAIL_TEMPLATE_DELETED":
            return 'Email template deleted successfully.';
        case "EVENT_ADDED":
            return 'Event added successfully.';
        case "EVENT_EDITED":
            return 'Event updated successfully.';
        case "EVENT_DELETED":
            return 'Event deleted successfully.';
        case "SMS_TEMPLATE_ADDED":
            return 'SMS template added successfully.';
        case "SMS_TEMPLATE_EDITED":
                return 'SMS template updated successfully.';
        case "SMS_TEMPLATE_DELETED":
            return 'SMS template deleted successfully.';
        case "SMS_TEMPLATE_FETCHED":
            return 'SMS template fetched successfully.';
        case "SMS_TEMPLATE_NOT_FOUND":
            return 'SMS template not found.';
        case "ROLE_PERMISSION_ASSIGNED":
            return 'Permission assigned to role successfully.';
        case "FEATURE_CREATED":
            return 'Feature created successfully.';
        case "FEATURE_DELETED":
                return 'Feature deleted successfully.';
        case "MODULE_CREATED":
            return 'Module created successfully.';

        
  
        default:
        return "";
    }
}

export const getErrorMessage = (template: string, systemErr: string): string => {
    // return systemErr;
    switch (template) {
        case "ADD_CLIENT":
            return `Failed to add client due to ${systemErr}`;
        case "DELETE_CLIENT":
            return `Failed to delete client due to ${systemErr}`;
        case "EDIT_CLIENT":
            return `Failed to update client due to ${systemErr}`;
        case "CLIENT_FETCH":
            return `Failed to fetch client details due to ${systemErr}`;
        case "CLIENT_FETCH_LIST":
            return `Failed to fetch client list due to ${systemErr}`;
        case "CLIENT_FETCH_ACTIVITY":
            return `Failed to fetch client's activities due to ${systemErr}`;
        default:
            return "";
    }
}
