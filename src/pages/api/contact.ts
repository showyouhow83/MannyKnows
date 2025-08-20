import type { APIRoute } from 'astro';
import { InputValidator } from '../../lib/security/inputValidator.js';
import { CSRFProtection } from '../../lib/security/csrfProtection.js';
import { RateLimiter } from '../../lib/security/rateLimiter.js';
import { DomainValidator } from '../../lib/security/domainValidator.js';

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const kv = (locals as any).runtime?.env?.CHATBOT_KV;
  
  if (!kv) {
    return new Response(JSON.stringify({ 
      error: 'Service temporarily unavailable' 
    }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { 
      name, 
      email, 
      subject, 
      message, 
      session_id, 
      csrf_token 
    } = body;

    // Domain validation
    const domainValidator = new DomainValidator();
    const domainResult = domainValidator.validateRequest(request);
    if (!domainResult.valid) {
      return new Response(JSON.stringify({
        error: 'Access denied',
        reason: domainResult.reason
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting
    const rateLimiter = new RateLimiter(kv);
    const clientIP = clientAddress || request.headers.get('cf-connecting-ip') || 'unknown';
    const rateResult = await rateLimiter.checkRateLimit(clientIP, 'anonymous');
    
    if (!rateResult.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded. Please wait before sending another message.',
        resetTime: rateResult.resetTime
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // CSRF protection
    const csrfProtection = new CSRFProtection(kv);
    const csrfResult = await csrfProtection.validateRequestWithBody(
      request, 
      session_id || 'anonymous', 
      body
    );
    
    if (!csrfResult.valid) {
      return csrfProtection.createCSRFErrorResponse(csrfResult.reason || 'CSRF validation failed');
    }

    // Input validation
    const contactSchema = {
      name: {
        required: true,
        type: 'string' as const,
        minLength: 2,
        maxLength: 100,
        sanitize: true
      },
      email: {
        required: true,
        type: 'email' as const,
        sanitize: true
      },
      subject: {
        required: true,
        type: 'string' as const,
        minLength: 5,
        maxLength: 200,
        sanitize: true
      },
      message: {
        required: true,
        type: 'string' as const,
        minLength: 20,
        maxLength: 2000,
        sanitize: true
      }
    };

    const validationResult = InputValidator.validate({
      name,
      email,
      subject,
      message
    }, contactSchema);

    if (!validationResult.valid) {
      return new Response(JSON.stringify({
        error: 'Invalid input',
        details: validationResult.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate submission ID
    const submissionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Store contact submission
    const contactRecord = {
      id: submissionId,
      type: 'contact_form',
      name: validationResult.sanitizedData.name,
      email: validationResult.sanitizedData.email,
      subject: validationResult.sanitizedData.subject,
      message: validationResult.sanitizedData.message,
      submittedAt: timestamp,
      clientIP,
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: 'pending'
    };

    // Store in KV with 30-day expiration
    await kv.put(
      `contact:${submissionId}`, 
      JSON.stringify(contactRecord), 
      { expirationTtl: 60 * 60 * 24 * 30 }
    );

    // Send notification email using Resend
    const ownerEmail = (locals as any).runtime?.env?.OWNER_EMAIL || 'verified@mailroute.mannyknows.com';
    const resendKey = (locals as any).runtime?.env?.RESEND_API_KEY;

    if (resendKey) {
      console.log(`🔧 Attempting to send email notification to: ${ownerEmail}`);
      try {
        const emailHtml = generateContactNotificationEmail(contactRecord);
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'MannyKnows Contact <verified@mailroute.mannyknows.com>',
            to: [ownerEmail],
            subject: `📧 New Contact Form Submission: ${contactRecord.subject}`,
            html: emailHtml
          })
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log(`✅ Contact notification sent for: ${submissionId}`, emailResult);
        } else {
          const errorText = await emailResponse.text();
          console.error(`❌ Failed to send contact notification. Status: ${emailResponse.status}, Response: ${errorText}`);
        }
      } catch (emailError) {
        console.error('❌ Email sending exception:', emailError);
        // Continue without failing - contact is still stored
      }
    } else {
      console.error('❌ RESEND_API_KEY not found in environment variables');
    }

    // Send auto-reply to user
    if (resendKey) {
      console.log(`🔧 Attempting to send auto-reply to: ${contactRecord.email}`);
      try {
        const autoReplyHtml = generateAutoReplyEmail(contactRecord);
        
        const autoReplyResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'MannyKnows <verified@mailroute.mannyknows.com>',
            to: [contactRecord.email],
            subject: `✅ Message Received - We'll Get Back to You Soon!`,
            html: autoReplyHtml
          })
        });

        if (autoReplyResponse.ok) {
          const autoReplyResult = await autoReplyResponse.json();
          console.log(`✅ Auto-reply sent to: ${contactRecord.email}`, autoReplyResult);
        } else {
          const errorText = await autoReplyResponse.text();
          console.error(`❌ Failed to send auto-reply. Status: ${autoReplyResponse.status}, Response: ${errorText}`);
        }
      } catch (autoReplyError) {
        console.error('❌ Auto-reply exception:', autoReplyError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Your message has been sent successfully! We\'ll get back to you within 24 hours.',
      submissionId,
      timestamp
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process your message. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Get CSRF token for contact form
export const GET: APIRoute = async ({ url, locals }) => {
  const kv = (locals as any).runtime?.env?.CHATBOT_KV;
  
  if (!kv) {
    return new Response(JSON.stringify({ 
      error: 'Service temporarily unavailable' 
    }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sessionId = url.searchParams.get('session_id') || crypto.randomUUID();
  
  try {
    const csrfProtection = new CSRFProtection(kv);
    const token = await csrfProtection.getSessionToken(sessionId);
    
    return new Response(JSON.stringify({
      csrf_token: token,
      session_id: sessionId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate security token'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Generate contact notification email HTML
function generateContactNotificationEmail(contact: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Contact Form Submission - MannyKnows</title>
      <style>
        body { margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 32px; }
        .brand { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; font-weight: 900; font-size: 28px; padding: 16px 24px; border-radius: 16px; margin-bottom: 12px; box-shadow: 0 8px 32px rgba(16, 209, 255, 0.3); }
        .subtitle { color: #4f46e5; font-size: 18px; font-weight: 600; }
        .content { margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .field { background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 16px; padding: 20px; backdrop-filter: blur(10px); }
        .label { display: block; color: #6366f1; font-size: 12px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .value { color: #1f2937; font-size: 16px; font-weight: 500; word-wrap: break-word; }
        .message-field { background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 16px; padding: 24px; backdrop-filter: blur(10px); grid-column: 1 / -1; }
        .message-content { color: #1f2937; font-size: 16px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
        .footer { text-align: center; color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-top: 32px; }
        .meta { margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2); }
        .tracking { color: #6366f1; font-size: 12px; text-align: center; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-weight: 500; }
        @media (max-width: 600px) {
          .container { padding: 20px 10px; }
          .card { padding: 24px; }
          .grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="brand">MK</div>
            <div class="subtitle">New Contact Form Submission</div>
          </div>
          <div class="content">
            <div class="grid">
              <div class="field">
                <span class="label">Name</span>
                <div class="value">${contact.name}</div>
              </div>
              <div class="field">
                <span class="label">Email</span>
                <div class="value">${contact.email}</div>
              </div>
              <div class="field">
                <span class="label">Subject</span>
                <div class="value">${contact.subject}</div>
              </div>
              <div class="field">
                <span class="label">Submitted</span>
                <div class="value">${new Date(contact.submittedAt).toLocaleString()}</div>
              </div>
            </div>
            
            <div class="message-field">
              <span class="label">Message</span>
              <div class="message-content">${contact.message}</div>
            </div>
            
            <div class="meta">
              <div class="tracking">Submission ID: ${contact.id}</div>
            </div>
          </div>
          <div class="footer">
            This notification was sent by the MannyKnows contact form<br>
            Automated lead capture · Professional business operations
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate auto-reply email HTML
function generateAutoReplyEmail(contact: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Message Received - MannyKnows</title>
      <style>
        body { margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 32px; }
        .brand { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; font-weight: 900; font-size: 28px; padding: 16px 24px; border-radius: 16px; margin-bottom: 12px; box-shadow: 0 8px 32px rgba(16, 209, 255, 0.3); }
        .subtitle { color: #4f46e5; font-size: 18px; font-weight: 600; }
        .content { margin-bottom: 24px; text-align: center; }
        .message { color: #1f2937; font-size: 18px; margin-bottom: 24px; font-weight: 500; }
        .details { background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left; backdrop-filter: blur(10px); }
        .label { display: block; color: #6366f1; font-size: 12px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .value { color: #1f2937; font-size: 16px; margin-bottom: 16px; font-weight: 500; }
        .footer { text-align: center; color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-top: 32px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; margin: 20px 0; box-shadow: 0 8px 32px rgba(16, 209, 255, 0.3); transition: transform 0.2s ease; }
        .btn:hover { transform: translateY(-2px); }
        @media (max-width: 600px) {
          .container { padding: 20px 10px; }
          .card { padding: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="brand">MK</div>
            <div class="subtitle">Message Received Successfully</div>
          </div>
          <div class="content">
            <div class="message">
              Hi ${contact.name}! 👋<br><br>
              Thanks for reaching out to MannyKnows. We've received your message and will get back to you within 24 hours.
            </div>
            
            <div class="details">
              <div class="label">Your Message Subject</div>
              <div class="value">${contact.subject}</div>
              <div class="label">Submitted</div>
              <div class="value">${new Date(contact.submittedAt).toLocaleString()}</div>
              <div class="label">Reference ID</div>
              <div class="value">${contact.id}</div>
            </div>
            
            <p>While you wait, feel free to explore our AI chatbot for instant website analysis and business insights!</p>
            
            <a href="https://mannyknows.com/" class="btn">Try Our AI Chat →</a>
          </div>
          <div class="footer">
            This confirmation was sent by MannyKnows<br>
            AI-powered business solutions · Professional web services
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
