import { connectToDatabase } from '../../utils/database';

export const getReferrerByName = async (name: string): Promise<any> => {
    const client = await connectToDatabase();
    let clientReleased = false; // Track if client is released
    try {
        if (!name) {
            throw new Error('Referrer name is required');
        }

        const query = `
            SELECT *
            FROM public.referrers
            WHERE name = $1
              AND is_deleted = false
            LIMIT 1
        `;
        const values = [name];
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return null; // Return null if no referrer is found
        }

        return result.rows[0]; // Return the first matching referrer
    } catch (error) {
        throw new Error('Error fetching referrer by name');
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
