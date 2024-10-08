import jwt, { JwtPayload } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { getJwks } from './getJwks';
import { connectToDatabase } from './database';

interface DecodedToken extends JwtPayload {
    sub: string;
}

export const verifyToken = async (token: string, userPoolId: string, region: string): Promise<DecodedToken> => {
    const jwks = await getJwks(userPoolId, region);
    const decoded = jwt.decode(token, { complete: true }) as { header: { kid: string }; payload: JwtPayload };
    if (!decoded) {
        throw new Error('Invalid token');
    }

    const jwk = jwks.find((key) => key.kid === decoded.header.kid);
    if (!jwk) {
        throw new Error('Public key not found');
    }

    const pem = jwkToPem(jwk as jwkToPem.RSA);
    return new Promise(async (resolve, reject) => {
        jwt.verify(token, pem, { algorithms: ['RS256'] }, async (err, decoded) => {
            if (err) {
                return reject(new Error('Token verification failed'));
            }

            const client = await connectToDatabase();
            const sessionCheckQuery = `
        SELECT is_active 
        FROM user_sessions 
        WHERE access_token = $1 AND is_active = TRUE;
      `;
            const sessionResult = await client.query(sessionCheckQuery, [token]);
            client.end();

            if (sessionResult.rows.length === 0) {
                return reject(new Error('Session has been terminated or token is blacklisted'));
            }

            resolve(decoded as DecodedToken);
        });
    });
};
