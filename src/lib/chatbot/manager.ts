import { createPromptBuilder } from './promptBuilder';
import { createDatabaseAdapter } from '../database/chatbotDatabase';
import { ChatbotTools } from './tools';

export interface ChatbotInstance {
  id: string;
  name: string;
  persona: string;
  goals: string;
  environment: 'development' | 'staging' | 'production';
  model: string;
  enabled: boolean;
}

// Pre-configured chatbot instances
export const CHATBOT_INSTANCES: Record<string, ChatbotInstance> = {
  business_consultant: {
    id: 'business_consultant',
    name: 'Business Consultant',
    persona: 'business_consultant',
    goals: 'lead_generation',
    environment: 'production',
    model: 'gpt-4.1-nano',
    enabled: true
  },
  sales_specialist: {
    id: 'sales_specialist', 
    name: 'Sales Specialist',
    persona: 'sales_specialist',
    goals: 'lead_generation',
    environment: 'production',
    model: 'gpt-4.1-nano',
    enabled: false // Not implemented yet
  },
  technical_advisor: {
    id: 'technical_advisor',
    name: 'Technical Advisor', 
    persona: 'technical_advisor',
    goals: 'consultation',
    environment: 'production',
    model: 'gpt-4.1-nano',
    enabled: false // Not implemented yet
  }
};

/**
 * Chatbot Manager - Orchestrates the entire chatbot system
 */
export class ChatbotManager {
  private promptBuilder: any;
  private tools: ChatbotTools | null = null;
  private config: ChatbotInstance;

  constructor(chatbotId: string = 'business_consultant', db?: any) {
    this.config = CHATBOT_INSTANCES[chatbotId];
    if (!this.config) {
      throw new Error(`Chatbot instance '${chatbotId}' not found`);
    }

    if (!this.config.enabled) {
      throw new Error(`Chatbot instance '${chatbotId}' is not enabled`);
    }

    // Initialize prompt builder
    this.promptBuilder = createPromptBuilder(
      this.config.persona,
      this.config.goals,
      this.config.environment
    );

    // Initialize tools if database is provided
    if (db) {
      const dbAdapter = createDatabaseAdapter(this.config.environment, db);
      this.tools = new ChatbotTools(dbAdapter, 'default');
    }
  }

  /**
   * Get the system prompt for this chatbot instance
   */
  getSystemPrompt(): string {
    return this.promptBuilder.buildSystemPrompt();
  }

  /**
   * Get environment configuration
   */
  getEnvironmentConfig() {
    return this.promptBuilder.getEnvironmentConfig();
  }

  /**
   * Process a user message and return a response
   */
  async processMessage(message: string, sessionId: string = 'default'): Promise<{
    reply: string;
    toolResults?: any[];
    metadata?: any;
  }> {
    const envConfig = this.getEnvironmentConfig();
    
    // Update tools session if needed
    if (this.tools) {
      this.tools = new ChatbotTools(
        createDatabaseAdapter(this.config.environment),
        sessionId
      );
    }

    // Auto-process tools if enabled
    let toolResults: any[] = [];
    if (envConfig.tools_enabled && this.tools) {
      // Check for lead information
      if (this.tools.shouldCaptureLead(message)) {
        const leadInfo = this.tools.extractLeadInfo(message);
        if (leadInfo.email || leadInfo.phone) {
          const leadResult = await this.tools.saveLead({
            name: leadInfo.name || 'Anonymous',
            email: leadInfo.email || '',
            phone: leadInfo.phone,
            company: leadInfo.company,
            interest: 'General inquiry from chat',
            budget_range: leadInfo.budget_range,
            source: 'website_chat'
          });
          toolResults.push(leadResult);
        }
      }

      // Log interaction
      await this.tools.logInteraction({
        event_type: 'chat_message',
        event_data: { message, chatbot_id: this.config.id }
      });
    }

    return {
      reply: '', // This will be filled by the API after OpenAI call
      toolResults,
      metadata: {
        chatbot_id: this.config.id,
        chatbot_name: this.config.name,
        session_id: sessionId,
        model: this.config.model
      }
    };
  }

  /**
   * Validate a response against guardrails
   */
  validateResponse(response: string) {
    return this.promptBuilder.validateResponse(response);
  }

  /**
   * Get chatbot instance information
   */
  getInstanceInfo() {
    return {
      ...this.config,
      environment_config: this.getEnvironmentConfig()
    };
  }
}

/**
 * Factory function to create a chatbot manager
 */
export function createChatbotManager(
  chatbotId: string = 'business_consultant',
  db?: any
): ChatbotManager {
  return new ChatbotManager(chatbotId, db);
}

/**
 * Get list of available chatbot instances
 */
export function getAvailableChatbots(): ChatbotInstance[] {
  return Object.values(CHATBOT_INSTANCES).filter(instance => instance.enabled);
}

/**
 * Switch between different chatbot configurations easily
 */
export const ChatbotPresets = {
  // Lead generation focused
  LEAD_GENERATION: 'business_consultant',
  
  // Sales focused (when implemented)
  SALES_FOCUSED: 'sales_specialist',
  
  // Technical support focused (when implemented)  
  TECHNICAL_SUPPORT: 'technical_advisor',
  
  // Custom configuration
  custom: (persona: string, goals: string) => ({
    id: 'custom',
    name: 'Custom Configuration',
    persona,
    goals,
    environment: 'development' as const,
    model: 'gpt-4.1-nano',
    enabled: true
  })
};
