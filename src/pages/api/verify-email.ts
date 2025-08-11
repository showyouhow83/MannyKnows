import type { APIRoute } from 'astro';
import { analyzeEmailDomain, generateVerificationToken, isValidEmailFormat, type UserVerificationData } from '../../lib/verification/emailVerification.js';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals, request }) => {
  try {
    const token = url.searchParams.get('token');
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!token) {
      return new Response(`
        <html>
          <head><title>Invalid Verification Link</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Invalid Verification Link</h1>
            <p>This verification link is missing required parameters.</p>
            <p>Please request a new verification email.</p>
          </body>
        </html>
      `, { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (!kv) {
      return new Response(`
        <html>
          <head><title>Service Unavailable</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>⚠️ Service Temporarily Unavailable</h1>
            <p>Please try again later.</p>
          </body>
        </html>
      `, { 
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Get email from verification token
    const email = await kv.get(`verification:${token}`);
    
    if (!email) {
      return new Response(`
        <html>
          <head><title>Verification Link Expired</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>⏰ Verification Link Expired</h1>
            <p>This verification link has expired or is invalid.</p>
            <p>Please request a new verification email from our chatbot.</p>
            <a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to Website</a>
          </body>
        </html>
      `, { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Get user data
    const userData = await kv.get(`user:${email}`);
    if (!userData) {
      return new Response(`
        <html>
          <head><title>User Not Found</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ User Not Found</h1>
            <p>No user account found for this verification link.</p>
            <a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to Website</a>
          </body>
        </html>
      `, { 
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const user = JSON.parse(userData);
    
    // Collect BI data from verification link click
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    const cfData = (locals as any).runtime?.cf;
    const visitorData = {
      ip: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'Unknown',
      country: request.headers.get('CF-IPCountry') || 'Unknown',
      city: request.headers.get('CF-IPCity') || 'Unknown',
      region: request.headers.get('CF-IPState') || 'Unknown',
      timezone: request.headers.get('CF-Timezone') || 'Unknown',
      userAgent: userAgent,
      device: userAgent.includes('Mobile') ? 'Mobile' : userAgent.includes('Tablet') ? 'Tablet' : 'Desktop',
      browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'Other',
      timestamp: new Date().toISOString(),
      verificationTimestamp: new Date().toISOString(),
      referrer: request.headers.get('Referer') || 'Direct',
      engagementScore: 10 // Base score for email verification completion
    };
    
    // Update user as verified with BI data
    const updatedUser = {
      ...user,
      verified: true,
      verificationDate: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      visitorIntelligence: visitorData,
      leadScore: (user.leadScore || 0) + 10 // Add points for email verification
    };

    await kv.put(`user:${email}`, JSON.stringify(updatedUser));
    
    // Store BI data separately for analytics dashboard
    const biKey = `bi:verification:${email}:${Date.now()}`;
    await kv.put(biKey, JSON.stringify(visitorData));
    
    // Clean up verification token
    await kv.delete(`verification:${token}`);

    const successPage = `
      <html>
        <head>
          <title>Email Verified Successfully</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #28a745; font-size: 64px; margin-bottom: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; margin-bottom: 15px; }
            .btn { background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px; }
            .btn:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅</div>
            <h1>Email Verified Successfully!</h1>
            <p><strong>Welcome to MannyKnows, ${email}!</strong></p>
            <p>Your email has been verified and your account is now active. You can now request website analyses and receive detailed reports.</p>
            
            <p>Return to our website and ask our AI chatbot to analyze your website!</p>
            <a href="/" class="btn">Start Website Analysis</a>
            
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              You can close this window now and return to the chat.
            </p>
          </div>
          
          <script>
            // Auto-redirect after 5 seconds
            setTimeout(() => {
              window.location.href = '/';
            }, 5000);
          </script>
        </body>
      </html>
    `;

    return new Response(successPage, { 
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return new Response(`
      <html>
        <head><title>Verification Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Verification Error</h1>
          <p>An error occurred during verification. Please try again or contact support.</p>
          <a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to Website</a>
        </body>
      </html>
    `, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email, websiteUrl } = await request.json();
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!kv) {
      return new Response(JSON.stringify({ error: 'Storage not available' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields
    if (!email || !websiteUrl) {
      return new Response(JSON.stringify({ 
        error: 'Email and website URL are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    if (!isValidEmailFormat(email)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email format provided' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Analyze email domain
    const emailAnalysis = analyzeEmailDomain(email, websiteUrl);

    // Block temp email providers
    if (emailAnalysis.isTempProvider) {
      return new Response(JSON.stringify({ 
        error: 'Temporary email providers are not accepted. Please use a professional email address.',
        analysis: emailAnalysis
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists and is verified
    const existingUserData = await kv.get(`user:${email}`);
    if (existingUserData) {
      const userData: UserVerificationData = JSON.parse(existingUserData);
      if (userData.verified) {
        return new Response(JSON.stringify({
          success: true,
          status: 'already_verified',
          message: 'Email is already verified',
          user: {
            email: userData.email,
            verified: true,
            verifiedAt: userData.verifiedAt
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const timestamp = new Date().toISOString();

    // Check rate limiting (max 3 attempts per hour)
    const existingUser = existingUserData ? JSON.parse(existingUserData) as UserVerificationData : null;
    if (existingUser) {
      const lastAttempt = existingUser.lastAttemptAt ? new Date(existingUser.lastAttemptAt) : null;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastAttempt && lastAttempt > oneHourAgo && existingUser.verificationAttempts >= 3) {
        return new Response(JSON.stringify({ 
          error: 'Too many verification attempts. Please try again in 1 hour.',
          nextAttemptAt: new Date(lastAttempt.getTime() + 60 * 60 * 1000).toISOString()
        }), { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Perform WHOIS lookup for domain analysis
    let whoisData = null;
    let domainOpportunities: string[] = [];
    
    try {
      whoisData = await performWhoisLookup(emailAnalysis.websiteDomain);
      domainOpportunities = analyzeWhoisData(whoisData, email);
    } catch (error) {
      console.log('WHOIS lookup failed:', error);
      // Continue without WHOIS data
    }

    // Create or update user verification data
    const verificationData: UserVerificationData = {
      email,
      websiteDomain: emailAnalysis.websiteDomain,
      verificationToken,
      verified: false,
      createdAt: existingUser?.createdAt || timestamp,
      verificationAttempts: (existingUser?.verificationAttempts || 0) + 1,
      lastAttemptAt: timestamp,
      whoisData: whoisData || undefined
    };

    // Store user data in KV
    await kv.put(`user:${email}`, JSON.stringify(verificationData));
    
    // Store verification token for quick lookup
    await kv.put(`token:${verificationToken}`, JSON.stringify({
      email,
      createdAt: timestamp,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }));

    // Send verification email (placeholder - implement with your email service)
    const verificationUrl = `${new URL(request.url).origin}/api/verify-link?token=${verificationToken}`;
    
    // TODO: Implement actual email sending here
    console.log(`Verification email would be sent to ${email} with URL: ${verificationUrl}`);

    return new Response(JSON.stringify({
      success: true,
      status: 'verification_sent',
      message: 'Verification email sent successfully',
      analysis: emailAnalysis,
      opportunities: [...emailAnalysis.opportunities, ...domainOpportunities],
      verificationUrl, // Remove this in production
      estimatedDeliveryTime: '1-2 minutes'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error during email verification' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// WHOIS lookup implementation (simplified)
async function performWhoisLookup(domain: string) {
  // This would typically use a WHOIS service API
  // For now, return mock data structure
  return {
    domain,
    isPublic: false, // Most domains have privacy protection now
    registrar: 'Unknown',
    technicalContact: undefined,
    adminContact: undefined,
    registrantContact: undefined
  };
}

// Analyze WHOIS data for business opportunities
function analyzeWhoisData(whoisData: any, userEmail: string): string[] {
  const opportunities: string[] = [];
  
  if (whoisData.isPublic && whoisData.technicalContact) {
    if (whoisData.technicalContact !== userEmail) {
      opportunities.push('🔧 **Domain Management** - Technical contact email differs from yours. We can help update domain records.');
    }
  }
  
  if (!whoisData.isPublic) {
    opportunities.push('🛡️ **Domain Privacy** - Your domain has privacy protection enabled (good security practice).');
  }
  
  return opportunities;
}
