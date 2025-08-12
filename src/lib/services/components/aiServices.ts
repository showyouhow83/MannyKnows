import type { ServiceComponent } from '../types/index';

/**
 * AI SERVICES - Internal services used by the AI agent
 * These are not directly exposed to users
 */

// Email Verification AI Service Component
export const emailVerificationAIComponent: ServiceComponent = {
  name: 'email_verification_ai',
  config: {
    enabled: true,
    priority: 1,
    timeout: 10000
  },
  async execute(input: any) {
    const { session_id, email, kv } = input;
    
    if (!session_id || !email || !kv) {
      throw new Error('Missing required parameters for email verification');
    }

    // Check if session already has verified email
    const existingSession = await kv.get(`session:${session_id}`);
    if (existingSession) {
      const sessionData = JSON.parse(existingSession);
      if (sessionData.verified && sessionData.userEmail === email) {
        return {
          status: 'already_verified',
          email: email,
          sessionData: sessionData,
          message: 'User already verified in this session'
        };
      }
    }

    // Check if user exists in KV
    const userData = await kv.get(`user:${email}`);
    if (userData) {
      const user = JSON.parse(userData);
      if (user.verified) {
        // Update session with verified email
        await kv.put(`session:${session_id}`, JSON.stringify({
          userEmail: email,
          verified: true,
          verifiedAt: new Date().toISOString(),
          userProfile: user
        }), { expirationTtl: 3600 });

        return {
          status: 'verified',
          email: email,
          userProfile: user,
          message: 'User verified and session updated'
        };
      }
    }

    // User needs verification
    return {
      status: 'needs_verification',
      email: email,
      message: 'User requires email verification before proceeding'
    };
  }
};

// Phone Verification AI Service Component (Future)
export const phoneVerificationAIComponent: ServiceComponent = {
  name: 'phone_verification_ai',
  config: {
    enabled: false, // Disabled until implemented
    priority: 2,
    timeout: 15000
  },
  async execute(input: any) {
    const { session_id, phone, kv } = input;
    
    // Future implementation for phone verification
    throw new Error('Phone verification not yet implemented');
  }
};

// Session Management AI Service Component
export const sessionManagementAIComponent: ServiceComponent = {
  name: 'session_management_ai',
  config: {
    enabled: true,
    priority: 0, // Highest priority
    timeout: 5000
  },
  async execute(input: any) {
    const { session_id, kv } = input;
    
    if (!session_id || !kv) {
      throw new Error('Missing session_id or kv for session management');
    }

    // Get current session data
    const sessionData = await kv.get(`session:${session_id}`);
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return {
        exists: true,
        data: session,
        verified: session.verified || false,
        userEmail: session.userEmail || null,
        userProfile: session.userProfile || null
      };
    }

    // Create new session
    const newSession = {
      created: new Date().toISOString(),
      verified: false,
      interactions: []
    };

    await kv.put(`session:${session_id}`, JSON.stringify(newSession), { 
      expirationTtl: 3600 
    });

    return {
      exists: false,
      data: newSession,
      verified: false,
      userEmail: null,
      userProfile: null
    };
  }
};
