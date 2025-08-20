import type { APIRoute } from 'astro';
import { serviceOrchestrator } from '../../lib/services/serviceOrchestrator';
import { devLog, errorLog } from '../../utils/debug';
import { ProfileManager } from '../../lib/user/ProfileManager';
import { createServiceArchitecture } from '../../lib/services/ServiceArchitecture';
import TokenBudgetManager from '../../lib/services/TokenBudgetManager';
import { createPromptBuilder } from '../../lib/chatbot/promptBuilder';
import envConfigs from '../../config/chatbot/environments.json';
import RateLimiter from '../../lib/security/rateLimiter';
import DomainValidator from '../../lib/security/domainValidator';
import CSRFProtection from '../../lib/security/csrfProtection';
import InputValidator from '../../lib/security/inputValidator';
import EncryptedKV from '../../lib/security/kvEncryption';
import DynamicServiceExecutor from '../../lib/services/dynamicServiceExecutor';
// Google Calendar removed. Scheduling now uses KV storage + email notification via Resend API.

export const prerender = false;

// CORS headers for security - will be updated per request
const getCorsHeaders = (request: Request) => {
  const domainValidator = new DomainValidator();
  const origin = request.headers.get('origin');
  return domainValidator.getCORSHeaders(origin || undefined);
};

// Handle CORS preflight requests
export const OPTIONS: APIRoute = async ({ request }) => {
  const corsHeaders = getCorsHeaders(request);
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
};

// Provide CSRF tokens for authenticated sessions
export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const corsHeaders = getCorsHeaders(request);
    
    // Get session_id from query params
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: 'Missing session_id parameter'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    if (!kv) {
      return new Response(JSON.stringify({
        error: 'Service temporarily unavailable'
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const csrfProtection = new CSRFProtection(kv);
    const token = await csrfProtection.getSessionToken(sessionId);

    return new Response(JSON.stringify({
      csrf_token: token,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      client_script: csrfProtection.generateClientScript(token)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-CSRF-Protection': 'enabled',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('CSRF token generation error:', error);
    const corsHeaders = getCorsHeaders(request);
    
    return new Response(JSON.stringify({
      error: 'Failed to generate CSRF token',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

// Basic rate limiting helper
async function checkRateLimit(kv: any, clientIP: string): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 30; // 30 requests per minute
  
  const key = `rate_limit:${clientIP}:${Math.floor(now / windowMs)}`;
  const current = await kv.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  // Increment counter
  await kv.put(key, (count + 1).toString(), { expirationTtl: Math.ceil(windowMs / 1000) });
  return { allowed: true, remaining: maxRequests - count - 1 };
}

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

  // Add meeting lookup tool
  const meetingLookupTool = {
    type: "function",
    function: {
      name: "lookup_existing_meetings",
      description: "Look up existing meetings for a user by their email address. Use when user asks about their scheduled calls, meetings, or appointments.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "User's email address to search for existing meetings" }
        },
        required: ["email"]
      }
    }
  };

  // Add meeting management tool
  const meetingManagementTool = {
    type: "function",
    function: {
      name: "manage_meeting",
      description: "Cancel or request changes to an existing meeting. Use when user wants to cancel, reschedule, or modify their appointment. Users can provide either their email address or meeting tracking ID.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["cancel", "reschedule"], description: "Action to perform on the meeting" },
          email: { type: "string", description: "User's email address associated with the meeting (preferred method)" },
          tracking_id: { type: "string", description: "Meeting reference/tracking ID (alternative to email)" },
          new_preferred_times: { type: "string", description: "New preferred times (only for reschedule action)" },
          reason: { type: "string", description: "Reason for cancellation or change (optional)" }
        },
        required: ["action"]
      }
    }
  };

  return [...serviceTools, calendarTool, meetingLookupTool, meetingManagementTool];
}

/**
 * Check if conversation contains all info needed for discovery call booking
 */
function checkIfShouldForceBooking(messages: Array<{role: string, content: string}>): boolean {
  const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
  
  // Check for discovery call interest
  const hasDiscoveryCallIntent = /(?:schedule|book|discovery call|meeting|appointment)/i.test(conversationText);
  
  // Check for meeting lookup intent
  const hasMeetingLookupIntent = /(?:do I have|my meeting|my appointment|scheduled call|existing meeting|upcoming call|meeting.*coming up)/i.test(conversationText);
  
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
      // Capture a wider window around the first time/day mention to avoid truncation
      const start = Math.max(0, idx - 120);
      const end = Math.min(lastUserText.length, idx + 240);
      const window = lastUserText.substring(start, end).replace(/\n+/g, ' ').trim();
      // Cap length to a reasonable size for storage/email
      preferred_times = window.length > 400 ? window.slice(0, 397) + '...' : window;
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
    // Domain validation first (security layer)
    const domainValidator = new DomainValidator();
    const domainValidation = domainValidator.validateRequest(request);
    
    if (!domainValidation.valid) {
      const kv = (locals as any).runtime?.env?.CHATBOT_KV;
      await domainValidator.logSecurityViolation(domainValidation, request, kv);
      return domainValidator.createDomainErrorResponse(domainValidation);
    }

    const body = await request.json();
    
    // Input validation (security layer)
    const validation = InputValidator.validate(body, InputValidator.schemas.chatMessage);
    if (!validation.valid) {
      devLog('Input validation failed:', validation.errors);
      const corsHeaders = getCorsHeaders(request);
      
      return new Response(JSON.stringify({
        error: 'Invalid input data',
        details: validation.errors,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Use sanitized data
    const { message, session_id = crypto.randomUUID(), conversation_history = [] } = validation.sanitizedData!;
    
    devLog('Architecture 2 chat request:', { message, session_id, history_length: conversation_history.length });

    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    const profilesKv = (locals as any).runtime?.env?.PROFILES; // Dedicated KV for profiles
    const sessionsKv = (locals as any).runtime?.env?.SESSIONS; // Dedicated KV for sessions
    const schedulerKv = (locals as any).runtime?.env?.SCHEDULER_KV || kv;
    
    // Initialize encrypted KV wrapper for sensitive data
    let encryptedKv: EncryptedKV | null = null;
    if (kv) {
      const encryptionKey = (locals as any).runtime?.env?.KV_ENCRYPTION_KEY || 'default-dev-key-change-in-production';
      encryptedKv = new EncryptedKV(kv, encryptionKey);
    }
    
    // CSRF Protection (security layer)
    if (kv) {
      const csrfProtection = new CSRFProtection(kv);
      const csrfValidation = await csrfProtection.validateRequestWithBody(request, session_id, body);
      
      if (!csrfValidation.valid) {
        devLog('CSRF validation failed:', csrfValidation.reason);
        return csrfProtection.createCSRFErrorResponse(csrfValidation.reason || 'CSRF validation failed');
      }
    }
    
    // Enhanced rate limiting with user tiers
    if (kv) {
      const rateLimiter = new RateLimiter(kv);
      const clientIP = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For') || 
                      'unknown';
      
      // Quick profile check for rate limiting (we'll get full profile later)
      const quickProfileData = await (sessionsKv || kv).get(`session:${session_id}`);
      const quickProfile = quickProfileData ? JSON.parse(quickProfileData) : null;
      const userTier = RateLimiter.getUserTier(quickProfile, null);
      
      const rateLimit = await rateLimiter.checkRateLimit(clientIP, userTier);
      
      if (!rateLimit.allowed) {
        return rateLimiter.createRateLimitResponse(rateLimit);
      }
      
      // Store rate limit info for response headers
      (locals as any).rateLimit = rateLimit;
      (locals as any).rateLimiter = rateLimiter;
    }

    let environment = (locals as any).runtime?.env as any; // Pass full environment for KV access
    if (!environment || Object.keys(environment).length === 0) {
      const devVars = await readDevVarsFromFile();
      if (devVars) environment = devVars;
    }
    
    // Initialize service architecture with KV environment
    const serviceArchitecture = createServiceArchitecture(environment);
    await serviceArchitecture.ensureAllLoaded(); // Load both services and products
    
    // Initialize managers
    const profileManager = new ProfileManager(profilesKv || kv, sessionsKv || kv); // Use separate KV instances
    
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
          finalResponseText = `I had trouble sending the request. Please email ${result.fallback_email || 'verified@mailroute.mannyknows.com'} and we’ll confirm manually.`;
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

        // Dynamic service execution based on Google Sheets configuration
        const dynamicExecutor = new DynamicServiceExecutor();
        
        // Find the service in serviceArchitecture
        const service = serviceArchitecture.getUserFacingServices().find((s: any) => s.functionName === functionName);
        
        if (service) {
          // Execute service dynamically
          toolResult = await dynamicExecutor.executeService(
            service,
            functionArgs,
            { session_id, kv: encryptedKv || kv, email: profile?.email }
          );
        } else {
          // Legacy hardcoded functions (gradually migrate these to Google Sheets)
          switch (functionName) {
            case 'show_available_services':
              toolResult = await executeShowServices(profile, profileManager, serviceArchitecture);
              break;

            case 'schedule_discovery_call':
              toolResult = await executeScheduleCall(functionArgs, profile, profileManager, environment, schedulerKv);
              break;

            case 'lookup_existing_meetings':
              toolResult = await executeLookupExistingMeetings(functionArgs, profile, profileManager, environment, schedulerKv);
              break;

            case 'manage_meeting':
              toolResult = await executeManageMeeting(functionArgs, profile, profileManager, environment, schedulerKv);
              break;
              
            default:
              toolResult = {
                error: `Function ${functionName} not implemented`,
                message: `Sorry, ${functionName} is not available yet. Please add it to Google Sheets or implement as legacy function.`
              };
          }
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

    // Get CORS headers for this request
    const corsHeaders = getCorsHeaders(request);

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
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
        // Add rate limit headers if available
        ...((locals as any).rateLimit && (locals as any).rateLimiter ? 
          (locals as any).rateLimiter.getRateLimitHeaders((locals as any).rateLimit) : {})
      }
    });

  } catch (error) {
    devLog('Chat error:', error);
    
    // Get CORS headers for error response
    const corsHeaders = getCorsHeaders(request);
    
    return new Response(JSON.stringify({
      error: 'Failed to process your request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
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
      'analyze_website',
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
  
  // Check for existing meetings to prevent duplicates
  if (kv && typeof kv.list === 'function') {
    try {
      const existingMeetings = [];
      const allMeetings = await kv.list({ prefix: 'meetreq:' });
      
      for (const key of allMeetings.keys) {
        try {
          const meetingData = await kv.get(key.name);
          if (meetingData) {
            const meeting = JSON.parse(meetingData);
            if (meeting.email && meeting.email.toLowerCase() === email.toLowerCase() && 
                meeting.status === 'pending') {
              existingMeetings.push(meeting);
            }
          }
        } catch (e) {
          // Skip invalid meetings
          continue;
        }
      }
      
      if (existingMeetings.length > 0) {
        const latestMeeting = existingMeetings[0];
        return {
          status: 'duplicate_meeting',
          error: 'You already have a pending discovery call request',
          existing_meeting: {
            id: latestMeeting.id,
            proposed_time: latestMeeting.proposed_time,
            meeting_link: latestMeeting.meeting_link
          },
          message: `You already have a discovery call scheduled for ${latestMeeting.proposed_time}. If you need to make changes, please let me know and I can help you reschedule or cancel it.`
        };
      }
    } catch (e) {
      // Continue with scheduling if duplicate check fails
      devLog('Duplicate check failed, proceeding with scheduling', e as any);
    }
  }
  
  // Track scheduling usage
  await profileManager.trackServiceUsage(profile, 'schedule_discovery_call', 'free', true);

  try {
  const ownerEmail = getEnvVal('OWNER_EMAIL', environment) || 'verified@mailroute.mannyknows.com';
  const ownerTimezone = getEnvVal('OWNER_TIMEZONE', environment) || 'America/New_York';
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
      const tzLabel = tz || ownerTimezone;
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
        timezone: timezone || ownerTimezone,
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
        const subject = `New Discovery Call Request — ${name}${proposedTime ? ` (${proposedTime})` : ''}`;
        const textBody = `New discovery call request\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nPreferred: ${preferred_times || 'flexible'}\nTimezone: ${timezone || ownerTimezone}\nProposed time: ${proposedTime}${meetingLink ? `\nMeeting link: ${meetingLink}` : ''}\nDetails: ${project_details || ''}\nTracking: ${trackingId}`;

        const htmlBody = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Discovery Call Request</title>
  <style>
    body{margin:0;padding:0;background:#fafafa;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6}
    .outer{background:linear-gradient(to-t,rgba(244,244,245,0.5) 0%,rgba(250,250,250,0.3) 50%,rgba(244,244,245,0.2) 100%);min-height:100vh;padding:40px 20px}
    .container{max-width:680px;margin:0 auto}
    .card{background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03)}
    .header{padding:32px 40px;background:linear-gradient(135deg,#10d1ff 0%,#ff4faa 100%);position:relative}
    .brand{font-weight:700;font-size:28px;color:#ffffff;letter-spacing:-0.025em}
    .subtitle{color:rgba(255,255,255,0.95);font-size:16px;margin-top:6px;font-weight:500}
    .content{padding:40px 40px 32px;background:#ffffff}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px}
    .field{background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:20px;transition:all 0.3s ease}
    .field:hover{background:#f4f4f5;border-color:#e4e4e7}
    .label{display:block;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;font-weight:600}
    .value{font-size:16px;color:#18181b;line-height:1.5;word-break:break-word;font-weight:500}
    .full-width{grid-column:1/-1}
    .details-field{background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:24px;margin-bottom:24px}
    .btn-container{text-align:center;margin:32px 0}
    .btn{display:inline-block;background:linear-gradient(135deg,#10d1ff,#ff4faa);color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;box-shadow:0 4px 14px rgba(16,209,255,0.25);transition:all 0.3s ease;letter-spacing:-0.025em}
    .btn:hover{transform:translateY(-1px);box-shadow:0 8px 25px rgba(16,209,255,0.3)}
    .meta{background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;padding:16px;text-align:center;margin-top:24px}
    .tracking{color:#71717a;font-size:13px;font-family:ui-monospace,SFMono-Regular,'SF Mono',Consolas,'Liberation Mono',Menlo,monospace;font-weight:500}
    .footer{text-align:center;margin-top:32px;padding:24px;color:#71717a;font-size:13px;background:#f4f4f5;border-radius:12px;border:1px solid #e4e4e7;font-weight:500}
    .highlight{background:linear-gradient(135deg,#10d1ff,#ff4faa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700}
    @media (max-width:640px){
      .outer{padding:20px 16px}
      .content{padding:24px 24px 20px}
      .grid{grid-template-columns:1fr;gap:16px}
      .brand{font-size:24px}
      .btn{padding:14px 24px;font-size:15px}
      .header{padding:24px 24px}
    }
  </style>
  <!--[if mso]><style>.btn{font-family:Arial, sans-serif !important;background:#10d1ff !important}</style><![endif]-->
</head>
<body>
  <div class="outer">
    <div class="container">
      <div class="card">
        <div class="header">
          <div class="brand">MK</div>
          <div class="subtitle">Discovery Call Request</div>
        </div>
        <div class="content">
          <div class="grid">
            <div class="field">
              <span class="label">Name</span>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <span class="label">Email</span>
              <div class="value">${email}</div>
            </div>
            <div class="field">
              <span class="label">Phone</span>
              <div class="value">${phone || 'Not provided'}</div>
            </div>
            <div class="field">
              <span class="label">Timezone</span>
              <div class="value">${timezone || ownerTimezone}</div>
            </div>
            <div class="field full-width">
              <span class="label">Preferred Time</span>
              <div class="value">${(preferred_times || 'Flexible').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
            </div>
            <div class="field full-width">
              <span class="label">Proposed Meeting Time</span>
              <div class="value">${proposedTime}</div>
            </div>
          </div>
          
          ${project_details ? `<div class="details-field full-width">
            <span class="label">Project Details</span>
            <div class="value">${project_details.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
          </div>` : ''}
          
          ${meetingLink ? `<div class="btn-container">
            <a class="btn" href="${meetingLink}" target="_blank" rel="noopener noreferrer">Join Meeting →</a>
          </div>` : ''}
          
          <div class="meta">
            <div class="tracking">Reference: ${trackingId}</div>
          </div>
        </div>
        <div class="footer">
          This notification was sent by the <span class="highlight">MannyKnows</span> AI assistant<br>
          Automated lead capture · Intelligent business operations
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [ownerEmail],
            subject: subject,
            text: textBody,
            html: htmlBody
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
      fallback_email: getEnvVal('OWNER_EMAIL', environment) || 'verified@mailroute.mannyknows.com'
    };
  }
}

/**
 * Look up existing meetings for a user by email address
 */
async function executeLookupExistingMeetings(functionArgs: any, profile: any, profileManager: ProfileManager, environment?: any, kv?: any) {
  const { email } = functionArgs;
  
  if (!email) {
    return {
      status: 'validation_error',
      error: 'Email address is required for lookup',
      required_fields: ['email']
    };
  }

  if (!kv || typeof kv.list !== 'function') {
    return {
      status: 'error',
      error: 'Meeting storage not available'
    };
  }

  try {
    // Search for meetings by email
    const meetings = [];
    const allMeetings = await kv.list({ prefix: 'meetreq:' });
    
    for (const key of allMeetings.keys) {
      try {
        const meetingData = await kv.get(key.name);
        if (meetingData) {
          const meeting = JSON.parse(meetingData);
          if (meeting.email && meeting.email.toLowerCase() === email.toLowerCase()) {
            const meetingInfo: any = {
              id: meeting.id,
              name: meeting.name,
              email: meeting.email,
              proposed_time: meeting.proposed_time,
              status: meeting.status,
              meeting_link: meeting.meeting_link,
              created_at: meeting.createdAt,
              project_details: meeting.project_details
            };

            // Include reschedule information if applicable
            if (meeting.status === 'reschedule_requested') {
              meetingInfo.reschedule_info = {
                new_preferred_times: meeting.new_preferred_times || meeting.newPreferredTimes,
                reschedule_reason: meeting.reschedule_reason || meeting.rescheduleReason,
                requested_at: meeting.reschedule_requested_at || meeting.rescheduleRequestedAt
              };
              meetingInfo.display_message = `PENDING RESCHEDULE: Originally ${meeting.proposed_time}, requested to reschedule to ${meeting.new_preferred_times || meeting.newPreferredTimes}`;
            }

            // Include cancellation info if applicable
            if (meeting.status === 'cancelled') {
              meetingInfo.cancellation_info = {
                reason: meeting.cancellation_reason || meeting.cancellationReason,
                cancelled_at: meeting.cancelled_at || meeting.cancelledAt
              };
              meetingInfo.display_message = `CANCELLED: Was scheduled for ${meeting.proposed_time}`;
            }

            meetings.push(meetingInfo);
          }
        }
      } catch (e) {
        // Skip invalid meetings
        continue;
      }
    }

    // Sort by creation date (newest first)
    meetings.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    await profileManager.trackServiceUsage(profile, 'lookup_existing_meetings', 'free', true);

    return {
      status: 'success',
      email: email,
      meetings: meetings,
      total_count: meetings.length
    };
  } catch (error) {
    errorLog('Meeting lookup error:', error);
    return {
      status: 'error',
      error: 'Failed to look up meetings'
    };
  }
}

/**
 * Manage existing meetings (cancel or reschedule)
 */
async function executeManageMeeting(functionArgs: any, profile: any, profileManager: ProfileManager, environment?: any, kv?: any) {
  const { action, email, tracking_id, new_preferred_times, reason } = functionArgs;
  
  // Accept either email or tracking_id, but prefer email for user convenience
  if (!action || (!email && !tracking_id)) {
    return {
      status: 'validation_error',
      error: 'Action and either email or tracking ID are required',
      required_fields: ['action', 'email (or tracking_id)']
    };
  }

  if (!kv || typeof kv.get !== 'function') {
    return {
      status: 'error',
      error: 'Meeting storage not available'
    };
  }

  try {
    let meeting = null;
    let meetingKey = null;

    if (email) {
      // Search for meeting by email
      // First try to list all meetings and find by email
      const meetings = await kv.list({ prefix: 'meetreq:' });
      
      for (const key of meetings.keys) {
        const meetingData = await kv.get(key.name);
        if (meetingData) {
          const parsedMeeting = JSON.parse(meetingData);
          if (parsedMeeting.email && parsedMeeting.email.toLowerCase() === email.toLowerCase()) {
            // Find the most recent non-cancelled meeting
            if (!meeting || (parsedMeeting.status !== 'cancelled' && parsedMeeting.created_at > meeting.created_at)) {
              meeting = parsedMeeting;
              meetingKey = key.name;
            }
          }
        }
      }

      if (!meeting) {
        return {
          status: 'not_found',
          error: `No active meeting found for email ${email}. Please check your email address or contact support.`
        };
      }
      } else {
        // Legacy support: Find by tracking_id
        const meetingData = await kv.get(`meetreq:${tracking_id}`);
        if (!meetingData) {
          return {
            status: 'not_found',
            error: `Meeting with ID ${tracking_id} not found`
          };
        }
        meeting = JSON.parse(meetingData);
        meetingKey = `meetreq:${tracking_id}`;
      }
    
    // Security check: Ensure meeting hasn't already been processed
    if (meeting.status === 'cancelled') {
      return {
        status: 'already_cancelled',
        error: 'This meeting has already been cancelled'
      };
    }    const resendKey = getEnvVal('RESEND_API_KEY', environment);
    const resendFrom = getEnvVal('RESEND_FROM', environment) || 'MannyKnows <noreply@mannyknows.com>';

    if (!resendKey) {
      return {
        status: 'error',
        error: 'Email verification system not available'
      };
    }

    // Generate secure verification token
    const verificationToken = crypto.randomUUID();
    const verificationExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Store pending verification action
    const pendingAction = {
      action: action,
      trackingId: meeting.id, // Use the actual meeting ID
      meetingKey: meetingKey, // Store the KV key for later lookup
      reason: reason,
      newPreferredTimes: new_preferred_times,
      requestedAt: Date.now(),
      expiresAt: verificationExpiry,
      email: meeting.email,
      name: meeting.name
    };

    await kv.put(`verify:${verificationToken}`, JSON.stringify(pendingAction), {
      expirationTtl: 86400 // 24 hours in seconds
    });

    // Send verification email
    const verificationUrl = `https://mannyknows.com/api/verify-meeting-action?token=${verificationToken}&action=${action}`;
    
    const actionText = action === 'cancel' ? 'cancellation' : 'reschedule request';
    const actionEmoji = action === 'cancel' ? '❌' : '🔄';
    
    const htmlBody = generateVerificationEmail(meeting, action, verificationUrl, reason, new_preferred_times);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [meeting.email],
        subject: `${actionEmoji} Verify your meeting ${actionText} - MannyKnows`,
        html: htmlBody
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send verification email');
    }

    await profileManager.trackServiceUsage(profile, 'manage_meeting_verification', 'free', true);

    return {
      status: 'verification_sent',
      tracking_id: meeting.id,
      action: action,
      message: `A verification email has been sent to ${meeting.email}. Please check your email and click the verification link to confirm your ${actionText}.`,
      verification_required: true,
      email_sent_to: meeting.email,
      meeting_details: {
        name: meeting.name,
        proposed_time: meeting.proposed_time,
        meeting_link: meeting.meeting_link || 'TBD'
      }
    };

  } catch (error) {
    errorLog('Meeting management error:', error);
    return {
      status: 'error',
      error: 'Failed to process meeting management request'
    };
  }
}

// Generate verification email HTML
function generateVerificationEmail(meeting: any, action: string, verificationUrl: string, reason?: string, newPreferredTimes?: string): string {
  const actionText = action === 'cancel' ? 'cancellation' : 'reschedule request';
  const actionTitle = action === 'cancel' ? 'Cancel Meeting' : 'Reschedule Meeting';
  const actionColor = action === 'cancel' ? '#ef4444' : '#f59e0b';
  const actionEmoji = action === 'cancel' ? '❌' : '🔄';

  return `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Verify Meeting ${actionTitle} - MannyKnows</title>
      <style>
        body{margin:0;padding:0;background:#fafafa;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6}
        .outer{background:linear-gradient(to-t,rgba(244,244,245,0.5) 0%,rgba(250,250,250,0.3) 50%,rgba(244,244,245,0.2) 100%);min-height:100vh;padding:40px 20px}
        .container{max-width:680px;margin:0 auto}
        .card{background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)}
        .header{padding:32px 40px;background:linear-gradient(135deg,${actionColor} 0%,${actionColor}dd 100%);color:#ffffff}
        .brand{font-weight:700;font-size:28px;letter-spacing:-0.025em}
        .subtitle{font-size:16px;margin-top:6px;font-weight:500;opacity:0.95}
        .content{padding:40px 40px 32px}
        .alert{background:#fffbeb;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:20px 0;color:#92400e}
        .meeting-details{background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin:24px 0}
        .field{margin:12px 0}
        .label{display:block;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;font-weight:600}
        .value{font-size:16px;color:#18181b;font-weight:500}
        .btn-container{text-align:center;margin:32px 0}
        .btn{display:inline-block;background:${actionColor};color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;transition:all 0.3s ease;letter-spacing:-0.025em}
        .btn:hover{opacity:0.9;transform:translateY(-1px)}
        .security-note{background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin:24px 0;color:#0c4a6e;font-size:14px}
        .footer{text-align:center;margin-top:32px;padding:24px;color:#71717a;font-size:13px;background:#f4f4f5;border-radius:12px;border:1px solid #e4e4e7;font-weight:500}
      </style>
    </head>
    <body>
      <div class="outer">
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="brand">MK</div>
              <div class="subtitle">${actionEmoji} Verify Meeting ${actionTitle}</div>
            </div>
            <div class="content">
              <div class="alert">
                <strong>Action Required:</strong> Please verify your meeting ${actionText} by clicking the button below.
              </div>
              
              <h2>Meeting Details</h2>
              <div class="meeting-details">
                <div class="field">
                  <span class="label">Meeting Reference</span>
                  <div class="value">${meeting.id}</div>
                </div>
                <div class="field">
                  <span class="label">Scheduled Time</span>
                  <div class="value">${meeting.proposed_time}</div>
                </div>
                <div class="field">
                  <span class="label">Meeting Link</span>
                  <div class="value">${meeting.meeting_link || 'TBD'}</div>
                </div>
                ${reason ? `
                  <div class="field">
                    <span class="label">Reason</span>
                    <div class="value">${reason}</div>
                  </div>
                ` : ''}
                ${newPreferredTimes ? `
                  <div class="field">
                    <span class="label">New Preferred Times</span>
                    <div class="value">${newPreferredTimes}</div>
                  </div>
                ` : ''}
              </div>
              
              <div class="btn-container">
                <a class="btn" href="${verificationUrl}" target="_blank" rel="noopener noreferrer">
                  ${actionEmoji} Verify ${actionTitle} →
                </a>
              </div>
              
              <div class="security-note">
                <strong>🔒 Security Notice:</strong> This verification link is required to prevent unauthorized changes to your meeting. 
                The link will expire in 24 hours and can only be used once.
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Click the verification button above</li>
                <li>Your ${actionText} will be processed immediately</li>
                <li>You'll receive a confirmation email</li>
                <li>Our team will be notified of the change</li>
              </ul>
              
              <p>If you didn't request this ${actionText}, please ignore this email or contact us at verified@mailroute.mannyknows.com</p>
            </div>
            <div class="footer">
              This verification email was sent by <strong>MannyKnows</strong><br>
              Secure meeting management · Professional business operations
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
