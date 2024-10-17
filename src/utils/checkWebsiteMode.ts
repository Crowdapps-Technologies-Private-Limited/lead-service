import { connectToDatabase } from './database';
import logger from './logger';
export const checkWebsiteMode = async () => {
    try {
        logger.info('Fetching website settings');
        const client = await connectToDatabase();
        await client.query(`SET search_path TO public`);
        let clientReleased = false; // Track if client is released
        // Fetch the website settings from the database
        const query = `SELECT website_mode, debug_mode FROM public.website_settings LIMIT 1`;
        const result = await client.query(query);

        // Check if the settings exist
        if (result.rows.length === 0) {
            throw new Error('Website settings not found.');
        }
        if (result.rows[0].website_mode !== 'LIVE') {
            throw new Error(`Website is under ${result.rows[0].website_mode} mode`);
        }
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
        return true;
    } catch (error: any) {
        throw new Error(error.message);
    }
};
