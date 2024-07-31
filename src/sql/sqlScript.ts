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
    collection_county VARCHAR(300),
    collection_city VARCHAR(300),
    collection_state VARCHAR(300),
    collection_postcode VARCHAR(50),
	collection_purchase_status VARCHAR(100),
	collection_house_size VARCHAR(100),
	collection_distance DECIMAL(8,2),
	collection_volume DECIMAL(8,2),
    collection_volume_unit VARCHAR(20),
	delivery_address VARCHAR(300),
    delivery_county VARCHAR(300),
    delivery_city VARCHAR(300),
    delivery_state VARCHAR(300),
    delivery_postcode VARCHAR(50),
	delivery_purchase_status VARCHAR(100),
	delivery_house_size VARCHAR(100),
	delivery_distance DECIMAL(8,2),
	delivery_volume DECIMAL(8,2),
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
    collection_county,
    collection_city,
    collection_state,
    collection_purchase_status,
    collection_house_size,
    collection_distance,
    collection_volume,
    collection_volume_unit,
    delivery_address,
    delivery_county,
    delivery_city,
    delivery_state,
    delivery_purchase_status,
    delivery_house_size,
    delivery_distance,
    delivery_volume,
    delivery_volume_unit, 
    customer_notes,
    referrer_id,
    generated_id,
    collection_postcode,
    delivery_postcode
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) RETURNING *`;

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
    collection_county = COALESCE($7, collection_county),
    collection_city = COALESCE($8, collection_city),
    collection_state = COALESCE($9, collection_state),
    collection_purchase_status = COALESCE($10, collection_purchase_status),
    collection_house_size = COALESCE($11, collection_house_size),
    collection_distance = COALESCE($12, collection_distance),
    collection_volume = COALESCE($13, collection_volume),
    collection_volume_unit = COALESCE($14, collection_volume_unit),
    delivery_address = COALESCE($15, delivery_address),
    delivery_county = COALESCE($16, delivery_county),
    delivery_city = COALESCE($17, delivery_city),
    delivery_state = COALESCE($18, delivery_state),
    delivery_purchase_status = COALESCE($19, delivery_purchase_status),
    delivery_house_size = COALESCE($20, delivery_house_size),
    delivery_distance = COALESCE($21, delivery_distance),
    delivery_volume = COALESCE($22, delivery_volume),
    delivery_volume_unit = COALESCE($23, delivery_volume_unit),
    customer_notes = COALESCE($24, customer_notes),
    referrer_id = COALESCE($25, referrer_id),
    collection_postcode = COALESCE($26, collection_postcode),
    delivery_postcode = COALESCE($27, delivery_postcode),
    packing_on_date = COALESCE($28, packing_on_date),
    updated_at = NOW()
WHERE id = $29 RETURNING *`;

export const CREATE_ESTIMATE_AND_RELATED_TABLE = `CREATE TABLE IF NOT EXISTS estimates (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    quote_total NUMERIC,
    cost_total NUMERIC,
    quote_expires_on DATE,
    notes TEXT,
    vat_included BOOLEAN,
    material_price_chargeable BOOLEAN
)

CREATE TABLE IF NOT EXISTS estimates (
    id SERIAL PRIMARY KEY,
    lead_id INT NOT NULL,
    quote_total DECIMAL(10, 2),
    cost_total DECIMAL(10, 2),
    quote_expires_on DATE,
    notes TEXT,
    vat_included BOOLEAN,
    material_price_chargeable BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dimensions VARCHAR(255),
    surveyed_qty DECIMAL(10, 2),
    charge_qty DECIMAL(10, 2),
    price DECIMAL(10, 2),
    total DECIMAL(10, 2),
    volume_cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS costs (
    id SERIAL PRIMARY KEY,
    driver_qty INT,
    porter_qty INT,
    packer_qty INT,
    vehicle_qty INT,
    vehicle_type_id INT,
    fuel_qty DECIMAL(10, 2),
    fuel_charge DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS general_information (
    id SERIAL PRIMARY KEY,
    driver_wage DECIMAL(10, 2),
    porter_wage DECIMAL(10, 2),
    packer_wage DECIMAL(10, 2),
    contents_value DECIMAL(10, 2),
    payment_method VARCHAR(255),
    insurance BOOLEAN,
    insurance_percentage DECIMAL(5, 2),
    insurance_type VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ancillaries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    charge DECIMAL(10, 2),
    isChargeable BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estimate_services (
    estimate_id INT NOT NULL,
    service_id INT NOT NULL,
    PRIMARY KEY (estimate_id, service_id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estimate_materials (
    estimate_id INT NOT NULL,
    material_id INT NOT NULL,
    PRIMARY KEY (estimate_id, material_id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estimate_costs (
    estimate_id INT NOT NULL,
    cost_id INT NOT NULL,
    PRIMARY KEY (estimate_id, cost_id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
    FOREIGN KEY (cost_id) REFERENCES costs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estimate_general_info (
    estimate_id INT NOT NULL,
    general_info_id INT NOT NULL,
    PRIMARY KEY (estimate_id, general_info_id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
    FOREIGN KEY (general_info_id) REFERENCES general_information(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estimate_ancillaries (
    estimate_id INT NOT NULL,
    ancillary_id INT NOT NULL,
    PRIMARY KEY (estimate_id, ancillary_id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
    FOREIGN KEY (ancillary_id) REFERENCES ancillaries(id) ON DELETE CASCADE
);
    
`;

export const INSERT_ESTIMATE = `INSERT INTO estimates (
    lead_id,
    quote_total,
    cost_total,
    quote_expires_on,
    notes,
    vat_included,
    material_price_chargeable
) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;



export const INSERT_ESTIMATE_SERVICE = `INSERT INTO estimate_services (
    estimate_id,
    service_id
) VALUES ($1, $2)`;



export const INSERT_ESTIMATE_MATERIAL = `INSERT INTO estimate_materials (
    estimate_id,
    material_id
) VALUES ($1, $2)`;



export const INSERT_ESTIMATE_COST = `INSERT INTO estimate_costs (
    estimate_id,
    cost_id
) VALUES ($1, $2)`;



export const INSERT_ESTIMATE_GENERAL_INFO = `INSERT INTO estimate_general_info (
    estimate_id,
    general_info_id
) VALUES ($1, $2)`;



export const INSERT_ESTIMATE_ANCILLARY = `INSERT INTO estimate_ancillaries (
    estimate_id,
    ancillary_id
) VALUES ($1, $2)`;

// Additional Insert Statements for Related Tables
export const INSERT_SERVICE = `INSERT INTO services (
    service_name,
    description,
    price
) VALUES ($1, $2, $3) RETURNING *`;

export const INSERT_MATERIAL = `INSERT INTO materials (
    name,
    dimensions,
    surveyed_qty,
    charge_qty,
    price,
    total,
    volume_cost
) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;

export const INSERT_COST = `INSERT INTO costs (
    driver_qty,
    porter_qty,
    packer_qty,
    vehicle_qty,
    vehicle_type_id,
    fuel_qty,
    fuel_charge
) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;

export const INSERT_GENERAL_INFO = `INSERT INTO general_information (
    driver_wage,
    porter_wage,
    packer_wage,
    contents_value,
    payment_method,
    insurance,
    insurance_percentage,
    insurance_type
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;

export const INSERT_ANCILLARY = `INSERT INTO ancillaries (
    name,
    charge,
    isChargeable
) VALUES ($1, $2, $3) RETURNING *`;


export const UPDATE_ESTIMATE = `
    UPDATE estimates 
    SET
        lead_id = $1,
        quote_total = $2,
        cost_total = $3,
        quote_expires_on = $4,
        notes = $5,
        vat_included = $6,
        material_price_chargeable = $7
    WHERE id = $8
`;


export const UPDATE_SERVICE = `
    UPDATE services
    SET
        service_name = $1,
        description = $2,
        price = $3
    WHERE id = $4
`;


export const UPDATE_MATERIAL = `
    UPDATE materials
    SET
        name = $1,
        dimensions = $2,
        surveyed_qty = $3,
        charge_qty = $4,
        price = $5,
        total = $6,
        volume_cost = $7
    WHERE id = $8
`;



export const UPDATE_COST = `
    UPDATE costs
    SET
        driver_qty = $1,
        porter_qty = $2,
        packer_qty = $3,
        vehicle_qty = $4,
        vehicle_type_id = $5,
        fuel_qty = $6,
        fuel_charge = $7
    WHERE id = $8
`;

export const UPDATE_GENERAL_INFO = `
    UPDATE general_information
    SET
        driver_wage = $1,
        porter_wage = $2,
        packer_wage = $3,
        contents_value = $4,
        payment_method = $5,
        insurance = $6,
        insurance_percentage = $7,
        insurance_type = $8
    WHERE id = $9
`;



export const UPDATE_ANCILLARY = `
    UPDATE ancillaries
    SET
        name = $1,
        charge = $2,
        isChargeable = $3
    WHERE id = $4
`;



