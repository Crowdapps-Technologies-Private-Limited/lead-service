import { connectToDatabase } from "./database";
import logger from "./logger";

interface SubscriptionStatus {
    isExpired: boolean;
    reason?: string;
}

export const checkSubscriptionStatus = async (tenantId: string): Promise<SubscriptionStatus> => {
    const client = await connectToDatabase();
    try {
        const query = `
            SELECT 
                end_date,
                status 
            FROM 
                subscriptions 
            WHERE 
                tenant_id = $1
            ORDER BY 
                end_date DESC
            LIMIT 1;
        `;

        logger.info('Checking subscription status for tenant:', { tenantId });

        const res = await client.query(query, [tenantId]);

        if (res.rowCount === 0) {
            logger.warn('No active subscription found for tenant:', { tenantId });
            return { isExpired: true, reason: 'No active subscription found' };
        }

        const subscription = res.rows[0];
        const currentDate = new Date();

        if (subscription.status === 'inactive' || subscription.status === 'cancelled') {
            logger.warn('Subscription status is inactive or cancelled for tenant:', { tenantId, status: subscription.status });
            return { isExpired: true, reason: `Subscription is ${subscription.status}` };
        }

        if (new Date(subscription.end_date) < currentDate) {
            logger.warn('Subscription has expired for tenant:', { tenantId, endDate: subscription.end_date });
            return { isExpired: true, reason: 'Subscription has expired' };
        }

        logger.info('Subscription is active for tenant:', { tenantId });
        return { isExpired: false };
    } catch (error) {
        logger.error('Error checking subscription status:', { tenantId, error });
        throw new Error('Failed to check subscription status');
    } finally {
        await client.end();
    }
};