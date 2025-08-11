import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const email = url.searchParams.get('email');
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV storage not available' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (email) {
      // Get opportunities for specific user
      const opportunities = await kv.get(`opportunities:${email}`);
      const userData = await kv.get(`user:${email}`);
      
      if (opportunities) {
        const oppData = JSON.parse(opportunities);
        const user = userData ? JSON.parse(userData) : null;
        
        return new Response(JSON.stringify({
          success: true,
          email,
          opportunities: oppData,
          userProfile: user ? {
            verified: user.verified,
            createdAt: user.createdAt,
            leadScore: user.leadScore,
            customerProfile: user.customerProfile
          } : null
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          success: true,
          email,
          opportunities: { opportunities: [], totalEstimatedValue: 0 },
          userProfile: null
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Get all opportunities (for sales dashboard)
      const keys = await kv.list({ prefix: 'opportunities:' });
      const allOpportunities = [];
      
      for (const key of keys.keys) {
        try {
          const oppData = await kv.get(key.name);
          if (oppData) {
            allOpportunities.push(JSON.parse(oppData));
          }
        } catch (error) {
          console.error('Error parsing opportunity data:', error);
        }
      }
      
      // Sort by total estimated value
      allOpportunities.sort((a, b) => (b.totalEstimatedValue || 0) - (a.totalEstimatedValue || 0));
      
      return new Response(JSON.stringify({
        success: true,
        totalLeads: allOpportunities.length,
        totalValue: allOpportunities.reduce((sum, opp) => sum + (opp.totalEstimatedValue || 0), 0),
        opportunities: allOpportunities.slice(0, 50) // Limit to 50 for performance
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Business opportunities retrieval error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to retrieve business opportunities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
