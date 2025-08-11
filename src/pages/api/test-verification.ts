import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email, websiteUrl } = await request.json();
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV storage not available' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Testing verification for:', { email, websiteUrl });

    // Test the verify-user endpoint
    try {
      const verifyResponse = await fetch(`${new URL(request.url).origin}/api/verify-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, websiteUrl })
      });
      
      const verifyData = await verifyResponse.json();
      
      return new Response(JSON.stringify({
        success: true,
        verificationResponse: {
          status: verifyResponse.status,
          data: verifyData
        }
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to call verify-user endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Test verification error:', error);
    return new Response(JSON.stringify({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
