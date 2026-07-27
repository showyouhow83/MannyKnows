-- =====================================================================
-- MannyKnows — 002-full-admin.sql
-- Full admin/CRM schema, consolidated from the SLPainting D1 database
-- (schemas v36–v99 + runtime-created tables + ad-hoc prod columns),
-- adapted for MK (state default 'MA', 'remi-chat' source, MK branding).
--
-- Apply with:
--   npx wrangler d1 execute MK_APP_DB --remote --file=database/migrations/002-full-admin.sql
--
-- NOTE: this file DROPs and recreates `leads` (the Phase-1 simple table,
-- currently zero rows). It is safe to run once on the current database.
-- Re-running later is safe for every other table (IF NOT EXISTS), but the
-- leads DROP would discard lead rows — don't re-run after go-live.
-- =====================================================================

PRAGMA defer_foreign_keys = true;

-- =====================================================================
-- 1. LEADS — drop Phase-1 simple table, recreate full SLP-style pipeline
--    table. Column set = SLP v36 + v37 extras + v92 partner_id, PLUS the
--    MK Phase-1 `notes` column. Defaults are relaxed so the existing
--    contact-form insert keeps working:
--      INSERT INTO leads (source, customer_name, customer_email,
--                         customer_phone, project_description, status)
-- =====================================================================
DROP TABLE IF EXISTS leads;

CREATE TABLE leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Confirmation tracking (nullable: contact-form leads have none;
    -- SQLite UNIQUE allows multiple NULLs)
    confirmation_code TEXT UNIQUE,
    confirmation_token TEXT UNIQUE,

    -- Customer info
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,

    -- Location
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT 'MA',
    zip TEXT,

    -- Service request
    service_type TEXT,
    preferred_date TEXT DEFAULT 'TBD',
    preferred_time TEXT DEFAULT 'TBD',
    preferred_contact_time TEXT,
    project_description TEXT,

    -- AI conversation context (Remi chat)
    conversation_summary TEXT,

    -- Project images (JSON array of R2/CF-Images URLs)
    project_images TEXT,

    -- Financing
    financing_interest INTEGER DEFAULT 0,

    -- Status: new | pending_confirmation | confirmed | promoted | won |
    --         failed | contacted | scheduled | completed | cancelled | lost
    status TEXT DEFAULT 'new',

    -- Source: contact-form | quote-form | footer-form | remi-chat | phone |
    --         referral | other
    source TEXT DEFAULT 'remi-chat',

    -- Partner white-label tag (NULL = own job)
    partner_id INTEGER,

    -- Internal notes (kept from MK Phase-1 UI)
    notes TEXT,

    -- Reminder tracking
    reminder_sent INTEGER DEFAULT 0,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    contacted_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_confirmation_code ON leads(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_leads_confirmation_token ON leads(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_leads_customer_email ON leads(customer_email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_preferred_date ON leads(preferred_date);

-- =====================================================================
-- 2. QUOTES (SLP v38 + v41 promoted_by + v53 contract_url + v55
--    preferred date/time + v63 template refs + v77 pdf_image_urls +
--    v85 require_signature + v92 partner_id + prod ad-hoc columns:
--    project_images, follow_up_count, last_follow_up_at).
--    lead_id nullable: standalone-portfolio creates quotes with no lead.
-- =====================================================================
CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,

    quote_number TEXT UNIQUE NOT NULL,

    -- Customer info (copied from lead, editable)
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT DEFAULT 'MA',
    zip TEXT,

    -- Scope
    services TEXT,                       -- JSON array
    scope_description TEXT,

    -- Property info
    year_built TEXT,
    repairs_needed TEXT,
    preferred_brand TEXT,

    -- Budget / timeline
    budget REAL,
    estimated_start DATE,
    estimated_end DATE,
    estimated_duration TEXT,
    preferred_date TEXT,
    preferred_time TEXT,

    -- Pricing
    materials TEXT,                      -- JSON [{name, qty, unit_price, total}]
    labor TEXT,                          -- JSON [{description, qty, unit_price, total}]
    materials_total REAL,
    labor_total REAL,
    subtotal REAL,
    discount REAL DEFAULT 0,
    total REAL,

    -- Internal notes (JSON [{date, note, author}])
    notes TEXT,

    -- Status: draft | sent | accepted | declined | failed | cold | project
    status TEXT DEFAULT 'draft',

    -- Renegotiation
    is_renegotiation INTEGER DEFAULT 0,
    renegotiation_count INTEGER DEFAULT 0,

    -- Customer access token (accept/decline links, message reply-to)
    quote_token TEXT,

    -- Tracking
    sent_at DATETIME,
    responded_at DATETIME,
    follow_up_count INTEGER DEFAULT 0,
    last_follow_up_at DATETIME,

    -- Contract PDF (R2 URL)
    contract_url TEXT,

    -- Decline feedback
    decline_reason TEXT,
    decline_feedback TEXT,
    admin_response TEXT,

    -- Who approved ('customer' | 'admin')
    promoted_by TEXT,

    -- Quote template system (v63/v64 multi-scope)
    template_id INTEGER,
    template_sections TEXT,

    -- Reference images (admin tray) + starred subset for the PDF
    project_images TEXT,
    pdf_image_urls TEXT,

    -- Acceptance mode: 0 = simple Accept button, 1 = drawn signature
    require_signature INTEGER DEFAULT 0,

    -- Partner white-label tag
    partner_id INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_token ON quotes(quote_token);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- =====================================================================
-- 3. QUOTE TEMPLATES (SLP v63 — no SLP painting boilerplate seeded;
--    admin authors MK templates in /admin/quote-templates)
-- =====================================================================
CREATE TABLE IF NOT EXISTS quote_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    project_type TEXT NOT NULL,
    sections TEXT NOT NULL,              -- JSON array of {id, title, items[]}
    is_default INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quote_templates_type
    ON quote_templates(project_type, archived);
CREATE INDEX IF NOT EXISTS idx_quote_templates_default
    ON quote_templates(project_type, is_default)
    WHERE is_default = 1;

-- =====================================================================
-- 4. QUOTE SIGNATURES (SLP v65 — ESIGN/UETA acceptance record)
-- =====================================================================
CREATE TABLE IF NOT EXISTS quote_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL UNIQUE,
    signer_name TEXT NOT NULL,
    signature_data_url TEXT NOT NULL,
    consent_text TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    signed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_signatures_quote_id ON quote_signatures(quote_id);

-- =====================================================================
-- 5. QUOTE ATTACHMENTS (SLP prod ad-hoc table + v98 is_internal)
-- =====================================================================
CREATE TABLE IF NOT EXISTS quote_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL,
    label TEXT DEFAULT 'Document',
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    is_internal INTEGER DEFAULT 0,       -- 1 = admin-only, hidden from customer
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_attachments_quote ON quote_attachments(quote_id);

-- =====================================================================
-- 6. PROJECTS (SLP v40 rebuilt per v94: quote_id nullable, + v42 crew_token,
--    v43 portfolio_at, v57 contract fields, v84 colors_locked, v87
--    company_name, v92 partner_id, + prod ad-hoc internal_notes)
-- =====================================================================
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER,
    project_number TEXT UNIQUE NOT NULL,

    -- Customer info (copied from quote)
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    customer_city TEXT,
    customer_state TEXT DEFAULT 'MA',
    customer_zip TEXT,

    -- Scope (crew-visible, prices stripped)
    services TEXT,
    scope_description TEXT,
    materials TEXT,
    labor TEXT,

    -- Pricing (admin only)
    total REAL,

    -- Crew assignment
    crew_lead_id INTEGER,
    crew_notes TEXT,

    -- Access tokens
    client_token TEXT,                   -- client portal
    crew_token TEXT,                     -- crew page

    -- Schedule
    scheduled_start DATE,
    scheduled_end DATE,

    -- Status: needs_crew | in_progress | completed
    status TEXT DEFAULT 'needs_crew',
    started_at DATETIME,
    completed_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    portfolio_at DATETIME,

    -- Contract workflow (v57 quick fields; full system = project_contracts)
    project_contract_url TEXT,
    project_signed_contract_url TEXT,
    contract_status TEXT DEFAULT 'none',
    contract_sent_at DATETIME,

    full_address TEXT,
    colors_locked INTEGER DEFAULT 0,
    company_name TEXT,
    partner_id INTEGER,
    internal_notes TEXT,

    FOREIGN KEY (quote_id) REFERENCES quotes(id),
    FOREIGN KEY (crew_lead_id) REFERENCES crew_leads(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_quote_id ON projects(quote_id);
CREATE INDEX IF NOT EXISTS idx_projects_crew_lead ON projects(crew_lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_token ON projects(client_token);
CREATE INDEX IF NOT EXISTS idx_projects_crew_token ON projects(crew_token);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- =====================================================================
-- 7. PROJECT UPDATES — timeline photos/notes (SLP v40 + v69 poster_url +
--    v81 is_starred + v96 stream_uid)
-- =====================================================================
CREATE TABLE IF NOT EXISTS project_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    image_url TEXT,
    note TEXT,
    posted_by TEXT,                      -- 'crew_lead' | 'admin'
    posted_by_name TEXT,
    poster_url TEXT,                     -- cached video poster frame
    is_starred INTEGER DEFAULT 0,        -- 1 = crew-page only, 0 = client-visible
    stream_uid TEXT,                     -- Cloudflare Stream UID for videos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_created ON project_updates(created_at);
CREATE INDEX IF NOT EXISTS idx_project_updates_starred ON project_updates(project_id, is_starred);

-- =====================================================================
-- 8. PROJECT DOCUMENTS (SLP v91 — PDFs owned by a project)
-- =====================================================================
CREATE TABLE IF NOT EXISTS project_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    label TEXT NOT NULL DEFAULT 'Document',
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    source TEXT NOT NULL DEFAULT 'admin',  -- 'quote_promotion' | 'admin'
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);

-- =====================================================================
-- 9. PROJECT COLORS (SLP v73 + v86 color_hex/image_url)
-- =====================================================================
CREATE TABLE IF NOT EXISTS project_colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,               -- scope item id this answers
    label TEXT,
    product_type TEXT,                   -- 'paint' | 'stain' | NULL
    color_value TEXT,
    finish TEXT,
    note TEXT,
    color_hex TEXT,
    image_url TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE (project_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_project_colors_project ON project_colors(project_id);

-- =====================================================================
-- 10. CONTRACT TEMPLATES (SLP v66 — no SLP boilerplate seeded)
-- =====================================================================
CREATE TABLE IF NOT EXISTS contract_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    project_type TEXT NOT NULL DEFAULT 'other',
    is_default INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,

    sections TEXT NOT NULL DEFAULT '[]', -- same QuoteSection[] shape as quote_templates

    -- Payment-schedule defaults (overridable per project)
    down_payment_percent REAL NOT NULL DEFAULT 30,
    down_payment_count INTEGER NOT NULL DEFAULT 3,
    monthly_payment_count INTEGER NOT NULL DEFAULT 8,
    cancellation_window_days INTEGER NOT NULL DEFAULT 3,
    cancellation_fee_amount REAL NOT NULL DEFAULT 300,
    late_fee_amount REAL NOT NULL DEFAULT 50,
    late_fee_grace_days INTEGER NOT NULL DEFAULT 3,
    warranty_months INTEGER NOT NULL DEFAULT 28,

    terms TEXT NOT NULL DEFAULT '{}',    -- {marketing_release, reference_request, custom_terms}

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(project_type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_archived ON contract_templates(archived);

-- =====================================================================
-- 11. PROJECT CONTRACTS (SLP v66 + v68 signed_pdf_url)
-- =====================================================================
CREATE TABLE IF NOT EXISTS project_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL UNIQUE,
    contract_template_id INTEGER,

    scopes TEXT NOT NULL DEFAULT '[]',   -- snapshotted scope content

    total REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,

    down_payment_percent REAL NOT NULL DEFAULT 30,
    down_payment_count INTEGER NOT NULL DEFAULT 3,
    monthly_payment_count INTEGER NOT NULL DEFAULT 8,
    cancellation_window_days INTEGER NOT NULL DEFAULT 3,
    cancellation_fee_amount REAL NOT NULL DEFAULT 300,
    late_fee_amount REAL NOT NULL DEFAULT 50,
    late_fee_grace_days INTEGER NOT NULL DEFAULT 3,
    warranty_months INTEGER NOT NULL DEFAULT 28,

    payment_schedule TEXT NOT NULL DEFAULT '[]',
    terms TEXT NOT NULL DEFAULT '{}',
    start_date TEXT,
    use_as_reference INTEGER,            -- 1 yes / 0 no / NULL unanswered

    contract_token TEXT UNIQUE,

    -- draft | sent | signed | countersigned | void
    status TEXT NOT NULL DEFAULT 'draft',
    sent_at TEXT,
    signed_at TEXT,
    countersigned_at TEXT,
    voided_at TEXT,

    signed_pdf_url TEXT,                 -- customer-signed PDF in R2

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_template_id) REFERENCES contract_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_project_contracts_project ON project_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contracts_token ON project_contracts(contract_token);
CREATE INDEX IF NOT EXISTS idx_project_contracts_status ON project_contracts(status);

-- =====================================================================
-- 12. CONTRACT SIGNATURES — audit trail (SLP v66)
-- =====================================================================
CREATE TABLE IF NOT EXISTS contract_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_contract_id INTEGER NOT NULL,
    signer_role TEXT NOT NULL,           -- 'customer' | 'contractor'
    signer_name TEXT NOT NULL,
    signature_data_url TEXT NOT NULL,
    consent_text TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    signed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_contract_id) REFERENCES project_contracts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contract_signatures_pc ON contract_signatures(project_contract_id);

-- =====================================================================
-- 13. CONTRACTOR SIGNATURE — singleton, id=1 (SLP v67)
-- =====================================================================
CREATE TABLE IF NOT EXISTS contractor_signature (
    id INTEGER PRIMARY KEY,
    signer_name TEXT NOT NULL,
    printed_title TEXT,
    signature_data_url TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (id = 1)
);

-- =====================================================================
-- 14. PAYMENT RECEIPTS — per-payment dual-signed receipts (SLP v72)
-- =====================================================================
CREATE TABLE IF NOT EXISTS payment_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_contract_id INTEGER NOT NULL,
    row_id TEXT NOT NULL,                -- payment_schedule row id
    row_label TEXT,
    row_kind TEXT,
    amount REAL NOT NULL,
    payment_method TEXT,                 -- check / cash / card / transfer
    check_number TEXT,
    customer_name TEXT,
    customer_signature_data_url TEXT,
    contractor_name TEXT,
    contractor_signature_data_url TEXT,
    collected_at TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_contract_id) REFERENCES project_contracts(id) ON DELETE CASCADE,
    UNIQUE (project_contract_id, row_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_contract ON payment_receipts(project_contract_id);

-- =====================================================================
-- 15. PAYMENT AVAILABILITY — customer "when can you pay" (SLP v74 + v83)
-- =====================================================================
CREATE TABLE IF NOT EXISTS payment_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_contract_id INTEGER NOT NULL,
    row_id TEXT NOT NULL,
    available_date TEXT,
    available_time TEXT,                 -- 'HH:MM' optional
    note TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_contract_id) REFERENCES project_contracts(id) ON DELETE CASCADE,
    UNIQUE (project_contract_id, row_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_availability_contract ON payment_availability(project_contract_id);

-- =====================================================================
-- 16. PAYMENT INVOICES — invoice-send log (SLP runtime-created table)
-- =====================================================================
CREATE TABLE IF NOT EXISTS payment_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_contract_id INTEGER,
    project_id INTEGER,
    row_id TEXT,
    amount REAL,
    sent_to TEXT,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_invoices_project ON payment_invoices(project_id);

-- =====================================================================
-- 17. CREW LEADS (SLP v39 + v58 bonus + v59 pay model/flags + prod
--     ad-hoc hourly_rate)
-- =====================================================================
CREATE TABLE IF NOT EXISTS crew_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,

    login_token TEXT,
    token_expires DATETIME,

    hourly_rate REAL DEFAULT 0,
    bonus_start_date TEXT,
    pay_model TEXT DEFAULT 'hourly',     -- 'hourly' | 'salaried_daily'
    salary_daily_hours REAL DEFAULT 8,
    salary_daily_rate REAL DEFAULT 0,
    is_driver INTEGER DEFAULT 0,

    active INTEGER DEFAULT 1,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_leads_email ON crew_leads(email);
CREATE INDEX IF NOT EXISTS idx_crew_leads_active ON crew_leads(active);
CREATE INDEX IF NOT EXISTS idx_crew_leads_login_token ON crew_leads(login_token);

-- =====================================================================
-- 18. CREW SESSIONS (SLP prod ad-hoc — timeclock/portal cookie sessions)
-- =====================================================================
CREATE TABLE IF NOT EXISTS crew_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_lead_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_lead_id) REFERENCES crew_leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crew_sessions_token ON crew_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_crew_sessions_crew ON crew_sessions(crew_lead_id);

-- =====================================================================
-- 19. TIME LOGS (SLP prod ad-hoc — timeclock shifts).
--     break_minutes / lunch_minutes are NOT NULL DEFAULT 0 because the
--     code does `lunch_minutes = lunch_minutes + ?`.
-- =====================================================================
CREATE TABLE IF NOT EXISTS time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_lead_id INTEGER NOT NULL,
    work_date TEXT,                      -- YYYY-MM-DD (ET)
    clock_in TEXT,                       -- ISO datetime
    clock_out TEXT,
    status TEXT DEFAULT 'working',       -- working | on_break | on_lunch | idle
    break_minutes INTEGER NOT NULL DEFAULT 0,
    lunch_minutes INTEGER NOT NULL DEFAULT 0,
    break_ends_at TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_lead_id) REFERENCES crew_leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_time_logs_crew_date ON time_logs(crew_lead_id, work_date);
CREATE INDEX IF NOT EXISTS idx_time_logs_work_date ON time_logs(work_date);

-- =====================================================================
-- 20. CREW EXPENSES (SLP prod ad-hoc — receipts/reimbursements)
-- =====================================================================
CREATE TABLE IF NOT EXISTS crew_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_lead_id INTEGER NOT NULL,
    work_date TEXT,                      -- YYYY-MM-DD
    amount REAL NOT NULL DEFAULT 0,
    description TEXT,
    receipt_url TEXT,
    paid_with TEXT,                      -- e.g. 'own' | 'company_card'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_lead_id) REFERENCES crew_leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crew_expenses_crew ON crew_expenses(crew_lead_id);
CREATE INDEX IF NOT EXISTS idx_crew_expenses_date ON crew_expenses(work_date);

-- =====================================================================
-- 21. CREW MATERIALS — gear issuance log (SLP v70)
-- =====================================================================
CREATE TABLE IF NOT EXISTS crew_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_lead_id INTEGER NOT NULL,
    item TEXT NOT NULL,
    category TEXT,
    quantity REAL NOT NULL DEFAULT 1,
    date_given TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_lead_id) REFERENCES crew_leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crew_materials_crew ON crew_materials(crew_lead_id);

-- =====================================================================
-- 22. UPLOAD LOGS — crew upload diagnostics (SLP runtime-created table)
-- =====================================================================
CREATE TABLE IF NOT EXISTS upload_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_id INTEGER,
    crew_name TEXT,
    filename TEXT,
    file_size INTEGER,
    media_type TEXT,
    note TEXT,
    result TEXT,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 23. PORTFOLIOS (SLP v49 unified naming; v45–v48 fields folded in)
-- =====================================================================
CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    project_type TEXT DEFAULT 'other',
    description TEXT,
    slug TEXT,
    is_published INTEGER DEFAULT 0,
    published_at DATETIME,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_city TEXT,
    source_project_id INTEGER,           -- NULL = manual portfolio
    display_mode TEXT DEFAULT 'pairs',   -- 'pairs' | 'gallery' | 'combined'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_slug ON portfolios(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portfolios_published ON portfolios(is_published);
CREATE INDEX IF NOT EXISTS idx_portfolios_source ON portfolios(source_project_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_display_mode ON portfolios(display_mode);

-- =====================================================================
-- 24. PORTFOLIO MEDIA (SLP v49 + v50 video/stream + v52 CF Images +
--     v69 poster_url + v96 stream_uid + v97 captured_at)
-- =====================================================================
CREATE TABLE IF NOT EXISTS portfolio_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',     -- 'image' | 'video'
    file_name TEXT,
    file_size INTEGER,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    stream_uid TEXT,
    playback_url TEXT,
    thumbnail_url TEXT,
    duration_seconds REAL,
    video_status TEXT DEFAULT 'ready',
    cloudflare_image_id TEXT,
    poster_url TEXT,
    captured_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_media_portfolio ON portfolio_media(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_media_stream_uid ON portfolio_media(stream_uid) WHERE stream_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portfolio_media_video_status ON portfolio_media(video_status) WHERE media_type = 'video';
CREATE INDEX IF NOT EXISTS idx_portfolio_media_cf_image ON portfolio_media(cloudflare_image_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_media_captured ON portfolio_media(portfolio_id, captured_at);

-- =====================================================================
-- 25. PORTFOLIO PAIRS — before/after (SLP v49)
-- =====================================================================
CREATE TABLE IF NOT EXISTS portfolio_pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    before_media_id INTEGER NOT NULL,
    after_media_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_cover INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (before_media_id) REFERENCES portfolio_media(id) ON DELETE CASCADE,
    FOREIGN KEY (after_media_id) REFERENCES portfolio_media(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_pairs_portfolio ON portfolio_pairs(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_pairs_cover ON portfolio_pairs(portfolio_id, is_cover);

-- =====================================================================
-- 26. PORTFOLIO GALLERY — single images (SLP v49)
-- =====================================================================
CREATE TABLE IF NOT EXISTS portfolio_gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    media_id INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_cover INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES portfolio_media(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_gallery_portfolio ON portfolio_gallery(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_gallery_cover ON portfolio_gallery(portfolio_id, is_cover);

-- =====================================================================
-- 27. MEDIA POOL — crew-captured media inbox (SLP v62 + v82 project tag +
--     v96 stream_uid)
-- =====================================================================
CREATE TABLE IF NOT EXISTS media_pool (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL,            -- 'image' | 'video'
    file_size INTEGER,
    original_filename TEXT,
    note TEXT,
    uploaded_by_crew_id INTEGER NOT NULL,
    project_id INTEGER,
    source TEXT,                         -- 'crew-portal' | 'timeclock' | NULL
    stream_uid TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by_crew_id) REFERENCES crew_leads(id)
);

CREATE INDEX IF NOT EXISTS idx_media_pool_created ON media_pool(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_pool_type ON media_pool(media_type);
CREATE INDEX IF NOT EXISTS idx_media_pool_uploader ON media_pool(uploaded_by_crew_id);
CREATE INDEX IF NOT EXISTS idx_media_pool_project ON media_pool(project_id);

-- =====================================================================
-- 28. CONTACTS (SLP runtime-created table + v89 company_name)
-- =====================================================================
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT DEFAULT 'US',
    source TEXT,
    notes TEXT,
    company_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);

-- =====================================================================
-- 29. CONTACT LINKS — contact ↔ lead/quote/project (SLP runtime-created)
-- =====================================================================
CREATE TABLE IF NOT EXISTS contact_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    link_type TEXT NOT NULL,             -- 'lead' | 'quote' | 'project'
    link_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

CREATE INDEX IF NOT EXISTS idx_contact_links_contact ON contact_links(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_links_target ON contact_links(link_type, link_id);

-- =====================================================================
-- 30. PARTNERS (SLP v75 + v78 code + v92 white-label branding)
-- =====================================================================
CREATE TABLE IF NOT EXISTS partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    code TEXT,                           -- short job-number prefix, e.g. 'ABC'
    address TEXT,
    logo_url TEXT,
    website TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 31. PARTNER JOBS (SLP v75 + v78 job_number/schedule)
-- =====================================================================
CREATE TABLE IF NOT EXISTS partner_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id INTEGER NOT NULL,
    client_name TEXT,
    address TEXT,
    phone TEXT,
    work_type TEXT,
    scope TEXT,
    colors TEXT,
    price REAL NOT NULL DEFAULT 0,
    pdf_url TEXT,
    pdf_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | completed
    notes TEXT,
    crew_token TEXT,
    job_number TEXT,
    scheduled_start TEXT,
    scheduled_end TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_partner_jobs_partner ON partner_jobs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_jobs_crew_token ON partner_jobs(crew_token);

-- =====================================================================
-- 32. PARTNER JOB UPDATES — crew progress photos (SLP v78)
-- =====================================================================
CREATE TABLE IF NOT EXISTS partner_job_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_job_id INTEGER NOT NULL,
    image_url TEXT,
    poster_url TEXT,
    note TEXT,
    posted_by TEXT DEFAULT 'crew_lead',
    posted_by_name TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_job_id) REFERENCES partner_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_partner_job_updates_job ON partner_job_updates(partner_job_id);

-- =====================================================================
-- 33. MESSAGES — admin ↔ customer email log (SLP v54 + v56 sender_email +
--     v88 attachments + prod ad-hoc read_at)
-- =====================================================================
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    quote_id INTEGER,

    subject TEXT,
    body TEXT NOT NULL,

    sender_type TEXT NOT NULL DEFAULT 'admin',  -- 'admin' | 'system' | 'customer'
    sender_name TEXT DEFAULT 'MannyKnows',
    sender_email TEXT,                          -- set on customer replies

    recipient_email TEXT NOT NULL,
    recipient_name TEXT,

    status TEXT DEFAULT 'sent',                 -- 'sent' | 'failed'
    resend_id TEXT,
    attachments TEXT,                           -- JSON [{url, name, type, size}]
    read_at TEXT,                               -- unread-replies tracking

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (quote_id) REFERENCES quotes(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_quote_id ON messages(quote_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =====================================================================
-- 34. HERO SLIDES — homepage carousel (SLP v95)
-- =====================================================================
CREATE TABLE IF NOT EXISTS hero_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    link_url TEXT NOT NULL DEFAULT '#',
    image_url TEXT NOT NULL,
    image_mobile_url TEXT,
    alt TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides(enabled, sort_order, id);

-- =====================================================================
-- 35. ADMIN USERS (SLP v44 — PBKDF2-SHA256; create users via
--     /api/admin/users or scripts/add-admin-user)
-- =====================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    display_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'admin',           -- 'admin' | 'manager' | 'viewer'
    status TEXT DEFAULT 'active',        -- 'active' | 'disabled'
    last_login DATETIME,
    login_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- =====================================================================
-- 36. ADMIN PRESENCE v2 — per-device "who's online" heartbeat
--     (SLP runtime-created; supersedes the old admin_presence table)
-- =====================================================================
CREATE TABLE IF NOT EXISTS admin_presence_v2 (
    client_id TEXT PRIMARY KEY,
    admin_name TEXT,
    record_type TEXT,                    -- 'quote' | 'project' | 'lead' | NULL
    record_id TEXT,
    page TEXT,
    last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 37. SERVICES — chatbot pricing/permissions source (SLP archive v15/v18
--     base + v32 AI-ready metadata, lowercase table name)
-- =====================================================================
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    unit TEXT NOT NULL DEFAULT 'project',

    -- Pricing (NULL until Manny provides real numbers)
    price_min REAL,
    price_max REAL,
    base_price REAL,
    materials_included INTEGER DEFAULT 1,

    -- AI permissions / metadata (v32)
    ai_can_share_pricing INTEGER DEFAULT 1,
    duration_hours INTEGER,
    estimated_duration TEXT,
    requirements TEXT,
    keywords TEXT,
    target_customers TEXT,
    mileage_pricing_enabled INTEGER DEFAULT 0,
    mileage_rate REAL DEFAULT 0.56,
    max_mileage_distance INTEGER DEFAULT 50,
    minimum_mileage_charge REAL DEFAULT 25.00,
    free_mileage_radius INTEGER DEFAULT 10,
    requires_consultation INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 5,

    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_service_id ON services(service_id);

-- =====================================================================
-- 38–39. AI PROMPTS + AI GUARDRAILS (SLP archive v17). Queried by the
--     ported lib/promptAssembly.ts (currently unwired, and it degrades to
--     a hardcoded fallback prompt) — created here so those queries can
--     never 500 if the prompt-assembly path gets wired into the chatbot.
-- =====================================================================
CREATE TABLE IF NOT EXISTS AIPrompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intent TEXT NOT NULL UNIQUE,         -- 'FAQ', 'QUOTE', 'SCHEDULE', 'SUPPORT', 'CHAT'
    prompt_text TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_intent ON AIPrompts(intent);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active ON AIPrompts(is_active);

CREATE TABLE IF NOT EXISTS AIGuardrails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL,
    rule_description TEXT NOT NULL,
    rule_type TEXT NOT NULL,             -- 'DO', 'DONT', 'LIMIT', 'FALLBACK'
    rule_content TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_guardrails_type ON AIGuardrails(rule_type);
CREATE INDEX IF NOT EXISTS idx_ai_guardrails_active ON AIGuardrails(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_guardrails_priority ON AIGuardrails(priority DESC);

-- =====================================================================
-- SEED: MannyKnows service catalog.
-- Prices intentionally NULL and ai_can_share_pricing = 0 — no real
-- pricing exists yet, so the chatbot must route to a consultation
-- (requires_consultation = 1) instead of quoting numbers.
-- =====================================================================
INSERT OR IGNORE INTO services
    (service_id, name, description, category, unit,
     price_min, price_max, base_price,
     ai_can_share_pricing, estimated_duration, keywords,
     requires_consultation, priority, active)
VALUES
    ('kitchen-remodeling', 'Kitchen Remodeling',
     'Full and partial kitchen remodels — cabinets, countertops, layout updates, and finishes.',
     'Remodeling', 'project',
     NULL, NULL, NULL,
     0, 'Contact for estimate', 'kitchen, remodel, renovation, cabinets, countertops',
     1, 1, 1),
    ('bathroom-remodeling', 'Bathroom Remodeling',
     'Bathroom renovations — tubs, showers, vanities, tile, and fixtures.',
     'Remodeling', 'project',
     NULL, NULL, NULL,
     0, 'Contact for estimate', 'bathroom, remodel, renovation, shower, tub, vanity, tile',
     1, 2, 1),
    ('interior-painting', 'Interior Painting',
     'Interior painting for walls, ceilings, trim, and doors.',
     'Painting', 'project',
     NULL, NULL, NULL,
     0, 'Contact for estimate', 'painting, interior, walls, ceilings, trim',
     1, 3, 1),
    ('flooring', 'Flooring',
     'Flooring installation and replacement — hardwood, tile, and LVP.',
     'Flooring', 'project',
     NULL, NULL, NULL,
     0, 'Contact for estimate', 'flooring, hardwood, tile, LVP, vinyl plank, installation',
     1, 4, 1),
    ('general-repairs-handyman', 'General Repairs & Handyman',
     'General home repairs and handyman services — small fixes to punch lists.',
     'Repairs', 'project',
     NULL, NULL, NULL,
     0, 'Contact for estimate', 'handyman, repairs, general repairs, home maintenance',
     1, 5, 1);

-- =====================================================================
-- SANITY: 39 tables created by this migration —
-- leads, quotes, quote_templates, quote_signatures, quote_attachments,
-- projects, project_updates, project_documents, project_colors,
-- contract_templates, project_contracts, contract_signatures,
-- contractor_signature, payment_receipts, payment_availability,
-- payment_invoices, crew_leads, crew_sessions, time_logs, crew_expenses,
-- crew_materials, upload_logs, portfolios, portfolio_media,
-- portfolio_pairs, portfolio_gallery, media_pool, contacts,
-- contact_links, partners, partner_jobs, partner_job_updates, messages,
-- hero_slides, admin_users, admin_presence_v2, services, AIPrompts,
-- AIGuardrails.
-- Verify after applying:
--   SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';
-- =====================================================================
