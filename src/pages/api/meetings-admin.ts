import type { APIRoute } from 'astro';
import { AdminAuthenticator } from '../../lib/security/adminAuthenticator.js';
import { AdminRateLimiter } from '../../lib/security/adminRateLimiter.js';

export const GET: APIRoute = async ({ locals, url, request }) => {
  try {
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!kv) {
      return new Response(JSON.stringify({ 
        error: 'KV storage not available' 
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Enhanced rate limiting for admin API
    const rateLimiter = new AdminRateLimiter(kv);
    const rateResult = await rateLimiter.checkAdminRateLimit(clientIP, 'admin_api');
    
    if (!rateResult.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: rateResult.reason,
        resetTime: rateResult.resetTime
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Multi-layer authentication (same as newsletter admin)
    const authenticator = new AdminAuthenticator(kv);
    
    const sessionToken = url.searchParams.get('session') || 
                        request.headers.get('Authorization')?.replace('Bearer ', '') ||
                        parseCookie(request.headers.get('cookie') || '', 'admin_session');

    let authenticated = false;
    let adminEmail = '';

    if (sessionToken) {
      const sessionResult = await authenticator.validateAdminSession(sessionToken, clientIP, userAgent);
      if (sessionResult.valid && sessionResult.session) {
        authenticated = true;
        adminEmail = sessionResult.session.email;
        await authenticator.logAdminAccess('meetings_access', adminEmail, clientIP, userAgent);
      }
    }

    // Method 2: Fallback to one-time token
    if (!authenticated) {
      const oneTimeToken = url.searchParams.get('token');
      if (oneTimeToken) {
        const tokenResult = await authenticator.validateOneTimeToken(oneTimeToken, 'api_access');
        if (tokenResult.valid && tokenResult.adminEmail) {
          authenticated = true;
          adminEmail = tokenResult.adminEmail;
          await authenticator.logAdminAccess('meetings_access_token', adminEmail, clientIP, userAgent);
        }
      }
    }

    // Method 3: Legacy admin key (less secure, for backwards compatibility)
    if (!authenticated) {
      const adminKey = url.searchParams.get('key');
      const storedAdminKey = (locals as any).runtime?.env?.ADMIN_KEY;
      
      if (adminKey && storedAdminKey && adminKey === storedAdminKey) {
        authenticated = true;
        adminEmail = 'admin@mannyknows.com';
        await authenticator.logAdminAccess('meetings_access_legacy', adminEmail, clientIP, userAgent, {
          warning: 'Using deprecated admin key authentication'
        });
      }
    }

    if (!authenticated) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid authentication credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log admin access
    console.log(`[MEETINGS-ADMIN] ${adminEmail} accessed from ${clientIP} at ${new Date().toISOString()}`);

    // Handle export requests
    const exportFormat = url.searchParams.get('export');
    if (exportFormat === 'csv') {
      return await handleMeetingsExport(kv);
    }

    // Get query parameters
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);
    const status = url.searchParams.get('status') || 'all';
    const sortBy = url.searchParams.get('sort') || 'date_desc';

    // Fetch all meeting requests
    const meetings = await fetchMeetings(kv, { limit, status, sortBy });
    
    // Get summary stats
    const stats = await getMeetingStats(kv);

    return new Response(JSON.stringify({
      success: true,
      meetings,
      stats,
      meta: {
        total: meetings.length,
        limit,
        status,
        sortBy,
        adminEmail,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[MEETINGS-ADMIN] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ locals, url, request }) => {
  try {
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!kv) {
      return new Response(JSON.stringify({ 
        error: 'KV storage not available' 
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limiting
    const rateLimiter = new AdminRateLimiter(kv);
    const rateResult = await rateLimiter.checkAdminRateLimit(clientIP, 'admin_api');
    
    if (!rateResult.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: rateResult.reason,
        resetTime: rateResult.resetTime
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Authentication (same as GET)
    const authenticator = new AdminAuthenticator(kv);
    
    const sessionToken = url.searchParams.get('session') || 
                        request.headers.get('Authorization')?.replace('Bearer ', '') ||
                        parseCookie(request.headers.get('cookie') || '', 'admin_session');

    let authenticated = false;
    let adminEmail = '';

    if (sessionToken) {
      const sessionResult = await authenticator.validateAdminSession(sessionToken, clientIP, userAgent);
      if (sessionResult.valid && sessionResult.session) {
        authenticated = true;
        adminEmail = sessionResult.session.email;
        await authenticator.logAdminAccess('meetings_update', adminEmail, clientIP, userAgent);
      }
    }

    // Method 2: Fallback to one-time token
    if (!authenticated) {
      const oneTimeToken = url.searchParams.get('token');
      if (oneTimeToken) {
        const tokenResult = await authenticator.validateOneTimeToken(oneTimeToken, 'api_access');
        if (tokenResult.valid && tokenResult.adminEmail) {
          authenticated = true;
          adminEmail = tokenResult.adminEmail;
          await authenticator.logAdminAccess('meetings_update_token', adminEmail, clientIP, userAgent);
        }
      }
    }

    // Method 3: Legacy admin key (less secure, for backwards compatibility)
    if (!authenticated) {
      const adminKey = url.searchParams.get('key');
      const storedAdminKey = (locals as any).runtime?.env?.ADMIN_KEY;
      
      if (adminKey && storedAdminKey && adminKey === storedAdminKey) {
        authenticated = true;
        adminEmail = 'admin@mannyknows.com';
        await authenticator.logAdminAccess('meetings_update_legacy', adminEmail, clientIP, userAgent, {
          warning: 'Using deprecated admin key authentication'
        });
      }
    }

    if (!authenticated) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid authentication credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await request.json();
    const { action, meetingId, status, notes } = body;

    if (!action || !meetingId) {
      return new Response(JSON.stringify({
        error: 'Bad request',
        message: 'Missing required fields: action, meetingId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle meeting updates
    const result = await updateMeeting(kv, meetingId, action, { status, notes, adminEmail });

    return new Response(JSON.stringify({
      success: true,
      result,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[MEETINGS-ADMIN] POST Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper Functions

async function fetchMeetings(kv: any, options: { limit: number, status: string, sortBy: string }) {
  const meetings = [];
  
  try {
    const allMeetings = await kv.list({ prefix: 'meetreq:' });
    
    for (const key of allMeetings.keys) {
      try {
        const meetingData = await kv.get(key.name);
        if (meetingData) {
          const meeting = JSON.parse(meetingData);
          
          // Filter by status if specified
          if (options.status !== 'all' && meeting.status !== options.status) {
            continue;
          }
          
          meetings.push({
            ...meeting,
            key: key.name
          });
        }
      } catch (e) {
        console.warn('Failed to parse meeting:', key.name, e);
        continue;
      }
    }
  } catch (error) {
    console.error('Error fetching meetings:', error);
  }

  // Sort meetings
  meetings.sort((a, b) => {
    switch (options.sortBy) {
      case 'date_desc':
        return (b.createdAt || 0) - (a.createdAt || 0);
      case 'date_asc':
        return (a.createdAt || 0) - (b.createdAt || 0);
      case 'name_asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name_desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      default:
        return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });

  // Limit results
  return meetings.slice(0, options.limit);
}

async function getMeetingStats(kv: any) {
  const stats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    recent24h: 0
  };

  try {
    const allMeetings = await kv.list({ prefix: 'meetreq:' });
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    for (const key of allMeetings.keys) {
      try {
        const meetingData = await kv.get(key.name);
        if (meetingData) {
          const meeting = JSON.parse(meetingData);
          stats.total++;
          
          // Count by status
          switch (meeting.status) {
            case 'pending':
              stats.pending++;
              break;
            case 'confirmed':
              stats.confirmed++;
              break;
            case 'completed':
              stats.completed++;
              break;
            case 'cancelled':
              stats.cancelled++;
              break;
          }
          
          // Count recent meetings
          if (meeting.createdAt && meeting.createdAt > oneDayAgo) {
            stats.recent24h++;
          }
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('Error getting meeting stats:', error);
  }

  return stats;
}

async function updateMeeting(kv: any, meetingId: string, action: string, data: any) {
  const meetingKey = `meetreq:${meetingId}`;
  
  try {
    const meetingData = await kv.get(meetingKey);
    if (!meetingData) {
      throw new Error('Meeting not found');
    }
    
    const meeting = JSON.parse(meetingData);
    
    // Update meeting based on action
    switch (action) {
      case 'update_status':
        meeting.status = data.status;
        meeting.updatedAt = Date.now();
        meeting.updatedBy = data.adminEmail;
        if (data.notes) {
          meeting.adminNotes = data.notes;
        }
        break;
        
      case 'add_notes':
        meeting.adminNotes = data.notes;
        meeting.updatedAt = Date.now();
        meeting.updatedBy = data.adminEmail;
        break;
        
      case 'delete':
        await kv.delete(meetingKey);
        return { action: 'deleted', meetingId };
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Save updated meeting
    await kv.put(meetingKey, JSON.stringify(meeting));
    
    return { action, meetingId, updated: meeting };
    
  } catch (error) {
    throw new Error(`Failed to update meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleMeetingsExport(kv: any) {
  const meetings = await fetchMeetings(kv, { limit: 1000, status: 'all', sortBy: 'date_desc' });
  
  // Create CSV content
  const headers = ['ID', 'Created', 'Name', 'Email', 'Phone', 'Status', 'Preferred Time', 'Timezone', 'Proposed Time', 'Meeting Link', 'Project Details', 'Admin Notes', 'Updated By', 'Updated At'];
  
  const csvRows = [headers.join(',')];
  
  meetings.forEach(meeting => {
    const row = [
      meeting.id || '',
      meeting.createdAt ? new Date(meeting.createdAt).toISOString() : '',
      `"${(meeting.name || '').replace(/"/g, '""')}"`,
      meeting.email || '',
      meeting.phone || '',
      meeting.status || '',
      `"${(meeting.preferred_times || '').replace(/"/g, '""')}"`,
      meeting.timezone || '',
      `"${(meeting.proposed_time || '').replace(/"/g, '""')}"`,
      meeting.meeting_link || '',
      `"${(meeting.project_details || '').replace(/"/g, '""')}"`,
      `"${(meeting.adminNotes || '').replace(/"/g, '""')}"`,
      meeting.updatedBy || '',
      meeting.updatedAt ? new Date(meeting.updatedAt).toISOString() : ''
    ];
    csvRows.push(row.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const timestamp = new Date().toISOString().split('T')[0];
  
  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="discovery_calls_${timestamp}.csv"`
    }
  });
}

// Cookie parser helper
function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}
