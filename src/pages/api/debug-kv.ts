import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const sessionId = url.searchParams.get('session_id') || 'test-session';
    
    const chatbotKv = (locals as any).runtime?.env?.CHATBOT_KV;
    const profilesKv = (locals as any).runtime?.env?.PROFILES;
    const sessionsKv = (locals as any).runtime?.env?.SESSIONS;
    const servicesKv = (locals as any).runtime?.env?.KV_SERVICES;
    const productsKv = (locals as any).runtime?.env?.KV_PRODUCTS;
    
    const results = {
      kvAccessible: {
        chatbot: !!chatbotKv,
        profiles: !!profilesKv,
        sessions: !!sessionsKv,
        services: !!servicesKv,
        products: !!productsKv
      },
      data: {
        sessions: {} as Record<string, any>,
        profiles: {} as Record<string, any>,
        services: {} as any,
        products: {} as any
      }
    };
    
    // Check for session data in SESSIONS KV
    if (sessionsKv) {
      try {
        const sessionData = await sessionsKv.get(`session:${sessionId}`);
        results.data.sessions[`session:${sessionId}`] = sessionData ? JSON.parse(sessionData) : null;
      } catch (e: any) {
        results.data.sessions[`session:${sessionId}`] = `Error: ${e.message}`;
      }
    }
    
    // Check for profile data in PROFILES KV (if we have a session)
    if (profilesKv && results.data.sessions[`session:${sessionId}`]) {
      try {
        const session = results.data.sessions[`session:${sessionId}`];
        if (session && session.profileId) {
          const profileData = await profilesKv.get(`profile:${session.profileId}`);
          results.data.profiles[`profile:${session.profileId}`] = profileData ? JSON.parse(profileData) : null;
        }
      } catch (e: any) {
        results.data.profiles.error = `Error: ${e.message}`;
      }
    }
    
    // Check services data
    if (servicesKv) {
      try {
        const servicesList = await servicesKv.list({ prefix: 'service:' });
        results.data.services = {
          count: servicesList.keys.length,
          keys: servicesList.keys.map((k: any) => k.name)
        };
      } catch (e: any) {
        results.data.services = { error: e.message };
      }
    }
    
    // Check products data
    if (productsKv) {
      try {
        const productsList = await productsKv.list({ prefix: 'product:' });
        results.data.products = {
          count: productsList.keys.length,
          keys: productsList.keys.map((k: any) => k.name)
        };
      } catch (e: any) {
        results.data.products = { error: e.message };
      }
    }
    
    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
