import { Client } from 'pg';
import { getconfigSecrets } from './getConfig';

export const connectToDatabase = async () => {
  const config = await getconfigSecrets();
  const client = new Client({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: parseInt(config.port, 10),
  });
  await client.connect();
  return client;
};