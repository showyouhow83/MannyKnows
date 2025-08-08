import type { APIRoute } from 'astro';
import { createPromptBuilder } from '../../lib/chatbot/promptBuilder';
import { createDatabaseAdapter } from '../../lib/database/chatbotDatabase';
import { ChatbotTools } from '../../lib/chatbot/tools';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if API key is available
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
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
      console.error('JSON parsing error:', parseError);
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
    console.log('Chat API request:', { message, model, session_id, history_length: conversation_history.length });
    console.log('API Key exists:', !!apiKey);

    // Initialize chatbot system
    const promptBuilder = createPromptBuilder();
    const envConfig = promptBuilder.getEnvironmentConfig();
    
    console.log('Environment config:', envConfig);
    console.log('Debug logging enabled:', envConfig.debug_logging);
    
    // Initialize database if enabled
    let chatbotTools: ChatbotTools | null = null;
    if (envConfig.database_enabled) {
      const dbAdapter = createDatabaseAdapter(envConfig.environment);
      chatbotTools = new ChatbotTools(dbAdapter, session_id);
    }

    // Build system prompt
    const systemPrompt = promptBuilder.buildSystemPrompt();
    
    console.log('System prompt built:', systemPrompt.length, 'characters');

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

    console.log('Sending', messages.length, 'messages to OpenAI');

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

    console.log('OpenAI response status:', response.status);
    const data = await response.json();
    if (envConfig.debug_logging) {
      console.log('OpenAI response:', JSON.stringify(data, null, 2));
    }
    
    if (data.choices && data.choices[0]) {
      // Handle different model response formats
      const choice = data.choices[0];
      let replyContent = '';
      
      if (envConfig.debug_logging) {
        console.log('Message object:', JSON.stringify(choice.message, null, 2));
      }
      
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
      
      if (envConfig.debug_logging) {
        console.log('Final reply content length:', replyContent?.length || 0);
        console.log('Final reply content preview:', replyContent?.substring(0, 100) + '...');
      }
      
      // Only validate if we have content
      if (replyContent) {
        // Validate response against guardrails
        const validation = promptBuilder.validateResponse(replyContent);
        if (!validation.valid && envConfig.environment === 'production') {
          console.warn('Response validation failed:', validation.issues);
          replyContent = 'I apologize, but I need to rephrase my response. Could you please ask your question again?';
        } else if (!validation.valid && envConfig.debug_logging) {
          console.warn('Response validation issues (allowing in dev):', validation.issues);
        }
      }

      // Process tools if enabled and chatbotTools available
      let toolResults: any[] = [];
      if (envConfig.tools_enabled && chatbotTools) {
        // Check if the conversation indicates lead information
        if (chatbotTools.shouldCaptureLead(message)) {
          const leadInfo = chatbotTools.extractLeadInfo(message);
          if (leadInfo.email || leadInfo.phone) {
            // Auto-save lead if we have sufficient information
            const leadResult = await chatbotTools.saveLead({
              name: leadInfo.name || 'Anonymous',
              email: leadInfo.email || '',
              phone: leadInfo.phone,
              company: leadInfo.company,
              interest: 'General inquiry from chat',
              budget_range: leadInfo.budget_range,
              source: 'website_chat'
            });
            toolResults.push(leadResult);
          }
        }

        // Log the interaction
        await chatbotTools.logInteraction({
          event_type: 'chat_message',
          event_data: { message, reply: replyContent, model: model || envConfig.model }
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
      console.error('OpenAI API error:', data.error);
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
    console.error('Chat API error:', error);
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
