-- Database schema for MannyKnows Chatbot System
-- Use this to set up Cloudflare D1 database

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  interest TEXT NOT NULL,
  budget_range TEXT,
  timeline TEXT,
  source TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- Consultation requests
CREATE TABLE IF NOT EXISTS consultation_requests (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  preferred_date TEXT,
  preferred_time TEXT,
  consultation_type TEXT NOT NULL,
  topics TEXT NOT NULL, -- JSON array
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Quote requests
CREATE TABLE IF NOT EXISTS quote_requests (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  project_type TEXT NOT NULL,
  requirements TEXT NOT NULL, -- JSON array
  budget_range TEXT NOT NULL,
  timeline TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Chat interactions log
CREATE TABLE IF NOT EXISTS chat_interactions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL, -- JSON object
  timestamp DATETIME NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_lead_id ON consultation_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_lead_id ON quote_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_session_id ON chat_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_timestamp ON chat_interactions(timestamp);
