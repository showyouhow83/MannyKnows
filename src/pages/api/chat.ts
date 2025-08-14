import type { APIRoute } from 'astro';
import { serviceOrchestrator } from '../../lib/services/serviceOrchestrator';
import { devLog } from '../../utils/debug';
import { ProfileManager } from '../../lib/user/ProfileManager';
import { createServiceArchitecture } from '../../lib/services/ServiceArchitecture';
import TokenBudgetManager from '../../lib/services/TokenBudgetManager';
import { createPromptBuilder } from '../../lib/chatbot/promptBuilder';
import GoogleCalendarService from '../../lib/services/GoogleCalendarService';

export const prerender = false;

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
        required: ["name", "email", "project_details"]
      }
    }
  };

  return [...serviceTools, calendarTool];
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { message, session_id = crypto.randomUUID(), conversation_history = [] } = body;
    
    devLog('Architecture 2 chat request:', { message, session_id, history_length: conversation_history.length });

    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    const environment = (locals as any).runtime?.env; // Pass full environment for KV access
    
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
    const config = await import('../../config/chatbot/environments.json');
    const envConfig = config.default[envMode as keyof typeof config.default];

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

    // Call OpenAI with function calling
    const apiKey = import.meta.env.OPENAI_API_KEY;
    
    const requestBody = {
      model: envConfig.model,
      messages: openaiMessages,
      max_completion_tokens: tokenAllocation.maxTokensForResponse,
      tools: AVAILABLE_TOOLS,
      tool_choice: "auto" as const
    };

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      devLog('OpenAI API error:', `${openaiResponse.status} - ${error}`);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${error}`);
    }

    const data = await openaiResponse.json();
    devLog('OpenAI response:', data);
    
    const choice = data.choices[0];
    let finalResponse = '';

    // Handle function calls
    if (choice.message.tool_calls) {
      const toolResults = [];

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
            toolResult = await executeScheduleCall(functionArgs, profile, profileManager);
            break;
            
          default:
            toolResult = {
              error: `Function ${functionName} not implemented`,
              message: `Sorry, ${functionName} is not available yet.`
            };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          result: toolResult
        });
      }

      // Let AI craft natural response using tool data
      const toolMessages = toolResults.map(result => ({
        role: "tool" as const,
        content: JSON.stringify(result.result),
        tool_call_id: result.tool_call_id
      }));

      const followUpRequestBody = {
        model: envConfig.model,
        messages: [
          ...openaiMessages,
          { role: "assistant" as const, content: choice.message.content || "", tool_calls: choice.message.tool_calls },
          ...toolMessages
        ],
        max_completion_tokens: tokenAllocation.maxTokensForResponse,
        temperature: 0.7
      };

      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(followUpRequestBody)
      });

      if (!followUpResponse.ok) {
        throw new Error(`OpenAI API error: ${followUpResponse.status}`);
      }

      const followUpData = await followUpResponse.json();
      finalResponse = followUpData.choices[0].message.content || "I apologize, but I'm having trouble processing that request right now.";
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
async function executeScheduleCall(functionArgs: any, profile: any, profileManager: ProfileManager) {
  const { name, email, phone, preferred_times, timezone, project_details } = functionArgs;
  
  // Track calendar scheduling usage
  await profileManager.trackServiceUsage(profile, 'schedule_discovery_call', 'free', true);

  try {
    // Initialize Google Calendar service
    const googleAccessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
    const ownerEmail = process.env.OWNER_EMAIL || 'manny@mannyknows.com';
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    if (!googleAccessToken) {
      return {
        status: 'configuration_error',
        calendar_available: false,
        contact_info: { name, email, phone, preferred_times, project_details },
        fallback_email: 'manny@mannyknows.com'
      };
    }

    const calendarService = new GoogleCalendarService(googleAccessToken, calendarId, ownerEmail);
    
    // Get available time slots first
    const availableSlots = await calendarService.getFormattedAvailability(timezone || 'America/Los_Angeles');
    
    if (availableSlots.length === 0) {
      return {
        status: 'no_availability',
        available_times: [],
        contact_info: { name, email, phone, preferred_times, project_details },
        fallback_email: 'manny@mannyknows.com'
      };
    }

    // If user provided preferred times, try to schedule
    if (preferred_times && preferred_times.toLowerCase() !== 'flexible') {
      const schedulingResult = await calendarService.createDiscoveryCall(
        name,
        email,
        preferred_times,
        timezone || 'America/Los_Angeles',
        project_details
      );

      if (schedulingResult.success) {
        return {
          status: 'meeting_scheduled',
          scheduled: true,
          meeting_details: {
            meeting_link: schedulingResult.meetingLink,
            calendar_link: schedulingResult.calendarLink,
            event_id: schedulingResult.eventId,
            attendee_email: email,
            contact_name: name
          }
        };
      } else {
        return {
          status: 'scheduling_conflict',
          scheduled: false,
          requested_time: preferred_times,
          available_times: availableSlots.slice(0, 3),
          contact_info: { name, email, phone, project_details }
        };
      }
    } else {
      // User is flexible, show available times
      return {
        status: 'showing_availability',
        available_times: availableSlots.slice(0, 5),
        contact_info: { name, email, phone, project_details },
        timezone: timezone || 'America/Los_Angeles'
      };
    }

  } catch (error) {
    console.error('Calendar scheduling error:', error);
    
    return {
      status: 'error',
      error_type: 'calendar_error',
      contact_info: { name, email, phone, preferred_times, project_details },
      fallback_email: 'manny@mannyknows.com',
      error_message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
