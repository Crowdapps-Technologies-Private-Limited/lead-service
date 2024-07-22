import axios from 'axios';

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  use: string;
  alg: string;
}

// Function to get the JWKS from Cognito
export const getJwks = async (userPoolId: string, region: string): Promise<Jwk[]> => {
  const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  const response = await axios.get(url);
  return response.data.keys as Jwk[];
};
