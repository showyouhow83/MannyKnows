import type { APIRoute } from 'astro';
import { AdminAuthenticator } from '../../lib/security/adminAuthenticator';
import { AdminRateLimiter } from '../../lib/security/adminRateLimiter';

// Helper function to get environment variables
function getEnvVal(key: string, env: any): string | undefined {
  if (env && env[key]) return env[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return undefined;
}

export const GET: APIRoute = async ({ locals, url, request }) => {
  try {
    const schedulerKv = (locals as any).runtime?.env?.SCHEDULER_KV;
    const chatbotKv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!schedulerKv || !chatbotKv) {
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
    const rateLimiter = new AdminRateLimiter(chatbotKv);
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
    const authenticator = new AdminAuthenticator(chatbotKv);
    
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

    // Check for export request
    const exportFormat = url.searchParams.get('export');
    if (exportFormat) {
      return await handleMeetingsExport(schedulerKv);
    }

    // Get meetings data
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);
    const status = url.searchParams.get('status') || 'all';
    const sortBy = url.searchParams.get('sortBy') || 'newest';
    
    const meetings = await fetchMeetings(schedulerKv, { limit, status, sortBy });
    
    // Calculate statistics
    const stats = await getMeetingStats(schedulerKv);

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
    const schedulerKv = (locals as any).runtime?.env?.SCHEDULER_KV;
    const chatbotKv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!schedulerKv || !chatbotKv) {
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
    const rateLimiter = new AdminRateLimiter(chatbotKv);
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
    const authenticator = new AdminAuthenticator(chatbotKv);
    
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

    // Get environment for email functionality  
    let environment = (locals as any).runtime?.env as any;
    if (!environment || Object.keys(environment).length === 0) {
      // Fallback to dev vars if runtime env not available
      environment = {};
    }

    // Handle meeting updates
    const result = await updateMeeting(schedulerKv, meetingId, action, { status, notes, adminEmail, environment });

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

// Email notification function
async function sendMeetingStatusEmail(meeting: any, newStatus: string, environment: any) {
  try {
    const resendKey = getEnvVal('RESEND_API_KEY', environment);
    const resendFrom = getEnvVal('RESEND_FROM', environment) || 'MannyKnows <noreply@mannyknows.com>';
    
    if (!resendKey || !meeting.email) {
      console.log('[MEETINGS-ADMIN] Email notification skipped - missing API key or email');
      return false;
    }

    let subject = '';
    let textBody = '';
    let htmlBody = '';

    const userName = meeting.name || 'there';
    const meetingTime = meeting.proposed_time || 'TBD';
    const meetingLink = meeting.meeting_link || '';

    switch (newStatus) {
      case 'confirmed':
        subject = `Discovery Call Confirmed — ${userName}`;
        textBody = `Hi ${userName},\n\nGreat news! Your discovery call has been confirmed.\n\n**Meeting Details:**\nDate & Time: ${meetingTime}\n${meetingLink ? `Meeting Link: ${meetingLink}\n` : ''}${meeting.phone ? `Phone: ${meeting.phone}\n` : ''}\nReference: ${meeting.id}\n\n**What's Next:**\n• Save the meeting details in your calendar\n• Join the meeting at the scheduled time\n• Come prepared to discuss your project needs\n\nLooking forward to speaking with you!\n\nBest regards,\nManny\nMannyKnows.com\n\n---\nNeed to reschedule? Chat with our AI assistant Manny™: https://mannyknows.com?chat=open&ref=${meeting.id}`;
        
        htmlBody = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Discovery Call Confirmed</title>
  <style>
    body{margin:0;padding:0;background:#fafafa;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6}
    .container{max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)}
    .header{background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);padding:32px;text-align:center;color:#ffffff}
    .brand{font-size:24px;font-weight:700;margin-bottom:8px}
    .content{padding:32px}
    .meeting-details{background:#f8fafc;padding:20px;border-radius:8px;margin:20px 0}
    .meeting-details h3{margin:0 0 12px 0;color:#1e293b}
    .detail-item{margin:8px 0}
    .footer{padding:20px 32px;background:#f8fafc;text-align:center;color:#64748b;font-size:14px}
    .highlight{color:#22c55e;font-weight:600}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">MannyKnows</div>
      <div>Your Discovery Call is Confirmed!</div>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Great news! Your discovery call has been <strong>confirmed</strong>.</p>
      
      <div class="meeting-details">
        <h3>Meeting Details</h3>
        <div class="detail-item"><strong>Date & Time:</strong> ${meetingTime}</div>
        ${meetingLink ? `<div class="detail-item"><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></div>` : ''}
        ${meeting.phone ? `<div class="detail-item"><strong>Phone:</strong> ${meeting.phone}</div>` : ''}
        <div class="detail-item"><strong>Reference:</strong> ${meeting.id}</div>
      </div>
      
      <p><strong>What's Next:</strong></p>
      <ul>
        <li>Save the meeting details in your calendar</li>
        <li>Join the meeting at the scheduled time</li>
        <li>Come prepared to discuss your project needs</li>
      </ul>
      
      <p>Looking forward to speaking with you!</p>
      <p>Best regards,<br>Manny</p>
      
      <p style="font-size: 13px; color: #64748b; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <strong>Need to reschedule?</strong><br>
        <a href="https://mannyknows.com?chat=open&ref=${meeting.id}" 
           style="color: #22c55e; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; margin-top: 4px;">
          <span style="display: inline-flex; 
                       width: 20px; 
                       height: 20px; 
                       background: linear-gradient(135deg, #22c55e, #16a34a); 
                       color: white;
                       border-radius: 50%; 
                       align-items: center;
                       justify-content: center;
                       margin-right: 10px;
                       font-weight: bold;
                       font-size: 12px;
                       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                       vertical-align: middle;
                       box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);">M</span>
          Chat with our AI assistant Manny&trade; &rarr;
        </a>
      </p>
    </div>
    <div class="footer">
      This confirmation was sent by <span class="highlight">MannyKnows</span><br>
      Intelligent business operations
    </div>
  </div>
</body>
</html>`;
        break;

      case 'cancelled':
        subject = `Discovery Call Cancelled — ${userName}`;
        textBody = `Hi ${userName},\n\nI need to let you know that your scheduled discovery call has been cancelled.\n\n**Original Meeting Details:**\nDate & Time: ${meetingTime}\nReference: ${meeting.id}\n\n**What's Next:**\nIf you'd like to reschedule, you can get instant help from our AI assistant Manny™:\n\n🤖 Chat to Reschedule: https://mannyknows.com?chat=open&ref=${meeting.id}\n\nour AI assistant Manny™ will help you find a new time that works for both of us.\n\nI apologize for any inconvenience this may cause.\n\nBest regards,\nManny\nMannyKnows.com`;
        
        htmlBody = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Discovery Call Cancelled</title>
  <style>
    body{margin:0;padding:0;background:#fafafa;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6}
    .container{max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)}
    .header{background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:32px;text-align:center;color:#ffffff}
    .brand{font-size:24px;font-weight:700;margin-bottom:8px}
    .content{padding:32px}
    .meeting-details{background:#f8fafc;padding:20px;border-radius:8px;margin:20px 0}
    .meeting-details h3{margin:0 0 12px 0;color:#1e293b}
    .detail-item{margin:8px 0}
    .footer{padding:20px 32px;background:#f8fafc;text-align:center;color:#64748b;font-size:14px}
    .highlight{color:#ef4444;font-weight:600}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">MannyKnows</div>
      <div>Discovery Call Cancelled</div>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>I need to let you know that your scheduled discovery call has been <strong>cancelled</strong>.</p>
      
      <div class="meeting-details">
        <h3>Original Meeting Details</h3>
        <div class="detail-item"><strong>Date & Time:</strong> ${meetingTime}</div>
        <div class="detail-item"><strong>Reference:</strong> ${meeting.id}</div>
      </div>
      
      <p><strong>What's Next:</strong></p>
      <p>If you'd like to reschedule, you can easily get help through our AI assistant Manny&trade;:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://mannyknows.com?chat=open&ref=${meeting.id}" 
           style="background: linear-gradient(to right, #4ade80, #10b981, #059669); 
                  color: white; 
                  text-decoration: none; 
                  padding: 16px 32px; 
                  border-radius: 8px; 
                  font-weight: 600; 
                  font-size: 16px; 
                  display: inline-flex;
                  align-items: center;
                  box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.4), 0 4px 6px -2px rgba(34, 197, 94, 0.25); 
                  transition: all 0.3s ease;">
          <span style="display: inline-flex; 
                       width: 24px; 
                       height: 24px; 
                       background: rgba(255, 255, 255, 0.25); 
                       border-radius: 50%; 
                       align-items: center;
                       justify-content: center;
                       margin-right: 12px;
                       font-weight: bold;
                       font-size: 14px;
                       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                       vertical-align: middle;
                       color: white;">M</span>
          Chat to Reschedule
        </a>
      </div>
      
      <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 12px;">
        our AI assistant Manny&trade; will help you find a new time that works for both of us
      </p>
      
      <p>I apologize for any inconvenience this may cause.</p>
      <p>Best regards,<br>Manny</p>
    </div>
    <div class="footer">
      This notification was sent by <span class="highlight">MannyKnows</span><br>
      Intelligent business operations
    </div>
  </div>
</body>
</html>`;
        break;

      case 'joined':
        subject = `I'm Ready for Our Call — ${userName}`;
        textBody = `Hi ${userName},\n\nI've joined our scheduled discovery call and am ready when you are!\n\n**Meeting Details:**\nDate & Time: ${meetingTime}\n${meetingLink ? `Meeting Link: ${meetingLink}\n` : ''}Reference: ${meeting.id}\n\n**Join Now:**\n${meetingLink ? `Click here to join: ${meetingLink}` : 'Please use the meeting link provided earlier or call the number shared with you.'}\n\nI'm looking forward to discussing your project!\n\nBest regards,\nManny\nMannyKnows.com`;
        
        htmlBody = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ready for Our Call</title>
  <style>
    body{margin:0;padding:0;background:#fafafa;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6}
    .container{max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)}
    .header{background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);padding:32px;text-align:center;color:#ffffff}
    .brand{font-size:24px;font-weight:700;margin-bottom:8px}
    .content{padding:32px}
    .meeting-details{background:#f8fafc;padding:20px;border-radius:8px;margin:20px 0}
    .meeting-details h3{margin:0 0 12px 0;color:#1e293b}
    .detail-item{margin:8px 0}
    .join-button{display:inline-block;background:#3b82f6;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0}
    .footer{padding:20px 32px;background:#f8fafc;text-align:center;color:#64748b;font-size:14px}
    .highlight{color:#3b82f6;font-weight:600}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">MannyKnows</div>
      <div>I'm Ready for Our Call!</div>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>I've joined our scheduled discovery call and am <strong>ready when you are!</strong></p>
      
      <div class="meeting-details">
        <h3>Meeting Details</h3>
        <div class="detail-item"><strong>Date & Time:</strong> ${meetingTime}</div>
        ${meetingLink ? `<div class="detail-item"><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></div>` : ''}
        <div class="detail-item"><strong>Reference:</strong> ${meeting.id}</div>
      </div>
      
      ${meetingLink ? `<div style="text-align:center;margin:24px 0;">
        <a href="${meetingLink}" class="join-button">Join the Call Now</a>
      </div>` : '<p><strong>Please use the meeting link provided earlier or call the number shared with you.</strong></p>'}
      
      <p>I'm looking forward to discussing your project!</p>
      <p>Best regards,<br>Manny</p>
    </div>
    <div class="footer">
      This notification was sent by <span class="highlight">MannyKnows</span><br>
      Intelligent business operations
    </div>
  </div>
</body>
</html>`;
        break;

      default:
        return false;
    }

    const emailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [meeting.email],
        subject: subject,
        text: textBody,
        html: htmlBody
      })
    });

    const success = emailResp.ok;
    if (success) {
      console.log(`[MEETINGS-ADMIN] Email sent successfully for ${newStatus} status to ${meeting.email}`);
    } else {
      const errorText = await emailResp.text();
      console.error(`[MEETINGS-ADMIN] Email failed for ${newStatus} status:`, errorText);
    }
    
    return success;
  } catch (error) {
    console.error('[MEETINGS-ADMIN] Email notification error:', error);
    return false;
  }
}

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
    const previousStatus = meeting.status;
    
    // Update meeting based on action
    switch (action) {
      case 'update_status':
        meeting.status = data.status;
        meeting.updatedAt = Date.now();
        meeting.updatedBy = data.adminEmail;
        if (data.notes) {
          // Append new notes to existing ones with timestamp
          const timestamp = new Date().toLocaleString('en-US', { 
            timeZone: 'America/New_York',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const newNote = `[${timestamp}] ${data.notes}`;
          meeting.adminNotes = meeting.adminNotes 
            ? `${meeting.adminNotes}\n\n${newNote}`
            : newNote;
        }
        
        // For completed status, require call summary
        if (data.status === 'completed' && !data.notes) {
          throw new Error('Call summary is required when marking as completed');
        }
        
        break;
        
      case 'add_notes':
        // Append new notes to existing ones with timestamp
        const timestamp = new Date().toLocaleString('en-US', { 
          timeZone: 'America/New_York',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const newNote = `[${timestamp}] ${data.notes}`;
        meeting.adminNotes = meeting.adminNotes 
          ? `${meeting.adminNotes}\n\n${newNote}`
          : newNote;
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
    
    // Send email notification for status changes (except completed - that's internal only)
    if (action === 'update_status' && data.status !== previousStatus && data.environment) {
      const emailStatuses = ['confirmed', 'cancelled', 'joined'];
      if (emailStatuses.includes(data.status)) {
        try {
          await sendMeetingStatusEmail(meeting, data.status, data.environment);
        } catch (emailError) {
          console.error('[MEETINGS-ADMIN] Email notification failed:', emailError);
          // Don't fail the entire update if email fails
        }
      }
    }
    
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
