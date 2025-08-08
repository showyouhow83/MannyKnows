import type { Lead, ConsultationRequest, QuoteRequest, ChatInteraction } from '../database/chatbotDatabase';
import { DatabaseAdapter } from '../database/chatbotDatabase';

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
}

export class ChatbotTools {
  private db: DatabaseAdapter;
  private sessionId: string;

  constructor(db: DatabaseAdapter, sessionId: string) {
    this.db = db;
    this.sessionId = sessionId;
  }

  /**
   * Save lead information to the database
   */
  async saveLead(params: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    interest: string;
    budget_range?: string;
    timeline?: string;
    source: string;
  }): Promise<ToolResult> {
    try {
      // Check if lead already exists
      const existingLead = await this.db.findLeadByEmail(params.email);
      
      if (existingLead) {
        // Update existing lead with new information
        await this.db.updateLead(existingLead.id!, {
          name: params.name,
          phone: params.phone || existingLead.phone,
          company: params.company || existingLead.company,
          interest: params.interest,
          budget_range: params.budget_range || existingLead.budget_range,
          timeline: params.timeline || existingLead.timeline,
        });
        
        await this.logInteraction({
          event_type: 'lead_updated',
          event_data: { lead_id: existingLead.id, updates: params }
        });
        
        return {
          success: true,
          message: 'Great! I\'ve updated your information in our system.',
          data: { lead_id: existingLead.id, action: 'updated' }
        };
      } else {
        // Create new lead
        const leadId = await this.db.saveLead({
          name: params.name,
          email: params.email,
          phone: params.phone,
          company: params.company,
          interest: params.interest,
          budget_range: params.budget_range,
          timeline: params.timeline,
          source: params.source
        });
        
        await this.logInteraction({
          event_type: 'lead_created',
          event_data: { lead_id: leadId, lead_data: params }
        });
        
        return {
          success: true,
          message: 'Perfect! I\'ve saved your information. We\'ll be in touch soon.',
          data: { lead_id: leadId, action: 'created' }
        };
      }
    } catch (error) {
      console.error('Error saving lead:', error);
      return {
        success: false,
        message: 'I apologize, but there was an issue saving your information. Please try again.'
      };
    }
  }

  /**
   * Schedule a consultation request
   */
  async scheduleConsultation(params: {
    lead_id: string;
    preferred_date?: string;
    preferred_time?: string;
    consultation_type: string;
    topics: string[];
  }): Promise<ToolResult> {
    try {
      const consultationId = await this.db.saveConsultationRequest({
        lead_id: params.lead_id,
        preferred_date: params.preferred_date,
        preferred_time: params.preferred_time,
        consultation_type: params.consultation_type,
        topics: params.topics,
        status: 'pending'
      });
      
      await this.logInteraction({
        event_type: 'consultation_requested',
        event_data: { consultation_id: consultationId, consultation_data: params }
      });
      
      return {
        success: true,
        message: 'Excellent! I\'ve scheduled your consultation request. Our team will contact you within 24 hours to confirm the details.',
        data: { consultation_id: consultationId }
      };
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      return {
        success: false,
        message: 'I apologize, but there was an issue scheduling your consultation. Please try again.'
      };
    }
  }

  /**
   * Generate a quote request
   */
  async generateQuoteRequest(params: {
    lead_id: string;
    project_type: string;
    requirements: string[];
    budget_range: string;
    timeline: string;
    priority: 'low' | 'medium' | 'high';
  }): Promise<ToolResult> {
    try {
      const quoteId = await this.db.saveQuoteRequest({
        lead_id: params.lead_id,
        project_type: params.project_type,
        requirements: params.requirements,
        budget_range: params.budget_range,
        timeline: params.timeline,
        priority: params.priority,
        status: 'pending'
      });
      
      await this.logInteraction({
        event_type: 'quote_requested',
        event_data: { quote_id: quoteId, quote_data: params }
      });
      
      return {
        success: true,
        message: 'Perfect! I\'ve submitted your quote request. Our team will prepare a detailed proposal and send it to you within 2-3 business days.',
        data: { quote_id: quoteId }
      };
    } catch (error) {
      console.error('Error generating quote request:', error);
      return {
        success: false,
        message: 'I apologize, but there was an issue submitting your quote request. Please try again.'
      };
    }
  }

  /**
   * Log interaction for tracking
   */
  async logInteraction(params: {
    event_type: string;
    event_data: Record<string, any>;
  }): Promise<ToolResult> {
    try {
      const interactionId = await this.db.logInteraction({
        session_id: this.sessionId,
        event_type: params.event_type,
        event_data: params.event_data,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        message: 'Interaction logged successfully',
        data: { interaction_id: interactionId }
      };
    } catch (error) {
      console.error('Error logging interaction:', error);
      return {
        success: false,
        message: 'Failed to log interaction'
      };
    }
  }

  /**
   * Extract lead information from natural language text
   */
  extractLeadInfo(message: string, userContext: any = {}): Partial<Lead> {
    const extracted: Partial<Lead> = {};
    
    // Email extraction
    const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      extracted.email = emailMatch[0];
    }
    
    // Phone extraction (basic patterns)
    const phoneMatch = message.match(/(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    if (phoneMatch) {
      extracted.phone = phoneMatch[0];
    }
    
    // Name extraction (if user says "I'm [name]" or "My name is [name]")
    const nameMatch = message.match(/(?:i'm|i am|my name is|call me)\s+([a-zA-Z\s]+)/i);
    if (nameMatch) {
      extracted.name = nameMatch[1].trim();
    }
    
    // Company extraction
    const companyMatch = message.match(/(?:company|business|work at|from)\s+([a-zA-Z\s&,.-]+)/i);
    if (companyMatch) {
      extracted.company = companyMatch[1].trim();
    }
    
    // Budget extraction
    const budgetMatch = message.match(/budget.*?(\$[\d,]+(?:\s*-\s*\$[\d,]+)?|\d+k?(?:\s*-\s*\d+k?)?)/i);
    if (budgetMatch) {
      extracted.budget_range = budgetMatch[1];
    }
    
    return extracted;
  }

  /**
   * Determine if a message contains lead information worth saving
   */
  shouldCaptureLead(message: string): boolean {
    const indicators = [
      /@/, // email
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // phone
      /(?:i'm|i am|my name is|call me)\s+[a-zA-Z]/i, // name introduction
      /(?:company|business|work at)/i, // company mention
      /budget/i, // budget discussion
      /interested in|want|need|looking for/i // interest indicators
    ];
    
    return indicators.some(pattern => pattern.test(message));
  }

  /**
   * Determine if a message is requesting a consultation
   */
  isConsultationRequest(message: string): boolean {
    const consultationKeywords = [
      /\b(?:schedule|book|set up|arrange)\b.*\b(?:consultation|meeting|call|appointment)\b/i,
      /\b(?:consultation|meeting|call|appointment)\b.*\b(?:schedule|book|set up|arrange)\b/i,
      /\bcan we meet\b/i,
      /\btalk to someone\b/i,
      /\bschedule.*call\b/i
    ];
    
    return consultationKeywords.some(pattern => pattern.test(message));
  }

  /**
   * Determine if a message is requesting a quote
   */
  isQuoteRequest(message: string): boolean {
    const quoteKeywords = [
      /\b(?:quote|estimate|proposal|pricing|cost|price)\b/i,
      /how much/i,
      /what.*cost/i,
      /budget.*for/i
    ];
    
    return quoteKeywords.some(pattern => pattern.test(message));
  }
}
