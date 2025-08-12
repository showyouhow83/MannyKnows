import type { APIRoute } from 'astro';
import { serviceOrchestrator } from '../../lib/services/serviceOrchestrator';
import { getServiceBranding } from '../../lib/services/components/userServices';
import { devLog } from '../../utils/debug';

export const prerender = false;

// Define the tools/functions available to the AI
const AVAILABLE_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "analyze_website",
      description: "Analyze a website for SEO, performance, security, and opportunities",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The website URL to analyze (e.g., 'mannyknows.com' or 'https://mannyknows.com')"
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
      description: "Show the user what AI services are available",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "request_email_verification",
      description: "Request email verification from user before running premium services",
      parameters: {
        type: "object", 
        properties: {
          email: {
            type: "string",
            description: "User's email address to verify"
          }
        },
        required: ["email"]
      }
    }
  }
];

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { message, session_id = crypto.randomUUID(), conversation_history = [] } = body;
    
    devLog('Function-calling chat request:', { message, session_id, history_length: conversation_history.length });

    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
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

    // Prepare OpenAI request with function calling
    const openaiMessages = [
      {
        role: "system" as const,
        content: `You are an AI business intelligence assistant. Your job is to EXECUTE TOOLS and provide ACTUAL RESULTS, not just talk about what you could do.

CRITICAL RULES:
1. When user asks for website analysis, IMMEDIATELY call analyze_website function
2. When user provides just a domain/URL, call analyze_website function  
3. Give SHORT responses (2-3 sentences max) and let the tools do the work
4. Format results with markdown for readability
5. Focus on ACTIONABLE insights, not lengthy explanations

Available services:
- 🔍 AI Web Intelligence Scan (website analysis)
- 🎯 Market Intelligence Report (coming soon)
- 📈 Digital Presence Audit (coming soon)
- 🚀 Growth Acceleration Analysis (coming soon)`
      },
      ...conversation_history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user" as const,
        content: message
      }
    ];

    // Call OpenAI with function calling
    const apiKey = import.meta.env.OPENAI_API_KEY;
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: envConfig.model,
        messages: openaiMessages,
        tools: AVAILABLE_TOOLS,
        tool_choice: "auto",
        max_tokens: envConfig.max_tokens,
        temperature: envConfig.temperature
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      devLog('OpenAI API error:', `${openaiResponse.status} - ${error}`);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${error}`);
    }

    const data = await openaiResponse.json();
    devLog('OpenAI function-calling response:', data);

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

        switch (functionName) {
          case 'analyze_website':
            toolResult = await executeWebsiteAnalysis(functionArgs.url, session_id, kv);
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
          max_tokens: 300, // Keep responses short
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
    const sessionData = kv ? await kv.get(`session:${sessionId}`) : null;
    const isVerified = sessionData ? JSON.parse(sessionData).verified : false;
    
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

function getAvailableServicesInfo() {
  const services = serviceOrchestrator.getAvailableUserServices();
  return {
    available_services: services,
    message: 'Here are the AI services currently available'
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
