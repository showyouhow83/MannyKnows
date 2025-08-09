// Database integration for customer data and chat interactions
// This module provides abstraction for different storage backends

import { warnLog } from '../../utils/debug';

export interface Lead {
  id?: string;
  // Basic Contact Info (20 points)
  name: string;
  email: string;
  phone?: string;
  location?: string;
  company?: string;
  
  // Project Details (40 points)
  project_type: string; // website, app, marketing, branding, etc.
  project_description?: string;
  budget_range?: string;
  timeline?: string;
  current_solution?: string; // what they have now
  
  // Business Context (25 points)
  business_goals?: string[];
  target_audience?: string;
  success_metrics?: string[];
  main_challenges?: string[];
  competitors?: string[];
  
  // Technical Requirements (10 points)
  technical_requirements?: string[];
  integrations_needed?: string[];
  platforms?: string[];
  special_features?: string[];
  
  // Lead Scoring & Quality
  lead_score?: number; // 0-100 score
  quality_tier: 'premium' | 'good' | 'medium' | 'low' | 'poor'; // 80+, 60-79, 40-59, 20-39, 0-19
  quality_indicators?: string[];
  conversation_insights?: string[];
  
  // Metadata
  source: string;
  conversation_length?: number;
  engagement_quality?: 'high' | 'medium' | 'low';
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
      INSERT INTO leads (id, name, email, phone, company, project_type, budget_range, timeline, source, lead_score, quality_tier, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, lead.name, lead.email, lead.phone, lead.company, 
      lead.project_type, lead.budget_range, lead.timeline, lead.source, 
      lead.lead_score || 0, lead.quality_tier, now, now
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

// Cloudflare KV implementation - simpler than D1 for lead storage
export class CloudflareKVAdapter extends DatabaseAdapter {
  private kv: any;

  constructor(kv: any) {
    super();
    this.kv = kv;
  }

  async saveLead(lead: Lead): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const leadData = { ...lead, id, created_at: now, updated_at: now };
    
    await this.kv.put(`lead:${id}`, JSON.stringify(leadData));
    // Also store by email for quick lookup
    if (lead.email) {
      await this.kv.put(`lead_by_email:${lead.email}`, id);
    }
    
    return id;
  }

  async getLead(id: string): Promise<Lead | null> {
    const data = await this.kv.get(`lead:${id}`);
    return data ? JSON.parse(data) : null;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
    const existing = await this.getLead(id);
    if (existing) {
      const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
      await this.kv.put(`lead:${id}`, JSON.stringify(updated));
    }
  }

  async findLeadByEmail(email: string): Promise<Lead | null> {
    const leadId = await this.kv.get(`lead_by_email:${email}`);
    return leadId ? await this.getLead(leadId) : null;
  }

  async saveConsultationRequest(request: ConsultationRequest): Promise<string> {
    const id = crypto.randomUUID();
    const data = { ...request, id, created_at: new Date().toISOString() };
    await this.kv.put(`consultation:${id}`, JSON.stringify(data));
    return id;
  }

  async getConsultationRequest(id: string): Promise<ConsultationRequest | null> {
    const data = await this.kv.get(`consultation:${id}`);
    return data ? JSON.parse(data) : null;
  }

  async updateConsultationRequest(id: string, updates: Partial<ConsultationRequest>): Promise<void> {
    const existing = await this.getConsultationRequest(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      await this.kv.put(`consultation:${id}`, JSON.stringify(updated));
    }
  }

  async saveQuoteRequest(request: QuoteRequest): Promise<string> {
    const id = crypto.randomUUID();
    const data = { ...request, id, created_at: new Date().toISOString() };
    await this.kv.put(`quote:${id}`, JSON.stringify(data));
    return id;
  }

  async getQuoteRequest(id: string): Promise<QuoteRequest | null> {
    const data = await this.kv.get(`quote:${id}`);
    return data ? JSON.parse(data) : null;
  }

  async updateQuoteRequest(id: string, updates: Partial<QuoteRequest>): Promise<void> {
    const existing = await this.getQuoteRequest(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      await this.kv.put(`quote:${id}`, JSON.stringify(updated));
    }
  }

  async logInteraction(interaction: ChatInteraction): Promise<string> {
    const id = crypto.randomUUID();
    const data = { ...interaction, id, timestamp: new Date().toISOString() };
    
    // Store individual interaction
    await this.kv.put(`interaction:${id}`, JSON.stringify(data));
    
    // Add to session history (append to list)
    const sessionKey = `session:${interaction.session_id}`;
    const existing = await this.kv.get(sessionKey);
    const interactions = existing ? JSON.parse(existing) : [];
    interactions.push(data);
    await this.kv.put(sessionKey, JSON.stringify(interactions));
    
    return id;
  }

  async getInteractionHistory(sessionId: string): Promise<ChatInteraction[]> {
    const data = await this.kv.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : [];
  }
}

// Factory function to create appropriate database adapter
export function createDatabaseAdapter(environment: string, storage?: any): DatabaseAdapter {
  switch (environment) {
    case 'development':
      return new MemoryAdapter();
    case 'staging':
    case 'production':
      if (storage) {
        // If it has a prepare method, it's D1
        if (storage.prepare) {
          return new CloudflareD1Adapter(storage);
        }
        // Otherwise assume it's KV
        return new CloudflareKVAdapter(storage);
      }
      // Fallback to memory for dev if no storage provided
      warnLog('No storage provided for production environment, using memory adapter');
      return new MemoryAdapter();
    default:
      return new MemoryAdapter();
  }
}
