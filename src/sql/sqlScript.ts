export const SELECT_TENANT = 'SELECT * FROM tenants WHERE cognito_sub = $1';

export const SELECT_COMPANY_INFO = 'SELECT * FROM company_info WHERE tenant_id = $1';


export const UPDATE_TENANT = `UPDATE tenants
SET 
    name = COALESCE($1, name),
    updated_at = NOW()
WHERE id = $2
RETURNING *`;

export const UPDATE_COMPANY_INFO = `UPDATE company_info
SET 
    phone_number = COALESCE($1, phone_number),
    logo = COALESCE($2, logo),
    updated_at = NOW()
WHERE tenant_id = $3
RETURNING *`;

export const ACTIVATE_TENANT = `UPDATE tenants
    SET 
        is_active = TRUE, 
        status = 'ACTIVE', 
        username = COALESCE($1, username),
        updated_at = NOW()
    WHERE cognito_sub = $2
    RETURNING *`;

;
