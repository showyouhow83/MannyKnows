-- MannyKnows — core schema (Phase 1)

CREATE TABLE IF NOT EXISTS leads (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  source           TEXT    NOT NULL DEFAULT 'contact-form',
  customer_name    TEXT    NOT NULL,
  customer_email   TEXT,
  customer_phone   TEXT,
  service_type     TEXT,
  project_description TEXT,
  status           TEXT    NOT NULL DEFAULT 'new',
  -- values: new | contacted | scheduled | quoted | won | lost
  notes            TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email      ON leads(customer_email);
