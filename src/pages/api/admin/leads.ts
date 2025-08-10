import type { APIRoute } from 'astro';
import { getLeads, deleteLead, clearAllLeads } from '../chat';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Basic auth check - ONLY use secret, NO fallback for security
    // Try both standard env and Cloudflare runtime context
    const adminPassword = import.meta.env.ADMIN_PASSWORD || (locals as any).runtime?.env?.ADMIN_PASSWORD;
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!adminPassword) {
      return new Response(JSON.stringify({ error: 'Admin access disabled - no password configured' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const format = url.searchParams.get('format');
    
    // Determine environment for storage selection
    const environment = import.meta.env.MODE === 'development' ? 'development' : 'production';

    // Get leads from our storage
    const leads = await getLeads(environment, kv);
    
    // Handle export requests
    if (action === 'export') {
      if (format === 'csv') {
        // Export as CSV for Google Sheets
        const csvHeader = 'Timestamp,Email,Phone,Name,Message,Session ID\n';
        const csvData = leads.map(lead => 
          `"${lead.timestamp}","${lead.email || ''}","${lead.phone || ''}","${lead.name || ''}","${(lead.message || '').replace(/"/g, '""')}","${lead.sessionId || ''}"`
        ).join('\n');
        
        return new Response(csvHeader + csvData, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="leads-export.csv"'
          }
        });
      }
      
      if (format === 'json') {
        // Export as JSON
        return new Response(JSON.stringify(leads, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="leads-export.json"'
          }
        });
      }
      
      if (format === 'sheets') {
        // Format for Google Sheets API (Apps Script compatible)
        const sheetsData = leads.map(lead => [
          lead.timestamp,
          lead.email || '',
          lead.phone || '', 
          lead.name || '',
          lead.message || '',
          lead.sessionId || ''
        ]);
        
        return new Response(JSON.stringify({
          range: 'A1',
          majorDimension: 'ROWS',
          values: [
            ['Timestamp', 'Email', 'Phone', 'Name', 'Message', 'Session ID'],
            ...sheetsData
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Calculate stats
    const today = new Date().toDateString();
    const todayLeads = leads.filter(lead => 
      new Date(lead.timestamp).toDateString() === today
    );

    const stats = {
      total: leads.length,
      today: todayLeads.length,
      pending: leads.length, // All leads are "pending" in this simple system
      conversations: leads.length
    };

    return new Response(JSON.stringify({
      success: true,
      stats,
      leads: leads.slice(-20).reverse() // Return last 20 leads, newest first
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
};

// Handle DELETE requests for individual lead deletion
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const adminPassword = import.meta.env.ADMIN_PASSWORD || (locals as any).runtime?.env?.ADMIN_PASSWORD;
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!adminPassword) {
      return new Response(JSON.stringify({ error: 'Admin access disabled' }), { status: 503 });
    }
    
    const authHeader = request.headers.get('authorization');
    let isAuthenticated = false;
    if (authHeader) {
      const base64 = authHeader.replace('Basic ', '');
      const decoded = atob(base64);
      const [username, password] = decoded.split(':');
      isAuthenticated = password === adminPassword;
    }

    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { leadId, action } = await request.json();
    const environment = import.meta.env.MODE === 'development' ? 'development' : 'production';
    
    if (action === 'clear_all') {
      await clearAllLeads(environment, kv);
      return new Response(JSON.stringify({ success: true, message: 'All leads cleared' }));
    }
    
    if (leadId) {
      const success = await deleteLead(leadId, environment, kv);
      return new Response(JSON.stringify({ 
        success, 
        message: success ? 'Lead deleted' : 'Lead not found' 
      }));
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });

  } catch (error) {
    console.error('Delete API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
