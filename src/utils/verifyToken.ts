import jwt, { JwtPayload } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { getJwks } from './getJwks';

interface DecodedToken extends JwtPayload {
  sub: string;
}

export const verifyToken = async (token: string, userPoolId: string, region: string): Promise<DecodedToken> => {
const jwks = await getJwks(userPoolId, region);
const decoded = jwt.decode(token, { complete: true }) as { header: { kid: string }, payload: JwtPayload };
if (!decoded) {
    throw new Error('Invalid token');
}

const jwk = jwks.find(key => key.kid === decoded.header.kid);
if (!jwk) {
    throw new Error('Public key not found');
}

const pem = jwkToPem(jwk as jwkToPem.RSA);
  return new Promise((resolve, reject) => {
    jwt.verify(token, pem, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        return reject(new Error('Token verification failed'));
      }
      resolve(decoded as DecodedToken);
    });
  });
};
