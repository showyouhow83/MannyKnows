// Twilio SMS API endpoint
// Sends branded SMS messages from MannyKnows
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
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

    // Get Twilio credentials. Feature-flag guard: when any of these env vars
    // is absent the endpoint degrades gracefully (503 + clear message) instead
    // of throwing — SMS is simply "off" until the secrets are added.
    const accountSid = env?.TWILIO_ACCOUNT_SID;
    const authToken = env?.TWILIO_AUTH_TOKEN;
    const senderNumber = env?.TWILIO_PHONE_NUMBER || env?.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !senderNumber) {
      console.log('[SMS] Send skipped — Twilio not configured (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
      return new Response(JSON.stringify({
        success: false,
        error: 'SMS service not configured',
        hint: 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER (or TWILIO_FROM_NUMBER) secrets'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { to, message } = body;

    // Validate phone number (basic US format check)
    if (!to || typeof to !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Phone number is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Clean phone number - remove all non-digits
    let cleanPhone = to.replace(/\D/g, '');

    // Add US country code if not present (E.164 format for Twilio)
    if (cleanPhone.length === 10) {
      cleanPhone = '+1' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      cleanPhone = '+' + cleanPhone;
    } else {
      cleanPhone = '+' + cleanPhone;
    }

    // Validate it's a valid US number
    if (cleanPhone.length !== 12 || !cleanPhone.startsWith('+1')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid US phone number format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!message || typeof message !== 'string' || message.length > 1600) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Message is required and must be under 1600 characters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send SMS via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: senderNumber,
        To: cleanPhone,
        Body: message
      }).toString()
    });

    const twilioResult = await twilioResponse.json() as any;

    if (!twilioResponse.ok) {
      console.error('[SMS] Twilio error:', twilioResult);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send SMS',
        details: twilioResult.message || 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[SMS] Sent to ${cleanPhone}: ${message.substring(0, 50)}...`);

    return new Response(JSON.stringify({
      success: true,
      message_sid: twilioResult.sid,
      to: cleanPhone
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SMS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send SMS',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
