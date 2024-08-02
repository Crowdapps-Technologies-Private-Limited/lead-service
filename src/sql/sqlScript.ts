export const SELECT_TENANT = 'SELECT * FROM tenants WHERE cognito_sub = $1';

export const SELECT_COMPANY_INFO = 'SELECT * FROM company_info WHERE tenant_id = $1';

export const CREATE_EXTENSION = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

export const CREATE_LEAD_TABLE = `CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    street VARCHAR(300),
    town VARCHAR(300),
    county VARCHAR(300),
    postcode VARCHAR(50),
    country VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    generated_id VARCHAR(10) NOT NULL UNIQUE,
    referrer_id UUID,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    collection_address_id UUID REFERENCES addresses(id) ON DELETE CASCADE,
    delivery_address_id UUID REFERENCES addresses(id) ON DELETE CASCADE,
    follow_up_date TIMESTAMP,
    moving_on_date TIMESTAMP,
    packing_on_date TIMESTAMP DEFAULT NULL,
    survey_date TIMESTAMP DEFAULT NULL,
    collection_purchase_status VARCHAR(100),
    collection_house_size VARCHAR(100),
    collection_distance DECIMAL(8, 2),
    collection_volume DECIMAL(8, 2),
    collection_volume_unit VARCHAR(20),
    delivery_purchase_status VARCHAR(100),
    delivery_house_size VARCHAR(100),
    delivery_distance DECIMAL(8, 2),
    delivery_volume DECIMAL(8, 2),
    delivery_volume_unit VARCHAR(20),
    status VARCHAR(100) NOT NULL CHECK (status IN ('NEW', 'ESTIMATES', 'SURVEY', 'QUOTE', 'CONFIRMED', 'COMPLETED')) DEFAULT 'NEW',
    customer_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    batch VARCHAR(20),
    incept_batch VARCHAR(20),
    lead_id VARCHAR(10),
    lead_date TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES public.referrers(id) ON DELETE CASCADE
);`;


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

export const GET_LEAD_BY_ID = `
SELECT 
    leads.generated_id,
    leads.referrer_id,
    leads.follow_up_date,
    leads.moving_on_date,
    leads.packing_on_date,
    leads.survey_date,
    leads.collection_purchase_status,
    leads.collection_house_size,
    leads.collection_distance,
    leads.collection_volume,
    leads.collection_volume_unit,
    leads.delivery_purchase_status,
    leads.delivery_house_size,
    leads.delivery_distance,
    leads.delivery_volume,
    leads.delivery_volume_unit,
    leads.status,
    leads.customer_notes,
    leads.batch,
    leads.incept_batch,
    leads.lead_date,
    leads.created_at,
    leads.updated_at,
    customers.id AS customer_id,
    customers.name AS customer_name,
    customers.phone AS customer_phone,
    customers.email AS customer_email,
    customers.created_at AS customer_created_at,
    customers.updated_at AS customer_updated_at,
    collection_addresses.id AS collection_address_id,
    collection_addresses.street AS collection_street,
    collection_addresses.town AS collection_town,
    collection_addresses.county AS collection_county,
    collection_addresses.postcode AS collection_postcode,
    collection_addresses.country AS collection_country,
    collection_addresses.created_at AS collection_created_at,
    collection_addresses.updated_at AS collection_updated_at,
    delivery_addresses.id AS delivery_address_id,
    delivery_addresses.street AS delivery_street,
    delivery_addresses.town AS delivery_town,
    delivery_addresses.county AS delivery_county,
    delivery_addresses.postcode AS delivery_postcode,
    delivery_addresses.country AS delivery_country,
    delivery_addresses.created_at AS delivery_created_at,
    delivery_addresses.updated_at AS delivery_updated_at
FROM 
    leads
LEFT JOIN 
    customers ON leads.customer_id = customers.id
LEFT JOIN 
    addresses AS collection_addresses ON leads.collection_address_id = collection_addresses.id
LEFT JOIN 
    addresses AS delivery_addresses ON leads.delivery_address_id = delivery_addresses.id
WHERE 
    leads.generated_id = $1;
`;


export const GET_EMAIL_TEMPLATE_BY_EVENT = `
    SELECT template_id, template_name, subject, salutation, body, links, signature, disclaimer, placeholders
    FROM public.email_templates 
    WHERE event = $1
`;

export const CREATE_LOG_TABLE = `CREATE TABLE IF NOT EXISTS lead_logs (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    actor_id UUID,
    lead_id VARCHAR(10),
    actor_name VARCHAR(150),
	actor_email VARCHAR(150),
    action TEXT,
    performed_on VARCHAR(150),
    lead_status VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (actor_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(generated_id) ON DELETE CASCADE
)`;

export const INSERT_LOG = `INSERT INTO lead_logs (
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
    FROM lead_logs
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
    follow_up_date = $4,
    moving_on_date = $5,
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
    referrer_id = $25,
    collection_postcode = COALESCE($26, collection_postcode),
    delivery_postcode = COALESCE($27, delivery_postcode),
    packing_on_date = $28,
    updated_at = NOW()
WHERE id = $29 RETURNING *`;


export const CREATE_ESTIMATE_AND_RELATED_TABLE = `
CREATE TABLE IF NOT EXISTS estimates (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    lead_id VARCHAR(10) NOT NULL,
    quote_total NUMERIC,
    cost_total NUMERIC,
    quote_expires_on DATE,
    notes TEXT,
    vat_included BOOLEAN,
    material_price_chargeable BOOLEAN
    FOREIGN KEY (lead_id) REFERENCES leads(generated_id)
);

CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS materials (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
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
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    driver_qty INT,
    porter_qty INT,
    packer_qty INT,
    vehicle_qty INT,
    vehicle_type_id UUID,
    fuel_qty DECIMAL(10, 2),
    fuel_charge DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS general_information (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    driver_wage DECIMAL(10, 2),
    porter_wage DECIMAL(10, 2),
    packer_wage DECIMAL(10, 2),
    contents_value DECIMAL(10, 2),
    payment_method VARCHAR(255),
    insurance_amount DECIMAL(10, 2),
    insurance_percentage DECIMAL(5, 2),
    insurance_type VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ancillaries (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    charge DECIMAL(10, 2),
    isChargeable BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estimate_services (
    estimate_id UUID NOT NULL,
    service_id UUID NOT NULL,
    PRIMARY KEY (estimate_id, service_id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estimate_materials (
    estimate_id UUID NOT NULL,
    material_id UUID NOT NULL,
    PRIMARY KEY (estimate_id, material_id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estimate_costs (
    estimate_id UUID NOT NULL,
    cost_id UUID NOT NULL,
    PRIMARY KEY (estimate_id, cost_id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
    FOREIGN KEY (cost_id) REFERENCES costs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estimate_general_info (
    estimate_id UUID NOT NULL,
    general_info_id UUID NOT NULL,
    PRIMARY KEY (estimate_id, general_info_id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
    FOREIGN KEY (general_info_id) REFERENCES general_information(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estimate_ancillaries (
    estimate_id UUID NOT NULL,
    ancillary_id UUID NOT NULL,
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
    insurance_amount,
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
        insurance_amount = $6,
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

export const ALTER_LEAD_TABLE_TO_ADD_COLUMNS = `ALTER TABLE leads 
    ADD COLUMN IF NOT EXISTS collection_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS lead_date TIMESTAMP
`;

export const GET_ALL_LEADS = `
    SELECT generated_id
    FROM leads
    order by generated_id DESC
    `;

export const UPDATE_LEAD_STATUS = `
    UPDATE leads
    SET status = $1
    WHERE generated_id = $2;
`;
