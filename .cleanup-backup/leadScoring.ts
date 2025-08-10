import type { Lead } from '../database/chatbotDatabase';

export interface LeadScoreBreakdown {
  contactInfo: number;      // 0-20 points
  projectDetails: number;   // 0-40 points  
  businessContext: number;  // 0-25 points
  engagementQuality: number;// 0-15 points
  total: number;           // 0-100 points
  tier: 'premium' | 'good' | 'medium' | 'low' | 'poor';
  insights: string[];
}

export class LeadScoringService {
  
  /**
   * Calculate comprehensive lead score
   */
  static calculateLeadScore(lead: Lead, conversationData?: {
    messageCount: number;
    thoughtfulResponses: number;
    questionsAsked: number;
    conversationHistory: any[];
  }): LeadScoreBreakdown {
    
    const contactInfo = this.scoreContactInfo(lead);
    const projectDetails = this.scoreProjectDetails(lead);
    const businessContext = this.scoreBusinessContext(lead);
    const engagementQuality = this.scoreEngagementQuality(lead, conversationData);
    
    const total = contactInfo + projectDetails + businessContext + engagementQuality;
    const tier = this.getTier(total);
    const insights = this.generateInsights(lead, total);
    
    return {
      contactInfo,
      projectDetails,
      businessContext,
      engagementQuality,
      total,
      tier,
      insights
    };
  }
  
  /**
   * Score contact information (0-20 points)
   */
  private static scoreContactInfo(lead: Lead): number {
    let score = 0;
    
    if (lead.name && lead.name.trim().length > 1) score += 5;
    if (lead.email && this.isValidEmail(lead.email)) score += 5;
    if (lead.phone && lead.phone.length >= 10) score += 5;
    if (lead.location || lead.company) score += 5;
    
    return score;
  }
  
  /**
   * Score project details (0-40 points)
   */
  private static scoreProjectDetails(lead: Lead): number {
    let score = 0;
    
    // Project type clarity (0-10)
    if (lead.project_type && lead.project_type !== 'General inquiry') {
      score += lead.project_description ? 10 : 6;
    }
    
    // Budget range (0-10)
    if (lead.budget_range) {
      const budgetScore = this.scoreBudgetRange(lead.budget_range);
      score += budgetScore;
    }
    
    // Timeline (0-10)
    if (lead.timeline) {
      score += this.scoreTimeline(lead.timeline);
    }
    
    // Specific requirements (0-10)
    const requirementsCount = (lead.technical_requirements?.length || 0) + 
                             (lead.special_features?.length || 0) +
                             (lead.integrations_needed?.length || 0);
    score += Math.min(10, requirementsCount * 2);
    
    return score;
  }
  
  /**
   * Score business context understanding (0-25 points)
   */
  private static scoreBusinessContext(lead: Lead): number {
    let score = 0;
    
    // Business goals (0-10)
    if (lead.business_goals && lead.business_goals.length > 0) {
      score += Math.min(10, lead.business_goals.length * 3);
    }
    
    // Challenges identified (0-10)
    if (lead.main_challenges && lead.main_challenges.length > 0) {
      score += Math.min(10, lead.main_challenges.length * 3);
    }
    
    // Success metrics (0-5)
    if (lead.success_metrics && lead.success_metrics.length > 0) {
      score += Math.min(5, lead.success_metrics.length * 2);
    }
    
    return score;
  }
  
  /**
   * Score engagement quality (0-15 points)
   */
  private static scoreEngagementQuality(lead: Lead, conversationData?: any): number {
    let score = 0;
    
    if (!conversationData) return 5; // Default middle score
    
    // Thoughtful responses (0-5)
    const thoughtfulnessRatio = conversationData.thoughtfulResponses / conversationData.messageCount;
    score += Math.round(thoughtfulnessRatio * 5);
    
    // Questions asked (shows interest) (0-5)
    score += Math.min(5, conversationData.questionsAsked * 2);
    
    // Conversation length indicates genuine interest (0-5)
    if (conversationData.messageCount >= 8) score += 5;
    else if (conversationData.messageCount >= 5) score += 3;
    else if (conversationData.messageCount >= 3) score += 1;
    
    return score;
  }
  
  /**
   * Determine quality tier based on score
   */
  private static getTier(score: number): 'premium' | 'good' | 'medium' | 'low' | 'poor' {
    if (score >= 80) return 'premium';
    if (score >= 60) return 'good';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'poor';
  }
  
  /**
   * Generate insights about the lead
   */
  private static generateInsights(lead: Lead, score: number): string[] {
    const insights: string[] = [];
    
    // Score-based insights
    if (score >= 80) {
      insights.push('🔥 Hot prospect - high-quality lead with clear project needs');
    } else if (score >= 60) {
      insights.push('✅ Qualified lead - good project understanding');
    } else if (score >= 40) {
      insights.push('⚡ Potential lead - needs more qualification');
    } else {
      insights.push('❓ Basic inquiry - requires nurturing');
    }
    
    // Project-specific insights
    if (lead.budget_range) {
      const budgetTier = this.getBudgetTier(lead.budget_range);
      insights.push(`💰 Budget: ${budgetTier} range`);
    }
    
    if (lead.timeline) {
      insights.push(`⏰ Timeline: ${lead.timeline}`);
    }
    
    if (lead.main_challenges && lead.main_challenges.length > 0) {
      insights.push(`🎯 ${lead.main_challenges.length} business challenges identified`);
    }
    
    // Missing information warnings
    if (!lead.phone) insights.push('📞 Missing phone number');
    if (!lead.budget_range) insights.push('💰 Budget range not specified');
    if (!lead.timeline) insights.push('⏰ Timeline not discussed');
    
    return insights;
  }
  
  /**
   * Score budget range
   */
  private static scoreBudgetRange(budget: string): number {
    const lower = budget.toLowerCase();
    if (lower.includes('50k') || lower.includes('100k') || lower.includes('enterprise')) return 10;
    if (lower.includes('25k') || lower.includes('30k') || lower.includes('40k')) return 8;
    if (lower.includes('10k') || lower.includes('15k') || lower.includes('20k')) return 6;
    if (lower.includes('5k') || lower.includes('7k') || lower.includes('8k')) return 4;
    if (lower.includes('1k') || lower.includes('2k') || lower.includes('3k')) return 2;
    return 5; // Default for any budget mentioned
  }
  
  /**
   * Score timeline urgency
   */
  private static scoreTimeline(timeline: string): number {
    const lower = timeline.toLowerCase();
    if (lower.includes('asap') || lower.includes('urgent') || lower.includes('immediately')) return 10;
    if (lower.includes('this month') || lower.includes('2 weeks') || lower.includes('3 weeks')) return 8;
    if (lower.includes('next month') || lower.includes('6 weeks') || lower.includes('2 months')) return 6;
    if (lower.includes('3 months') || lower.includes('quarter')) return 4;
    if (lower.includes('6 months') || lower.includes('next year')) return 2;
    return 5; // Default for any timeline mentioned
  }
  
  /**
   * Get budget tier description
   */
  private static getBudgetTier(budget: string): string {
    const lower = budget.toLowerCase();
    if (lower.includes('50k') || lower.includes('100k') || lower.includes('enterprise')) return 'Enterprise';
    if (lower.includes('25k') || lower.includes('30k') || lower.includes('40k')) return 'High';
    if (lower.includes('10k') || lower.includes('15k') || lower.includes('20k')) return 'Medium';
    if (lower.includes('5k') || lower.includes('7k') || lower.includes('8k')) return 'Standard';
    return 'Starter';
  }
  
  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Extract lead data from conversation
   */
  static extractLeadFromConversation(conversationHistory: any[]): Partial<Lead> {
    const lead: Partial<Lead> = {
      business_goals: [],
      main_challenges: [],
      success_metrics: [],
      technical_requirements: [],
      quality_indicators: [],
      conversation_insights: []
    };
    
    // Analyze conversation for data extraction
    const fullText = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();
    
    // Extract project type
    if (fullText.includes('website') || fullText.includes('web')) lead.project_type = 'Website';
    else if (fullText.includes('app') || fullText.includes('mobile')) lead.project_type = 'Mobile App';
    else if (fullText.includes('marketing') || fullText.includes('seo')) lead.project_type = 'Marketing';
    else if (fullText.includes('brand') || fullText.includes('logo')) lead.project_type = 'Branding';
    else lead.project_type = 'General inquiry';
    
    // Extract budget mentions
    const budgetMatch = fullText.match(/(\$?\d+k?|\d+,?\d+)/);
    if (budgetMatch) {
      lead.budget_range = budgetMatch[0];
    }
    
    // Extract timeline mentions
    if (fullText.includes('asap') || fullText.includes('urgent')) lead.timeline = 'ASAP';
    else if (fullText.includes('this month')) lead.timeline = 'This month';
    else if (fullText.includes('next month')) lead.timeline = 'Next month';
    
    return lead;
  }
}
