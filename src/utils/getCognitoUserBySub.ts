import AWS from 'aws-sdk';
import { InputUser, OutputUser, UserAttributes } from '../types/interfaces';

// Set AWS region
AWS.config.update({ region: 'eu-west-2' });

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const transformUser = (inputUser: InputUser): OutputUser => {
    const attributes: UserAttributes = inputUser.Attributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
    }, {} as UserAttributes);

    return {
        Enabled: inputUser.Enabled,
        UserStatus: inputUser.UserStatus,
        email: attributes['email'],
        email_verified: attributes['email_verified'],
        name: attributes['name'],
        role: attributes['custom:role'],
        sub: attributes['sub'],
        tenant_id: attributes['custom:tenant_id'],
    };
};

export const getUserBySub = async ({ userPoolId, sub }: { userPoolId: string; sub: string }) => {
    try {
        const params = {
            UserPoolId: userPoolId,
            Filter: `sub = "${sub}"`,
            Limit: 1,
        };

        const result = await cognitoIdentityServiceProvider.listUsers(params).promise();

        if (result.Users && result.Users.length > 0) {
            return transformUser(result.Users[0] as InputUser);
        } else {
            throw new Error('User not found');
        }
    } catch (error: any) {
        throw new Error(`Error fetching user: ${error.message}`);
    }
};
