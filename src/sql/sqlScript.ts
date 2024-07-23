export const SELECT_TENANT = 'SELECT * FROM tenants WHERE cognito_sub = $1';

export const SELECT_COMPANY_INFO = 'SELECT * FROM company_info WHERE tenant_id = $1';

export const CREATE_LEAD_TABLE = `CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id uuid,
    name VARCHAR(100),
	phone VARCHAR(20),
	email VARCHAR(100),
	follow_up_date	TIMESTAMP,
	moving_on_date	TIMESTAMP,
    packing_on_date	TIMESTAMP DEFAULT NULL,
	collection_address VARCHAR(300),
	collection_purchase_status VARCHAR(100),
	collection_house_size VARCHAR(100),
	collection_distance DECIMAL(8,2),
	collection_volume DECIMAL(8,2),
	delivery_address VARCHAR(300),
	delivery_purchase_status VARCHAR(100),
	delivery_house_size VARCHAR(100),
	delivery_distance DECIMAL(8,2),
	delivery_volume DECIMAL(8,2),
    status VARCHAR(100) NOT NULL CHECK (status IN ('NEW', 'ESTIMATES', 'SURVEY', 'QUOTE', 'CONFIRMED', 'COMPLETED')) DEFAULT 'NEW',
    customer_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (referrer_id) REFERENCES referrers(id)
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
    collection_volume,
    delivery_address,
    delivery_purchase_status,
    delivery_house_size,
    delivery_distance,
    delivery_volume, 
    customer_notes,
    referrer_id
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`;

export const CHECK_LEAD_BY_EMAIL = `SELECT COUNT(*) FROM leads WHERE email = $1`;

export const CHECK_LEAD_BY_NAME = `SELECT COUNT(*) FROM leads WHERE name = $1`;

export const GET_ALL_REFERRERS = `SELECT * FROM referrers`;

export const GET_LEAD_COUNT = `
    SELECT COUNT(*) 
    FROM leads
`;
