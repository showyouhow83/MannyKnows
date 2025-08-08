// Database integration for customer data and chat interactions
// This module provides abstraction for different storage backends

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  interest: string;
  budget_range?: string;
  timeline?: string;
  source: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultationRequest {
  id?: string;
  lead_id: string;
  preferred_date?: string;
  preferred_time?: string;
  consultation_type: string;
  topics: string[];
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
}

export interface QuoteRequest {
  id?: string;
  lead_id: string;
  project_type: string;
  requirements: string[];
  budget_range: string;
  timeline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'declined';
  created_at?: string;
}

export interface ChatInteraction {
  id?: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
}

// Abstract base class for database operations
export abstract class DatabaseAdapter {
  abstract saveLead(lead: Lead): Promise<string>;
  abstract getLead(id: string): Promise<Lead | null>;
  abstract updateLead(id: string, updates: Partial<Lead>): Promise<void>;
  abstract findLeadByEmail(email: string): Promise<Lead | null>;
  
  abstract saveConsultationRequest(request: ConsultationRequest): Promise<string>;
  abstract getConsultationRequest(id: string): Promise<ConsultationRequest | null>;
  abstract updateConsultationRequest(id: string, updates: Partial<ConsultationRequest>): Promise<void>;
  
  abstract saveQuoteRequest(request: QuoteRequest): Promise<string>;
  abstract getQuoteRequest(id: string): Promise<QuoteRequest | null>;
  abstract updateQuoteRequest(id: string, updates: Partial<QuoteRequest>): Promise<void>;
  
  abstract logInteraction(interaction: ChatInteraction): Promise<string>;
  abstract getInteractionHistory(sessionId: string): Promise<ChatInteraction[]>;
}

// Cloudflare D1 implementation
export class CloudflareD1Adapter extends DatabaseAdapter {
  private db: any;

  constructor(db: any) {
    super();
    this.db = db;
  }

  async saveLead(lead: Lead): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await this.db.prepare(`
      INSERT INTO leads (id, name, email, phone, company, interest, budget_range, timeline, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, lead.name, lead.email, lead.phone, lead.company, 
      lead.interest, lead.budget_range, lead.timeline, lead.source, now, now
    ).run();
    
    return id;
  }

  async getLead(id: string): Promise<Lead | null> {
    const result = await this.db.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
    return result || null;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(new Date().toISOString(), id);
    
    await this.db.prepare(`
      UPDATE leads SET ${fields}, updated_at = ? WHERE id = ?
    `).bind(...values).run();
  }

  async findLeadByEmail(email: string): Promise<Lead | null> {
    const result = await this.db.prepare('SELECT * FROM leads WHERE email = ?').bind(email).first();
    return result || null;
  }

  async saveConsultationRequest(request: ConsultationRequest): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await this.db.prepare(`
      INSERT INTO consultation_requests (id, lead_id, preferred_date, preferred_time, consultation_type, topics, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, request.lead_id, request.preferred_date, request.preferred_time,
      request.consultation_type, JSON.stringify(request.topics), request.status, now
    ).run();
    
    return id;
  }

  async getConsultationRequest(id: string): Promise<ConsultationRequest | null> {
    const result = await this.db.prepare('SELECT * FROM consultation_requests WHERE id = ?').bind(id).first();
    if (result) {
      result.topics = JSON.parse(result.topics);
    }
    return result || null;
  }

  async updateConsultationRequest(id: string, updates: Partial<ConsultationRequest>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates).map(value => 
      Array.isArray(value) ? JSON.stringify(value) : value
    );
    values.push(id);
    
    await this.db.prepare(`
      UPDATE consultation_requests SET ${fields} WHERE id = ?
    `).bind(...values).run();
  }

  async saveQuoteRequest(request: QuoteRequest): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await this.db.prepare(`
      INSERT INTO quote_requests (id, lead_id, project_type, requirements, budget_range, timeline, priority, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, request.lead_id, request.project_type, JSON.stringify(request.requirements),
      request.budget_range, request.timeline, request.priority, request.status, now
    ).run();
    
    return id;
  }

  async getQuoteRequest(id: string): Promise<QuoteRequest | null> {
    const result = await this.db.prepare('SELECT * FROM quote_requests WHERE id = ?').bind(id).first();
    if (result) {
      result.requirements = JSON.parse(result.requirements);
    }
    return result || null;
  }

  async updateQuoteRequest(id: string, updates: Partial<QuoteRequest>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates).map(value => 
      Array.isArray(value) ? JSON.stringify(value) : value
    );
    values.push(id);
    
    await this.db.prepare(`
      UPDATE quote_requests SET ${fields} WHERE id = ?
    `).bind(...values).run();
  }

  async logInteraction(interaction: ChatInteraction): Promise<string> {
    const id = crypto.randomUUID();
    
    await this.db.prepare(`
      INSERT INTO chat_interactions (id, session_id, event_type, event_data, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      id, interaction.session_id, interaction.event_type,
      JSON.stringify(interaction.event_data), interaction.timestamp
    ).run();
    
    return id;
  }

  async getInteractionHistory(sessionId: string): Promise<ChatInteraction[]> {
    const results = await this.db.prepare('SELECT * FROM chat_interactions WHERE session_id = ? ORDER BY timestamp').bind(sessionId).all();
    return results.results.map((row: any) => ({
      ...row,
      event_data: JSON.parse(row.event_data)
    }));
  }
}

// Memory adapter for development/testing
export class MemoryAdapter extends DatabaseAdapter {
  private leads: Map<string, Lead> = new Map();
  private consultations: Map<string, ConsultationRequest> = new Map();
  private quotes: Map<string, QuoteRequest> = new Map();
  private interactions: Map<string, ChatInteraction[]> = new Map();

  async saveLead(lead: Lead): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.leads.set(id, { ...lead, id, created_at: now, updated_at: now });
    return id;
  }

  async getLead(id: string): Promise<Lead | null> {
    return this.leads.get(id) || null;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
    const existing = this.leads.get(id);
    if (existing) {
      this.leads.set(id, { ...existing, ...updates, updated_at: new Date().toISOString() });
    }
  }

  async findLeadByEmail(email: string): Promise<Lead | null> {
    for (const lead of this.leads.values()) {
      if (lead.email === email) return lead;
    }
    return null;
  }

  async saveConsultationRequest(request: ConsultationRequest): Promise<string> {
    const id = crypto.randomUUID();
    this.consultations.set(id, { ...request, id, created_at: new Date().toISOString() });
    return id;
  }

  async getConsultationRequest(id: string): Promise<ConsultationRequest | null> {
    return this.consultations.get(id) || null;
  }

  async updateConsultationRequest(id: string, updates: Partial<ConsultationRequest>): Promise<void> {
    const existing = this.consultations.get(id);
    if (existing) {
      this.consultations.set(id, { ...existing, ...updates });
    }
  }

  async saveQuoteRequest(request: QuoteRequest): Promise<string> {
    const id = crypto.randomUUID();
    this.quotes.set(id, { ...request, id, created_at: new Date().toISOString() });
    return id;
  }

  async getQuoteRequest(id: string): Promise<QuoteRequest | null> {
    return this.quotes.get(id) || null;
  }

  async updateQuoteRequest(id: string, updates: Partial<QuoteRequest>): Promise<void> {
    const existing = this.quotes.get(id);
    if (existing) {
      this.quotes.set(id, { ...existing, ...updates });
    }
  }

  async logInteraction(interaction: ChatInteraction): Promise<string> {
    const id = crypto.randomUUID();
    const sessionInteractions = this.interactions.get(interaction.session_id) || [];
    sessionInteractions.push({ ...interaction, id });
    this.interactions.set(interaction.session_id, sessionInteractions);
    return id;
  }

  async getInteractionHistory(sessionId: string): Promise<ChatInteraction[]> {
    return this.interactions.get(sessionId) || [];
  }
}

// Factory function to create appropriate database adapter
export function createDatabaseAdapter(environment: string, db?: any): DatabaseAdapter {
  switch (environment) {
    case 'development':
      return new MemoryAdapter();
    case 'staging':
    case 'production':
      if (db) {
        return new CloudflareD1Adapter(db);
      }
      throw new Error('Database instance required for staging/production');
    default:
      return new MemoryAdapter();
  }
}
