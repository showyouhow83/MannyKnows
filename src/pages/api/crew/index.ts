// Crew Leads API - CRUD operations
// GET: List all crew leads
// POST: Create new crew lead (with optional SMS invite)
// PATCH: Update crew lead
// DELETE: Soft delete (deactivate) crew lead
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { secureToken } from '../../../utils/token';

// Generate a secure login token (128-bit CSPRNG hex — Math.random is predictable)
function generateToken(): string {
  return secureToken(16);
}

// GET: List all active crew leads
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all active crew leads with project count
    const result = await db.prepare(`
      SELECT
        cl.*,
        COUNT(p.id) as active_projects
      FROM crew_leads cl
      LEFT JOIN projects p ON cl.id = p.crew_lead_id AND p.status IN ('needs_crew', 'in_progress')
      WHERE cl.active = 1
      GROUP BY cl.id
      ORDER BY cl.name ASC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      crew: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Crew API] GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch crew leads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Create new crew lead
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { name, phone, email, send_sms } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!phone || typeof phone !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Phone number is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid phone number'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if phone already exists
    const existing = await db.prepare(
      'SELECT id, active FROM crew_leads WHERE phone = ? OR phone = ?'
    ).bind(cleanPhone, phone).first();

    if (existing) {
      if (existing.active) {
        return new Response(JSON.stringify({
          success: false,
          error: 'A crew lead with this phone number already exists'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Reactivate existing crew lead
        await db.prepare(`
          UPDATE crew_leads
          SET active = 1, name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(name.trim(), email?.trim() || null, existing.id).run();

        return new Response(JSON.stringify({
          success: true,
          crew_id: existing.id,
          reactivated: true,
          message: 'Crew lead reactivated'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate login token
    const loginToken = generateToken();
    const tokenExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    // Insert new crew lead
    const result = await db.prepare(`
      INSERT INTO crew_leads (name, phone, email, login_token, token_expires)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      name.trim(),
      cleanPhone,
      email?.trim() || `crew_${cleanPhone}@mannyknows.com`, // Fallback email for DB constraint
      loginToken,
      tokenExpires.toISOString()
    ).run();

    const crewId = result.meta?.last_row_id;

    console.log(`[Crew API] Created crew lead ${crewId}: ${name}`);

    // Send SMS invite if requested
    let smsSent = false;
    let smsError = null;

    if (send_sms !== false) {
      const accountSid = env?.TWILIO_ACCOUNT_SID;
      const authToken = env?.TWILIO_AUTH_TOKEN;
      const senderNumber = env?.TWILIO_PHONE_NUMBER || env?.TWILIO_FROM_NUMBER;

      if (accountSid && authToken && senderNumber) {
        try {
          // TODO: no page consumes login_token — /crew?token=... 404s (this
          // was already stale in the SL Painting source; crew access moved to
          // per-project links /project/crew/[crew_token] and the name+phone
          // timeclock login). Fix the destination before enabling SMS invites.
          const crewPortalUrl = `https://mannyknows.com/crew?token=${loginToken}`;
          const smsMessage = `MannyKnows: Welcome ${name.split(' ')[0]}! You've been added as a crew lead. Access your projects here: ${crewPortalUrl}`;

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          const credentials = btoa(`${accountSid}:${authToken}`);

          // Format phone for Twilio (E.164 format)
          let twilioPhone = cleanPhone;
          if (twilioPhone.length === 10) {
            twilioPhone = '+1' + twilioPhone;
          } else if (twilioPhone.length === 11 && twilioPhone.startsWith('1')) {
            twilioPhone = '+' + twilioPhone;
          }

          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              From: senderNumber,
              To: twilioPhone,
              Body: smsMessage
            }).toString()
          });

          if (twilioResponse.ok) {
            smsSent = true;
            console.log(`[Crew API] SMS invite sent to ${cleanPhone}`);
          } else {
            const twilioError = await twilioResponse.json() as any;
            smsError = twilioError.message || 'SMS send failed';
            console.error('[Crew API] SMS error:', twilioError);
          }
        } catch (err) {
          smsError = err instanceof Error ? err.message : 'SMS send failed';
          console.error('[Crew API] SMS exception:', err);
        }
      } else {
        // Feature-flag guard: Twilio env vars absent → skip the send, report
        // it in the response instead of failing crew creation.
        smsError = 'SMS not configured (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)';
        console.log('[Crew API] SMS invite skipped: Twilio not configured');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      crew_id: crewId,
      login_token: loginToken,
      sms_sent: smsSent,
      sms_error: smsError,
      message: smsSent ? 'Crew lead created and SMS sent' : 'Crew lead created'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Crew API] POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create crew lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH: Update crew lead
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { crew_id, name, phone, email, resend_sms } = body;

    if (!crew_id || isNaN(Number(crew_id))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid crew ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get current crew lead
    const current = await db.prepare(
      'SELECT * FROM crew_leads WHERE id = ? AND active = 1'
    ).bind(crew_id).first();

    if (!current) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Crew lead not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update
    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (name && typeof name === 'string') {
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (phone && typeof phone === 'string') {
      const cleanPhone = phone.replace(/\D/g, '');
      updates.push('phone = ?');
      values.push(cleanPhone);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email?.trim() || null);
    }

    values.push(crew_id);

    await db.prepare(`
      UPDATE crew_leads SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    // Resend SMS if requested
    let smsSent = false;
    if (resend_sms) {
      const accountSid = env?.TWILIO_ACCOUNT_SID;
      const authToken = env?.TWILIO_AUTH_TOKEN;
      const senderNumber = env?.TWILIO_PHONE_NUMBER || env?.TWILIO_FROM_NUMBER;

      if (accountSid && authToken && senderNumber && current.login_token) {
        try {
          // TODO: stale destination — see note on the invite SMS above.
          const crewPortalUrl = `https://mannyknows.com/crew?token=${current.login_token}`;
          const crewName = name || current.name;
          const smsMessage = `MannyKnows: Hi ${crewName.split(' ')[0]}! Here's your crew portal link: ${crewPortalUrl}`;

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          const credentials = btoa(`${accountSid}:${authToken}`);

          let twilioPhone = (phone?.replace(/\D/g, '') || current.phone);
          if (twilioPhone.length === 10) {
            twilioPhone = '+1' + twilioPhone;
          } else if (twilioPhone.length === 11 && twilioPhone.startsWith('1')) {
            twilioPhone = '+' + twilioPhone;
          }

          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              From: senderNumber,
              To: twilioPhone,
              Body: smsMessage
            }).toString()
          });

          smsSent = twilioResponse.ok;
        } catch (err) {
          console.error('[Crew API] Resend SMS error:', err);
        }
      } else if (!accountSid || !authToken || !senderNumber) {
        // Feature-flag guard: Twilio env vars absent → skip, don't fail the update.
        console.log('[Crew API] Resend SMS skipped: Twilio not configured (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sms_sent: smsSent,
      message: 'Crew lead updated'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Crew API] PATCH error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update crew lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Soft delete (deactivate) crew lead
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const crewId = url.searchParams.get('crew_id');

    if (!crewId || isNaN(Number(crewId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid crew ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if crew lead has active projects
    const activeProjects = await db.prepare(`
      SELECT COUNT(*) as count FROM projects
      WHERE crew_lead_id = ? AND status IN ('needs_crew', 'in_progress')
    `).bind(crewId).first();

    if (activeProjects && (activeProjects.count as number) > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot delete: crew lead has ${activeProjects.count} active project(s)`
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Soft delete
    const result = await db.prepare(`
      UPDATE crew_leads SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(crewId).run();

    if (result.meta?.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Crew lead not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Crew API] Deactivated crew lead ${crewId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Crew lead removed'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Crew API] DELETE error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete crew lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
