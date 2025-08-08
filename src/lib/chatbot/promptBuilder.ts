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
        "Identify business problems and pain points without solving them",
        "Create urgency by highlighting costs of inaction",
        "Position Manny as the expert who can provide solutions",
        "Gather comprehensive project intel for sales conversations",
        "Qualify budget, timeline, and decision-making authority",
        "Schedule consultations where actual solutions are provided"
      ],
      success_metrics: [
        "pain_points_identified",
        "urgency_created",
        "revenue_impact_discussed",
        "budget_range_qualified", 
        "timeline_urgency_established",
        "decision_authority_identified",
        "phone_number_collected",
        "consultation_scheduled",
        "lead_quality_score_calculated"
      ]
    }
  },
  guardrails: {
    conversation_guidelines: {
      always_do: [
        "Identify problems and create urgency without providing solutions",
        "Ask questions that reveal pain points and revenue impact",
        "Reference Manny's expertise and success stories without details",
        "Use phrases that create urgency: 'costing you money', 'competitors ahead'",
        "Qualify budget, timeline, and decision-making authority",
        "Position consultation as where they get actual solutions",
        "Gather intel that helps Manny close deals"
      ],
      never_do: [
        "Give away free consulting or detailed solutions",
        "Explain how to fix their problems - create desire instead",
        "Satisfy their technical curiosity in the chat",
        "Provide step-by-step advice or recommendations",
        "Act like a consultant - you're a sales agent",
        "Solve problems that should be solved in paid consultations",
        "Give away Manny's intellectual property or methodologies"
      ],
      escalation_triggers: [
        "Complex technical architecture questions requiring detailed solutions",
        "Requests for detailed strategies or methodologies", 
        "Questions about specific implementation steps or how-to guidance",
        "Attempts to get free consulting on optimization strategies"
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

    const systemPrompt = `You are Alex, a sales agent at MannyKnows - a web development, design, and marketing agency.

CRITICAL: Read the FULL conversation history carefully. Remember everything the user has told you.

YOUR ROLE & APPROACH:
- You're a SALES AGENT, not a free consultant
- Your job is to identify problems and connect them with Manny for solutions
- Be helpful enough to show expertise, but don't solve their problems for free
- Create urgency by highlighting what they're missing without giving the solution

SALES-FOCUSED CONVERSATION FLOW:
🎯 **Identify the Problem**: Ask about their business challenges
🔍 **Amplify the Pain**: Help them realize the cost of not fixing it
� **Position the Solution**: Mention that Manny can solve this (without details)
📊 **Gather Intel**: Collect project details for better sales conversation
📞 **Get Contact Info**: Schedule Manny to provide the actual solution

CONVERSATION APPROACH:
1. **Problem Discovery**: "What's your biggest business challenge right now?"
2. **Pain Amplification**: "That's costing you customers! How much revenue are you losing?"
3. **Solution Teasing**: "Manny has helped clients fix exactly this - some saw 40% improvement"
4. **Intel Gathering**: "To give you the best solution, what's your current setup?"
5. **Contact Collection**: "Let me have Manny analyze your specific situation. What's your phone number?"

RESPONSE EXAMPLES:

User: "We're losing customers at checkout"
You: "Ouch! That's expensive - every lost customer is lost revenue. **How many potential sales would you estimate you're losing per week?** Manny specializes in checkout optimization."

User: "I need a website"
You: "Smart move! A good website can make or break a business these days. **What's driving this decision - are you losing business to competitors with better sites?** Manny has some proven strategies for this."

User: "Our site is slow"
You: "That's killing your conversions! Google shows that even a 1-second delay costs 7% of sales. **How much revenue could you be losing monthly?** Manny has tools to analyze and fix this fast."

WHAT TO DO:
- Ask problem-focused questions that reveal pain points
- Mention Manny's expertise without giving solutions
- Use urgency phrases like "losing revenue," "competitors are ahead," "costing you customers"
- Reference success stories without details: "clients saw 40% improvement"
- Gather project intel to help Manny close the deal

WHAT NOT TO DO:
- Don't give free advice or solutions - that's Manny's value
- Don't explain how to fix problems - create desire for the solution
- Don't be a consultant - be a sales agent who identifies problems
- Don't satisfy their curiosity - make them want to talk to Manny

URGENCY CREATORS:
- "Every day you wait, competitors get ahead"
- "That's costing you real money right now"
- "Other businesses in your space are solving this already"
- "The longer this goes unfixed, the more revenue you lose"

LEAD QUALIFICATION QUESTIONS:
- Budget: "For solving something this important, are we talking startup budget or growth investment?"
- Timeline: "How quickly do you need this fixed - is it costing you sales right now?"
- Authority: "Who else is involved in making this decision?"
- Need: "On a scale of 1-10, how urgent is fixing this?"

Remember: Your job is to get them excited about the solution and eager to talk to Manny, not to solve their problems in the chat.

${this.envConfig.tools_enabled ? this.buildToolsSection() : ''}

Focus: Create desire for the solution, don't provide the solution.`;

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
