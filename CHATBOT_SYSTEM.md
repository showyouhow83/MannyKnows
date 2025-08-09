# MannyKnows Chatbot System

A streamlined chatbot system with GPT-5 integration, configurable environments, and database integration.

## 🚀 TLDR - Quick Settings

### Turn Chatbot On/Off
Control chatbot availability by editing `src/config/chatbot/environments.json`:
```json
{
  "development": {
    "chatbot_enabled": true     // Set to false for offline mode
  },
  "production": {
    "chatbot_enabled": true     // Set to false for offline mode
  }
}
```

### Quick Commands
```bash
# Deploy changes after configuration update
npm run deploy

# Test locally
npm run dev
```

### Common Settings
- **Enable/Disable**: `chatbot_enabled: true/false` in environments.json
- **Change Model**: Update `model` field (gpt-5-nano for dev, gpt-5 for production)
- **Debug Mode**: Set `debug_logging: true` for detailed logs
- **Database**: Set `database_enabled: false` to use memory storage (dev/testing)

### Environment URLs
- **Live Chat**: https://mannyknows.showyouhow83.workers.dev (click green chat button)
- **Admin Panel**: https://mannyknows.showyouhow83.workers.dev/admin/leads

## 🏗️ Architecture Overview

```
src/
├── config/chatbot/
│   └── environments.json     # Environment-specific settings (ONLY CONFIG FILE)
├── lib/chatbot/             # Core chatbot logic
│   ├── promptBuilder.ts      # Builds system prompts (contains hardcoded personas/goals)
│   ├── tools.ts              # Tool implementations (save leads, etc.)
│   └── leadScoring.ts        # Lead scoring logic
├── lib/database/            # Database operations
│   ├── chatbotDatabase.ts    # Database adapters (KV, Memory)
│   └── schema.sql            # Database schema
└── pages/api/               # API endpoints
    └── chat.ts               # Main chat endpoint
```

## ⚙️ Configuration Management

### Environment Configuration (environments.json)
This is the **ONLY** configuration file actually used by the system:

```json
{
  "development": {
    "persona": "business_consultant",
    "goals": "lead_generation", 
    "model": "gpt-5-nano",
    "max_tokens": 500,
    "temperature": 0.7,
    "debug_logging": true,
    "tools_enabled": true,
    "database_enabled": false,
    "session_storage": "memory",
    "chatbot_enabled": true
  },
  "production": {
    "persona": "business_consultant", 
    "goals": "lead_generation",
    "model": "gpt-5",
    "max_tokens": 500,
    "temperature": 0.7,
    "debug_logging": true,
    "tools_enabled": true,
    "database_enabled": true,
    "session_storage": "cloudflare_kv",
    "chatbot_enabled": true
  }
}
```

### Personas and Goals (Hardcoded in promptBuilder.ts)
Currently available personas and goals are hardcoded in `src/lib/chatbot/promptBuilder.ts`:

**Available Personas:**
- `business_consultant`: Professional, strategic consultant
- `sales_agent`: Friendly, direct sales agent

**Available Goals:**
- `lead_generation`: Focus on capturing leads and consultations
- `lead_capture`: Focus on identifying problems and creating urgency

### Environment Variables (Cloudflare Secrets)
```bash
# Required (already configured)
OPENAI_API_KEY=your-openai-api-key  # Set via: wrangler secret put OPENAI_API_KEY

# Optional - GA tracking (already configured)
GA_MEASUREMENT_ID=G-J0V35RZNZB
```

### Current System Status ✅
The chatbot system is **fully implemented and operational**:

1. ✅ **Streamlined configuration** - Single environments.json config file
2. ✅ **Database integration** - Cloudflare KV storage active
3. ✅ **API endpoint** - `/api/chat` fully functional  
4. ✅ **Tools system** - Lead capture and interaction logging working
5. ✅ **Admin interface** - Lead management at `/admin/leads`
6. ✅ **Production deployment** - Live on Cloudflare Workers
7. ✅ **GPT-5 integration** - Latest models (gpt-5-nano dev, gpt-5 production)

### Current Configuration Status
- ✅ **Production**: Fully configured with Cloudflare KV storage
- ✅ **Authentication**: OAuth-based deployment setup  
- ✅ **Secrets**: OPENAI_API_KEY stored as Cloudflare secret
- ✅ **Database**: Cloudflare KV for conversations and sessions
- ✅ **Admin Panel**: /admin/leads for viewing captured leads

## 🔧 Adding/Modifying Personas and Goals

Since personas and goals are hardcoded in `src/lib/chatbot/promptBuilder.ts`, to add new ones:

1. **Adding a New Persona**: Edit the `CONFIG_DATA.personas` object in promptBuilder.ts:
```typescript
const CONFIG_DATA = {
  personas: {
    // ... existing personas
    customer_support: {
      name: "Customer Support Specialist",
      role: "customer support specialist for MannyKnows",
      company: "MannyKnows customer success team",
      personality: {
        traits: ["helpful", "patient", "empathetic", "solution-oriented"],
        tone: "friendly and supportive",
        communication_style: "clear and reassuring"
      },
      expertise: [
        "troubleshooting issues",
        "account management", 
        "service explanations"
      ]
    }
  }
}
```

2. **Adding New Goals**: Edit the `CONFIG_DATA.goals` object in promptBuilder.ts:
```typescript
goals: {
  // ... existing goals
  customer_support: {
    primary_objectives: [
      "Resolve customer issues quickly",
      "Maintain high satisfaction", 
      "Escalate when needed"
    ],
    success_metrics: [
      "issue_resolved",
      "satisfaction_rating"
    ]
  }
}
```

3. **Update environments.json** to use the new persona/goals:
```json
{
  "production": {
    "persona": "customer_support",
    "goals": "customer_support"
  }
}
```

## 🗄️ Database Integration

### Database Setup (Cloudflare KV)
The system uses Cloudflare KV storage (already configured in wrangler.jsonc):

```typescript
// KV namespaces configured:
// - CHATBOT_KV: For conversation history
// - SESSION: For session management
```

### Using the Database
```typescript
// In chat.ts (already implemented)
const dbAdapter = createDatabaseAdapter(environment, storage);
const chatbotTools = new ChatbotTools(dbAdapter, sessionId);

// Save a lead (handled automatically by tools)
const leadResult = await chatbotTools.saveLead({
  name: 'John Doe',
  email: 'john@example.com',
  interest: 'Website development',
  source: 'website_chat'
});
```

## 🚀 Usage Examples

### Basic API Usage
The main chat endpoint is `POST /api/chat`:

```typescript
// Request
{
  "message": "I need help with my website",
  "session_id": "optional-session-id",
  "conversation_history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ]
}

// Response
{
  "reply": "Chat response from GPT-5",
  "tool_results": [...],
  "session_id": "session-id"
}
```

### Environment Configuration
The system automatically detects environment and loads appropriate settings:

```typescript
// Development environment (local dev server)
// Uses: gpt-5-nano, memory storage, debug logging

// Production environment (deployed)  
// Uses: gpt-5, Cloudflare KV storage
```

### Changing Configuration
1. Edit `src/config/chatbot/environments.json`
2. Deploy changes: `npm run deploy`
3. Test the changes

## 📊 Monitoring & Analytics

### Built-in Logging
- All conversations are logged via the tools system
- Lead capture events are automatically tracked
- Debug information available when `debug_logging: true`

### Admin Panel
Visit `/admin/leads` to view:
- Captured leads
- Conversation history
- Tool usage statistics

## 🔧 Troubleshooting

### Chatbot Not Responding
1. Check `chatbot_enabled: true` in environments.json
2. Verify OPENAI_API_KEY is set: `wrangler secret list`
3. Check browser console for API errors

### Database Issues  
1. Verify KV namespaces in wrangler.jsonc
2. Check admin panel: `/admin/leads`
3. Enable debug logging: `debug_logging: true`

### Configuration Changes Not Working
1. Redeploy after changes: `npm run deploy`
2. Clear browser cache
3. Check environment (development/production)

### Quick Fixes
```bash
# Reset to default working config
git checkout src/config/chatbot/environments.json

# Redeploy
npm run deploy

# Check logs (if needed)
wrangler tail
```

## 🚀 Best Practices

1. **Simple Configuration**: Keep environment settings in environments.json
2. **Environment Separation**: Use different models for dev/production
3. **Tool Safety**: All tools validate inputs and handle errors
4. **Database Backup**: Regular backups of lead data via admin panel
5. **Monitoring**: Track conversation quality via debug logs
6. **Deployment**: Always test in development before deploying

## � System Architecture Summary

**Current Implementation:**
- Single configuration file: `environments.json`
- Hardcoded personas/goals in `promptBuilder.ts`
- Direct API integration with GPT-5 models
- Cloudflare KV for production data storage
- Memory storage for development
- Tools system for lead capture and logging

**Key Files:**
- `src/pages/api/chat.ts` - Main API endpoint
- `src/config/chatbot/environments.json` - Environment configuration
- `src/lib/chatbot/promptBuilder.ts` - System prompts and personas
- `src/lib/chatbot/tools.ts` - Lead capture and logging tools
- `src/lib/database/chatbotDatabase.ts` - Database adapters

This streamlined architecture provides reliable chatbot functionality with GPT-5 integration while maintaining simplicity and ease of maintenance.
