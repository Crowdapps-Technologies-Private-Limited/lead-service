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
                        staff_role_permissions 
                    JOIN 
                        modules ON staff_role_permissions.module_id = modules.module_id 
                    JOIN 
                        permissions ON staff_role_permissions.permission_id = permissions.permission_id 
                    WHERE 
                        staff_role_permissions.role = $1 
                        AND modules.module_name ILIKE $2 
                        AND permissions.permission_name = $3
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
