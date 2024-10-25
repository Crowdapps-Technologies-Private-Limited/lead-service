import { connectToDatabase } from './database';
import logger from './logger';

export const checkLeadCompletion = async (
    leadId: string,
    tenant: any,
): Promise<{ isCompleted: boolean; reason?: string }> => {
    logger.info('Checking lead completion for lead:', { leadId });
    logger.info('Checking lead completion for tenant:', { tenant });
    const client = await connectToDatabase();
    await client.query(`SET search_path TO ${tenant.schema}`);
    let clientReleased = false; // Track if client is released

    try {
        const query = `
            SELECT 
                status
            FROM 
                leads 
            WHERE 
                generated_id = $1;
        `;

        const res = await client.query(query, [leadId]);

        if (res.rowCount === 0) {
            return { isCompleted: false, reason: 'Lead not found' };
        }

        const lead = res.rows[0];
        logger.info('Lead:', { lead });

        if (lead.status === 'COMPLETED') {
            return { isCompleted: true };
        } else {
            return { isCompleted: false, reason: 'Lead is not in a completed status' };
        }
    } catch (error: any) {
        throw new Error(`Failed to check lead completion: ${error.message}`);
    } finally {
        if (!clientReleased) {
            client.release();
            clientReleased = true;
        }
    }
};
