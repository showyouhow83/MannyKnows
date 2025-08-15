import type { APIRoute } from 'astro';
import { serviceOrchestrator } from '../../lib/services/serviceOrchestrator';
import { devLog, errorLog } from '../../utils/debug';
import { ProfileManager } from '../../lib/user/ProfileManager';
import { createServiceArchitecture } from '../../lib/services/ServiceArchitecture';
import TokenBudgetManager from '../../lib/services/TokenBudgetManager';
import { createPromptBuilder } from '../../lib/chatbot/promptBuilder';
import envConfigs from '../../config/chatbot/environments.json';
// Google Calendar removed. Scheduling now uses KV storage + email notification via Resend API.

export const prerender = false;

// Load .dev.vars in Node dev when Worker runtime env is absent
async function readDevVarsFromFile(): Promise<Record<string, string> | undefined> {
  try {
    // Only attempt in Node environments
    // @ts-ignore
    const isNode = typeof process !== 'undefined' && !!(process as any).versions?.node;
    if (!isNode) return undefined;
    const { readFile } = await import('node:fs/promises');
    const path = `${process.cwd()}/.dev.vars`;
    const raw = await readFile(path, 'utf8');
    const env: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch {
    return undefined;
  }
}

// Note: In local dev, ensure your process.env is set (e.g., via shell or dev server tooling).

// Helper function to convert services to OpenAI function tools
function getAvailableToolsFromServices(serviceArchitecture: any, profile: any) {
  const accessibleServices = serviceArchitecture.getAccessibleServices(profile);
  
  const serviceTools = accessibleServices
    .filter((service: any) => service.functionName && service.canDemoInChat)
    .map((service: any) => {
      // Convert Google Sheets parameter format to OpenAI JSON Schema
      const convertToOpenAISchema = (googleSheetsParams: any) => {
        let parsedParams = googleSheetsParams;
        
        // Handle both string parameters (old format) and object parameters (new format)
        if (typeof googleSheetsParams === 'string') {
          try {
            parsedParams = JSON.parse(googleSheetsParams);
          } catch (e) {
            console.warn('Failed to parse parameters:', googleSheetsParams);
            return { properties: {}, required: [] };
          }
        }
        
        if (!parsedParams || typeof parsedParams !== 'object') {
          return { properties: {}, required: [] };
        }
        
        const properties: any = {};
        const required: string[] = [];
        
        Object.entries(parsedParams).forEach(([key, type]) => {
          if (typeof type === 'string') {
            // Convert simple types to JSON Schema format
            switch (type) {
              case 'string':
                properties[key] = { type: 'string', description: `${key} parameter` };
                break;
              case 'number':
                properties[key] = { type: 'number', description: `${key} parameter` };
                break;
              case 'boolean':
                properties[key] = { type: 'boolean', description: `${key} parameter` };
                break;
              case 'array':
                properties[key] = { type: 'array', items: { type: 'string' }, description: `${key} parameter` };
                break;
              case 'json':
                properties[key] = { type: 'object', description: `${key} parameter` };
                break;
              default:
                properties[key] = { type: 'string', description: `${key} parameter` };
            }
            required.push(key);
          }
        });
        
        return { properties, required };
      };

      const schemaData = convertToOpenAISchema(service.parameters);
      
      return {
        type: "function",
        function: {
          name: service.functionName,
          description: service.description,
          parameters: {
            type: "object",
            properties: schemaData.properties,
            required: schemaData.required
          }
        }
      };
    });

  // Add calendar scheduling tool
  const calendarTool = {
    type: "function",
    function: {
      name: "schedule_discovery_call",
      description: "Schedule a discovery call when user shows interest in services, asks about pricing, or wants to discuss their specific business needs. Use to capture leads and move conversations forward.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Contact's full name" },
          email: { type: "string", description: "Contact's email address" },
          phone: { type: "string", description: "Contact's phone number (optional)" },
          preferred_times: { type: "string", description: "Preferred meeting times or availability (e.g., 'Tomorrow 2 PM' or 'flexible')" },
          timezone: { type: "string", description: "Contact's timezone (default: America/Los_Angeles)" },
          project_details: { type: "string", description: "Brief description of their project, business challenge, or goals" }
        },
        required: ["name", "email", "phone"]
      }
    }
  };

  return [...serviceTools, calendarTool];
}

/**
 * Check if conversation contains all info needed for discovery call booking
 */
function checkIfShouldForceBooking(messages: Array<{role: string, content: string}>): boolean {
  const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
  
  // Check for discovery call interest
  const hasDiscoveryCallIntent = /(?:schedule|book|discovery call|meeting|appointment)/i.test(conversationText);
  
  // Check for email pattern
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(conversationText);
  
  // Check for name pattern (looking for "my name is" or "name is" or similar)
  const hasName = /(?:my name is|name is|i'm|i am)\s+[a-zA-Z]+/i.test(conversationText);
  
  // Check for project/business details
  const hasProjectDetails = /(?:help with|need|challenge|problem|conversion|ecommerce|website|business)/i.test(conversationText);
  
  // Check for explicit booking request
  const hasExplicitBookingRequest = /(?:book the|schedule the|please book|please schedule)/i.test(conversationText);
  
  // Only force if we have explicit booking request + basic info
  const shouldForce = hasDiscoveryCallIntent && hasEmail && hasName && hasProjectDetails && hasExplicitBookingRequest;
  
  if (shouldForce) {
    console.log('🎯 Forcing discovery call booking - all conditions met:', {
      hasDiscoveryCallIntent,
      hasEmail,
      hasName,
      hasProjectDetails,
      hasExplicitBookingRequest
    });
  }
  
  return shouldForce;
}

/**
 * Get a valid Google access token. If refresh credentials exist, refresh first.
 */
function getEnvVal(key: string, environment?: any): string | undefined {
  // Prefer platform runtime env, then import.meta.env (Astro/Vite), then process.env
  const envFromRuntime = environment && typeof environment === 'object' ? environment[key] : undefined;
  let envFromImportMeta: any;
  try {
    // @ts-ignore - import.meta may not exist in some runtimes
    envFromImportMeta = (import.meta as any)?.env;
  } catch {
    envFromImportMeta = undefined;
  }
  const envFromProcess = (typeof process !== 'undefined' && process.env) ? (process.env as any)[key] : undefined;
  const metaVal = envFromImportMeta && typeof envFromImportMeta === 'object' ? envFromImportMeta[key] : undefined;
  return envFromRuntime ?? metaVal ?? envFromProcess;
}

// getGoogleAccessTokenFromEnv removed with Google Calendar integration

/**
 * Extract booking details from recent conversation messages.
 * Heuristics: looks for name, email, phone, preferred time phrases, timezone, and explicit booking intent.
 */
function extractBookingDetails(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>) {
  // Analyze ONLY user-authored text to avoid matching examples in the system prompt
  const userMessages = messages.filter(m => m.role === 'user');
  const recentUsers = userMessages.slice(-4);
  const joinedUser = recentUsers.map(m => m.content).join("\n");
  const lastUser = userMessages[userMessages.length - 1];
  const lastUserText = lastUser?.content || '';
  const lowerLast = lastUserText.toLowerCase();

  // Guard: ignore super-short greetings
  const isGreetingOnly = /^(hi|hey|hello|yo|sup|howdy)[.!\s]*$/i.test(lastUserText.trim());

  // Explicit booking intent must be in the LAST user message
  const explicitBooking = /\b(please\s+book|book\s+(?:a|the)?\s*call|schedule\s+(?:a|the)?\s*call|go\s+ahead\s+and\s+book|let'?s\s+(?:book|schedule)|set\s*up\s*(?:a|the)?\s*call)\b/i.test(lastUserText);

  // Email (from user text only)
  const emailMatch = joinedUser.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  let email = emailMatch ? emailMatch[0] : undefined;

  // Phone (very permissive; from user text only)
  const phoneMatch = joinedUser.match(/\b(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  // Name: from explicit patterns in user text
  const namePatterns = [
    /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,2})/i,
    /\bi\s*am\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,2})/i,
    /\bi'?m\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,2})/i,
    /\bthis\s+is\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,2})/i
  ];
  let name: string | undefined;
  for (const re of namePatterns) {
    const m = joinedUser.match(re);
    if (m?.[1]) { name = m[1].trim(); break; }
  }
  // Do NOT derive a name from the email local-part to avoid false positives

  // Preferred times: capture phrases in user text
  const dayRe = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|thur|fri|sat|sun|today|tomorrow|next\s+(?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i;
  const timeRe = /\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i;
  const flexRe = /\b(flexible|any\s*time|whenever|you\s*pick|open)\b/i;

  let preferred_times: string | undefined;
  if (flexRe.test(lowerLast)) {
    preferred_times = 'flexible';
  } else {
    const idx = lastUserText.search(new RegExp(`${dayRe.source}|${timeRe.source}`, 'i'));
    if (idx !== -1) {
      const window = lastUserText.substring(Math.max(0, idx - 30), Math.min(lastUserText.length, idx + 60)).replace(/\n+/g, ' ').trim();
      preferred_times = window;
    }
  }

  // Timezone (user text only)
  const tzMatch = lastUserText.match(/\b(ACDT|ACST|ACT|ADT|AEDT|AEST|AKDT|AKST|AST|AWST|BST|CDT|CEST|CET|CST|EAT|EDT|EEST|EET|EST|GMT|HKT|HST|IST|JST|KST|MDT|MSK|MST|NZDT|NZST|PDT|PET|PKT|PHT|PST|SGT|UTC|WAT|WET)\b/i);
  const timezone = tzMatch ? tzMatch[0].toUpperCase() : undefined;

  // Project details: from last user message
  let project_details = lastUserText.trim();
  if (project_details && project_details.length > 500) project_details = project_details.slice(0, 500) + '...';

  // Must have explicit booking intent in last user message and a real email to proceed
  const ready = Boolean(!isGreetingOnly && explicitBooking && email && project_details && project_details.length >= 8);

  return { ready, explicitBooking, name, email, phone, preferred_times, timezone, project_details };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { message, session_id = crypto.randomUUID(), conversation_history = [] } = body;
    
    devLog('Architecture 2 chat request:', { message, session_id, history_length: conversation_history.length });

  const kv = (locals as any).runtime?.env?.CHATBOT_KV;
  const schedulerKv = (locals as any).runtime?.env?.SCHEDULER_KV || kv;
    let environment = (locals as any).runtime?.env as any; // Pass full environment for KV access
    if (!environment || Object.keys(environment).length === 0) {
      const devVars = await readDevVarsFromFile();
      if (devVars) environment = devVars;
    }
    
    // Initialize service architecture with KV environment
    const serviceArchitecture = createServiceArchitecture(environment);
    await serviceArchitecture.ensureServicesLoaded();
    
    // Initialize managers
    const profileManager = new ProfileManager(kv);
    
    // Get or create user profile
    const profile = await profileManager.getUserProfile(session_id);
    devLog('User profile:', { id: profile.id, interactions: profile.interactions, trustScore: profile.trustScore });
    
    // Get environment config
  const envMode = import.meta.env.MODE === 'development' ? 'development' : 'production';
  devLog('Env mode:', envMode);
  const envConfig = envConfigs[envMode as keyof typeof envConfigs];

    // Initialize token budget manager
    const tokenBudgetManager = new TokenBudgetManager(kv, envConfig);
    
    // Calculate token allocation based on user tier and usage
    const tokenAllocation = await tokenBudgetManager.calculateTokenAllocation(profile);
    devLog('Token allocation:', tokenAllocation);

    if (!envConfig.chatbot_enabled) {
      return new Response(JSON.stringify({
        reply: "I'm currently offline for maintenance. Please contact us directly for assistance.",
        chatbot_offline: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build system prompt using the structured prompt builder
    const promptBuilder = createPromptBuilder('business_consultant', 'business_consultation');
    
    // Get all services for Manny's knowledge, regardless of user tier
    const allServices = serviceArchitecture.getUserFacingServices();
    const servicesList = allServices.map((s: any) => s.displayName).join(', ');
    const categories = Array.from(new Set(allServices.map((s: any) => s.businessCategory)))
      .filter((cat): cat is string => typeof cat === 'string' && cat.trim() !== '');
    
    const systemPrompt = promptBuilder.buildSystemPrompt(
      servicesList,
      categories.length,
      allServices.length,
      profile
    );

    // Get available tools based on current service architecture
    const AVAILABLE_TOOLS = getAvailableToolsFromServices(serviceArchitecture, profile);

    // Prepare OpenAI request with function calling and conversation history
    const openaiMessages: Array<{role: "system" | "user" | "assistant", content: string}> = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add conversation history if provided
    if (conversation_history && conversation_history.length > 0) {
      conversation_history.forEach((msg: any) => {
        openaiMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content
        });
      });
    }

    // Add current message
    openaiMessages.push({
      role: "user",
      content: message
    });

    devLog('System prompt length:', systemPrompt.length);
    devLog('Available tools count:', AVAILABLE_TOOLS.length);

  // Server-side fallback: if user explicitly asked to book and we have details, schedule directly
  const bookingDetails = extractBookingDetails(openaiMessages);
  devLog('Booking details extracted:', bookingDetails);
  if (bookingDetails.ready && bookingDetails.explicitBooking) {
    try {
      devLog('Attempting server-side direct booking...');
      // Track service usage (same as tool path)
      await profileManager.trackServiceUsage(profile, 'schedule_discovery_call', 'free', true);

  const result = await executeScheduleCall({
        name: bookingDetails.name,
        email: bookingDetails.email,
        phone: bookingDetails.phone,
        preferred_times: bookingDetails.preferred_times || 'flexible',
        timezone: bookingDetails.timezone || 'America/Los_Angeles',
        project_details: bookingDetails.project_details || 'Not specified'
  }, profile, profileManager, environment, schedulerKv);
      
      devLog('Direct booking result:', result);
      if (result?.status === 'error') {
        errorLog('Calendar booking error (direct fallback):', result);
      }
      
      let finalResponseText = '';
      if (result?.status === 'meeting_requested' && result.tracking_id) {
        finalResponseText = `Got it — I’ve sent your request to our team and we’ll confirm the meeting time by email.\n\n• Name: ${bookingDetails.name}\n• Email: ${bookingDetails.email}\n• Preferred: ${bookingDetails.preferred_times || 'Flexible'}\n• Reference: ${result.tracking_id}${result.proposed_time ? `\n• Proposed: ${result.proposed_time}` : ''}${result.meeting_link ? `\n• Meeting: ${result.meeting_link}` : ''}`;
      } else if (result?.status === 'validation_error') {
          finalResponseText = `I need a couple details to book: ${result.required_fields?.join(', ')}.`;
      } else if (result?.status === 'error') {
          finalResponseText = `I had trouble sending the request. Please email ${result.fallback_email || 'manny@mannyknows.com'} and we’ll confirm manually.`;
        } else {
          finalResponseText = `I had trouble booking that just now. Please share a time window and I’ll try again.`;
        }

        // Return immediately to avoid any secondary KV calls causing failures
        return new Response(JSON.stringify({
          reply: finalResponseText,
          finalResponse: finalResponseText,
          session_id
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        devLog('Direct booking fallback failed:', e);
      }
    }

    // Call OpenAI with function calling
  const apiKey = getEnvVal('OPENAI_API_KEY', environment);
    
    // Cap tokens to avoid model limits (e.g., 16,384 for many models)
    const SAFE_MODEL_COMPLETION_CAP = 12000;
    const maxTokensThisCall = Math.max(256, Math.min(SAFE_MODEL_COMPLETION_CAP, tokenAllocation.maxTokensForResponse));

    const requestBody: any = {
      model: envConfig.model,
      messages: openaiMessages,
      max_completion_tokens: maxTokensThisCall,
      tools: AVAILABLE_TOOLS,
      tool_choice: "auto"
    };

    // Support custom-compatible API base and auth header
    const baseUrl = (getEnvVal('OPENAI_BASE_URL', environment) || 'https://api.openai.com').replace(/\/+$/,'');
    const apiHeaderName = getEnvVal('OPENAI_AUTH_HEADER', environment) || 'Authorization';
    const apiHeaderScheme = getEnvVal('OPENAI_AUTH_SCHEME', environment) || 'Bearer';
    const headersInit: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    headersInit[apiHeaderName] = `${apiHeaderScheme} ${apiKey}`;

    // Allow extra headers via JSON env var (e.g., OpenRouter requires HTTP-Referer, X-Title)
    try {
      const extra = getEnvVal('OPENAI_EXTRA_HEADERS', environment);
      if (extra) {
        const parsed = JSON.parse(extra);
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'string') headersInit[k] = v;
          }
        }
      }
    } catch {}

    const openaiResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: headersInit,
      body: JSON.stringify(requestBody),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      devLog('OpenAI API error:', `${openaiResponse.status} - ${errorText}`);

      // Friendly handling for invalid API key in dev
      if (openaiResponse.status === 401) {
        const fallbackText = `I'm temporarily offline because my AI key is invalid or missing. Please check OPENAI_API_KEY in your environment and try again.`;
        return new Response(JSON.stringify({
          reply: fallbackText,
          finalResponse: fallbackText,
          session_id
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const data = await openaiResponse.json();
    devLog('OpenAI response:', data);
    
    const choice = data.choices[0];
    let finalResponse = '';

    // Handle function calls
    if (choice.message.tool_calls) {
  const toolResults: Array<{ tool_call_id: string; result: any; name: string }> = [];

      for (const toolCall of choice.message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        devLog('Executing function:', `${functionName} with ${JSON.stringify(functionArgs)}`);

        let toolResult = null;

        // Route function calls through service architecture
        switch (functionName) {
          case 'analyze_website':
            toolResult = await executeWebsiteAnalysis(functionArgs.url, session_id, kv, profile, profileManager, serviceArchitecture);
            break;
            
          case 'show_available_services':
            toolResult = await executeShowServices(profile, profileManager, serviceArchitecture);
            break;

          case 'get_seo_tips':
            toolResult = await executeGetSeoTips(functionArgs.topic, profile, profileManager);
            break;

          case 'check_domain_status':
            toolResult = await executeCheckDomain(functionArgs.domain, profile, profileManager);
            break;

          case 'get_industry_insights':
            toolResult = await executeIndustryInsights(functionArgs.industry, profile, profileManager, serviceArchitecture);
            break;

          case 'schedule_discovery_call':
            toolResult = await executeScheduleCall(functionArgs, profile, profileManager, environment, schedulerKv);
            break;
            
          default:
            toolResult = {
              error: `Function ${functionName} not implemented`,
              message: `Sorry, ${functionName} is not available yet.`
            };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          result: toolResult,
          name: functionName
        });
      }

      // Let AI craft natural response using tool data
    const toolMessages = toolResults.map(result => {
        // Limit tool response size to prevent API errors
        let resultContent = JSON.stringify(result.result);
        if (resultContent.length > 4000) {
          // Truncate large responses but keep essential data
          const truncatedResult = {
            ...result.result,
            truncated: true,
            originalSize: resultContent.length
          };
          resultContent = JSON.stringify(truncatedResult).substring(0, 4000) + '...}';
        }
        
        return {
          role: "tool" as const,
          content: resultContent,
      tool_call_id: result.tool_call_id,
      name: result.name
        };
      });

  const followUpRequestBody = {
        model: envConfig.model,
        messages: [
          ...openaiMessages,
          { role: "assistant" as const, content: choice.message.content || "", tool_calls: choice.message.tool_calls },
          ...toolMessages
        ],
  max_completion_tokens: Math.max(256, Math.min(2000, maxTokensThisCall))
      };

      const followUpResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: headersInit,
  body: JSON.stringify(followUpRequestBody)
      });

      if (!followUpResponse.ok) {
        const errorData = await followUpResponse.text();
        devLog('Follow-up OpenAI API error:', `${followUpResponse.status} - ${errorData}`);
        devLog('Follow-up request body:', JSON.stringify(followUpRequestBody, null, 2));
        throw new Error(`OpenAI API error: ${followUpResponse.status}`);
      }

      const followUpData = await followUpResponse.json();
      finalResponse = followUpData.choices[0].message.content || "I apologize, but I'm having trouble processing that request right now.";
      // If scheduling happened, append the reference details to ensure user sees them
      const scheduleResult = toolResults.find(t => t.name === 'schedule_discovery_call')?.result;
      if (scheduleResult?.status === 'meeting_requested' && scheduleResult?.tracking_id) {
        const extras = `\n\nReference: ${scheduleResult.tracking_id}`
          + (scheduleResult.proposed_time ? `\nProposed: ${scheduleResult.proposed_time}` : '')
          + (scheduleResult.meeting_link ? `\nMeeting: ${scheduleResult.meeting_link}` : '');
        if (!finalResponse.includes(scheduleResult.tracking_id)) {
          finalResponse += extras;
        }
      }
    } else {
      // Handle direct content response
      finalResponse = choice.message.content || '';
      
      // Handle case where response was truncated due to length
      if (data.choices[0].finish_reason === 'length') {
        if (!finalResponse.trim()) {
          finalResponse = "I was going to give you a detailed response, but it got cut off. Let me try again with a shorter answer. Could you please repeat your question?";
        } else {
          finalResponse += "\n\n(Note: My response was cut short - feel free to ask for more details!)";
        }
      }
      
      // Ensure we always have some response
      if (!finalResponse.trim()) {
        finalResponse = "I understand your question, but I'm having trouble formulating a complete response right now. Could you try rephrasing your question?";
      }
    }

    // Track token usage
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;
    await tokenBudgetManager.trackTokenUsage(profile.id, promptTokens, completionTokens);

    // Track interaction
    await profileManager.trackInteraction(profile, 'message_sent', {
      messageLength: message.length,
      responseLength: finalResponse.length,
      toolsUsed: choice.message.tool_calls?.length || 0,
      tokensUsed: promptTokens + completionTokens,
      userTier: tokenAllocation.userTier
    });

    // Add budget warnings if needed
    if (tokenAllocation.budgetWarning) {
      finalResponse += `\n\n💡 ${tokenAllocation.budgetWarning}`;
    }

    devLog('Final response being sent:', { finalResponse, length: finalResponse.length });

    // Get updated usage summary for response
    const usageSummary = await tokenBudgetManager.getUsageSummary(profile);

    return new Response(JSON.stringify({
      reply: finalResponse,
      finalResponse: finalResponse, // For frontend compatibility
      session_id,
      profile_summary: {
        interactions: profile.interactions,
        trustScore: profile.trustScore,
        servicesUsed: profile.freeServicesUsed.length + profile.premiumServicesUsed.length,
        tier: usageSummary.tier,
        usage: {
          daily: usageSummary.dailyUsage,
          session: usageSummary.sessionUsage
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    devLog('Chat error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process your request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper Functions

/**
 * Extract service name from user message
 */
function extractServiceName(message: string): string | undefined {
  const lowerMessage = message.toLowerCase();
  
  const serviceKeywords = {
    'analyze_website': ['analyz', 'website', 'audit', 'scan', 'check website'],
    'get_seo_tips': ['seo', 'search engine', 'optimization', 'ranking'],
    'check_domain_status': ['domain', 'availability', 'whois'],
    'get_industry_insights': ['industry', 'benchmark', 'competitor', 'market'],
    'competitor_analysis': ['competitor', 'competition', 'rival'],
    'market_intelligence': ['market', 'intelligence', 'research', 'trends']
  };

  for (const [serviceName, keywords] of Object.entries(serviceKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return serviceName;
    }
  }

  return undefined;
}

/**
 * Classify user intent from message
 */
function classifyUserIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
    return 'discovery';
  }
  if (lowerMessage.includes('analyz') || lowerMessage.includes('check')) {
    return 'analysis';
  }
  if (lowerMessage.includes('improve') || lowerMessage.includes('optimize')) {
    return 'optimization';
  }
  if (lowerMessage.includes('business') || lowerMessage.includes('revenue')) {
    return 'business_growth';
  }
  
  return 'general';
}

// Service Execution Functions

/**
 * Execute website analysis with access control
 */
async function executeWebsiteAnalysis(url: string, sessionId: string, kv: any, profile: any, profileManager: ProfileManager, serviceArchitecture: any) {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Check service access using the passed serviceArchitecture
    const accessCheck = serviceArchitecture.checkAccess('analyze_website', profile);
    
    if (!accessCheck.allowed) {
      // Track attempted premium service
      await profileManager.trackServiceUsage(profile, 'analyze_website', 'premium', false);
      
      return {
        status: 'access_denied',
        message: accessCheck.message,
        suggested_action: accessCheck.suggestedAction,
        url: normalizedUrl
      };
    }

    // Execute the analysis
    const result = await serviceOrchestrator.executeUserService(
      'advanced_web_analysis',
      { url: normalizedUrl },
      { session_id: sessionId, kv }
    );

    // Track successful premium service usage
    await profileManager.trackServiceUsage(profile, 'analyze_website', 'premium', true);

    return result;
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
}

/**
 * Execute show available services - returns pure service data
 */
async function executeShowServices(profile: any, profileManager: ProfileManager, serviceArchitecture: any): Promise<any> {
  // Get all user-facing services (no tier restrictions)
  const allServices = serviceArchitecture.getUserFacingServices();
  
  if (allServices.length === 0) {
    return {
      available_services: [],
      total_services: 0,
      categories: []
    };
  }

  // Track interaction
  await profileManager.trackServiceUsage(profile, 'show_available_services', 'free', true);

  const categories = Array.from(new Set(allServices.map((s: any) => s.businessCategory)))
    .filter((cat): cat is string => typeof cat === 'string' && cat.trim() !== '');

  return {
    available_services: allServices.map((s: any) => ({
      name: s.displayName,
      description: s.description,
      category: s.businessCategory,
      type: s.serviceType,
      delivery: s.deliveryMethod,
      status: 'available'
    })),
    total_services: allServices.length,
    categories: categories,
    service_catalog: 'MannyKnows'
  };
}

/**
 * Execute SEO tips (free service) - returns pure data
 */
async function executeGetSeoTips(topic: string, profile: any, profileManager: ProfileManager) {
  // Track free service usage
  await profileManager.trackServiceUsage(profile, 'get_seo_tips', 'free', true);

  const tips: Record<string, string[]> = {
    'general': [
      'Focus on high-quality, relevant content',
      'Optimize your page titles and meta descriptions',
      'Improve your website loading speed',
      'Use schema markup for better search visibility',
      'Build quality backlinks from relevant websites'
    ],
    'content': [
      'Write for your audience, not just search engines',
      'Use header tags (H1, H2, H3) to structure content',
      'Include relevant keywords naturally in your content',
      'Create comprehensive, in-depth content',
      'Update old content regularly'
    ],
    'technical': [
      'Ensure your website is mobile-friendly',
      'Create an XML sitemap',
      'Fix broken links and 404 errors',
      'Optimize images with alt text',
      'Improve Core Web Vitals scores'
    ]
  };

  const relevantTips = tips[topic] || tips['general'];

  return {
    topic,
    tips: relevantTips,
    tip_count: relevantTips.length,
    category: topic
  };
}

/**
 * Execute domain check (free service)
 */
async function executeCheckDomain(domain: string, profile: any, profileManager: ProfileManager) {
  // Track free service usage
  await profileManager.trackServiceUsage(profile, 'check_domain_status', 'free', true);

  // Simple domain check (in real implementation, you'd use a domain API)
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  return {
    domain: cleanDomain,
    status: 'available', // Simulated
    extensions: ['.com', '.net', '.org'],
    message: `Domain check completed for ${cleanDomain}`
  };
}

/**
 * Execute industry insights (engaged user service)
 */
async function executeIndustryInsights(industry: string, profile: any, profileManager: ProfileManager, serviceArchitecture: any) {
  // Check access using passed serviceArchitecture
  const accessCheck = serviceArchitecture.checkAccess('get_industry_insights', profile);
  
  if (!accessCheck.allowed) {
    return {
      status: 'access_denied',
      message: accessCheck.message
    };
  }

  // Track service usage
  await profileManager.trackServiceUsage(profile, 'get_industry_insights', 'free', true);

  const insights = {
    industry,
    averageConversionRate: '2.5%',
    topTrafficSources: ['Search', 'Social Media', 'Direct'],
    keyMetrics: {
      pageSpeed: '3.2s average',
      mobileOptimization: '78% of sites',
      sslAdoption: '95%'
    },
    message: `Industry insights for ${industry} sector`
  };

  return insights;
}

/**
 * Execute calendar scheduling for discovery call - returns pure data
 */
async function executeScheduleCall(functionArgs: any, profile: any, profileManager: ProfileManager, environment?: any, kv?: any) {
  // Validate required arguments
  const { name, email, phone, preferred_times, timezone, project_details } = functionArgs;
  
  if (!name || !email) {
    return {
      status: 'validation_error',
      error: 'Name and email are required for scheduling',
      required_fields: ['name', 'email']
    };
  }
  
  // Track scheduling usage
  await profileManager.trackServiceUsage(profile, 'schedule_discovery_call', 'free', true);

  try {
    const ownerEmail = getEnvVal('OWNER_EMAIL', environment) || 'manny@mannyknows.com';
    const trackingId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    // Simple 15-min slot selection (best-effort): pick earliest 15-min slot mentioned or default to flexible
    function pickProposedTime(text?: string, tz?: string): string {
      if (!text) return 'Flexible (we will confirm by email)';
      const lower = text.toLowerCase();
      const now = new Date();
      let day = new Date(now);
      if (/tomorrow/.test(lower)) {
        day = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }
      // Find first explicit time like 2 or 2:30 pm
      const m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s?(am|pm)\b/i);
      let hours = 14, minutes = 0, ampm = 'pm';
      if (m) {
        hours = parseInt(m[1], 10);
        minutes = m[2] ? parseInt(m[2], 10) : 0;
        ampm = (m[3] || '').toLowerCase();
      }
      // Normalize to 24h
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      // Snap minutes to nearest 15 down
      minutes = Math.floor(minutes / 15) * 15;
      const scheduled = new Date(day);
      scheduled.setHours(hours, minutes, 0, 0);
      const tzLabel = tz || 'America/Los_Angeles';
      // Return readable text; not shifting timezone server-side to avoid Intl dependency issues
      return `${scheduled.toDateString()} ${('0'+((hours%12)||12)).slice(-2)}:${('0'+minutes).slice(-2)} ${ampm.toUpperCase()} (${tzLabel})`;
    }
    const proposedTime = pickProposedTime(preferred_times, timezone);

  // Optional Jitsi link generation
  const jitsiAuto = (getEnvVal('JITSI_AUTO_LINK', environment) ?? 'true').toString().toLowerCase() !== 'false';
  const jitsiBase = (getEnvVal('JITSI_BASE_URL', environment) || 'https://meet.jit.si').replace(/\/$/, '');
  const roomName = `mk-${trackingId}`;
  const meetingLink = jitsiAuto ? `${jitsiBase}/${encodeURIComponent(roomName)}` : undefined;

    // Persist request in KV for backoffice processing
    if (kv && typeof kv.put === 'function') {
      const record = {
        id: trackingId,
        type: 'discovery_call_request',
        createdAt: Date.now(),
        name,
        email,
        phone,
        preferred_times: preferred_times || 'flexible',
        timezone: timezone || 'America/Los_Angeles',
        project_details: project_details || '',
        proposed_time: proposedTime,
  meeting_link: meetingLink,
        status: 'pending'
      };
      try {
        await kv.put(`meetreq:${trackingId}`, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 14 }); // 14 days
      } catch (e) {
        devLog('KV put failed for meeting request', e as any);
      }
    }

    // Send notification email via Resend (best-effort)
    try {
      const resendKey = getEnvVal('RESEND_API_KEY', environment);
      const resendFrom = getEnvVal('RESEND_FROM', environment) || 'MannyKnows <onboarding@resend.dev>';
      if (resendKey) {
        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [ownerEmail],
            subject: 'New Discovery Call Request',
    text: `New discovery call request\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nPreferred: ${preferred_times || 'flexible'}\nTimezone: ${timezone || 'America/Los_Angeles'}\nProposed time: ${proposedTime}${meetingLink ? `\nMeeting link: ${meetingLink}` : ''}\nDetails: ${project_details || ''}\nTracking: ${trackingId}`
          })
        });
        try {
          const emailText = await emailResp.text();
          devLog('Resend email response:', { status: emailResp.status, body: emailText });
        } catch {}
      }
    } catch (e) {
      devLog('Resend email failed for meeting request', e as any);
    }

    return {
      status: 'meeting_requested',
      tracking_id: trackingId,
  contact: { name, email },
  proposed_time: proposedTime,
  meeting_link: meetingLink
    };
  } catch (error) {
    errorLog('Meeting request error:', error);
    return {
      status: 'error',
      fallback_email: getEnvVal('OWNER_EMAIL', environment) || 'manny@mannyknows.com'
    };
  }
}
