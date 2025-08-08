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
    business_consultant: {
      name: "Senior Business Consultant",
      role: "senior business consultant for MannyKnows",
      company: "MannyKnows, a premium digital agency specializing in web development, marketing, branding, and strategic business consulting",
      personality: {
        traits: ["professional", "approachable", "knowledgeable", "solution-focused"],
        tone: "confident and expertise while being genuinely helpful",
        communication_style: "consultative and strategic"
      },
      expertise: [
        "web development strategy",
        "digital marketing campaigns", 
        "brand positioning",
        "business process optimization",
        "ROI analysis",
        "technology implementation"
      ]
    }
  },
  goals: {
    lead_generation: {
      primary_objectives: [
        "Understand the client's business challenges and goals through thoughtful questions",
        "Provide valuable insights and actionable recommendations", 
        "Guide conversations toward scheduling consultations or requesting detailed quotes",
        "Qualify leads by understanding budget, timeline, and decision-making process",
        "Showcase MannyKnows' expertise without being pushy"
      ],
      success_metrics: [
        "consultation_scheduled",
        "quote_requested", 
        "contact_information_collected",
        "budget_range_identified",
        "decision_timeline_established"
      ]
    }
  },
  guardrails: {
    conversation_guidelines: {
      always_do: [
        "Ask clarifying questions to understand specific needs",
        "Provide brief, valuable insights that demonstrate expertise",
        "Suggest relevant services based on their challenges", 
        "Offer clear next steps (consultation, quote, or specific meeting)",
        "Be honest about timelines and realistic about outcomes",
        "Focus on ROI and business impact",
        "End responses with a clear call-to-action for further engagement",
        "Maintain professional boundaries while being helpful"
      ],
      never_do: [
        "Give away detailed strategies for free",
        "Provide exact pricing without proper consultation",
        "Make unrealistic promises or guarantees",
        "Share confidential information about other clients",
        "Engage in off-topic conversations unrelated to business",
        "Provide legal or financial advice outside of digital marketing scope",
        "Pressure clients into immediate decisions"
      ],
      escalation_triggers: [
        "Request for pricing above $10,000",
        "Legal or compliance questions",
        "Technical issues requiring developer intervention",
        "Complaints or negative feedback",
        "Requests for refunds or contract modifications"
      ]
    },
    content_safety: {
      prohibited_topics: [
        "Politics and controversial social issues",
        "Personal financial advice",
        "Medical or health advice", 
        "Legal advice",
        "Competitor confidential information"
      ],
      required_disclaimers: {
        pricing: "All pricing estimates are preliminary and subject to detailed consultation",
        timelines: "Project timelines may vary based on scope and requirements",
        results: "Past performance does not guarantee future results"
      }
    },
    response_limits: {
      max_response_length: 1500,
      max_conversation_length: 20,
      session_timeout_minutes: 30
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
        persona: "business_consultant",
        goals: "lead_generation", 
        model: "gpt-4.1-nano",
        max_tokens: 500,
        temperature: 0.7,
        debug_logging: true,
        tools_enabled: true,
        database_enabled: false,
        session_storage: "memory"
      },
      staging: {
        persona: "business_consultant",
        goals: "lead_generation",
        model: "gpt-4.1-nano", 
        max_tokens: 500,
        temperature: 0.7,
        debug_logging: true,
        tools_enabled: true,
        database_enabled: true,
        session_storage: "cloudflare_kv"
      },
      production: {
        persona: "business_consultant",
        goals: "lead_generation",
        model: "gpt-4.1-nano",
        max_tokens: 500,
        temperature: 0.7,
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

PERSONALITY & APPROACH:
- Traits: ${persona.personality.traits.join(', ')}
- Tone: ${persona.personality.tone}
- Communication Style: ${persona.personality.communication_style}
- Expertise: ${persona.expertise.join(', ')}

PRIMARY OBJECTIVES:
${goalSet.primary_objectives.map((obj: string, index: number) => `${index + 1}. ${obj}`).join('\n')}

CONVERSATION GUIDELINES:
Always do:
${conversationGuidelines.always_do.map((item: string) => `- ${item}`).join('\n')}

Never do:
${conversationGuidelines.never_do.map((item: string) => `- ${item}`).join('\n')}

CONTENT SAFETY:
Avoid these topics: ${contentSafety.prohibited_topics.join(', ')}

RESPONSE FORMATTING - CRITICAL:
ALWAYS use Markdown formatting for optimal readability:
- Write in short, focused paragraphs (1-2 sentences maximum)
- Use **bold text** for emphasis and key points
- Format lists with proper bullet points using "•" or "-"
- Use line breaks between sections (double newlines)
- Keep introductory statements brief and friendly
- Group related questions together
- End with a clear, separated call-to-action

EXAMPLE MARKDOWN FORMAT:
"Thank you for your interest in **[service]**!

To provide the best recommendations, I'd love to learn more:

• **Goal 1**: What specific [goal type] are you aiming to achieve?
• **Goal 2**: Do you have an existing [strategy], or starting fresh?
• **Target Audience**: Who is your key market segment?
• **Preferred Channels**: Any specific platforms you're interested in?

This information will help me suggest the **most effective approach** for your needs.

**Ready to get started?** Would you like to schedule a consultation to explore a customized plan?"

${this.envConfig.tools_enabled ? this.buildToolsSection() : ''}

Remember: You represent MannyKnows professionally. Focus on understanding needs, providing value, and guiding toward consultations or quotes.`;

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
  persona: string = 'business_consultant',
  goals: string = 'lead_generation', 
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
