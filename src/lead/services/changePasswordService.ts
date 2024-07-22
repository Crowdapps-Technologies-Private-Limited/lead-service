import AWS from 'aws-sdk';

const { CognitoIdentityServiceProvider } = AWS;
const cognito = new CognitoIdentityServiceProvider();

export const changeUserPassword = async (accessToken: string, previousPassword: string, proposedPassword: string, tenant: any) => {
    try {
        if(tenant?.is_suspended){
            throw new Error('Tenant is suspended');
        }
        // Change user password in Cognito
        try {
            await cognito
            .changePassword({
                AccessToken: accessToken,
                PreviousPassword: previousPassword,
                ProposedPassword: proposedPassword,
            })
            .promise();
        } catch (error) {
            throw new Error(`Please! check your current password and try again`);
        }

        return { message: 'Password changed successfully' };
    } catch (error: any) {
        throw new Error(`Failed to change password: ${error.message}`);
    }
};
