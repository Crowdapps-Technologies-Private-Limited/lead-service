export const SELECT_TENANT = 'SELECT * FROM tenants WHERE cognito_sub = $1';

export const SELECT_COMPANY_INFO = 'SELECT * FROM company_info WHERE tenant_id = $1';

export const CREATE_EXTENSION = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

export const CREATE_LEAD_TABLE = `CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    generated_id VARCHAR(10) NOT NULL UNIQUE,
    referrer_id UUID,
    name VARCHAR(100),
	phone VARCHAR(20),
	email VARCHAR(100),
	follow_up_date	TIMESTAMP,
	moving_on_date	TIMESTAMP,
    packing_on_date	TIMESTAMP DEFAULT NULL,
    survey_date	TIMESTAMP DEFAULT NULL,
	collection_address VARCHAR(300),
    collection_postcode VARCHAR(50),
	collection_purchase_status VARCHAR(100),
	collection_house_size VARCHAR(100),
	collection_distance DECIMAL(8,2),
	collection_volume_meter DECIMAL(8,2),
    collection_volume_feet DECIMAL(8,2),
    collection_volume_unit VARCHAR(20),
	delivery_address VARCHAR(300),
    delivery_postcode VARCHAR(50),
	delivery_purchase_status VARCHAR(100),
	delivery_house_size VARCHAR(100),
	delivery_distance DECIMAL(8,2),
	delivery_volume_meter DECIMAL(8,2),
    delivery_volume_feet DECIMAL(8,2),
    delivery_volume_unit VARCHAR(20),
    status VARCHAR(100) NOT NULL CHECK (status IN ('NEW', 'ESTIMATES', 'SURVEY', 'QUOTE', 'CONFIRMED', 'COMPLETED')) DEFAULT 'NEW',
    customer_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (referrer_id) REFERENCES public.referrers(id) ON DELETE CASCADE
)`;

export const INSERT_LEAD = `INSERT INTO leads (
    name,
    phone,
    email,
    follow_up_date,
    moving_on_date,
    collection_address,
    collection_purchase_status,
    collection_house_size,
    collection_distance,
    collection_volume_meter,
    collection_volume_feet,
    collection_volume_unit,
    delivery_address,
    delivery_purchase_status,
    delivery_house_size,
    delivery_distance,
    delivery_volume_meter, 
    delivery_volume_feet, 
    delivery_volume_unit, 
    customer_notes,
    referrer_id,
    generated_id,
    collection_postcode,
    delivery_postcode
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) RETURNING *`;

export const CHECK_LEAD_BY_EMAIL = `SELECT COUNT(*) FROM leads WHERE email = $1`;

export const CHECK_LEAD_BY_NAME = `SELECT COUNT(*) FROM leads WHERE name = $1`;

export const GET_ALL_REFERRERS = `SELECT * 
  FROM public.referrers 
  ORDER BY 
    CASE WHEN name = 'Others' THEN 1 ELSE 0 END, 
    name`;

export const GET_REFERRER_BY_ID = `
SELECT
    name,
    contact_name,
    email,
    id_string
FROM public.referrers 
WHERE id = $1`;

export const GET_LEAD_COUNT = `
    SELECT COUNT(*) 
    FROM leads
`;

export const GET_ALL_LEADS = `
    SELECT generated_id
    FROM leads
    order by generated_id DESC
`;

export const GET_LEAD_BY_ID = `SELECT * FROM leads WHERE id = $1`;

export const GET_EMAIL_TEMPLATE_BY_EVENT = `
    SELECT template_id, template_name, subject, salutation, body, links, signature, disclaimer, placeholders
    FROM public.email_templates 
    WHERE event = $1
`;

export const CREATE_LOG_TABLE = `CREATE TABLE IF NOT EXISTS audit_trails (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    actor_id UUID,
    lead_id UUID,
    actor_name VARCHAR(150),
	actor_email VARCHAR(150),
    action TEXT,
    performed_on VARCHAR(150),
    lead_status VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (actor_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
)`;

export const INSERT_LOG = `INSERT INTO audit_trails (
    actor_id,
    actor_name,
    actor_email,
    action,
    performed_on,
    lead_status,
    lead_id
) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;

export const GET_LOG_COUNT = `
    SELECT COUNT(*) 
    FROM audit_trails
    WHERE lead_id = $1
`;

export const CHECK_TABLE_EXISTS = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = $2
      );
`;

export const EDIT_LEAD = `UPDATE leads 
SET
    name = COALESCE($1, name),
    phone = COALESCE($2, phone),
    email = COALESCE($3, email),
    follow_up_date = COALESCE($4, follow_up_date),
    moving_on_date = COALESCE($5, moving_on_date),
    collection_address = COALESCE($6, collection_address),
    collection_purchase_status = COALESCE($7, collection_purchase_status),
    collection_house_size = COALESCE($8, collection_house_size),
    collection_distance = COALESCE($9, collection_distance),
    collection_volume_meter = COALESCE($10, collection_volume_meter),
    collection_volume_feet = COALESCE($11, collection_volume_feet),
    collection_volume_unit = COALESCE($12, collection_volume_unit),
    delivery_address = COALESCE($13, delivery_address),
    delivery_purchase_status = COALESCE($14, delivery_purchase_status),
    delivery_house_size = COALESCE($15, delivery_house_size),
    delivery_distance = COALESCE($16, delivery_distance),
    delivery_volume_meter = COALESCE($17, delivery_volume_meter),
    delivery_volume_feet = COALESCE($18, delivery_volume_feet),
    delivery_volume_unit = COALESCE($19, delivery_volume_unit),
    customer_notes = COALESCE($20, customer_notes),
    referrer_id = COALESCE($21, referrer_id),
    collection_postcode = COALESCE($22, collection_postcode),
    delivery_postcode = COALESCE($23, delivery_postcode)
WHERE id = $24 RETURNING *`;