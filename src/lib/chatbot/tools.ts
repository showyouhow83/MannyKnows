import type { Lead, ConsultationRequest, QuoteRequest, ChatInteraction } from '../database/chatbotDatabase';
import { DatabaseAdapter } from '../database/chatbotDatabase';
import { LeadScoringService } from './leadScoring';

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
   * Save enhanced lead information with scoring
   */
  async saveLead(params: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    location?: string;
    project_type: string;
    project_description?: string;
    business_goals?: string[];
    main_challenges?: string[];
    budget_range?: string;
    timeline?: string;
    technical_requirements?: string[];
    source: string;
  }, conversationHistory?: any[]): Promise<ToolResult> {
    try {
      // Check if lead already exists
      const existingLead = await this.db.findLeadByEmail(params.email);
      
      // Calculate lead score
      const leadData: Lead = {
        name: params.name,
        email: params.email,
        phone: params.phone,
        company: params.company,
        location: params.location,
        project_type: params.project_type,
        project_description: params.project_description,
        business_goals: params.business_goals || [],
        main_challenges: params.main_challenges || [],
        budget_range: params.budget_range,
        timeline: params.timeline,
        technical_requirements: params.technical_requirements || [],
        source: params.source,
        quality_tier: 'medium' // Will be updated by scoring
      };
      
      // Enhanced conversation analysis
      const conversationData = conversationHistory ? {
        messageCount: conversationHistory.filter(msg => msg.role === 'user').length,
        thoughtfulResponses: this.countThoughtfulResponses(conversationHistory),
        questionsAsked: this.countQuestionsAsked(conversationHistory),
        conversationHistory
      } : undefined;
      
      const scoreBreakdown = LeadScoringService.calculateLeadScore(leadData, conversationData);
      
      // Update lead with scoring results
      leadData.lead_score = scoreBreakdown.total;
      leadData.quality_tier = scoreBreakdown.tier;
      leadData.quality_indicators = scoreBreakdown.insights;
      leadData.conversation_length = conversationData?.messageCount || 0;
      leadData.engagement_quality = this.getEngagementQuality(scoreBreakdown.engagementQuality);
      
      if (existingLead) {
        // Update existing lead
        await this.db.updateLead(existingLead.id!, leadData);
        
        await this.logInteraction({
          event_type: 'lead_updated',
          event_data: { 
            lead_id: existingLead.id, 
            updates: leadData,
            score_breakdown: scoreBreakdown
          }
        });
        
        return {
          success: true,
          message: this.getScoreBasedMessage(scoreBreakdown.tier, 'updated'),
          data: { 
            lead_id: existingLead.id, 
            action: 'updated',
            score: scoreBreakdown.total,
            tier: scoreBreakdown.tier
          }
        };
      } else {
        // Create new lead
        const leadId = await this.db.saveLead(leadData);
        
        await this.logInteraction({
          event_type: 'lead_created',
          event_data: { 
            lead_id: leadId, 
            lead_data: leadData,
            score_breakdown: scoreBreakdown
          }
        });
        
        return {
          success: true,
          message: this.getScoreBasedMessage(scoreBreakdown.tier, 'created'),
          data: { 
            lead_id: leadId, 
            action: 'created',
            score: scoreBreakdown.total,
            tier: scoreBreakdown.tier
          }
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
        message: 'Excellent! I\'ve scheduled your consultation request. Manny will contact you within 24 hours to confirm the details.',
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
        message: 'Perfect! I\'ve created your quote request. Manny will prepare a detailed proposal and email it to you within 2 business days.',
        data: { quote_id: quoteId }
      };
    } catch (error) {
      console.error('Error generating quote request:', error);
      return {
        success: false,
        message: 'I apologize, but there was an issue creating your quote request. Please try again.'
      };
    }
  }

  /**
   * Log interaction events
   */
  async logInteraction(interaction: {
    event_type: string;
    event_data: Record<string, any>;
  }): Promise<string> {
    try {
      return await this.db.logInteraction({
        session_id: this.sessionId,
        event_type: interaction.event_type,
        event_data: interaction.event_data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
      return '';
    }
  }

  /**
   * Check if we should capture lead info based on conversation
   */
  shouldCaptureLead(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return lowerMessage.includes('@') || // Email mentioned
           lowerMessage.includes('phone') ||
           lowerMessage.includes('call') ||
           lowerMessage.includes('contact') ||
           lowerMessage.match(/\d{3}[-\s]?\d{3}[-\s]?\d{4}/) !== null; // Phone pattern
  }

  /**
   * Extract lead information from conversation
   */
  extractLeadInfo(message: string): Partial<Lead> {
    const extracted: Partial<Lead> = {};
    
    // Extract email
    const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      extracted.email = emailMatch[0];
    }
    
    // Extract phone
    const phoneMatch = message.match(/(\d{3})[-\s]?(\d{3})[-\s]?(\d{4})/);
    if (phoneMatch) {
      extracted.phone = phoneMatch[0];
    }
    
    // Extract name (simple pattern)
    const nameMatch = message.match(/(?:i'm|my name is|i am|call me)\s+([a-zA-Z]+)/i);
    if (nameMatch) {
      extracted.name = nameMatch[1];
    }
    
    return extracted;
  }

  /**
   * Count thoughtful responses in conversation
   */
  private countThoughtfulResponses(conversationHistory: any[]): number {
    return conversationHistory
      .filter(msg => msg.role === 'user')
      .filter(msg => msg.content.length > 50 && !msg.content.match(/^(yes|no|ok|sure|maybe)$/i))
      .length;
  }

  /**
   * Count questions asked by user
   */
  private countQuestionsAsked(conversationHistory: any[]): number {
    return conversationHistory
      .filter(msg => msg.role === 'user')
      .filter(msg => msg.content.includes('?'))
      .length;
  }

  /**
   * Get engagement quality rating
   */
  private getEngagementQuality(score: number): 'high' | 'medium' | 'low' {
    if (score >= 12) return 'high';
    if (score >= 8) return 'medium';
    return 'low';
  }

  /**
   * Get score-based message
   */
  private getScoreBasedMessage(tier: string, action: string): string {
    const messages = {
      premium: `🔥 Excellent! You're clearly serious about this project. I've ${action} your high-priority profile - Manny will personally reach out today!`,
      good: `✅ Perfect! I've ${action} your detailed information. You'll hear from Manny within 24 hours.`,
      medium: `👍 Great! I've ${action} your information. Manny will review your project and get back to you soon.`,
      low: `Thanks! I've ${action} your basic information. Manny will follow up to learn more about your needs.`,
      poor: `I've ${action} your contact info. Someone from our team will reach out to better understand your project.`
    };
    
    return messages[tier as keyof typeof messages] || messages.medium;
  }
}
