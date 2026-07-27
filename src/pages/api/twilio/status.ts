// Twilio Status Callback Webhook
// Receives status updates for A2P registration and message delivery
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let data: Record<string, string> = {};

    // Twilio sends form-urlencoded data
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
    } else {
      // Fallback to JSON
      data = await request.json();
    }

    // Log the status update
    console.log('[Twilio Status Callback]', JSON.stringify(data, null, 2));

    // Common fields from Twilio:
    // - MessageSid: Unique message ID
    // - MessageStatus: queued, sent, delivered, undelivered, failed
    // - To: Recipient phone
    // - From: Sender phone
    // - ErrorCode: If failed
    // - ErrorMessage: If failed

    const { MessageSid, MessageStatus, To, ErrorCode, ErrorMessage } = data;

    if (MessageStatus) {
      console.log(`[SMS Status] ${MessageSid}: ${MessageStatus} to ${To}`);

      if (ErrorCode || ErrorMessage) {
        console.error(`[SMS Error] ${ErrorCode}: ${ErrorMessage}`);
      }
    }

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Twilio Status Callback] Error:', error);
    // Still return 200 to prevent Twilio retries
    return new Response(JSON.stringify({ received: true, error: 'Parse error' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Also handle GET for verification
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    status: 'Twilio webhook active',
    endpoint: '/api/twilio/status'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
