import type { APIRoute } from 'astro';
import { createPromptBuilder } from '../../lib/chatbot/promptBuilder';
import { errorLog, devLog } from '../../utils/debug';

export const prerender = false;

// Development storage (in-memory)
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
      errorLog('Error fetching leads from KV:', error);
      return [];
    }
  } else {
    // Return from memory for development
    return devLeads;
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Access KV storage from Cloudflare runtime
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    // Check if API key is available
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      errorLog('OPENAI_API_KEY environment variable is not set');
      return new Response(JSON.stringify({
        reply: 'Chat service is currently unavailable. Please try again later.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      errorLog('JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        reply: 'Invalid request format. Please try again.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { message, session_id = 'default', conversation_history = [] } = body;
    devLog('Chat API request:', { message, session_id, history_length: conversation_history.length });

    // Initialize chatbot system
    const environment = import.meta.env.MODE === 'development' ? 'development' : 'production';
    const environmentsConfig = await import('../../config/chatbot/environments.json');
    const envSettings = environmentsConfig.default[environment];
    
    const promptBuilder = createPromptBuilder(envSettings.persona, envSettings.goals, environment);
    const guardrails = promptBuilder.getGuardrails();
    
    // Enforce message limits
    const maxMessages = guardrails.response_limits.max_conversation_length;
    const currentMessageCount = conversation_history.filter((msg: any) => msg.role === 'user').length + 1;
    
    if (currentMessageCount > maxMessages) {
      devLog(`Message limit exceeded: ${currentMessageCount}/${maxMessages} for session ${session_id}`);
      return new Response(JSON.stringify({
        reply: `I appreciate your interest! After ${maxMessages} messages, I need to connect you with Manny for a proper consultation. Please call us at (555) 123-4567 or email hello@mannyknows.com to continue.`,
        message_limit_reached: true,
        session_id: session_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if chatbot is enabled
    if (!envSettings.chatbot_enabled) {
      return new Response(JSON.stringify({
        reply: "Thank you for reaching out! Our AI assistant is currently offline. Please contact us directly at (555) 123-4567 or email hello@mannyknows.com for assistance.",
        chatbot_offline: true,
        session_id: session_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build system prompt
    const systemPrompt = promptBuilder.buildSystemPrompt();

    // Check for website analysis request
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    const isAnalysisRequest = (message.toLowerCase().includes('analyze') || 
                              message.toLowerCase().includes('review') || 
                              message.toLowerCase().includes('check')) && urlMatch;
    
    if (isAnalysisRequest && urlMatch) {
      const url = urlMatch[0];
      devLog('Website analysis requested for:', url);
      
      try {
        // Call our website analysis API
        const analysisResponse = await fetch(`${new URL(request.url).origin}/api/analyze-website`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        
        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          
          const analysisReply = `I've analyzed ${url} for you! Here's what I found:

📊 **Overall Score: ${analysisResult.analysis.overallScore}/100**

🚀 **Performance**: ${analysisResult.analysis.performanceScore}/100 (${analysisResult.analysis.responseTime}ms response time)
🔍 **SEO Score**: ${analysisResult.analysis.seoScore}/100  
♿ **Accessibility**: ${analysisResult.analysis.accessibilityScore}/100

${analysisResult.analysis.issues.length > 0 ? `\n⚠️ **Issues Found:**\n${analysisResult.analysis.issues.map((issue: string) => `• ${issue}`).join('\n')}` : ''}

${analysisResult.analysis.recommendations.length > 0 ? `\n💡 **Recommendations:**\n${analysisResult.analysis.recommendations.map((rec: string) => `• ${rec}`).join('\n')}` : ''}

📄 **View full report**: ${analysisResult.reportUrl}
${analysisResult.htmlUrl ? `🌐 **Saved HTML**: ${analysisResult.htmlUrl}` : ''}

Would you like me to explain any of these findings or help you improve your website?`;

          return new Response(JSON.stringify({
            reply: analysisReply,
            session_id: session_id,
            analysis_data: analysisResult
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        devLog('Website analysis failed:', error);
        // Continue with normal chat flow if analysis fails
      }
    }

    // Build conversation messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const requestBody: any = {
      model: envSettings.model,
      messages: messages,
      temperature: envSettings.temperature,
    };
    
    // Add max_tokens for older models
    if (!envSettings.model.includes('gpt-5') && !envSettings.model.includes('o1')) {
      requestBody.max_tokens = envSettings.max_tokens;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    devLog('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      errorLog(`OpenAI API error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({
        reply: 'Sorry, I encountered an error. Please try again later.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    devLog('OpenAI API response data:', data);
    
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];
      let replyContent = choice.message?.content || '';
      
      // Validate response against guardrails
      if (replyContent) {
        const validation = promptBuilder.validateResponse(replyContent);
        if (!validation.valid && environment === 'production') {
          replyContent = 'I apologize, but I need to rephrase my response. Could you please ask your question again?';
        }
      }

      // Simple lead capture (only in production and if enabled)
      if (envSettings.lead_capture_enabled && environment === 'production') {
        const leadInfo = extractSimpleLeadInfo(message, conversation_history);
        if (leadInfo.hasContactInfo) {
          const leadData = {
            ...leadInfo,
            message,
            timestamp: new Date().toISOString(),
            sessionId: session_id
          };
          await saveLeadToStorage(leadData, environment, kv);
          devLog('Lead captured:', leadInfo);
        }
      }
      
      return new Response(JSON.stringify({
        reply: replyContent || 'I received your message but had trouble generating a response. Please try again.',
        session_id: session_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      reply: 'I apologize, but I encountered an issue. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    errorLog('Chat API error:', error);
    return new Response(JSON.stringify({
      reply: 'Sorry, I encountered an error. Please try again later.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

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
      errorLog('Error deleting lead from KV:', error);
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
    } catch (error) {
      errorLog('Error clearing leads from KV:', error);
    }
  } else {
    // Clear memory for development
    devLeads.length = 0;
  }
};

// Simple lead extraction function
function extractSimpleLeadInfo(message: string, history: any[]) {
  const fullText = [...history.map((msg: any) => msg.content), message].join(' ');
  
  const leadInfo: any = { hasContactInfo: false };
  
  // Extract email
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    leadInfo.email = emailMatch[0];
    leadInfo.hasContactInfo = true;
  }
  
  // Extract phone
  const phoneMatch = fullText.match(/(\d{3})[-\s]?(\d{3})[-\s]?(\d{4})/);
  if (phoneMatch) {
    leadInfo.phone = phoneMatch[0];
    leadInfo.hasContactInfo = true;
  }
  
  // Extract name
  const nameMatch = fullText.match(/(?:i'm|my name is|i am|call me)\s+([a-zA-Z]+)/i);
  if (nameMatch) {
    leadInfo.name = nameMatch[1];
    leadInfo.hasContactInfo = true;
  }
  
  return leadInfo;
}
