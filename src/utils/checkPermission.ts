import { connectToDatabase } from "./database";
import logger from "./logger";

export const checkPermission = async (
    userRole: string,
    moduleName: string,
    permissionName: string,
    schema: string
): Promise<boolean> => {
    logger.info('Checking permission', { userRole, moduleName, permissionName });

    let role = userRole === 'TENANT' ? 'Admin' : userRole;
    logger.info('Role:', { role });

    // Admin has all permissions
    if (role === 'Admin') {
        return true;
    }

    const client = await connectToDatabase();
    logger.info('Schema:', { schema });

    try {
        await client.query(`SET search_path TO ${schema}`);
        logger.info('Schema set successfully');

        const CHECK_PERMISSION_QUERY = `
            SELECT 
                EXISTS (
                    SELECT 1 
                    FROM 
                        staff_role_permissions srp
                    JOIN 
                        modules m ON srp.module_id = m.module_id 
                    JOIN 
                        permissions p ON srp.permission_id = p.permission_id 
                    JOIN
                        staff_roles sr ON sr.id = srp.role_id
                    WHERE 
                        sr.role = $1
                        AND m.module_name ILIKE $2 
                        AND p.permission_name = $3
                ) AS has_permission
        `;

        const result = await client.query(CHECK_PERMISSION_QUERY, [role, moduleName, permissionName]);
        const hasPermission = result.rows[0]?.has_permission || false;
        logger.info('hasPermission:', { hasPermission });

        return hasPermission;
    } catch (error: any) {
        logger.error('Error checking permission', { error });
        throw new Error(`Failed to check permission: ${error.message}`);
    } finally {
        await client.end();
    }
};
