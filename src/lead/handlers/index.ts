import { getProfile } from './getProfileHandler';
import { updateProfile } from './updateProfileHandler';
import { changePassword } from './changePasswordHandler';
import { getUploadKeyHandler } from './getUploadKeyHandler';
import { activateAccount } from './activateAccountHandler';

const authHandlers = {
    getProfile,
    updateProfile,
    changePassword,
    getUploadKeyHandler,
    activateAccount
};

export default authHandlers;
