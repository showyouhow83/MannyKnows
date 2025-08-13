import type { APIRoute } from 'astro';
import { serviceOrchestrator } from '../../lib/services/serviceOrchestrator';
import { devLog } from '../../utils/debug';
import { ProfileManager } from '../../lib/user/ProfileManager';
import { serviceArchitecture } from '../../lib/services/ServiceArchitecture';
import EmailCollectionManager from '../../lib/services/EmailCollectionManager';

export const prerender = false;

// Get available tools from service architecture
const AVAILABLE_TOOLS = serviceArchitecture.getAvailableTools();

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { message, session_id = crypto.randomUUID(), conversation_history = [] } = body;
    
    devLog('Architecture 2 chat request:', { message, session_id, history_length: conversation_history.length });

    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    // Initialize managers
    const profileManager = new ProfileManager(kv);
    const emailManager = new EmailCollectionManager(profileManager);
    
    // Get or create user profile
    const profile = await profileManager.getUserProfile(session_id);
    devLog('User profile:', { id: profile.id, interactions: profile.interactions, trustScore: profile.trustScore });
    
    // Get environment config
    const environment = import.meta.env.MODE === 'development' ? 'development' : 'production';
    const config = await import('../../config/chatbot/environments.json');
    const envConfig = config.default[environment as keyof typeof config.default];

    if (!envConfig.chatbot_enabled) {
      return new Response(JSON.stringify({
        reply: "I'm currently offline for maintenance. Please contact us directly for assistance.",
        chatbot_offline: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if we should request email before processing
    const emailContext = {
      message,
      serviceName: extractServiceName(message),
      userIntent: classifyUserIntent(message)
    };

    const emailEvaluation = await emailManager.evaluateEmailRequest(profile, emailContext);
    
    if (emailEvaluation.shouldRequest && emailEvaluation.timing === 'now') {
      // Mark email as requested and return collection message
      await profileManager.markEmailRequested(profile);
      
      return new Response(JSON.stringify({
        reply: emailEvaluation.message,
        action: 'request_email',
        strategy: emailEvaluation.strategy,
        session_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build system prompt based on user profile and accessible services
    const accessibleServices = serviceArchitecture.getAccessibleServices(profile);
    const systemPrompt = buildAdaptiveSystemPrompt(profile, accessibleServices, emailEvaluation);

    // Prepare OpenAI request with function calling
    const openaiMessages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: message
      }
    ];

    devLog('System prompt length:', systemPrompt.length);
    devLog('Available tools count:', AVAILABLE_TOOLS.length);

    // Call OpenAI with function calling
    const apiKey = import.meta.env.OPENAI_API_KEY;
    
    const requestBody = {
      model: envConfig.model,
      messages: openaiMessages,
      max_completion_tokens: envConfig.max_tokens,
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
            toolResult = await executeWebsiteAnalysis(functionArgs.url, session_id, kv, profile, profileManager);
            break;
            
          case 'show_available_services':
            toolResult = await executeShowServices(profile, profileManager);
            break;
            
          case 'request_email_verification':
            toolResult = await executeEmailVerification(functionArgs.email, session_id, kv, profile, profileManager, emailManager);
            break;

          case 'get_seo_tips':
            toolResult = await executeGetSeoTips(functionArgs.topic, profile, profileManager);
            break;

          case 'check_domain_status':
            toolResult = await executeCheckDomain(functionArgs.domain, profile, profileManager);
            break;

          case 'get_industry_insights':
            toolResult = await executeIndustryInsights(functionArgs.industry, profile, profileManager);
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

      // Format the final response based on tool results
      finalResponse = formatToolResults(toolResults);
    } else {
      finalResponse = choice.message.content;
    }

    // Track interaction
    await profileManager.trackInteraction(profile, 'message_sent', {
      messageLength: message.length,
      responseLength: finalResponse.length,
      toolsUsed: choice.message.tool_calls?.length || 0
    });

    // Check if we should suggest email after service completion
    if (emailEvaluation.shouldRequest && emailEvaluation.timing === 'after_service') {
      finalResponse += `\n\n${emailEvaluation.message}`;
    }

    return new Response(JSON.stringify({
      reply: finalResponse,
      session_id,
      profile_summary: {
        interactions: profile.interactions,
        trustScore: profile.trustScore,
        servicesUsed: profile.freeServicesUsed.length + profile.premiumServicesUsed.length
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

/**
 * Build adaptive system prompt based on user profile
 */
function buildAdaptiveSystemPrompt(profile: any, accessibleServices: any[], emailEvaluation: any): string {
  const userType = profile.emailVerified ? 'verified user' : 
                  profile.interactions >= 3 ? 'engaged visitor' : 'new visitor';
  
  const servicesList = accessibleServices.map(s => s.displayName).join(', ');
  
  let prompt = `You are Sally, MK's AI business consultant. User type: ${userType} (${profile.interactions} interactions, trust: ${profile.trustScore}).

Available services: ${servicesList}

Guidelines:
- Be helpful and professional
- For new visitors: Focus on demonstrating value with free services
- For engaged visitors: Highlight premium features they can unlock
- For verified users: Provide full access to all services
- Keep responses concise (1-2 sentences when possible)`;

  if (emailEvaluation.shouldRequest && emailEvaluation.timing === 'after_service') {
    prompt += `\n- After helping, mention: "${emailEvaluation.message}"`;
  }

  return prompt;
}

// Service Execution Functions

/**
 * Execute website analysis with access control
 */
async function executeWebsiteAnalysis(url: string, sessionId: string, kv: any, profile: any, profileManager: ProfileManager) {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Check service access
    const accessCheck = serviceArchitecture.checkServiceAccess('analyze_website', profile);
    
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
 * Execute show available services
 */
async function executeShowServices(profile: any, profileManager: ProfileManager): Promise<any> {
  const allServices = serviceArchitecture.getServicesByCategory('free')
    .concat(serviceArchitecture.getServicesByCategory('premium'));
  
  const accessibleServices = serviceArchitecture.getAccessibleServices(profile);
  const lockedServices = allServices.filter(service => 
    !accessibleServices.find(accessible => accessible.name === service.name)
  );

  // Track interaction
  await profileManager.trackServiceUsage(profile, 'show_available_services', 'free', true);

  return {
    available_services: accessibleServices.map(s => ({
      name: s.displayName,
      description: s.description,
      category: s.category,
      status: 'available'
    })),
    locked_services: lockedServices.map(s => ({
      name: s.displayName,
      description: s.description,
      category: s.category,
      status: 'locked',
      requirement: s.requiresEmail ? 'Email verification required' : 'More engagement needed'
    })),
    message: `Here are your available AI services. You have access to ${accessibleServices.length} services.`
  };
}

/**
 * Execute email verification
 */
async function executeEmailVerification(email: string, sessionId: string, kv: any, profile: any, profileManager: ProfileManager, emailManager: EmailCollectionManager) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        status: 'invalid_email',
        message: 'Please provide a valid email address.'
      };
    }

    // Handle email provided
    await emailManager.handleEmailProvided(profile, email);

    // TODO: Implement actual email sending
    // For now, simulate verification
    const verificationToken = crypto.randomUUID();
    await kv.put(`verify:${verificationToken}`, JSON.stringify({
      email,
      sessionId,
      timestamp: Date.now()
    }));

    return {
      status: 'verification_sent',
      email: email,
      message: emailManager.getEmailVerificationMessage(email),
      token: verificationToken // Remove in production
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to send verification email'
    };
  }
}

/**
 * Execute SEO tips (free service)
 */
async function executeGetSeoTips(topic: string, profile: any, profileManager: ProfileManager) {
  // Track free service usage
  await profileManager.trackServiceUsage(profile, 'get_seo_tips', 'free', true);

  const tips: Record<string, string[]> = {
    'general': [
      'Focus on high-quality, relevant content',
      'Optimize your page titles and meta descriptions',
      'Improve your website loading speed'
    ],
    'content': [
      'Write for your audience, not just search engines',
      'Use header tags (H1, H2, H3) to structure content',
      'Include relevant keywords naturally in your content'
    ],
    'technical': [
      'Ensure your website is mobile-friendly',
      'Create an XML sitemap',
      'Fix broken links and 404 errors'
    ]
  };

  const relevantTips = tips[topic] || tips['general'];

  return {
    topic,
    tips: relevantTips,
    message: `Here are ${relevantTips.length} SEO tips for ${topic}:`
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
async function executeIndustryInsights(industry: string, profile: any, profileManager: ProfileManager) {
  // Check access
  const accessCheck = serviceArchitecture.checkServiceAccess('get_industry_insights', profile);
  
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
 * Format tool results into readable response
 */
function formatToolResults(toolResults: any[]): string {
  let response = '';
  
  for (const result of toolResults) {
    const data = result.result;
    
    if (data.status === 'access_denied') {
      response += data.message + '\n\n';
    } else if (data.message) {
      response += data.message + '\n\n';
    } else if (data.available_services) {
      response += `📋 Available Services:\n`;
      data.available_services.forEach((service: any) => {
        response += `• ${service.name}: ${service.description}\n`;
      });
      if (data.locked_services && data.locked_services.length > 0) {
        response += `\n🔒 Premium Services (${data.locked_services[0].requirement}):\n`;
        data.locked_services.forEach((service: any) => {
          response += `• ${service.name}: ${service.description}\n`;
        });
      }
    } else if (data.tips) {
      response += `💡 SEO Tips for ${data.topic}:\n`;
      data.tips.forEach((tip: string, index: number) => {
        response += `${index + 1}. ${tip}\n`;
      });
    } else {
      response += JSON.stringify(data, null, 2) + '\n\n';
    }
  }
  
  return response.trim();
}
