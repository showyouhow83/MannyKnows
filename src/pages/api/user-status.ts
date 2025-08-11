import type { APIRoute } from 'astro';
import type { UserVerificationData } from '../../lib/verification/emailVerification.js';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email } = await request.json();
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!kv) {
      return new Response(JSON.stringify({ error: 'Storage not available' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user verification status
    const userData = await kv.get(`user:${email}`);
    
    if (!userData) {
      return new Response(JSON.stringify({
        success: true,
        verified: false,
        status: 'not_found',
        message: 'User not found. Please start verification process.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user: UserVerificationData = JSON.parse(userData);

    // Return verification status and user profile data
    return new Response(JSON.stringify({
      success: true,
      verified: user.verified,
      status: user.verified ? 'verified' : 'pending_verification',
      user: {
        email: user.email,
        websiteDomain: user.websiteDomain,
        verified: user.verified,
        createdAt: user.createdAt,
        verifiedAt: user.verifiedAt,
        verificationAttempts: user.verificationAttempts,
        businessIntel: user.businessIntel ? {
          country: user.businessIntel.country,
          city: user.businessIntel.city,
          device: user.businessIntel.device,
          timestamp: user.businessIntel.timestamp
        } : undefined
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User status check error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error during status check' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
