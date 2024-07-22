import AWS from 'aws-sdk';
import { Config } from '../types/interfaces';

interface Parameter {
    Name: string;
    Value: string;
}

const getAllParameters = async (): Promise<Parameter[]> => {
    const ssm = new AWS.SSM();
    const params: AWS.SSM.GetParametersByPathRequest = {
        Path: '/appclient/mmym/', // Update with your parameter path
        WithDecryption: true,
        Recursive: true,
    };

    let allParameters: Parameter[] = [];
    let nextToken: string | undefined;

    do {
        const data = await ssm.getParametersByPath({ ...params, NextToken: nextToken }).promise();
        allParameters = allParameters.concat(
            data.Parameters!.map((parameter) => ({
                Name: parameter.Name!,
                Value: parameter.Value!,
            })),
        );
        nextToken = data.NextToken;
    } while (nextToken);

    return allParameters;
};

/*creating closure function to get config
 the getConfig function will only call getAllParameters 
 when the parameters are null, and will use the cached parameters for subsequent calls.
*/

export const createConfigGetter = () => {
    let parameters: Parameter[] | null = null;

    const getConfig = async (): Promise<Config> => {
        if (parameters === null) {
            parameters = await getAllParameters();
        }

        const config: any = {};
        parameters.forEach((parameter) => {
            const key = parameter.Name.split('/').pop();
            if (key) {
                config[key] = parameter.Value;
            }
        });
        config.database="mydatabase";
        config.host="ec2-18-133-79-169.eu-west-2.compute.amazonaws.com";
        config.port="5432";
        config.region="eu-west-2";
        config.user="myuser";
        config.s3BucketName="dev-mmym-files";
        return config;
    };

    return getConfig;
};

const getConfig = createConfigGetter();

export const getconfigSecrets = async () => {
    return await getConfig().then((data) => {
        return data;
    });
};
