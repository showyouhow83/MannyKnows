import type { APIRoute } from 'astro';
import { createDatabaseAdapter } from '../../../lib/database/chatbotDatabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    // Basic auth check
    const adminPassword = import.meta.env.ADMIN_PASSWORD || 'admin123';
    const authHeader = request.headers.get('authorization');

    let isAuthenticated = false;
    if (authHeader) {
      const base64 = authHeader.replace('Basic ', '');
      const decoded = atob(base64);
      const [username, password] = decoded.split(':');
      isAuthenticated = password === adminPassword;
    }

    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        }
      });
    }

    // Get storage (same logic as chat API)
    let storage = null;
    try {
      // @ts-ignore - Access Cloudflare runtime if available
      storage = globalThis.CHATBOT_KV || globalThis.KV || null;
    } catch (e) {
      console.log('No Cloudflare KV available, using memory storage');
    }

    const dbAdapter = createDatabaseAdapter('production', storage);

    // Since we're using KV, we need to implement a list function
    // For now, return mock data or implement a leads list in KV
    const mockStats = {
      total: 0,
      today: 0,
      pending: 0,
      conversations: 0
    };

    const mockLeads: any[] = [];

    // TODO: Implement proper lead listing from KV
    // This would require storing a leads index in KV
    
    return new Response(JSON.stringify({
      stats: mockStats,
      leads: mockLeads
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Admin leads API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
