import type { APIRoute } from 'astro';
import { createPromptBuilder } from '../../lib/chatbot/promptBuilder';
import { createDatabaseAdapter } from '../../lib/database/chatbotDatabase';
import { ChatbotTools } from '../../lib/chatbot/tools';
import { LeadScoringService } from '../../lib/chatbot/leadScoring';
import { errorLog, devLog } from '../../utils/debug';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if API key is available
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      errorLog('OPENAI_API_KEY environment variable is not set');
      return new Response(JSON.stringify({
        reply: 'Chat service is currently unavailable. Please try again later.'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      errorLog('JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        reply: 'Invalid request format. Please try again.'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const { message, model, session_id = 'default', conversation_history = [] } = body;
    devLog('Chat API request:', { message, model, session_id, history_length: conversation_history.length });
    devLog('API Key exists:', !!apiKey);

    // Initialize chatbot system
    const promptBuilder = createPromptBuilder();
    const guardrails = promptBuilder.getGuardrails();
    
    // ENFORCE MESSAGE LIMITS - Critical for cost control
    const maxMessages = guardrails.response_limits.max_conversation_length;
    const currentMessageCount = conversation_history.filter((msg: any) => msg.role === 'user').length + 1; // +1 for current message
    
    if (currentMessageCount > maxMessages) {
      devLog(`Message limit exceeded: ${currentMessageCount}/${maxMessages} for session ${session_id}`);
      return new Response(JSON.stringify({
        reply: `I appreciate your interest! After ${maxMessages} messages, I need to connect you with Manny for a proper consultation. Please call us at (555) 123-4567 or email hello@mannyknows.com to continue.`,
        message_limit_reached: true,
        session_id: session_id
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    const envConfig = promptBuilder.getEnvironmentConfig();
    
    devLog('Environment config:', envConfig);
    devLog('Debug logging enabled:', envConfig.debug_logging);
    
    // Check if chatbot is enabled
    if (!envConfig.chatbot_enabled) {
      return new Response(JSON.stringify({
        reply: "Thank you for reaching out! Our AI assistant is currently offline. Please contact us directly at (555) 123-4567 or email hello@mannyknows.com for assistance.",
        chatbot_offline: true,
        session_id: session_id
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Initialize database if enabled
    let chatbotTools: ChatbotTools | null = null;
    if (envConfig.database_enabled) {
      // Try to get KV storage from Cloudflare Workers runtime
      let storage = null;
      try {
        // @ts-ignore - Access Cloudflare runtime if available
        storage = globalThis.CHATBOT_KV || globalThis.KV || null;
      } catch (e) {
        // KV not available, fallback to memory storage
      }
      
      const dbAdapter = createDatabaseAdapter(envConfig.environment, storage);
      chatbotTools = new ChatbotTools(dbAdapter, session_id);
    }

    // Build system prompt
    const systemPrompt = promptBuilder.buildSystemPrompt();

    // Build conversation messages with history
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      // Add conversation history
      ...conversation_history,
      // Add current user message
      {
        role: 'user',
        content: message
      }
    ];

    // Simple OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || envConfig.model,
        messages: messages,
        max_completion_tokens: envConfig.max_tokens,
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      // Handle different model response formats
      const choice = data.choices[0];
      let replyContent = '';
      
      // Standard models use message.content
      if (choice.message && choice.message.content) {
        replyContent = choice.message.content;
      }
      // o1-series and reasoning models might have different structure
      else if (choice.message && choice.message.reasoning) {
        replyContent = choice.message.reasoning;
      }
      // Fallback: try to get any text content
      else if (choice.text) {
        replyContent = choice.text;
      }
      
      // Only validate if we have content
      if (replyContent) {
        // Validate response against guardrails
        const validation = promptBuilder.validateResponse(replyContent);
        if (!validation.valid && envConfig.environment === 'production') {
          replyContent = 'I apologize, but I need to rephrase my response. Could you please ask your question again?';
        }
      }

      // Process tools if enabled and chatbotTools available
      let toolResults: any[] = [];
      if (envConfig.tools_enabled && chatbotTools) {
        // Enhanced lead capture - extract data from full conversation
        const shouldCapture = chatbotTools.shouldCaptureLead(message) || 
                             conversation_history.length >= 5; // Auto-capture after 5 messages
        
        if (shouldCapture) {
          // Extract lead info from entire conversation
          const extractedLead = chatbotTools.extractLeadInfo(
            conversation_history.map((msg: any) => msg.content).join(' ') + ' ' + message
          );
          
          // Enhanced lead data extraction from conversation
          const enhancedLead = LeadScoringService.extractLeadFromConversation(conversation_history);
          
          // Merge extracted data
          const leadData = {
            ...extractedLead,
            ...enhancedLead,
            name: extractedLead.name || 'Anonymous',
            email: extractedLead.email || '',
            project_type: enhancedLead.project_type || 'General inquiry',
            source: 'website_chat'
          };
          
          // Only save if we have meaningful data
          if (leadData.email || leadData.phone || leadData.name !== 'Anonymous') {
            const leadResult = await chatbotTools.saveLead(leadData, conversation_history);
            toolResults.push(leadResult);
          }
        }

        // Log the interaction with enhanced data
        await chatbotTools.logInteraction({
          event_type: 'chat_message',
          event_data: { 
            message, 
            reply: replyContent, 
            model: model || envConfig.model,
            conversation_length: conversation_history.length + 1,
            user_message_count: conversation_history.filter((msg: any) => msg.role === 'user').length + 1
          }
        });
      }
      
      return new Response(JSON.stringify({
        reply: replyContent || 'I received your message but had trouble generating a response. Please try again.',
        tool_results: toolResults,
        session_id: session_id
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Handle OpenAI API errors
    if (data.error) {
      return new Response(JSON.stringify({
        reply: 'I apologize, but I encountered an issue with the AI service. Please try again.'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({
      reply: 'I apologize, but I encountered an issue. Please try again.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      reply: 'Sorry, I encountered an error. Please try again later.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
