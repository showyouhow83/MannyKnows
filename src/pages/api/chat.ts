import type { APIRoute } from 'astro';
import { serviceOrchestrator } from '../../lib/services/serviceOrchestrator';
import { getServiceBranding, getAvailableUserServices } from '../../lib/services/components/userServices';
import { devLog } from '../../utils/debug';
import { PromptBuilder } from '../../lib/chatbot/promptBuilder';

export const prerender = false;

// Ultra-simplified tools for debugging
const AVAILABLE_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "analyze_website",
      description: "Analyze a website",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Website URL"
          }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "show_available_services",
      description: "Show available MK services to the user",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { message, session_id = crypto.randomUUID(), conversation_history = [], mode = 'analysis' } = body;
    
    devLog('Function-calling chat request:', { message, session_id, history_length: conversation_history.length, mode });

    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    // Get environment config and build personality-driven prompt
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

    // Build streamlined prompt for function calling mode
    const isAnalysisRequest = message.toLowerCase().includes('analyz') || 
                             message.toLowerCase().includes('website') ||
                             message.toLowerCase().includes('scan') ||
                             message.toLowerCase().includes('audit');

    // Email detection helper
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const hasEmail = emailPattern.test(message);

    let systemPrompt = '';
    let toolChoice: "auto" | "required" = "auto";
    
    if (isAnalysisRequest && mode === 'analysis') {
      // Analysis mode - implement email verification workflow first
      if (message.toLowerCase().includes('verify email:')) {
        // Handle email verification
        systemPrompt = `You are Sally from MK. The user provided an email for verification. Confirm the email is valid and proceed with next steps. If email is valid, respond with verification success and ask for their website URL.`;
        toolChoice = "auto";
      } else if (hasEmail && (message.includes('http') || message.includes('www.'))) {
        // Both email and URL provided - proceed with analysis
        systemPrompt = `You are Sally from MK. The user provided both email and website URL. Proceed with analyzing the website using the analyze_website function.`;
        toolChoice = "required";
      } else if (hasEmail && !message.toLowerCase().includes('verify email:')) {
        // Email detected in message - verify it and then ask for URL
        systemPrompt = `You are Sally from MK. The user provided an email address. Extract and verify the email, then ask for their website URL to proceed with the analysis. Say something like: "Perfect! I have your email [EMAIL]. Now, what's your website URL so I can run the comprehensive AI analysis?"`;
        toolChoice = "auto";
      } else if (message.includes('http') || message.includes('www.')) {
        // URL provided, but need to check if email was verified first
        systemPrompt = `You are Sally from MK. Before analyzing any website, you need to collect and verify the user's email address for lead generation. Ask: "I'd be happy to analyze your website! First, I need your email address to send you the detailed analysis report. What's your email address?"`;
        toolChoice = "auto";
      } else {
        // Initial analysis request - ask for email first, not URL
        systemPrompt = `You are Sally from MK. The user wants website analysis. Before asking for their website URL, you need to collect their email address first for lead generation. Ask: "I'd be happy to help with a comprehensive AI analysis of your website! First, I'll need your email address to send you the detailed report. What's your email address?"`;
        toolChoice = "auto";
      }
    } else if (mode === 'chat') {
      // Chat mode - no tools, conversational Sally
      systemPrompt = `You are Sally, an MK sales specialist. Be helpful and professional. Available services: AI Web Intelligence Scan, Market Intelligence Report, Digital Presence Optimizer, Growth Acceleration Analysis. 

For website analysis, recommend: "I'd suggest using our AI Web Intelligence Scan tool for a comprehensive analysis." 

Answer questions about MK services, availability, and help schedule calls. Be conversational but focused on MK offerings.`;
    } else {
      // Get available services from catalog (modal mode with tools)
      const availableServices = getAvailableUserServices();
      const servicesList = availableServices.map(s => `${s.displayName}`).join(', ');
      
      // Professional MK-focused system prompt
      systemPrompt = `You are an MK sales specialist. Available services: ${servicesList}. Be professional and direct. Only offer MK services.`;
    }

    // Prepare OpenAI request with function calling
    const openaiMessages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: isAnalysisRequest ? `analyze website: ${message}` : message
      }
    ];

    devLog('System prompt length:', systemPrompt.length);
    devLog('Tool choice:', toolChoice);
    devLog('Sending messages to OpenAI:', openaiMessages);

    // Call OpenAI with function calling
    const apiKey = import.meta.env.OPENAI_API_KEY;
    
    // Prepare request body - only include tools for analysis/modal modes
    const requestBody: any = {
      model: envConfig.model,
      messages: openaiMessages,
      max_completion_tokens: envConfig.max_tokens,
      temperature: envConfig.temperature
    };

    // Only include tools for non-chat modes
    if (mode !== 'chat') {
      requestBody.tools = AVAILABLE_TOOLS;
      requestBody.tool_choice = toolChoice;
    }

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
    devLog('OpenAI function-calling response:', data);
    
    const choice = data.choices[0];
    devLog('Choice message:', choice?.message);
    devLog('Tool calls:', choice?.message?.tool_calls);
    
    let finalResponse = '';

    // Handle function calls
    if (choice.message.tool_calls) {
      const toolResults = [];

      for (const toolCall of choice.message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        devLog('Executing function:', `${functionName} with ${JSON.stringify(functionArgs)}`);

        let toolResult = null;

        switch (functionName) {
          case 'analyze_website':
            toolResult = await executeWebsiteAnalysis(functionArgs.url, session_id, kv);
            break;
            
          case 'product_analysis':
            toolResult = await executeProductAnalysis(functionArgs.url, session_id, kv);
            break;
            
          case 'seo_audit':
            toolResult = await executeSEOAudit(functionArgs.url, session_id, kv);
            break;
            
          case 'conversion_optimization':
            toolResult = await executeConversionOptimization(functionArgs.url, session_id, kv);
            break;
            
          case 'show_available_services':
            toolResult = getAvailableServicesInfo();
            break;
            
          case 'request_email_verification':
            toolResult = await handleEmailVerification(functionArgs.email, session_id, kv);
            break;
            
          default:
            toolResult = { error: `Unknown function: ${functionName}` };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          result: toolResult
        });
      }

      // Send tool results back to OpenAI for final response
      const followUpMessages = [
        ...openaiMessages,
        choice.message,
        ...toolResults.map(result => ({
          role: "tool" as const,
          tool_call_id: result.tool_call_id,
          content: JSON.stringify(result.result)
        }))
      ];

      const finalOpenaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: envConfig.model,
          messages: followUpMessages,
          max_completion_tokens: 300, // Keep responses short
          temperature: envConfig.temperature
        }),
      });

      const finalData = await finalOpenaiResponse.json();
      finalResponse = finalData.choices[0].message.content;

    } else {
      // No function calls, just regular response
      finalResponse = choice.message.content;
    }

    return new Response(JSON.stringify({
      reply: finalResponse,
      session_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Function-calling chat error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      reply: "I'm having technical difficulties. Please try again in a moment."
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Function implementations
async function executeWebsiteAnalysis(url: string, sessionId: string, kv: any) {
  try {
    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Check if user needs verification first
    // const sessionData = kv ? await kv.get(`session:${sessionId}`) : null;
    // const isVerified = sessionData ? JSON.parse(sessionData).verified : false;
    
    // Temporarily disable verification for testing
    const isVerified = true;
    
    if (!isVerified) {
      return {
        status: 'verification_required',
        message: 'Email verification required before analysis',
        url: normalizedUrl
      };
    }

    // Execute the actual analysis using our service orchestrator
    const result = await serviceOrchestrator.executeUserService(
      'advanced_web_analysis',
      { url: normalizedUrl },
      { session_id: sessionId, kv }
    );

    devLog('Service orchestrator result:', result);

    if (result.success) {
      return {
        status: 'success',
        url: normalizedUrl,
        analysis: result.data,
        summary: formatAnalysisResults(result.data)
      };
    } else {
      return {
        status: 'error',
        message: result.errors?.join(', ') || 'Analysis failed'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generate available services dynamically from User Services
function getAvailableServicesInfo() {
  const userServices = getAvailableUserServices();
  
  const servicesText = userServices.map(service => 
    `**${service.displayName}** ${service.icon}\n` +
    `${service.shortDescription}\n` +
    `⏱️ ${service.estimatedTime}`
  ).join('\n\n');

  return {
    success: true,
    services: userServices,
    formatted_text: `Here are our available AI services:\n\n${servicesText}\n\nWhich service interests you most?`
  };
}

async function handleEmailVerification(email: string, sessionId: string, kv: any) {
  // Implementation for email verification
  return {
    status: 'verification_sent',
    email: email,
    message: 'Verification email sent'
  };
}

function formatAnalysisResults(data: any) {
  if (!data.analysis) return 'Analysis data not available';
  
  const analysis = data.analysis;
  return `## 📊 Website Analysis Results

**Overall Score:** ${analysis.overallScore}/100

### 🔍 Key Metrics
- **SEO Score:** ${analysis.scores.seo}/100
- **Performance:** ${analysis.scores.performance}/100  
- **Security:** ${analysis.scores.security}/100

### ⚡ Load Performance
- **Response Time:** ${analysis.metrics.responseTime}ms
- **Page Size:** ${analysis.metrics.pageSizeKB}KB

### 🎯 Top Opportunities
${analysis.issues.slice(0, 3).map((issue: string) => `- ${issue}`).join('\n')}

Ready to dive deeper into any specific area?`;
}

// Progressive Analysis Functions
async function executeProductAnalysis(url: string, session_id: string, kv: any) {
  try {
    devLog('Executing product analysis for:', url);
    
    // Simulated product analysis results
    const productAnalysis = {
      analysis: {
        productDescriptions: {
          count: 12,
          avgLength: 45,
          aiOptimizationScore: 35,
          issues: [
            "Generic product descriptions lack emotional triggers",
            "Missing SEO keywords in 70% of descriptions", 
            "No personalization or customer-specific language",
            "Competitive descriptions outperform by 40%"
          ]
        },
        opportunities: [
          "AI-powered description generator could increase conversions by 25%",
          "Personalized product recommendations based on user behavior",
          "Dynamic pricing optimization using market intelligence"
        ]
      }
    };
    
    return {
      success: true,
      data: productAnalysis,
      analysis_type: 'product_analysis'
    };
  } catch (error) {
    return { success: false, error: 'Product analysis failed' };
  }
}

async function executeSEOAudit(url: string, session_id: string, kv: any) {
  try {
    devLog('Executing SEO audit for:', url);
    
    const seoAudit = {
      analysis: {
        seoGaps: {
          missingKeywords: 23,
          contentGaps: 8,
          technicalIssues: 5,
          competitorAdvantages: [
            "Competitors rank for 40% more profitable keywords",
            "Missing schema markup reducing rich snippet potential",
            "Page speed affecting mobile rankings",
            "Internal linking structure needs optimization"
          ]
        },
        opportunities: [
          "AI SEO agent could identify and target 50+ new profitable keywords",
          "Automated content optimization for featured snippets",
          "Real-time competitor tracking and gap analysis"
        ]
      }
    };
    
    return {
      success: true,
      data: seoAudit,
      analysis_type: 'seo_audit'
    };
  } catch (error) {
    return { success: false, error: 'SEO audit failed' };
  }
}

async function executeConversionOptimization(url: string, session_id: string, kv: any) {
  try {
    devLog('Executing conversion optimization for:', url);
    
    const conversionAnalysis = {
      analysis: {
        conversionIssues: {
          currentRate: 2.3,
          potentialRate: 4.8,
          revenueGap: "$12,400/month",
          criticalIssues: [
            "Call-to-action buttons have low visibility",
            "Checkout process has 60% abandonment rate",
            "No urgency triggers or social proof",
            "Mobile experience causes 40% drop-offs"
          ]
        },
        opportunities: [
          "AI-powered A/B testing could optimize conversion funnels automatically",
          "Behavioral tracking agent to identify drop-off points",
          "Dynamic pricing and offer optimization based on user intent"
        ]
      }
    };
    
    return {
      success: true,
      data: conversionAnalysis,
      analysis_type: 'conversion_optimization'
    };
  } catch (error) {
    return { success: false, error: 'Conversion optimization failed' };
  }
}

// Development storage (in-memory) for leads
const devLeads: Array<{
  name?: string;
  email?: string;
  phone?: string;
  message: string;
  timestamp: string;
  sessionId: string;
}> = [];

// Storage functions that adapt based on environment
async function saveLeadToStorage(lead: any, environment: string, kv?: any) {
  if (environment === 'production' && kv) {
    // Save to KV storage
    const leadId = crypto.randomUUID();
    const leadData = { ...lead, id: leadId, created_at: new Date().toISOString() };
    await kv.put(`lead:${leadId}`, JSON.stringify(leadData));
    devLog('Lead saved to KV storage:', leadId);
  } else {
    // Save to memory for development
    devLeads.push(lead);
    devLog('Lead saved to memory storage');
  }
}

async function getLeadsFromStorage(environment: string, kv?: any) {
  if (environment === 'production' && kv) {
    // Get from KV storage
    try {
      const keys = await kv.list({ prefix: 'lead:' });
      const leads = [];
      for (const key of keys.keys) {
        const leadData = await kv.get(key.name);
        if (leadData) {
          leads.push(JSON.parse(leadData));
        }
      }
      return leads.sort((a, b) => new Date(b.created_at || b.timestamp).getTime() - new Date(a.created_at || a.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching leads from KV:', error);
      return [];
    }
  } else {
    // Return from memory for development
    return devLeads;
  }
}

// Export leads for admin access
export const getLeads = async (environment?: string, kv?: any) => {
  const env = environment || (import.meta.env.MODE === 'development' ? 'development' : 'production');
  return await getLeadsFromStorage(env, kv);
};

// Delete a specific lead by timestamp or index
export const deleteLead = async (leadId: string, environment?: string, kv?: any): Promise<boolean> => {
  const env = environment || (import.meta.env.MODE === 'development' ? 'development' : 'production');
  
  if (env === 'production' && kv) {
    // Delete from KV storage
    try {
      const leads = await getLeadsFromStorage(env, kv);
      const lead = leads.find((l: any) => l.timestamp === leadId || l.id === leadId);
      if (lead) {
        await kv.delete(`lead:${lead.id || leadId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting lead from KV:', error);
      return false;
    }
  } else {
    // Delete from memory for development
    const initialLength = devLeads.length;
    
    // Try to find by timestamp first
    let index = devLeads.findIndex((lead: any) => lead.timestamp === leadId);
    
    // If not found by timestamp, try by array index
    if (index === -1) {
      const numericId = parseInt(leadId);
      if (!isNaN(numericId) && numericId >= 0 && numericId < devLeads.length) {
        index = numericId;
      }
    }
    
    if (index !== -1) {
      devLeads.splice(index, 1);
      return true;
    }
    
    return false;
  }
};

// Clear all leads
export const clearAllLeads = async (environment?: string, kv?: any): Promise<void> => {
  const env = environment || (import.meta.env.MODE === 'development' ? 'development' : 'production');
  
  if (env === 'production' && kv) {
    // Clear KV storage
    try {
      const keys = await kv.list({ prefix: 'lead:' });
      for (const key of keys.keys) {
        await kv.delete(key.name);
      }
      devLog('All leads cleared from KV storage');
    } catch (error) {
      console.error('Error clearing leads from KV:', error);
    }
  } else {
    // Clear memory for development
    devLeads.length = 0;
    devLog('All leads cleared from memory storage');
  }
};
