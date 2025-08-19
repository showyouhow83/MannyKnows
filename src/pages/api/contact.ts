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
    const ownerEmail = (locals as any).runtime?.env?.OWNER_EMAIL || 'showyouhow83@gmail.com';
    const resendKey = (locals as any).runtime?.env?.RESEND_API_KEY;

    if (resendKey) {
      try {
        const emailHtml = generateContactNotificationEmail(contactRecord);
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'MannyKnows Contact <contact@mannyknows.com>',
            to: [ownerEmail],
            subject: `📧 New Contact Form Submission: ${contactRecord.subject}`,
            html: emailHtml
          })
        });

        if (emailResponse.ok) {
          console.log(`✅ Contact notification sent for: ${submissionId}`);
        }
      } catch (emailError) {
        console.error('Failed to send contact notification:', emailError);
        // Continue without failing - contact is still stored
      }
    }

    // Send auto-reply to user
    if (resendKey) {
      try {
        const autoReplyHtml = generateAutoReplyEmail(contactRecord);
        
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'MannyKnows <noreply@mannyknows.com>',
            to: [contactRecord.email],
            subject: `✅ Message Received - We'll Get Back to You Soon!`,
            html: autoReplyHtml
          })
        });
      } catch (autoReplyError) {
        console.error('Failed to send auto-reply:', autoReplyError);
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
        body { margin: 0; padding: 0; background: #fafafa; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; margin-bottom: 20px; }
        .header { text-align: center; margin-bottom: 32px; }
        .brand { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; font-weight: 900; font-size: 24px; padding: 12px 20px; border-radius: 12px; margin-bottom: 8px; }
        .subtitle { color: #71717a; font-size: 16px; font-weight: 500; }
        .content { margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .field { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px; }
        .label { display: block; color: #71717a; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { color: #18181b; font-size: 16px; word-wrap: break-word; }
        .message-field { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 20px; }
        .message-content { color: #18181b; font-size: 16px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
        .footer { text-align: center; color: #a1a1aa; font-size: 14px; margin-top: 32px; }
        .meta { margin-top: 24px; padding-top: 20px; border-top: 1px solid #f4f4f5; }
        .tracking { color: #71717a; font-size: 12px; text-align: center; }
        @media (max-width: 600px) {
          .container { padding: 10px; }
          .card { padding: 20px; }
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
        body { margin: 0; padding: 0; background: #fafafa; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; margin-bottom: 20px; }
        .header { text-align: center; margin-bottom: 32px; }
        .brand { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; font-weight: 900; font-size: 24px; padding: 12px 20px; border-radius: 12px; margin-bottom: 8px; }
        .subtitle { color: #71717a; font-size: 16px; font-weight: 500; }
        .content { margin-bottom: 24px; text-align: center; }
        .message { color: #18181b; font-size: 18px; margin-bottom: 24px; }
        .details { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left; }
        .label { display: block; color: #71717a; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
        .value { color: #18181b; font-size: 16px; margin-bottom: 16px; }
        .footer { text-align: center; color: #a1a1aa; font-size: 14px; margin-top: 32px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        @media (max-width: 600px) {
          .container { padding: 10px; }
          .card { padding: 20px; }
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
            
            <a href="/" class="btn">Try Our AI Chat →</a>
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
