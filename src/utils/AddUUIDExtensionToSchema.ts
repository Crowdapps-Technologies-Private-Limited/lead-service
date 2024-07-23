// scripts/addUuidExtension.js
const { connectToDatabase } = require('../utils/database');
const logger = require('../utils/logger'); // Assume you have a logger utility

export const addUuidExtensionToSchema = async (schema: string) => {
    const client = await connectToDatabase();
    try {
        await client.query('BEGIN');
        await client.query(`SET search_path TO ${schema}`);
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        await client.query('COMMIT');
        logger.info(`UUID extension created successfully in schema ${schema}`);
    } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error(`Failed to create UUID extension in schema ${schema}`, { error });
        throw new Error(`Failed to create UUID extension in schema ${schema}: ${error.message}`);
    } finally {
        client.release();
    }
};
