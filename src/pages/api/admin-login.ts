import type { APIRoute } from 'astro';
import { AdminAuthenticator } from '../../lib/security/adminAuthenticator.js';
import { AdminRateLimiter } from '../../lib/security/adminRateLimiter.js';
import { InputValidator } from '../../lib/security/inputValidator.js';
import { CSRFProtection } from '../../lib/security/csrfProtection.js';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!kv) {
      return new Response(JSON.stringify({ 
        error: 'Service temporarily unavailable' 
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limiting for login attempts
    const rateLimiter = new AdminRateLimiter(kv);
    const rateResult = await rateLimiter.checkAdminRateLimit(clientIP, 'admin_login');
    
    if (!rateResult.allowed) {
      return new Response(JSON.stringify({
        error: 'Too many login attempts',
        message: rateResult.reason,
        resetTime: rateResult.resetTime
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request
    const body = await request.json();
    const { email, adminKey, csrf_token, session_id } = body;

    // CSRF protection
    const csrfProtection = new CSRFProtection(kv);
    const csrfResult = await csrfProtection.validateRequestWithBody(
      request, 
      session_id || 'anonymous', 
      body
    );
    
    if (!csrfResult.valid) {
      return new Response(JSON.stringify({
        error: 'Security validation failed',
        message: 'Invalid request token'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Input validation
    const loginSchema = {
      email: {
        required: true,
        type: 'email' as const,
        sanitize: true
      },
      adminKey: {
        required: true,
        type: 'string' as const,
        minLength: 10,
        maxLength: 200,
        sanitize: true
      }
    };

    const validationResult = InputValidator.validate({ email, adminKey }, loginSchema);
    if (!validationResult.valid) {
      return new Response(JSON.stringify({
        error: 'Invalid input',
        details: validationResult.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify admin credentials
    const storedAdminKey = (locals as any).runtime?.env?.ADMIN_KEY;
    const allowedAdminEmail = (locals as any).runtime?.env?.ADMIN_EMAIL || 'mk@mannyknows.com';
    
    const keyValid = storedAdminKey && adminKey === storedAdminKey;
    const emailValid = validationResult.sanitizedData.email === allowedAdminEmail;

    if (!keyValid || !emailValid) {
      // Log failed attempt
      const authenticator = new AdminAuthenticator(kv);
      await authenticator.logAdminAccess(
        'login_failed', 
        validationResult.sanitizedData.email, 
        clientIP, 
        userAgent,
        { reason: 'Invalid credentials' }
      );

      // Update rate limit as failed attempt
      await rateLimiter.checkAdminRateLimit(clientIP, 'admin_login', false);

      return new Response(JSON.stringify({
        error: 'Authentication failed',
        message: 'Invalid admin credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create secure admin session
    const authenticator = new AdminAuthenticator(kv, {
      sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
      allowedIPs: [], // Configure IP whitelist if needed
      maxConcurrentSessions: 3
    });

    const sessionToken = await authenticator.createAdminSession(
      validationResult.sanitizedData.email,
      clientIP,
      userAgent
    );

    // Generate one-time token for API access
    const apiToken = await authenticator.generateOneTimeToken(
      validationResult.sanitizedData.email,
      'api_access',
      120 // 2 hours
    );

    // Clear rate limit on successful login
    await rateLimiter.checkAdminRateLimit(clientIP, 'admin_login', true);

    return new Response(JSON.stringify({
      success: true,
      message: 'Authentication successful',
      sessionToken,
      apiToken,
      expiresAt: Date.now() + (2 * 60 * 60 * 1000),
      permissions: ['newsletter_view', 'newsletter_export', 'admin_logs']
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `admin_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=7200; Path=/api/`
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return new Response(JSON.stringify({
      error: 'Authentication system error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  // Return CSRF token for admin login form
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
    const csrfProtection = new CSRFProtection(kv);
    const sessionId = crypto.randomUUID();
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
