import type { APIRoute } from 'astro';
import { InputValidator } from '../../lib/security/inputValidator.js';
import { CSRFProtection } from '../../lib/security/csrfProtection.js';

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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    const resendKey = (locals as any).runtime?.env?.RESEND_API_KEY;
    
    if (!kv) {
      throw new Error('KV storage not available');
    }

    // Parse request data
    const data = await request.json();
    const { email, csrf_token, session_id } = data;

    // CSRF protection
    const csrfProtection = new CSRFProtection(kv);
    const csrfResult = await csrfProtection.validateRequestWithBody(
      request, 
      session_id || 'anonymous', 
      data
    );
    
    if (!csrfResult.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request. Please refresh the page and try again.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email input
    const emailSchema = {
      email: {
        required: true,
        type: 'email' as const,
        sanitize: true
      }
    };

    const validationResult = InputValidator.validate({ email }, emailSchema);
    if (!validationResult.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: validationResult.errors[0] || 'Invalid email address'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sanitizedEmail = validationResult.sanitizedData.email;
    
    // Check if email already exists and handle re-subscription
    const existingSubscription = await kv.get(`newsletter:${sanitizedEmail}`);
    if (existingSubscription) {
      const existingData = JSON.parse(existingSubscription);
      
      // If user is currently active, prevent duplicate subscription
      if (existingData.status === 'active') {
        return new Response(JSON.stringify({
          success: false,
          error: 'This email is already subscribed to our newsletter!'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // If user was unsubscribed, allow re-subscription by updating existing record
      if (existingData.status === 'unsubscribed') {
        const timestamp = new Date().toISOString();
        
        const resubscriptionRecord = {
          ...existingData,
          status: 'active',
          resubscribedAt: timestamp,
          lastSubscribedAt: timestamp,
          resubscriptionCount: (existingData.resubscriptionCount || 0) + 1,
          userAgent: request.headers.get('user-agent') || 'unknown',
          ipAddress: request.headers.get('cf-connecting-ip') || 'unknown',
          // Clear unsubscribe data
          unsubscribedAt: undefined
        };

        // Update subscription in KV
        await kv.put(
          `newsletter:${sanitizedEmail}`, 
          JSON.stringify(resubscriptionRecord),
          { expirationTtl: 60 * 60 * 24 * 365 * 2 } // 2 years
        );

        // Also update by ID
        await kv.put(
          `newsletter_id:${existingData.id}`, 
          JSON.stringify(resubscriptionRecord),
          { expirationTtl: 60 * 60 * 24 * 365 * 2 } // 2 years
        );

        // Send re-subscription confirmation email if Resend is configured
        if (resendKey) {
          try {
            const resubscriptionHtml = generateNewsletterResubscriptionEmail(sanitizedEmail, existingData.id);
            
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Manny <manny@mannyknows.com>',
                to: [sanitizedEmail],
                subject: '🎉 Welcome Back to AI Insights - You\'re Subscribed Again!',
                html: resubscriptionHtml
              })
            });
          } catch (emailError) {
            console.error('Failed to send re-subscription confirmation:', emailError);
            // Continue without failing - subscription is still valid
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Welcome back! You have been re-subscribed to our newsletter.',
          subscriptionId: existingData.id,
          type: 'resubscription'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate subscription ID and record for new subscribers
    const subscriptionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const subscriptionRecord = {
      id: subscriptionId,
      email: sanitizedEmail,
      subscribedAt: timestamp,
      lastSubscribedAt: timestamp,
      status: 'active',
      source: 'website_footer',
      userAgent: request.headers.get('user-agent') || 'unknown',
      ipAddress: request.headers.get('cf-connecting-ip') || 'unknown',
      resubscriptionCount: 0
    };

    // Store subscription in KV
    await kv.put(
      `newsletter:${sanitizedEmail}`, 
      JSON.stringify(subscriptionRecord),
      { expirationTtl: 60 * 60 * 24 * 365 * 2 } // 2 years
    );

    // Also store by ID for easy management
    await kv.put(
      `newsletter_id:${subscriptionId}`, 
      JSON.stringify(subscriptionRecord),
      { expirationTtl: 60 * 60 * 24 * 365 * 2 } // 2 years
    );

    // Send confirmation email if Resend is configured
    if (resendKey) {
      try {
        const confirmationHtml = generateNewsletterConfirmationEmail(sanitizedEmail, subscriptionId);
        
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Manny <manny@mannyknows.com>',
            to: [sanitizedEmail],
            subject: '✨ Welcome to AI Insights - Your Subscription is Confirmed!',
            html: confirmationHtml
          })
        });
      } catch (emailError) {
        console.error('Failed to send newsletter confirmation:', emailError);
        // Continue without failing - subscription is still valid
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for subscribing! Check your email for confirmation.',
      subscriptionId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process subscription. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Generate newsletter confirmation email HTML
function generateNewsletterConfirmationEmail(email: string, subscriptionId: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to AI Insights - MannyKnows</title>
      <style>
        body { margin: 0; padding: 0; background: #fafafa; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; margin-bottom: 20px; }
        .header { text-align: center; margin-bottom: 32px; }
        .brand { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; font-weight: 900; font-size: 24px; padding: 12px 20px; border-radius: 12px; margin-bottom: 8px; }
        .subtitle { color: #71717a; font-size: 16px; font-weight: 500; }
        .content { margin-bottom: 24px; text-align: center; }
        .welcome-message { color: #18181b; font-size: 18px; margin-bottom: 24px; }
        .features { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left; }
        .feature { display: flex; align-items: flex-start; margin-bottom: 16px; }
        .feature-icon { color: #10d1ff; margin-right: 12px; font-size: 18px; }
        .feature-text { color: #18181b; font-size: 14px; }
        .footer { text-align: center; color: #a1a1aa; font-size: 14px; margin-top: 32px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .unsubscribe { color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 20px; }
        .unsubscribe a { color: #a1a1aa; text-decoration: underline; }
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
            <div class="subtitle">AI Insights Newsletter</div>
          </div>
          <div class="content">
            <div class="welcome-message">
              🎉 <strong>Welcome to AI Insights!</strong><br>
              Your subscription to our exclusive newsletter is confirmed.
            </div>
            
            <div class="features">
              <div class="feature">
                <div class="feature-icon">🤖</div>
                <div class="feature-text">
                  <strong>AI Tips & Trends</strong><br>
                  Latest insights on AI tools and automation for your business
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">💡</div>
                <div class="feature-text">
                  <strong>Exclusive Content</strong><br>
                  Behind-the-scenes tips and strategies not shared anywhere else
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">🚀</div>
                <div class="feature-text">
                  <strong>Growth Strategies</strong><br>
                  Actionable advice to scale your business with technology
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📧</div>
                <div class="feature-text">
                  <strong>Weekly Delivery</strong><br>
                  Fresh insights delivered to your inbox every week
                </div>
              </div>
            </div>

            <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">
              You'll receive your first newsletter within the next few days. In the meantime, explore our AI-powered tools and services.
            </p>

            <a href="https://mannyknows.com" class="btn">Explore AI Tools →</a>
          </div>
          <div class="footer">
            This confirmation was sent to: <strong>${email}</strong><br>
            MannyKnows - AI-powered business solutions
          </div>
        </div>
        
        <div class="unsubscribe">
          <p>Don't want to receive these emails? <a href="https://mannyknows.com/unsubscribe?id=${subscriptionId}">Unsubscribe here</a></p>
          <p>Subscription ID: ${subscriptionId}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate newsletter re-subscription email HTML
function generateNewsletterResubscriptionEmail(email: string, subscriptionId: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome Back to AI Insights - MannyKnows</title>
      <style>
        body { margin: 0; padding: 0; background: #fafafa; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; margin-bottom: 20px; }
        .header { text-align: center; margin-bottom: 32px; }
        .brand { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; font-weight: 900; font-size: 24px; padding: 12px 20px; border-radius: 12px; margin-bottom: 8px; }
        .subtitle { color: #71717a; font-size: 16px; font-weight: 500; }
        .content { margin-bottom: 24px; text-align: center; }
        .welcome-message { color: #18181b; font-size: 18px; margin-bottom: 24px; }
        .welcome-back { background: linear-gradient(135deg, #10d1ff10 0%, #ff4faa10 100%); border: 1px solid #10d1ff30; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; }
        .features { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left; }
        .feature { display: flex; align-items: flex-start; margin-bottom: 16px; }
        .feature-icon { color: #10d1ff; margin-right: 12px; font-size: 18px; }
        .feature-text { color: #18181b; font-size: 14px; }
        .footer { text-align: center; color: #a1a1aa; font-size: 14px; margin-top: 32px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .unsubscribe { color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 20px; }
        .unsubscribe a { color: #a1a1aa; text-decoration: underline; }
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
            <div class="subtitle">AI Insights Newsletter</div>
          </div>
          <div class="content">
            <div class="welcome-back">
              <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
              <div style="font-size: 20px; font-weight: 600; color: #18181b; margin-bottom: 8px;">Welcome Back!</div>
              <div style="color: #71717a; font-size: 14px;">You've successfully re-subscribed to AI Insights</div>
            </div>
            
            <div class="welcome-message">
              Great to have you back! You're now re-subscribed to our exclusive AI Insights newsletter.
            </div>
            
            <div class="features">
              <div class="feature">
                <div class="feature-icon">🚀</div>
                <div class="feature-text">
                  <strong>What's New</strong><br>
                  Since you've been away, we've added even more AI insights and trends
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">💡</div>
                <div class="feature-text">
                  <strong>Fresh Content</strong><br>
                  New strategies, tools, and exclusive tips you won't find anywhere else
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📈</div>
                <div class="feature-text">
                  <strong>Latest Trends</strong><br>
                  Stay ahead with the newest developments in AI and business automation
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📧</div>
                <div class="feature-text">
                  <strong>Weekly Updates</strong><br>
                  Fresh insights delivered every week, just as you remember
                </div>
              </div>
            </div>

            <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">
              You'll continue receiving our weekly newsletter with the latest AI insights and business growth strategies.
            </p>

            <a href="https://mannyknows.com" class="btn">Explore What's New →</a>
          </div>
          <div class="footer">
            This confirmation was sent to: <strong>${email}</strong><br>
            MannyKnows - AI-powered business solutions
          </div>
        </div>
        
        <div class="unsubscribe">
          <p>Don't want to receive these emails? <a href="https://mannyknows.com/unsubscribe?id=${subscriptionId}">Unsubscribe here</a></p>
          <p>Subscription ID: ${subscriptionId}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
