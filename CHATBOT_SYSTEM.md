# MannyKnows Chatbot System

A modular, containerized chatbot system with configurable personas, goals, guardrails, and database integration.

## 🏗️ Architecture Overview

```
src/
├── config/chatbot/           # JSON configuration files
│   ├── personas.json         # Character profiles and expertise
│   ├── goals.json            # Objective sets (lead_generation, consultation, etc.)
│   ├── guardrails.json       # Safety rules and content restrictions
│   ├── tools.json            # Available tools and when to use them
│   └── environments.json     # Environment-specific settings
├── lib/chatbot/             # Core chatbot logic
│   ├── promptBuilder.ts      # Builds system prompts from configs
│   ├── manager.ts            # Main orchestration class
│   └── tools.ts              # Tool implementations (save leads, etc.)
├── lib/database/            # Database operations
│   ├── chatbotDatabase.ts    # Database adapters (D1, Memory)
│   └── schema.sql            # Database schema
└── pages/api/               # API endpoints
    └── chat.ts               # Main chat endpoint
```

## 🎭 Managing Personas

### Current Personas
- **business_consultant**: Professional, strategic, lead-focused
- **sales_specialist**: Energetic, persuasive, deal-closing focused
- **technical_advisor**: Analytical, detail-oriented, solution-focused

### Adding a New Persona
1. Edit `src/config/chatbot/personas.json`:
```json
{
  "customer_support": {
    "name": "Customer Support Specialist",
    "role": "customer support specialist for MannyKnows",
    "company": "MannyKnows customer success team",
    "personality": {
      "traits": ["helpful", "patient", "empathetic", "solution-oriented"],
      "tone": "friendly and supportive",
      "communication_style": "clear and reassuring"
    },
    "expertise": [
      "troubleshooting issues",
      "account management", 
      "service explanations",
      "escalation handling"
    ]
  }
}
```

2. Update `src/lib/chatbot/manager.ts` to include the new instance:
```typescript
export const CHATBOT_INSTANCES: Record<string, ChatbotInstance> = {
  // ... existing instances
  customer_support: {
    id: 'customer_support',
    name: 'Customer Support',
    persona: 'customer_support',
    goals: 'customer_support', // You'll need to create this in goals.json
    environment: 'production',
    model: 'gpt-4.1-nano',
    enabled: true
  }
}
```

## 🎯 Managing Goals

### Current Goal Sets
- **lead_generation**: Focus on capturing leads and scheduling consultations
- **customer_support**: Focus on resolving issues and maintaining satisfaction
- **consultation**: Focus on needs analysis and strategic recommendations

### Adding New Goals
Edit `src/config/chatbot/goals.json`:
```json
{
  "upselling": {
    "primary_objectives": [
      "Identify expansion opportunities with existing customers",
      "Present relevant additional services",
      "Quantify potential ROI of additional services",
      "Guide toward upgrade consultations"
    ],
    "success_metrics": [
      "upsell_opportunity_identified",
      "upgrade_consultation_scheduled",
      "additional_service_interest"
    ]
  }
}
```

## 🛡️ Managing Guardrails

### Current Guardrails
- **Conversation Guidelines**: What to always do/never do
- **Content Safety**: Prohibited topics and required disclaimers
- **Response Limits**: Length, conversation limits, timeouts

### Updating Guardrails
Edit `src/config/chatbot/guardrails.json`:
```json
{
  "conversation_guidelines": {
    "always_do": [
      "Verify customer identity for sensitive requests",
      "Provide accurate service information",
      "Document important customer requests"
    ],
    "never_do": [
      "Share customer data with unauthorized parties",
      "Make commitments beyond your authority",
      "Ignore escalation triggers"
    ],
    "escalation_triggers": [
      "Customer data requests",
      "Billing disputes over $500",
      "Technical issues affecting live sites"
    ]
  }
}
```

## 🔧 Managing Tools

### Current Tools
- **save_lead**: Capture customer information
- **schedule_consultation**: Create consultation requests  
- **generate_quote_request**: Submit quote requests
- **log_interaction**: Track conversation events

### Adding New Tools
1. Add tool definition to `src/config/chatbot/tools.json`:
```json
{
  "send_welcome_email": {
    "name": "send_welcome_email",
    "description": "Send a welcome email to new leads",
    "parameters": {
      "lead_id": "string",
      "email_template": "string"
    },
    "when_to_use": "After successfully capturing a new lead"
  }
}
```

2. Implement the tool in `src/lib/chatbot/tools.ts`:
```typescript
async sendWelcomeEmail(params: {
  lead_id: string;
  email_template: string;
}): Promise<ToolResult> {
  try {
    // Email sending logic here
    return {
      success: true,
      message: 'Welcome email sent successfully',
      data: { email_sent: true }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send welcome email'
    };
  }
}
```

## 🗄️ Database Integration

### Setup Cloudflare D1
1. Create D1 database:
```bash
npx wrangler d1 create mannyknows-chatbot
```

2. Run schema:
```bash
npx wrangler d1 execute mannyknows-chatbot --file=src/lib/database/schema.sql
```

3. Add to `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "mannyknows-chatbot" 
database_id = "your-database-id"
```

### Using the Database
```typescript
// In your API route
const dbAdapter = createDatabaseAdapter('production', env.DB);
const chatbotTools = new ChatbotTools(dbAdapter, sessionId);

// Save a lead
const leadResult = await chatbotTools.saveLead({
  name: 'John Doe',
  email: 'john@example.com',
  interest: 'Website development',
  source: 'website_chat'
});
```

## 🚀 Usage Examples

### Basic Usage
```typescript
import { createChatbotManager } from '../lib/chatbot/manager';

// Create a business consultant chatbot
const chatbot = createChatbotManager('business_consultant');

// Get system prompt
const systemPrompt = chatbot.getSystemPrompt();

// Process a message
const result = await chatbot.processMessage('I need a website', 'session123');
```

### Environment-Specific Configuration
```typescript
// Development environment with memory storage
const devChatbot = createChatbotManager('business_consultant');

// Production environment with D1 database
const prodChatbot = createChatbotManager('business_consultant', env.DB);
```

### Custom Configuration
```typescript
import { ChatbotPresets } from '../lib/chatbot/manager';

// Use preset
const leadGenBot = createChatbotManager(ChatbotPresets.LEAD_GENERATION);

// Custom configuration
const customConfig = ChatbotPresets.custom('technical_advisor', 'consultation');
```

## 🔄 Switching Configurations

### Runtime Switching
```typescript
// In your API endpoint
const chatbotId = request.headers.get('x-chatbot-id') || 'business_consultant';
const chatbot = createChatbotManager(chatbotId, env.DB);
```

### A/B Testing
```typescript
// Simple A/B test
const chatbotId = Math.random() > 0.5 ? 'business_consultant' : 'sales_specialist';
const chatbot = createChatbotManager(chatbotId, env.DB);
```

### Environment-Based Selection
```typescript
const environment = import.meta.env.MODE;
const chatbotId = environment === 'development' ? 'business_consultant' : 'sales_specialist';
```

## 📊 Monitoring & Analytics

### Built-in Logging
- All conversations are logged via `log_interaction` tool
- Lead capture events are automatically tracked
- Response validation failures are logged

### Custom Metrics
```typescript
// Track custom events
await chatbotTools.logInteraction({
  event_type: 'feature_request',
  event_data: { feature: 'mobile_app', priority: 'high' }
});
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional - Chatbot Selection
DEFAULT_CHATBOT_ID=business_consultant
ENABLE_TOOLS=true
ENABLE_DATABASE=true
```

### Dynamic Configuration Updates
```typescript
// Update configuration without restart
const config = chatbot.getInstanceInfo();
config.environment_config.max_tokens = 750;
```

## 🚀 Best Practices

1. **Modular Design**: Keep personas, goals, and guardrails in separate files
2. **Environment Separation**: Use different configurations for dev/staging/prod
3. **Tool Safety**: Always validate tool inputs and handle errors gracefully
4. **Response Validation**: Use guardrails to ensure brand consistency
5. **Database Backup**: Regular backups of lead and interaction data
6. **Monitoring**: Track conversation quality and tool usage metrics
7. **Version Control**: Tag configuration changes for rollback capability

## 🔄 Migration Guide

### From Old System
1. Export existing system prompt to persona + goals + guardrails
2. Move database operations to tools system
3. Update API endpoint to use ChatbotManager
4. Test with memory adapter before enabling database
5. Deploy incrementally with feature flags

### Configuration Versioning
```typescript
// Version your configurations
const configVersion = '1.2.0';
const chatbot = createChatbotManager('business_consultant', env.DB);
chatbot.setConfigVersion(configVersion);
```

This modular system gives you complete control over your chatbot's behavior while maintaining clean separation of concerns and easy maintainability.
