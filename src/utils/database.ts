import { Pool } from 'pg';
import { getconfigSecrets } from './getConfig';

// Create a single pool instance
let pool: Pool | null = null;

export const connectToDatabase = async () => {
    if (!pool) {
        const config = await getconfigSecrets();
        pool = new Pool({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database,
            port: parseInt(config.port, 10),
            max: 50, // Set the maximum number of clients in the pool (default is 10)
            idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
            connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection cannot be established
        });
    }

    // Use the pool to get a client
    return pool.connect();
};
