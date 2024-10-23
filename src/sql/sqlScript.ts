export const SELECT_TENANT = 'SELECT * FROM tenants WHERE cognito_sub = $1';

export const SELECT_COMPANY_INFO = 'SELECT * FROM company_info WHERE tenant_id = $1';

export const SELECT_EMAIL_INFO = 'SELECT * FROM public.email_info WHERE tenant_id = $1';

export const GET_STAFF_BY_SUB = `
    SELECT * 
    FROM staffs 
    WHERE cognito_sub = $1;
`;

export const GET_TENANT_BY_ID = 'SELECT * FROM public.tenants WHERE id = $1';

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
export const GET_LEAD_COUNT_WITH_FILTER = `
    SELECT COUNT(*) 
    FROM leads
    WHERE ($1::TEXT IS NULL OR status = $1::TEXT)
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

export const GET_EMAIL_TEMPLATE_BY_ID = `
    SELECT template_id, template_name, subject, salutation, body, links, signature, disclaimer, placeholders
    FROM public.email_templates 
    WHERE template_id = $1
`;

export const GET_CUSTOMER_BY_ID = `SELECT * FROM customers WHERE id = $1`;

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
  WHERE sr.role = $1 AND status='ACTIVE'
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
    e.id = $1
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
    username,
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

export const MARK_SEEN_CONFIRMATION_TOOLTIP = `
    UPDATE confirmations
    SET
        is_seen = true,
        updated_at = NOW(),
        updated_by = $1
    WHERE lead_id = $2`;

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

export const UPDATE_CONFIRMATION_FEEDBACK = `
    UPDATE confirmations
    SET
        is_asked_for_feedback = true,
        updated_by = $1,
        updated_at = NOW()
    WHERE lead_id = $2
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

export const GET_INVOICE_BY_LEAD_AND_TYPE = `
            SELECT 
                i.invoice_number, 
                i.invoice_type             
            FROM invoices i
            WHERE i.lead_id = $1 AND i.invoice_type ILIKE $2
            LIMIT 1
        `;

export const GET_CONFIRMATION_NOTES = `
SELECT 
    notes AS confirmation_note
FROM 
    confirmations
WHERE
    lead_id::VARCHAR(50) = $1::VARCHAR(50)
ORDER BY created_at DESC
LIMIT 1;`;

export const GET_QUOTES_NOTE = `
SELECT 
    notes AS quote_note
FROM 
    quotes
WHERE 
    lead_id::VARCHAR(50) = $1::VARCHAR(50)
ORDER BY created_at DESC
LIMIT 1;`;

export const GET_JOB_NOTES = `
SELECT 
    note AS job_note
FROM 
    job_schedules
WHERE 
    lead_id::VARCHAR(50) = $1::VARCHAR(50)
ORDER BY created_at DESC
LIMIT 1;`;

export const GET_SURVEY_NOTE = `
SELECT 
    notes AS survey_note
FROM 
    surveys
WHERE 
    lead_id::VARCHAR(50) = $1::VARCHAR(50)
ORDER BY created_at DESC
LIMIT 1;`;

export const UPDATE_FOLLOWUP_DATE = `
    UPDATE leads
    SET follow_up_date = $1
    WHERE generated_id = $2;
`;

// SQL queries
export const GET_LEAD_STATUS_BY_ID = `
    SELECT status , generated_id AS lead_id
    FROM leads 
    WHERE generated_id = $1;
`;

export const DELETE_EXISTING_RESPONSES = `
DELETE FROM feedback_responses 
WHERE lead_id = $1;
`;

export const GET_QUOTE_BY_LEAD_ID = `
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
OFFSET 1
LIMIT 1;
`;

export const GET_ESTIMATE_BY_LEAD_ID = `
SELECT 
    e.id AS estimateId,
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
        FROM estimate_services es
        JOIN services s ON es.service_id = s.id
        WHERE es.estimate_id = e.id
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
        FROM estimate_materials em
        JOIN materials m ON em.material_id = m.id
        WHERE em.estimate_id = e.id
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
        FROM estimate_costs ec
        JOIN costs c ON ec.cost_id = c.id
        JOIN public.vehicle_types vt ON c.vehicle_type_id = vt.id
        WHERE ec.estimate_id = e.id
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
        FROM estimate_general_info eg
        JOIN general_information gi ON eg.general_info_id = gi.id
        WHERE eg.estimate_id = e.id
    ) AS generalInfo,
    (
        SELECT json_agg(json_build_object(
            'ancillaryId', a.id,
            'name', a.name,
            'charge', a.charge,
            'isChargeable', a.ischargeable
        ))
        FROM estimate_ancillaries ea
        JOIN ancillaries a ON ea.ancillary_id = a.id
        WHERE ea.estimate_id = e.id
    ) AS ancillaries
FROM 
    estimates e
WHERE 
    e.lead_id = $1
ORDER BY 
    e.created_at DESC
LIMIT 1;
`;

export const GET_JOB_LIST = `
SELECT 
    js.job_id,
    js.job_title,
    js.lead_id,
    js.start_date_time,
    js.end_date_time,
    js.note,
    js.job_type,
    js.status,
    c.name AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    ca.street AS collection_street,
    ca.town AS collection_town,
    ca.postcode AS collection_postcode,
    ca.country AS collection_country,
    da.street AS delivery_street,
    da.town AS delivery_town,
    da.postcode AS delivery_postcode,
    da.country AS delivery_country,
    vt.type_name AS vehicle_type, 
    jv.vehicle_count
FROM job_schedules js
LEFT JOIN customers c ON js.customer_id = c.id
LEFT JOIN addresses ca ON js.collection_address_id = ca.id
LEFT JOIN addresses da ON js.delivery_address_id = da.id
LEFT JOIN job_vehicles jv ON js.job_id = jv.job_id
LEFT JOIN public.vehicle_types vt ON jv.vehicle_type_id::UUID = vt.id
ORDER BY js.start_date_time DESC;
`;

export const GET_FEEDBACK = `
SELECT 
    fr.response_id,
    fr.question_id,
    fq.question_text,
    fq.category,
    fr.rating,
    fr.comment,
    fr.created_at
FROM feedback_responses fr
LEFT JOIN feedback_questions fq ON fr.question_id = fq.question_id
WHERE fr.lead_id = $1
ORDER BY fr.created_at DESC;
        `;

export const UPDATE_ADDRESS = `
        UPDATE addresses 
        SET 
            county = $1, 
            country = $2, 
            street = $3, 
            town = $4, 
            postcode = $5 
        WHERE id = $6
    `;

export const INSERT_ADDRESS = `
INSERT INTO addresses (street, town, county, postcode, country)
VALUES ($1, $2, $3, $4, $5) RETURNING id
`;

export const UPDATE_LEAD = `
UPDATE leads
SET 
    referrer_id = $1,
    follow_up_date = $2,
    moving_on_date = $3,
    packing_on_date = $4,
    collection_purchase_status = $5,
    collection_house_size = $6,
    collection_distance = $7,
    collection_volume = $8,
    collection_volume_unit = $9,
    delivery_purchase_status = $10,
    delivery_house_size = $11,
    delivery_distance = $12,
    delivery_volume = $13,
    delivery_volume_unit = $14,
    customer_notes = $15,
    batch = $16,
    incept_batch = $17,
    lead_date = $18,
    collection_address_id = $19,
    delivery_address_id = $20,
    customer_id = $21,
    updated_at = NOW()
WHERE generated_id = $22
`;

export const UPDATE_LEAD_STATUS = `
UPDATE leads
SET status = $1, updated_at = CURRENT_TIMESTAMP
WHERE generated_id = $2
RETURNING generated_id as lead_id, status, updated_at;
`;
