import type { APIRoute } from 'astro';

export const prerender = false;

// CORS headers for security
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mannyknows.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

export const GET: APIRoute = async ({ url, request, locals }) => {
  try {
    const params = new URL(request.url).searchParams;
    const token = params.get('token');
    const action = params.get('action'); // 'cancel' | 'reschedule'
    
    if (!token || !action) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Verification Link</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Invalid Verification Link</h1>
            <p>This verification link is invalid or malformed. Please request a new verification email.</p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Get KV binding from environment (using the same pattern as chat.ts)
    const kv = (locals as any).runtime?.env?.SCHEDULER_KV;
    const environment = (locals as any).runtime?.env;
    
    if (!kv) {
      throw new Error('KV binding not available');
    }

    // Look up pending verification
    const pendingActionKey = `verify:${token}`;
    const pendingDataRaw = await kv.get(pendingActionKey);
    
    if (!pendingDataRaw) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Link Expired</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; }
            .warning { color: #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="warning">Verification Link Expired</h1>
            <p>This verification link has expired or has already been used. Please request a new verification email if you still need to make changes to your meeting.</p>
          </div>
        </body>
        </html>
      `, {
        status: 410,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Parse the pending action data
    const pendingData = JSON.parse(pendingDataRaw);

    // Verify the action matches
    if (pendingData.action !== action) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Action Mismatch</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Action Mismatch</h1>
            <p>This verification link doesn't match the requested action. Please use the correct verification link from your email.</p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Get the original meeting using the stored meeting key
    const meetingKey = pendingData.meetingKey || `meetreq:${pendingData.trackingId}`;
    const meetingDataRaw = await kv.get(meetingKey);
    
    if (!meetingDataRaw) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Meeting Not Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; }
            .warning { color: #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="warning">Meeting Not Found</h1>
            <p>The meeting associated with this verification link could not be found. It may have already been processed or cancelled.</p>
          </div>
        </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Parse the meeting data
    const meeting = JSON.parse(meetingDataRaw);

    // Process the verified action
    let resultMessage = '';
    let actionTitle = '';
    
    if (action === 'cancel') {
      // Update meeting status to cancelled
      meeting.status = 'cancelled';
      meeting.cancelledAt = Date.now();
      meeting.cancellationReason = pendingData.reason || 'Cancelled by user';
      
      await kv.put(meetingKey, JSON.stringify(meeting));
      
      actionTitle = 'Meeting Cancelled';
      resultMessage = `Your meeting scheduled for ${meeting.proposed_time} has been successfully cancelled.`;
      
      // Send cancellation confirmation email to owner
      await sendOwnerNotification(meeting, 'cancelled', pendingData, environment);
      
    } else if (action === 'reschedule') {
      // Update meeting status to reschedule requested
      meeting.status = 'reschedule_requested';
      meeting.rescheduleRequestedAt = Date.now();
      meeting.newPreferredTimes = pendingData.newPreferredTimes;
      meeting.rescheduleReason = pendingData.reason || 'Reschedule requested by user';
      
      await kv.put(meetingKey, JSON.stringify(meeting));
      
      actionTitle = 'Reschedule Request Submitted';
      resultMessage = `Your reschedule request for the meeting originally scheduled for ${meeting.proposed_time} has been submitted. Our team will contact you within 24 hours with new time options.`;
      
      // Send reschedule notification email to owner
      await sendOwnerNotification(meeting, 'reschedule', pendingData, environment);
    }

    // Clean up the verification token
    await kv.delete(pendingActionKey);

    // Return success page
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${actionTitle} - MannyKnows</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            margin: 0; 
            padding: 40px 20px; 
            background: #fafafa; 
            color: #18181b; 
            line-height: 1.6;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            padding: 40px; 
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          }
          .success { color: #10b981; display: flex; align-items: center; gap: 8px; }
          .checkmark { 
            display: inline-block; 
            width: 24px; 
            height: 24px; 
            background: #10b981; 
            border-radius: 50%; 
            position: relative;
          }
          .checkmark::after {
            content: '';
            position: absolute;
            left: 8px;
            top: 4px;
            width: 6px;
            height: 12px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }
          .brand { 
            background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .details {
            background: #f4f4f5;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-item {
            margin: 8px 0;
          }
          .label {
            font-weight: 600;
            color: #71717a;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">MK</div>
          <h1 class="success">
            <span class="checkmark"></span>
            ${actionTitle}
          </h1>
          <p>${resultMessage}</p>
          
          <div class="details">
            <div class="detail-item">
              <span class="label">Reference:</span> ${meeting.id}
            </div>
            <div class="detail-item">
              <span class="label">Contact:</span> ${meeting.name} (${meeting.email})
            </div>
            ${action === 'reschedule' ? `
              <div class="detail-item">
                <span class="label">New Preferred Times:</span> ${pendingData.newPreferredTimes || 'To be discussed'}
              </div>
            ` : ''}
          </div>
          
          <p><strong>What happens next?</strong></p>
          <p>A confirmation email has been sent to our team. ${action === 'reschedule' ? 'We will contact you within 24 hours with new time options.' : 'Your cancellation has been processed.'}</p>
          
          <p>If you have any questions, please contact us at <a href="mailto:showyouhow83@gmail.com">showyouhow83@gmail.com</a></p>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Error processing meeting verification:', error);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
          .container { max-width: 600px; margin: 0 auto; }
          .error { color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">Verification Error</h1>
          <p>There was an error processing your verification. Please contact support at showyouhow83@gmail.com if this issue persists.</p>
        </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};

// Helper function to send owner notifications
async function sendOwnerNotification(meeting: any, actionType: string, pendingData: any, environment: any) {
  try {
    // Get environment variables from the passed environment
    const resendApiKey = environment?.RESEND_API_KEY;
    const ownerEmail = environment?.OWNER_EMAIL || 'showyouhow83@gmail.com';
    const resendFrom = environment?.RESEND_FROM || 'MannyKnows <noreply@mannyknows.com>';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not available for owner notification');
      return;
    }

    const actionDetails = actionType === 'cancel' 
      ? `<strong>Cancelled</strong> by ${meeting.name}`
      : `<strong>Reschedule requested</strong> by ${meeting.name}<br>New preferred times: ${pendingData.newPreferredTimes || 'To be discussed'}`;

    const htmlBody = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Meeting ${actionType === 'cancel' ? 'Cancellation' : 'Reschedule Request'}</title>
        <style>
          body{margin:0;padding:0;background:#fafafa;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif;line-height:1.6}
          .container{max-width:680px;margin:40px auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)}
          .header{padding:32px 40px;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:#ffffff}
          .brand{font-weight:700;font-size:28px;letter-spacing:-0.025em}
          .subtitle{font-size:16px;margin-top:6px;font-weight:500;opacity:0.95}
          .content{padding:40px 40px 32px}
          .action{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin:20px 0;color:#dc2626}
          .details{background:#f4f4f5;border-radius:12px;padding:20px;margin:20px 0}
          .label{font-weight:600;color:#71717a;display:block;margin-bottom:4px}
          .value{color:#18181b;margin-bottom:12px}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">MK</div>
            <div class="subtitle">Meeting ${actionType === 'cancel' ? 'Cancellation' : 'Reschedule Request'}</div>
          </div>
          <div class="content">
            <div class="action">
              ${actionDetails}
            </div>
            
            <div class="details">
              <div class="label">Meeting Details</div>
              <div class="value"><strong>Name:</strong> ${meeting.name}</div>
              <div class="value"><strong>Email:</strong> ${meeting.email}</div>
              <div class="value"><strong>Phone:</strong> ${meeting.phone || 'Not provided'}</div>
              <div class="value"><strong>Original Time:</strong> ${meeting.proposed_time}</div>
              <div class="value"><strong>Reference:</strong> ${meeting.id}</div>
              ${pendingData.reason ? `<div class="value"><strong>Reason:</strong> ${pendingData.reason}</div>` : ''}
            </div>
            
            <p><strong>Action Required:</strong></p>
            <p>${actionType === 'cancel' 
              ? 'The meeting has been cancelled. No further action needed unless you want to follow up with the client.' 
              : 'Please respond to the client within 24 hours with new time options.'
            }</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [ownerEmail],
        subject: `Meeting ${actionType === 'cancel' ? 'Cancelled' : 'Reschedule Request'}: ${meeting.name}`,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.status}`);
    }

  } catch (error) {
    console.error('Error sending owner notification:', error);
  }
}
