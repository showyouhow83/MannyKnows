import type { APIRoute } from 'astro';

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

    const { message, model } = body;
    console.log('Chat API request:', { message, model });
    console.log('API Key exists:', !!apiKey);

    // Simple OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4.1-nano',
        messages: [
          {
            role: 'system',
            content: 'You are a business development consultant for MannyKnows, a digital agency specializing in web development, marketing, branding, and business consulting. Your goal is to understand client needs, provide helpful solutions, generate qualified leads, and guide clients toward scheduling consultations or requesting quotes. Be professional, consultative, and focus on understanding their business challenges and goals. Always offer to schedule a consultation or provide a quote when appropriate.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_completion_tokens: 500,
      }),
    });

    console.log('OpenAI response status:', response.status);
    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0]) {
      // Handle different model response formats
      const choice = data.choices[0];
      let replyContent = '';
      
      console.log('Message object:', JSON.stringify(choice.message, null, 2));
      
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
      
      console.log('Final reply content:', replyContent);
      
      return new Response(JSON.stringify({
        reply: replyContent || 'I received your message but had trouble generating a response. Please try again.'
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
