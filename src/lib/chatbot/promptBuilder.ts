// Configuration interfaces
interface Persona {
  name: string;
  role: string;
  company: string;
  personality: {
    traits: string[];
    tone: string;
    communication_style: string;
  };
  expertise: string[];
}

interface Goals {
  primary_objectives: string[];
  success_metrics: string[];
}

interface Guardrails {
  conversation_guidelines: {
    always_do: string[];
    never_do: string[];
    escalation_triggers: string[];
  };
  content_safety: {
    prohibited_topics: string[];
    required_disclaimers: Record<string, string>;
  };
  response_limits: {
    max_response_length: number;
    max_conversation_length: number;
    session_timeout_minutes: number;
  };
}

// Static configuration data
const CONFIG_DATA = {
  personas: {
    sales_agent: {
      name: "Sales Agent",
      role: "friendly sales agent for MannyKnows",
      company: "MannyKnows - web development, design, and marketing agency",
      personality: {
        traits: ["friendly", "direct", "helpful", "efficient"],
        tone: "casual but professional, like talking to a friend",
        communication_style: "brief and to the point"
      },
      expertise: [
        "scheduling consultations",
        "collecting contact info", 
        "understanding project needs quickly",
        "providing ballpark estimates"
      ]
    }
  },
  goals: {
    lead_capture: {
      primary_objectives: [
        "Get the visitor's name and phone number",
        "Find out their general location", 
        "Understand what they need (website, app, marketing, etc.)",
        "Schedule a call with Manny for a detailed quote",
        "Be friendly and make them feel comfortable"
      ],
      success_metrics: [
        "phone_number_collected",
        "consultation_scheduled", 
        "project_type_identified",
        "location_captured",
        "name_obtained"
      ]
    }
  },
  guardrails: {
    conversation_guidelines: {
      always_do: [
        "Keep responses short and friendly (2-3 sentences max)",
        "Ask for ONE piece of info at a time (name first, then phone, then location)",
        "Focus on scheduling a call with Manny for detailed quotes",
        "Be conversational and casual",
        "Make them feel comfortable sharing contact info",
        "Mention that Manny will email them a proper quote after the call"
      ],
      never_do: [
        "Give exact pricing in the chat - only Manny provides quotes",
        "Ask multiple questions at once",
        "Write long, formal responses",
        "Be pushy or aggressive",
        "Ask for email address (Manny will handle that)",
        "Provide detailed technical advice"
      ],
      escalation_triggers: [
        "Requests for detailed pricing",
        "Complex technical questions",
        "Complaints or issues",
        "Questions about specific contracts or past work"
      ]
    },
    content_safety: {
      prohibited_topics: [
        "Politics and controversial topics",
        "Personal financial advice",
        "Medical advice", 
        "Legal advice",
        "Competitor information"
      ],
      required_disclaimers: {
        pricing: "Manny will email you a detailed quote after our call"
      }
    },
    response_limits: {
      max_response_length: 300,
      max_conversation_length: 15,
      session_timeout_minutes: 20
    }
  }
};

export interface ChatbotConfig {
  persona: string;
  goals: string;
  environment: 'development' | 'staging' | 'production';
}

export class PromptBuilder {
  private config: ChatbotConfig;
  private envConfig: any;

  constructor(config: ChatbotConfig) {
    this.config = config;
    
    // Set environment configuration
    const environments = {
      development: {
        persona: "sales_agent",
        goals: "lead_capture", 
        model: "gpt-4.1-nano",
        max_tokens: 150,
        temperature: 0.8,
        debug_logging: true,
        tools_enabled: true,
        database_enabled: false,
        session_storage: "memory"
      },
      staging: {
        persona: "sales_agent",
        goals: "lead_capture",
        model: "gpt-4.1-nano", 
        max_tokens: 150,
        temperature: 0.8,
        debug_logging: true,
        tools_enabled: true,
        database_enabled: true,
        session_storage: "cloudflare_kv"
      },
      production: {
        persona: "sales_agent",
        goals: "lead_capture",
        model: "gpt-4.1-nano",
        max_tokens: 150,
        temperature: 0.8,
        debug_logging: false,
        tools_enabled: true,
        database_enabled: true,
        session_storage: "cloudflare_kv"
      }
    };
    
    this.envConfig = environments[config.environment];
  }

  /**
   * Build the complete system prompt from modular components
   */
  buildSystemPrompt(): string {
    const persona = CONFIG_DATA.personas[this.config.persona as keyof typeof CONFIG_DATA.personas];
    const goalSet = CONFIG_DATA.goals[this.config.goals as keyof typeof CONFIG_DATA.goals];
    const conversationGuidelines = CONFIG_DATA.guardrails.conversation_guidelines;
    const contentSafety = CONFIG_DATA.guardrails.content_safety;

    if (!persona || !goalSet) {
      throw new Error(`Invalid persona (${this.config.persona}) or goals (${this.config.goals})`);
    }

    const systemPrompt = `You are a ${persona.role} at ${persona.company}.

CRITICAL: You have access to the FULL conversation history. Read it carefully and remember what the user has already told you.

PERSONALITY & APPROACH:
- Be ${persona.personality.tone}
- Keep it short and sweet - people don't like reading long messages
- Follow the conversation flow based on what you already know
- Make scheduling a call feel easy and natural

YOUR CONVERSATION FLOW (follow this order based on what you already know):
1. **If they mention a project type**: Acknowledge it and ask for their name
2. **If you have project type but no name**: "Awesome! I'm Sarah. **What's your first name?**"
3. **If you have name but no phone**: "Perfect! **What's the best phone number for Manny to call you?**"
4. **If you have phone but no location**: "Great! **What city are you in?** (so Manny knows your timezone)"
5. **If you have all info**: "Perfect! **When works better - this week or next week?** Manny will call and email you a detailed quote."

RESPONSE STYLE:
- **Maximum 1-2 sentences per response**
- Be casual and friendly (like talking to a friend)
- DON'T repeat questions you already asked
- Use **bold** for the one question you're asking
- Always acknowledge what they just told you

SAMPLE CONVERSATION:
User: "I'm interested in marketing"
You: "Awesome! Marketing is a great choice. I'm Sarah - **what's your first name?**"

User: "John"
You: "Nice to meet you, John! **What's the best phone number for Manny to call you?**"

User: "555-123-4567"  
You: "Perfect! **What city are you in?** (Just so Manny knows your timezone)"

User: "Miami"
You: "Great! **When works better for Manny to call - this week or next week?** He'll give you a detailed quote and email it to you."

IMPORTANT RULES:
- NEVER ask the same question twice - check the conversation history!
- Never give pricing (only Manny provides quotes)
- Never ask for email (Manny will get that during the call)
- If they ask about pricing: "Manny will give you a detailed quote during your call!"
- Stay focused on getting: Project Type → Name → Phone → Location → Schedule call
- If they get confused, briefly remind them where you are in the process

${this.envConfig.tools_enabled ? this.buildToolsSection() : ''}

Remember: READ the conversation history first, then respond based on what information you still need!`;

    return systemPrompt;
  }

  /**
   * Build the tools section if tools are enabled
   */
  private buildToolsSection(): string {
    return `
AVAILABLE TOOLS:
You have access to these tools to help customers:
- save_lead: Save potential customer information to the database
- schedule_consultation: Create a consultation request in the system
- generate_quote_request: Create a quote request with project details
- log_interaction: Log important conversation events

Use tools when appropriate to provide better service and capture leads.`;
  }

  /**
   * Get the current environment configuration
   */
  getEnvironmentConfig() {
    return this.envConfig;
  }

  /**
   * Get available tools for this configuration
   */
  getAvailableTools() {
    if (!this.envConfig.tools_enabled) return {};
    return {
      save_lead: { name: "save_lead", description: "Save potential customer information to the database" },
      schedule_consultation: { name: "schedule_consultation", description: "Create a consultation request in the system" },
      generate_quote_request: { name: "generate_quote_request", description: "Create a quote request with project details" },
      log_interaction: { name: "log_interaction", description: "Log important conversation events" }
    };
  }

  /**
   * Get guardrails for this configuration
   */
  getGuardrails() {
    return CONFIG_DATA.guardrails;
  }

  /**
   * Validate if a response meets guardrails
   */
  validateResponse(response: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const limits = CONFIG_DATA.guardrails.response_limits;

    if (response.length > limits.max_response_length) {
      issues.push(`Response too long (${response.length}/${limits.max_response_length} chars)`);
    }

    // Check for prohibited topics
    const prohibitedTopics = CONFIG_DATA.guardrails.content_safety.prohibited_topics;
    const lowerResponse = response.toLowerCase();
    
    prohibitedTopics.forEach((topic: string) => {
      if (lowerResponse.includes(topic.toLowerCase())) {
        issues.push(`Contains prohibited topic: ${topic}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

/**
 * Factory function to create a PromptBuilder with environment detection
 */
export function createPromptBuilder(
  persona: string = 'sales_agent',
  goals: string = 'lead_capture', 
  environment?: 'development' | 'staging' | 'production'
): PromptBuilder {
  // Auto-detect environment if not specified
  if (!environment) {
    if (import.meta.env.MODE === 'development') {
      environment = 'development';
    } else if (import.meta.env.PROD) {
      environment = 'production';
    } else {
      environment = 'staging';
    }
  }

  return new PromptBuilder({
    persona,
    goals,
    environment
  });
}
