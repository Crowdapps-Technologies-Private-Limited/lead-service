export const SELECT_TENANT = 'SELECT * FROM tenants WHERE cognito_sub = $1';

export const SELECT_COMPANY_INFO = 'SELECT * FROM company_info WHERE tenant_id = $1';

export const SELECT_EMAIL_INFO = 'SELECT * FROM public.email_info WHERE tenant_id = $1';

export const GET_STAFF_BY_SUB = `
    SELECT * 
    FROM staffs 
    WHERE cognito_sub = $1;
`;

export const GET_TENANT_BY_ID = 'SELECT * FROM public.tenants WHERE id = $1';

export const CREATE_EXTENSION = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

export const CREATE_LEAD_TABLE = `
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NULL,
    cognito_sub VARCHAR(255) ,
    tenant_id UUID,
    created_by VARCHAR(255),
    updated_by VARCHAR(255) DEFAULT NULL,
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
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    collection_address_id UUID REFERENCES addresses(id),
    delivery_address_id UUID REFERENCES addresses(id),
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
    status VARCHAR(100) NOT NULL DEFAULT 'NEW LEAD',
    customer_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    batch VARCHAR(20),
    incept_batch VARCHAR(20),
    lead_id VARCHAR(10),
    lead_date TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES public.referrers(id) ON DELETE SET NULL
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

export const GET_SURVEY_BY_LEAD = `
SELECT id, lead_id, status
FROM surveys 
WHERE lead_id = $1
ORDER BY created_at DESC 
LIMIT 1`;

export const GET_EMAIL_TEMPLATE_BY_EVENT = `
    SELECT template_id, template_name, subject, salutation, body, links, signature, disclaimer, placeholders
    FROM public.email_templates 
    WHERE event = $1
`;

export const CREATE_LOG_TABLE = `CREATE TABLE IF NOT EXISTS lead_logs (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    actor_id UUID,
    lead_id VARCHAR(20),
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
    lead_id VARCHAR(20) NOT NULL,
    quote_total NUMERIC,
    cost_total NUMERIC,
    quote_expires_on DATE,
    notes TEXT,
    vat_included BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    material_price_chargeable BOOLEAN,
    FOREIGN KEY (lead_id) REFERENCES leads(generated_id) ON DELETE CASCADE
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
    volume DECIMAL(10, 2),
    cost DECIMAL(10, 2),
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
    wage_charge DECIMAL(10, 2),
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
    volume,
    cost
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;

export const INSERT_COST = `INSERT INTO costs (
    driver_qty,
    porter_qty,
    packer_qty,
    vehicle_qty,
    vehicle_type_id,
    wage_charge,
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
        volume = $7,
        cost = $8
    WHERE id = $9
`;

export const UPDATE_COST = `
    UPDATE costs
    SET
        driver_qty = $1,
        porter_qty = $2,
        packer_qty = $3,
        vehicle_qty = $4,
        vehicle_type_id = $5,
        wage_charge = $6,
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

export const GET_EMAIL_TEMPLATE_BY_ID = `
    SELECT template_id, template_name, subject, salutation, body, links, signature, disclaimer, placeholders
    FROM public.email_templates 
    WHERE template_id = $1
`;

export const GET_CUSTOMER_BY_ID = `SELECT * FROM customers WHERE id = $1`;

export const CREATE_SURVEY_AND_RELATED_TABLE = `
CREATE TABLE IF NOT EXISTS surveys (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    lead_id VARCHAR(20) NOT NULL,
	surveyor_id VARCHAR(100),
    survey_type VARCHAR(100),
    notes text,
    remarks text,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP default NULL,
    survey_date TIMESTAMP default NULL,
    description text,
    status VARCHAR(100) NOT NULL DEFAULT 'PENDING',
    is_cancelled BOOLEAN DEFAULT FALSE,
    reason_to_cancel TEXT,
    moving_from_paces INTEGER,
    moving_from_flight_of_stairs INTEGER,
    moving_from_lift_availability VARCHAR(100),
    moving_from_bedrooms INTEGER,
    moving_from_floors INTEGER,
    is_moving_from_postcode_verified BOOLEAN,
    moving_from_type VARCHAR(100),
    moving_to_paces INTEGER,
    moving_to_flight_of_stairs INTEGER,
    moving_to_lift_availability VARCHAR(100),
    moving_to_bedrooms INTEGER,
    moving_to_floors INTEGER,
    is_moving_to_postcode_verified BOOLEAN,
    moving_to_type VARCHAR(100),
    summary_status VARCHAR(100),
    is_tenant_assigned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(generated_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS survey_items (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    survey_id UUID NOT NULL,
	room VARCHAR(100),
	item VARCHAR(100),
	ft3	DECIMAL(5,2),
	quantity INTEGER,
	is_leave BOOLEAN,
	is_weee BOOLEAN,
	is_cust BOOLEAN,
	is_clear BOOLEAN,
	dismentle_charges DECIMAL(8,2),
	sort_order INTEGER,
	linked_item VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS survey_services (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    survey_id UUID NOT NULL,
    service_name VARCHAR(100),
    is_accepted BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);
`;

export const INSERT_SURVEY = `INSERT INTO surveys (
    lead_id,
    surveyor_id,
    survey_type,
    remarks,
    start_time,
    end_time,
    description,
    survey_date,
    is_tenant_assigned
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;

export const CHECK_SURVEY = `
SELECT * FROM surveys 
WHERE 
    lead_id = $1 AND status <> 'COMPLETED'`;

export const CHECK_SURVEYOR_AVAILABILITY = `
SELECT 
    COUNT(*) > 0 AS has_conflict
FROM 
    surveys
WHERE 
    surveyor_id = $1
    AND (
        (start_time <= $2 AND end_time >= $2) OR
        (start_time <= $3 AND end_time >= $3) OR
        (start_time >= $2 AND end_time <= $3)
    );`;

export const INSERT_SURVEY_ITEM_FOR_TAB1 = `INSERT INTO survey_items (
    survey_id,
    room,
    item,
    ft3,
    quantity,
    isLeave,
    isWeee,
    isCust,
    isClear
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;

export const GET_SURVEY_BY_ID = `select * from surveys where id = $1 AND is_cancelled = false`;

export const GET_SURVEY_DETAILS = `
    SELECT 
        s.id,
        s.lead_id AS "leadId",
        l.generated_id AS "leadGeneratedId",
        l.customer_id AS "customerId",
        c.name AS "customerName",
        c.phone AS "customerPhone",
        c.email AS "customerEmail",
        coll_addr.street AS "collectionStreet",
        coll_addr.town AS "collectionTown",
        coll_addr.county AS "collectionCounty",
        coll_addr.postcode AS "collectionPostcode",
        coll_addr.country AS "collectionCountry",
        s.surveyor_id,
        st.name AS "surveyorName",
        st.email AS "surveyorEmail",
        st.phone AS "surveyorPhone",
        s.survey_type,
        s.remarks,
        s.start_time,
        s.end_time,
        s.description,
        s.status
    FROM 
        surveys s
    LEFT JOIN leads l ON s.lead_id = l.generated_id
    LEFT JOIN customers c ON l.customer_id = c.id
    LEFT JOIN staffs st ON s.surveyor_id = st.staff_id
    LEFT JOIN addresses coll_addr ON coll_addr.id = l.collection_address_id
    WHERE 
        s.id = $1
`;

export const GET_SURVEYS_LIST_BASE = `
    SELECT 
        s.id,
        s.lead_id AS "leadId",
        l.generated_id AS "leadGeneratedId",
        l.customer_id AS "customerId",
        c.name AS "customerName",
        c.phone AS "customerPhone",
        c.email AS "customerEmail",
        s.surveyor_id,
        st.name AS "surveyorName",
        st.email AS "surveyorEmail",
        st.phone AS "surveyorPhone",
        s.survey_type,
        s.remarks,
        s.start_time,
        s.end_time,
        s.description,
        s.status
    FROM 
        surveys s
    LEFT JOIN leads l ON s.lead_id = l.generated_id
    LEFT JOIN customers c ON l.customer_id = c.id
    LEFT JOIN staffs st ON s.surveyor_id = st.staff_id 
    WHERE 
        s.is_tenant_assigned = false
        AND s.lead_id IS NOT NULL
`;

export const GET_SURVEYS_LIST_TENANT = `
    SELECT 
        s.id,
        s.lead_id AS "leadId",
        l.generated_id AS "leadGeneratedId",
        l.customer_id AS "customerId",
        c.name AS "customerName",
        c.phone AS "customerPhone",
        c.email AS "customerEmail",
        s.surveyor_id,
        s.survey_type,
        s.remarks,
        s.start_time,
        s.end_time,
        s.description,
        s.status,
        'self' AS "surveyorName",
        true AS "is_tenant_assigned"
    FROM 
        surveys s
    LEFT JOIN leads l ON s.lead_id = l.generated_id
    LEFT JOIN customers c ON l.customer_id = c.id
    WHERE 
        s.is_tenant_assigned = true
        AND s.lead_id IS NOT NULL
`;

export const GET_SURVEYS_COUNT = `
    SELECT 
        COUNT(*) 
    FROM 
        surveys s
    WHERE 
        s.lead_id IS NOT NULL
`;

export const GET_TENANT_SURVEYS_COUNT = `
    SELECT 
        COUNT(*) 
    FROM 
        surveys s
    WHERE 
        s.lead_id IS NOT NULL
        AND s.is_tenant_assigned = true
`;

export const GET_SURVEYS_COUNT_SURVEYOR = `
    SELECT 
        COUNT(*) 
    FROM 
        surveys s
    WHERE 
        s.lead_id IS NOT NULL
        AND s.surveyor_id = $1
`;

export const GET_SURVEY_ITEM_BY_ID = `select * from survey_items where id = $1`;

export const GET_SURVEY_ITEMS_BY_SURVEY_ID = `select * from survey_items where survey_id = $1`;

export const INSERT_SURVEY_FOR_TAB2 = `UPDATE surveys SET notes = $1 WHERE id = $2 RETURNING *`;

export const INSERT_SURVEY_ITEM_FOR_TAB3 = `
UPDATE survey_items 
    SET 
        room = $1,
        item = $2,
        ft3 = $3,
        dismentle_charges = $4,
        sort_order = $5,
        linked_item = $6,
        updated_at = NOW()
    WHERE id = $7 
    RETURNING *`;

export const GET_ALL_ROOM_LIST = `SELECT * FROM public.rooms`;

export const GET_ALL_LINKED_ITEM_LIST = `SELECT * FROM public.linked_items`;

export const GET_MATERIALS_BY_ESTIMATE = `
WITH latest_estimate AS (
    SELECT id 
    FROM estimates 
    WHERE lead_id = $1 
    ORDER BY created_at DESC 
    LIMIT 1
)
SELECT 
    json_agg(json_build_object(
        'materialId', m.id,
        'name', m.name,
        'dimensions', m.dimensions,
        'surveyedQty', m.surveyed_qty,
        'chargeQty', m.charge_qty,
        'price', m.price,
        'total', m.total,
        'volume', m.volume,
        'cost', m.cost
    )) AS materials
FROM 
    estimate_materials em
JOIN 
    materials m ON em.material_id = m.id
WHERE 
    em.estimate_id = (SELECT id FROM latest_estimate);
`;

export const UPDATE_MATERIAL_BY_SURVEY = `
UPDATE materials
SET
    surveyed_qty = $1,
    volume = $2,
    cost = $3,
    updated_at = NOW()
WHERE id = $9
`;

export const GET_ALL_SURVEYORS = `
  SELECT *
  FROM staffs s
  INNER JOIN staff_roles sr ON s.role_id = sr.id
  WHERE sr.role = $1
`;

export const DELETE_ESTIMATE_SERVICES = `
    DELETE FROM estimate_services
    WHERE estimate_id = $1;
`;

export const DELETE_ESTIMATE_MATERIALS = `
    DELETE FROM estimate_materials
    WHERE estimate_id = $1;
`;

export const DELETE_ESTIMATE_COSTS = `
    DELETE FROM estimate_costs
    WHERE estimate_id = $1;
`;

export const DELETE_ESTIMATE_GENERAL_INFO = `
    DELETE FROM estimate_general_info
    WHERE estimate_id = $1;
`;

export const DELETE_ESTIMATE_ANCILLARIES = `
    DELETE FROM estimate_ancillaries
    WHERE estimate_id = $1;
`;

export const CREATE_QUOTE_AND_RELATED_TABLE = `
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    lead_id VARCHAR(20) NOT NULL,
    quote_total NUMERIC,
    cost_total NUMERIC,
    quote_expires_on DATE,
    notes TEXT,
    vat_included BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    material_price_chargeable BOOLEAN,
    FOREIGN KEY (lead_id) REFERENCES leads(generated_id) ON DELETE CASCADE
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
    volume DECIMAL(10, 2),
    cost DECIMAL(10, 2),
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
    wage_charge DECIMAL(10, 2),
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

CREATE TABLE IF NOT EXISTS quote_services (
    quote_id UUID NOT NULL,
    service_id UUID NOT NULL,
    PRIMARY KEY (quote_id, service_id),
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_materials (
    quote_id UUID NOT NULL,
    material_id UUID NOT NULL,
    PRIMARY KEY (quote_id, material_id),
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS quote_costs (
    quote_id UUID NOT NULL,
    cost_id UUID NOT NULL,
    PRIMARY KEY (quote_id, cost_id),
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (cost_id) REFERENCES costs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_general_info (
    quote_id UUID NOT NULL,
    general_info_id UUID NOT NULL,
    PRIMARY KEY (quote_id, general_info_id),
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (general_info_id) REFERENCES general_information(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_ancillaries (
    quote_id UUID NOT NULL,
    ancillary_id UUID NOT NULL,
    PRIMARY KEY (quote_id, ancillary_id),
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (ancillary_id) REFERENCES ancillaries(id) ON DELETE CASCADE
);
`;

export const INSERT_QUOTE = `INSERT INTO quotes (
    lead_id,
    quote_total,
    cost_total,
    quote_expires_on,
    notes,
    vat_included,
    material_price_chargeable
) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;

export const INSERT_QUOTE_SERVICE = `INSERT INTO quote_services (
    quote_id,
    service_id
) VALUES ($1, $2)`;

export const INSERT_QUOTE_MATERIAL = `INSERT INTO quote_materials (
    quote_id,
    material_id
) VALUES ($1, $2)`;

export const INSERT_QUOTE_COST = `INSERT INTO quote_costs (
    quote_id,
    cost_id
) VALUES ($1, $2)`;

export const INSERT_QUOTE_GENERAL_INFO = `INSERT INTO quote_general_info (
    quote_id,
    general_info_id
) VALUES ($1, $2)`;

export const INSERT_QUOTE_ANCILLARY = `INSERT INTO quote_ancillaries (
    quote_id,
    ancillary_id
) VALUES ($1, $2)`;

export const DELETE_QUOTE_SERVICES = `
    DELETE FROM quote_services
    WHERE quote_id = $1;
`;

export const DELETE_QUOTE_MATERIALS = `
    DELETE FROM quote_materials
    WHERE quote_id = $1;
`;

export const DELETE_QUOTE_COSTS = `
    DELETE FROM quote_costs
    WHERE quote_id = $1;
`;

export const DELETE_QUOTE_GENERAL_INFO = `
    DELETE FROM quote_general_info
    WHERE quote_id = $1;
`;

export const DELETE_QUOTE_ANCILLARIES = `
    DELETE FROM quote_ancillaries
    WHERE quote_id = $1;
`;

export const UPDATE_QUOTE = `
    UPDATE quotes 
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

export const GET_LEAD_CUSTOMER_BY_LEAD_ID = `
    SELECT
        l.generated_id,
        l.status,
        cust.id AS customer_id,
        cust.name AS customer_name,
        cust.phone AS customer_phone,
        cust.email AS customer_email,  -- Missing comma added here
        l.moving_on_date AS "moving_on_date",
        l.packing_on_date AS "packing_on_date"
    FROM
        leads l
    LEFT JOIN
        customers cust ON l.customer_id = cust.id
    WHERE
        l.generated_id = $1;
`;

export const UPDATE_CUSTOMER_WITH_CREDENTIAL = `
UPDATE customers
SET 
    password = $1,
    cognito_sub = $2,
    tenant_id = $3,
    username = $4,
    updated_by = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $6;
`;

export const CREATE_CONFIRMATION_TABLES = `
CREATE TABLE IF NOT EXISTS confirmations (
    confirmation_id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    customer_id UUID DEFAULT public.uuid_generate_v4(),
    lead_id VARCHAR(20) REFERENCES leads(generated_id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    moving_on_date TIMESTAMP,
    moving_on_time VARCHAR(100),
    moving_on_status VARCHAR(100),
    packing_on_date TIMESTAMP DEFAULT NULL,
    packing_on_time VARCHAR(100),
    packing_on_status VARCHAR(100),
    is_accept_liability_cover BOOLEAN DEFAULT FALSE,
    liability_cover NUMERIC DEFAULT NULL,
    is_terms_accepted BOOLEAN DEFAULT FALSE,
    is_quotation_accepted BOOLEAN DEFAULT FALSE,  -- Corrected from "is_quoation_accepted"
    is_submitted BOOLEAN DEFAULT FALSE,
    tool_tip_content VARCHAR(100) DEFAULT NULL,
    is_new_response BOOLEAN DEFAULT FALSE,
    is_deposit_received BOOLEAN DEFAULT FALSE,
	is_seen BOOLEAN DEFAULT FALSE,
    comments TEXT,
    notes TEXT,
    confirmed_on TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS confirmation_services (
    service_id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    confirmation_id UUID REFERENCES confirmations(confirmation_id) ON DELETE CASCADE,
    name VARCHAR(100),
    cost DECIMAL(10, 2),
    status VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export const INSERT_CONFIRMATION = `
INSERT INTO confirmations (
    confirmation_id, 
    customer_id, 
    lead_id, 
    moving_on_date, 
    packing_on_date, 
    is_accept_liability_cover, 
    is_terms_accepted, 
    is_quotation_accepted, 
    is_submitted, 
    is_seen, 
    notes, 
    created_by,
    quote_id
) VALUES (
    public.uuid_generate_v4(),   
    $1,                         
    $2,                          
    $3,    
    $4,                         
    $5,                         
    $6,                          
    $7,                          
    $8,                         
    $9,                         
    $10,                       
    $11,
    $12                         
) RETURNING confirmation_id;
`;

export const GET_QUOTE_SERVICES = `
SELECT 
    e.id AS quoteId,
    e.lead_id AS leadId,
    e.notes,
    e.vat_included AS vatIncluded,
    (
        SELECT json_agg(json_build_object(
            'serviceId', s.id,
            'serviceName', s.service_name,
            'description', s.description,
            'price', s.price
        ))
        FROM quote_services es
        JOIN services s ON es.service_id = s.id
        WHERE es.quote_id = e.id
    ) AS services
FROM 
    quotes e
WHERE 
    e.lead_id = $1
ORDER BY 
    e.created_at DESC
LIMIT 1;
`;

export const INSERT_CONFIRMATION_SERVICES = `
INSERT INTO confirmation_services (
    service_id,
    confirmation_id,
    name,
    cost,
    status,
    created_at,
    updated_at
) VALUES (
    public.uuid_generate_v4(),   
    $1,                         
    $2,                         
    $3,                         
    $4,                         
    CURRENT_TIMESTAMP,           
    CURRENT_TIMESTAMP           
);
`;

export const DELETE_CONFIRMATION_BY_LEAD_ID = `
DELETE FROM confirmations
WHERE lead_id = $1;
`;

export const GET_CONFIRMATION_BY_LEAD_ID = `
SELECT 
    confirmation_id,
    customer_id,
    lead_id,
    moving_on_date,
    moving_on_time,
    moving_on_status,
    packing_on_date,
    packing_on_time,
    packing_on_status,
    is_accept_liability_cover,
    liability_cover,
    is_terms_accepted,
    is_quotation_accepted,
    is_submitted,
    tool_tip_content,
    is_seen,
    comments,
    notes,
    confirmed_on,
    created_at,
    updated_at,
    created_by,
    updated_by
FROM confirmations
WHERE lead_id = $1;
`;

export const GET_CUSTOMER_BY_EMAIL = `
SELECT 
    id AS customer_id,
    name AS customer_name,
    phone AS customer_phone,
    email AS customer_email,
    password,
    cognito_sub,
    tenant_id,
    created_at,
    updated_at
FROM 
    customers
WHERE 
    email = $1;
`;

export const GET_CONFIRMATION_TOOLTIP_DETAILS = `
    SELECT
        c.confirmation_id AS "confirmationId",
        c.lead_id AS "leadId",
        c.is_seen AS "isSeen",
        c.is_new_response AS "isNewResponse"
    FROM
        confirmations c
    WHERE
        c.lead_id = $1
    ORDER BY
        c.created_at DESC
    LIMIT 1;
`;

export const UPDATE_CONFIRMATION_TOOLTIP_DETAILS = `
    UPDATE confirmations
    SET
        is_seen = $1,
        updated_at = NOW(),
        updated_by = $2
    WHERE confirmation_id = $3`;

export const GET_TERMS_DOC = `
    SELECT * FROM documents WHERE name = 'terms_conditions';
`;

export const GET_PACKING_DOC = `
    SELECT * FROM documents WHERE name = 'packing_guide';
`;

export const GET_CONFIRMATION_DETAILS = `
    SELECT
        c.confirmation_id AS "confirmationId",
        c.customer_id AS "customerId",
        c.lead_id AS "leadId",
        c.quote_id AS "quoteId",
        c.is_deposit_received AS "isDepositReceived",
        c.moving_on_date AS "movingOnDate",
        c.moving_on_time AS "movingOnTime",
        c.moving_on_status AS "movingOnStatus",
        c.packing_on_date AS "packingOnDate",
        c.packing_on_time AS "packingOnTime",
        c.packing_on_status AS "packingOnStatus",
        c.is_accept_liability_cover AS "isAcceptLiabilityCover",
        c.liability_cover AS "liabilityCover",
        c.is_terms_accepted AS "isTermsAccepted",
        c.is_quotation_accepted AS "isQuotationAccepted",
        c.is_submitted AS "isSubmitted",
        c.tool_tip_content AS "toolTipContent",
        c.is_seen AS "isSeen",
        c.comments AS "comments",
        c.notes AS "notes",
        c.confirmed_on AS "confirmedOn",
        (
            SELECT json_agg(json_build_object(
                'serviceId', cs.service_id,
                'name', cs.name,
                'cost', cs.cost,
                'status', cs.status
            ))
            FROM confirmation_services cs
            WHERE cs.confirmation_id = c.confirmation_id
        ) AS services
    FROM
        confirmations c
    WHERE
        c.lead_id = $1
    ORDER BY
        c.created_at DESC
    LIMIT 1;
`;

export const UPDATE_CONFIRMATION = `
    UPDATE confirmations
    SET
        moving_on_date = $1,
        moving_on_time = $2,
        moving_on_status = $3,
        packing_on_date = $4,
        packing_on_time = $5,
        packing_on_status = $6,
        is_accept_liability_cover = $7,
        liability_cover = $8,
        is_terms_accepted = $9,
        is_quotation_accepted = $10,
        is_submitted = $11,
        tool_tip_content = $12,
        is_seen = $13,
        comments = $14,
        confirmed_on = $15,
        updated_by = $16,
        is_new_response = $17,
        updated_at = NOW()
    WHERE confirmation_id = $18
    RETURNING *;
`;

export const UPDATE_CONFIRMATION_SERVICE = `
    UPDATE confirmation_services
    SET
        name = $1,
        cost = $2,
        status = $3,
        confirmation_id = $4,
        updated_at = NOW()
    WHERE service_id = $5
    RETURNING *;
`;

export const INSERT_CONFIRMATION_SERVICE = `
    INSERT INTO confirmation_services (
        name,
        cost,
        status,
        confirmation_id
    ) VALUES ($1, $2, $3, $4)
    RETURNING *;
`;

export const GET_LEAD_DETAILS_FOR_CUSTOMER = `
    SELECT
        cust.name AS "name",
        cust.phone AS "phone",
        ca.street AS "collectionStreet",
        ca.town AS "collectionTown",
        ca.county AS "collectionCounty",
        ca.postcode AS "collectionPostcode",
        ca.country AS "collectionCountry",
        da.street AS "deliveryStreet",
        da.town AS "deliveryTown",
        da.county AS "deliveryCounty",
        da.postcode AS "deliveryPostcode",
        da.country AS "deliveryCountry",
        l.collection_volume,
        l.collection_volume_unit,
        l.delivery_volume,
        l.delivery_volume_unit,
        l.collection_purchase_status AS "collectionPurchaseStatus",
        l.delivery_purchase_status AS "deliveryPurchaseStatus"
    FROM
        leads l
    LEFT JOIN
        customers cust ON l.customer_id = cust.id
    LEFT JOIN
        addresses ca ON l.collection_address_id = ca.id
    LEFT JOIN
        addresses da ON l.delivery_address_id = da.id
    WHERE
        l.generated_id = $1;
`;

export const GET_LEAD_QUOTES_CONFIRMATION = `
SELECT 
    q.notes,
    q.vat_included AS "vatIncluded",
    c.driver_qty AS "driverQty",
    c.porter_qty AS "porterQty",
    c.packer_qty AS "packerQty",
    g.contents_value AS "contentsValue",
    g.payment_method AS "paymentMethod",
    g.insurance_amount AS "insuranceAmount",
    g.insurance_percentage AS "insurancePercentage",
    g.insurance_type AS "insuranceType"
FROM 
    quotes q
LEFT JOIN 
    quote_costs qc ON q.id = qc.quote_id
LEFT JOIN 
    costs c ON qc.cost_id = c.id
LEFT JOIN 
    quote_general_info qg ON q.id = qg.quote_id
LEFT JOIN 
    general_information g ON qg.general_info_id = g.id
LEFT JOIN 
    quote_materials qm ON q.id = qm.quote_id
WHERE 
    q.id = $1;
`;

export const GET_CONFIRMATION_BY_ID = `
    SELECT * FROM confirmations WHERE confirmation_id = $1;
`;

export const UPDATE_CONFIRMATION_BY_CLIENT = `
    UPDATE confirmations
    SET
        moving_on_date = $1,
        moving_on_time = $2,
        moving_on_status = $3,
        packing_on_date = $4,
        packing_on_time = $5,
        packing_on_status = $6,
        is_deposit_received = $7,
        updated_by = $8,
        updated_at = NOW()
    WHERE confirmation_id = $9
    RETURNING *;
`;

export const CREATE_JOB_SCHEDULE_TABLE_IF_NOT_EXIST = `
CREATE TABLE IF NOT EXISTS job_schedules (
    job_id UUID DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    lead_id INT NOT NULL,
    assigned_workers INT,
    customer_id UUID,
    collection_address_id UUID,
    delivery_address_id UUID,
    start_date_time TIMESTAMP NOT NULL,
    end_date_time TIMESTAMP,
    note TEXT,
    job_type VARCHAR(50),
    status VARCHAR(50),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_vehicles (
    vehicle_id SERIAL PRIMARY KEY,     
    vehicle_type_id VARCHAR(100) NOT NULL, 
    lead_id VARCHAR(100) NOT NULL, 
    job_id UUID NOT NULL,
    vehicle_count INT NOT NULL         
);
`;

export const GET_CONFIRMATION_AND_CUSTOMER_BY_ID = `
SELECT 
    c.confirmation_id,
    c.lead_id,
    c.quote_id,
    cus.id AS customer_id,
    cus.name AS customer_name,
    cus.phone AS customer_phone,
    cus.email AS customer_email,
    a1.id AS collection_address_id,
    a1.street AS collection_street,
    a1.town AS collection_town,
    a1.county AS collection_county,
    a1.postcode AS collection_postcode,
    a1.country AS collection_country,
    a2.id AS delivery_address_id,
    a2.street AS delivery_street,
    a2.town AS delivery_town,
    a2.county AS delivery_county,
    a2.postcode AS delivery_postcode,
    a2.country AS delivery_country,
    c.moving_on_status,
    c.packing_on_date,
    c.packing_on_status,
    l.status
FROM 
    confirmations c
JOIN 
    leads l ON c.lead_id = l.generated_id
LEFT JOIN 
    customers cus ON l.customer_id = cus.id
LEFT JOIN 
    addresses a1 ON l.collection_address_id = a1.id
LEFT JOIN 
    addresses a2 ON l.delivery_address_id = a2.id
WHERE 
    c.confirmation_id = $1;
`;

export const INSERT_JOB_SCHEDULE = `
  INSERT INTO job_schedules (
    job_title, 
    assigned_workers, 
    customer_id, 
    collection_address_id,
    delivery_address_id,
    start_date_time, 
    end_date_time, 
    note,
    job_type,
    status, 
    created_by, 
    created_at, 
    updated_by, 
    updated_at, 
    lead_id
  ) 
  VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
  ) RETURNING job_id;;
`;


export const INSERT_JOB_VEHICLE = `
  INSERT INTO job_vehicles (
    vehicle_type_id, 
    vehicle_count,
    job_id,
    lead_id
  ) 
  VALUES (
    $1, $2, $3, $4
  ) RETURNING *;
`;

export const GET_QUOTE_BY_ID_FOR_CONFIRMATION = `
SELECT 
    e.id AS quoteId,
    e.lead_id AS leadId,
    e.quote_total AS quoteTotal,
    e.cost_total AS costTotal,
    e.notes,
    e.vat_included,
    (
        SELECT json_agg(json_build_object(
            'costId', c.id,
            'driverQty', c.driver_qty,
            'porterQty', c.porter_qty,
            'packerQty', c.packer_qty,
            'vehicleQty', c.vehicle_qty,
            'vehicleTypeId', c.vehicle_type_id
        ))
        FROM quote_costs ec
        JOIN costs c ON ec.cost_id = c.id
        JOIN public.vehicle_types vt ON c.vehicle_type_id = vt.id
        WHERE ec.quote_id = e.id
    ) AS costs
FROM 
    quotes e
WHERE 
    e.id = $1
ORDER BY 
    e.created_at DESC
LIMIT 1;
`;

export const GET_CONFIRMATION_ID_BY_LEAD_ID = `
SELECT 
    confirmation_id
FROM 
    confirmations
WHERE 
    lead_id = $1
ORDER BY 
    created_at DESC
LIMIT 1;
`;

export const UPDATE_VAT_INCLUDED_IN_QUOTE = `
UPDATE quotes
SET
   vat_included = $1
 WHERE id = $2 ;
`;

export const GET_LATEST_QUOTES = `
SELECT 
    e.id AS quoteId,
    e.lead_id AS leadId,
    e.quote_total AS quoteTotal,
    e.cost_total AS costTotal,
    e.quote_expires_on AS quoteExpiresOn,
    e.notes,
    e.vat_included AS vatIncluded,
    e.material_price_chargeable AS materialPriceChargeable,
    (
        SELECT json_agg(json_build_object(
            'serviceId', s.id,
            'typeName', s.service_name,
            'description', s.description,
            'price', s.price
        ))
        FROM quote_services es
        JOIN services s ON es.service_id = s.id
        WHERE es.quote_id = e.id
    ) AS services,
    (
        SELECT json_agg(json_build_object(
            'materialId', m.id,
            'name', m.name,
            'dimensions', m.dimensions,
            'surveyedQty', m.surveyed_qty,
            'chargeQty', m.charge_qty,
            'price', m.price,
            'total', m.total,
            'volume', m.volume,
            'cost', m.cost
        ))
        FROM quote_materials em
        JOIN materials m ON em.material_id = m.id
        WHERE em.quote_id = e.id
    ) AS materials,
    (
        SELECT json_agg(json_build_object(
            'costId', c.id,
            'driverQty', c.driver_qty,
            'porterQty', c.porter_qty,
            'packerQty', c.packer_qty,
            'vehicleQty', c.vehicle_qty,
            'vehicleTypeId', c.vehicle_type_id,
            'vehicleTypeName', vt.type_name,
            'fuelCharge', c.fuel_charge,
            'wageCharge', c.wage_charge
        ))
        FROM quote_costs ec
        JOIN costs c ON ec.cost_id = c.id
        JOIN public.vehicle_types vt ON c.vehicle_type_id = vt.id
        WHERE ec.quote_id = e.id
    ) AS costs,
    (
        SELECT json_agg(json_build_object(
            'generalInfoId', gi.id,
            'driverWage', gi.driver_wage,
            'porterWage', gi.porter_wage,
            'packerWage', gi.packer_wage,
            'contentsValue', gi.contents_value,
            'paymentMethod', gi.payment_method,
            'insuranceAmount', gi.insurance_amount,
            'insurancePercentage', gi.insurance_percentage,
            'insuranceType', gi.insurance_type
        ))
        FROM quote_general_info eg
        JOIN general_information gi ON eg.general_info_id = gi.id
        WHERE eg.quote_id = e.id
    ) AS generalInfo,
    (
        SELECT json_agg(json_build_object(
            'ancillaryId', a.id,
            'name', a.name,
            'charge', a.charge,
            'isChargeable', a.ischargeable
        ))
        FROM quote_ancillaries ea
        JOIN ancillaries a ON ea.ancillary_id = a.id
        WHERE ea.quote_id = e.id
    ) AS ancillaries
FROM 
    quotes e
WHERE 
    e.lead_id = $1
ORDER BY 
    e.created_at DESC
LIMIT 1;
`;


export const CREATE_DOC_TABLE_IF_NOT_EXISTS = `
CREATE TABLE IF NOT EXISTS documents
(
    doc_id uuid NOT NULL DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    name CHAR(50) COLLATE pg_catalog."default" NOT NULL UNIQUE,
    s3key text COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by text COLLATE pg_catalog."default",
    updated_by text COLLATE pg_catalog."default"
);

CREATE OR REPLACE TRIGGER update_documents_updated_at
    BEFORE UPDATE 
    ON documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
`;

export const GET_JOB_SCHEDULE_BY_LEAD_ID = `
SELECT  
    js.lead_id,  
    js.assigned_workers, 
    js.customer_id, 
    c.name AS customer_name, 
    c.email AS customer_email
FROM 
    job_schedules js
LEFT JOIN 
    customers c ON js.customer_id = c.id
WHERE 
    js.lead_id = $1;
`;

export const GET_ALL_VEHICLE_TYPES = `
SELECT 
    id AS vehicle_type_id, 
    type_name AS vehicle_type,
    0 AS vehicle_count
FROM 
    public.vehicle_types
WHERE 
    is_active = true
ORDER BY 
    type_name;
`;

export const GET_JOB_VEHICLES_BY_LEAD_ID = `
SELECT   
    jv.vehicle_type_id, 
    vt.type_name AS vehicle_type, 
    jv.vehicle_count
FROM 
    job_vehicles jv
LEFT JOIN 
    public.vehicle_types vt ON jv.vehicle_type_id::UUID = vt.id
WHERE 
    jv.lead_id = $1
ORDER BY 
    vt.type_name;
`;



