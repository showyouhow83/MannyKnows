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

    // Multi-layer authentication
    const authenticator = new AdminAuthenticator(kv);
    
    // Method 1: Check for session token (preferred)
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
        await authenticator.logAdminAccess('newsletter_access', adminEmail, clientIP, userAgent);
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
          await authenticator.logAdminAccess('newsletter_access_token', adminEmail, clientIP, userAgent);
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
        await authenticator.logAdminAccess('newsletter_access_legacy', adminEmail, clientIP, userAgent, {
          warning: 'Using deprecated admin key authentication'
        });
      }
    }

    if (!authenticated) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid admin authentication required',
        methods: ['session_token', 'one_time_token', 'admin_key']
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Additional IP-based security check
    if (!authenticator.isIPAllowed(clientIP)) {
      await authenticator.logAdminAccess('access_denied_ip', adminEmail, clientIP, userAgent);
      return new Response(JSON.stringify({ 
        error: 'Access denied',
        message: 'IP address not in allowed list'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for export request (higher rate limit)
    const exportFormat = url.searchParams.get('export');
    if (exportFormat) {
      const exportRateResult = await rateLimiter.checkAdminRateLimit(clientIP, 'admin_newsletter_export');
      if (!exportRateResult.allowed) {
        return new Response(JSON.stringify({
          error: 'Export rate limit exceeded',
          message: exportRateResult.reason,
          resetTime: exportRateResult.resetTime
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Get all newsletter subscriptions with enhanced filtering
    const subscriptions = [];
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000); // Max 1000
    const status = url.searchParams.get('status') || 'all'; // active, unsubscribed, all
    
    const { keys } = await kv.list({ prefix: 'newsletter:', limit });
    
    for (const key of keys) {
      try {
        const data = await kv.get(key.name);
        if (data) {
          const subscription = JSON.parse(data);
          
          // Filter by status if specified
          if (status !== 'all' && subscription.status !== status) {
            continue;
          }
          
          subscriptions.push(subscription);
        }
      } catch (error) {
        console.error(`Error parsing subscription data for ${key.name}:`, error);
      }
    }

    // Sort by subscription date (newest first)
    subscriptions.sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime());

    // Enhanced statistics
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'active').length,
      unsubscribed: subscriptions.filter(s => s.status === 'unsubscribed').length,
      resubscribed: subscriptions.filter(s => s.resubscriptionCount && s.resubscriptionCount > 0).length,
      todaySubscriptions: subscriptions.filter(s => {
        const today = new Date().toDateString();
        return new Date(s.subscribedAt).toDateString() === today;
      }).length,
      todayResubscriptions: subscriptions.filter(s => {
        const today = new Date().toDateString();
        return s.resubscribedAt && new Date(s.resubscribedAt).toDateString() === today;
      }).length,
      sources: subscriptions.reduce((acc, s) => {
        acc[s.source] = (acc[s.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    const responseData = {
      success: true,
      authenticated_as: adminEmail,
      timestamp: new Date().toISOString(),
      stats,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        email: exportFormat ? sub.email : maskEmail(sub.email), // Mask emails unless exporting
        status: sub.status,
        subscribedAt: sub.subscribedAt,
        lastSubscribedAt: sub.lastSubscribedAt,
        unsubscribedAt: sub.unsubscribedAt,
        resubscribedAt: sub.resubscribedAt,
        resubscriptionCount: sub.resubscriptionCount || 0,
        source: sub.source,
        ipAddress: exportFormat ? sub.ipAddress : undefined // Only show IP for exports
      }))
    };

    // Handle different export formats
    if (exportFormat === 'csv') {
      const csv = generateCSV(subscriptions);
      await authenticator.logAdminAccess('newsletter_export_csv', adminEmail, clientIP, userAgent, {
        recordCount: subscriptions.length
      });
      
      return new Response(csv, {
        status: 200,
        headers: { 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (exportFormat === 'json') {
      await authenticator.logAdminAccess('newsletter_export_json', adminEmail, clientIP, userAgent, {
        recordCount: subscriptions.length
      });
    }

    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Newsletter admin error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch newsletter data',
      message: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper functions
function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.substring(0, 2)}***@${domain}`;
}

function generateCSV(subscriptions: any[]): string {
  const headers = ['Email', 'Status', 'Subscribed At', 'Last Subscribed At', 'Unsubscribed At', 'Resubscribed At', 'Resubscription Count', 'Source', 'IP Address'];
  const rows = [headers];
  
  subscriptions.forEach(sub => {
    rows.push([
      sub.email,
      sub.status,
      sub.subscribedAt,
      sub.lastSubscribedAt || sub.subscribedAt,
      sub.unsubscribedAt || '',
      sub.resubscribedAt || '',
      sub.resubscriptionCount || 0,
      sub.source || '',
      sub.ipAddress || ''
    ]);
  });
  
  return rows.map(row => 
    row.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}
