// Admin Authentication Library
// Secure session-based authentication for admin panel
// Uses HMAC-SHA256 signed tokens to prevent session forgery
// Supports multi-user authentication via D1 database

export interface AdminSession {
  isAuthenticated: boolean;
  username?: string;
  displayName?: string;
  role?: string;
  loginTime?: Date;
  expiresAt?: Date;
}

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  salt: string;
  display_name?: string;
  email?: string;
  role: string;
  status: string;
  last_login?: string;
  login_count: number;
}

// HMAC signing utilities using Web Crypto API
async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  // Convert to base64url (URL-safe base64)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createHmacSignature(data, secret);
  // Constant-time comparison to prevent timing attacks
  if (expectedSignature.length !== signature.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

// Get signing secret from environment or use fallback for development
// In production, SESSION_SECRET should be set via wrangler secret
function getSessionSecret(): string {
  // Check if we're in a context where env is available (will be overridden in actual calls)
  // This is a fallback - the actual secret should come from the environment
  return process.env.SESSION_SECRET ||
         process.env.ADMIN_PASSWORD ||
         'mk-session-secret-change-in-production';
}

// =====================================================
// PASSWORD HASHING (PBKDF2-SHA256)
// =====================================================

// Generate a random salt
export async function generateSalt(): Promise<string> {
  const saltBuffer = new Uint8Array(16);
  crypto.getRandomValues(saltBuffer);
  return btoa(String.fromCharCode(...saltBuffer));
}

// Hash password with PBKDF2-SHA256
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const saltData = encoder.encode(salt);

  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key with PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  // Convert to base64
  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  // Constant-time comparison
  if (computedHash.length !== hash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

// Helper: returns a 403 Response if the session role is 'viewer'
export function viewerGuard(session: AdminSession): Response | null {
  if (session.role === 'viewer') {
    return new Response(JSON.stringify({
      success: false,
      error: 'View-only access. Contact admin for changes.'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}

// Constant-time string comparison. Hashes both inputs to fixed-length SHA-256
// digests first, so neither the content nor the length leaks via timing.
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let r = 0;
  for (let i = 0; i < va.length; i++) r |= va[i] ^ vb[i];
  return r === 0;
}

export class AdminAuth {
  private static SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours (was 7d: shorter-lived, matches docs)
  private static SESSION_KEY = 'mk_admin_session';

  // Validate admin session from request
  // Now accepts optional secret parameter for Workers environment
  static async validateSession(request: Request, secret?: string): Promise<AdminSession> {
    try {
      const signingSecret = secret || getSessionSecret();

      // Check session cookie
      const cookies = request.headers.get('cookie');
      if (!cookies) {
        return { isAuthenticated: false };
      }

      // Parse session cookie
      const sessionCookie = cookies
        .split(';')
        .find(c => c.trim().startsWith(`${this.SESSION_KEY}=`));

      if (!sessionCookie) {
        return { isAuthenticated: false };
      }

      const sessionValue = sessionCookie.split('=').slice(1).join('=').trim();
      if (!sessionValue) {
        return { isAuthenticated: false };
      }

      // Parse signed token: payload.signature
      const parts = sessionValue.split('.');
      if (parts.length !== 2) {
        console.warn('Invalid session format - missing signature');
        return { isAuthenticated: false };
      }

      const [payload, signature] = parts;

      // Verify HMAC signature
      const isValid = await verifyHmacSignature(payload, signature, signingSecret);
      if (!isValid) {
        console.warn('Invalid session signature - possible tampering');
        return { isAuthenticated: false };
      }

      // Decode and parse payload
      const decoded = JSON.parse(atob(payload));
      const expiresAt = new Date(decoded.expiresAt);

      // Check if session expired
      if (new Date() > expiresAt) {
        return { isAuthenticated: false };
      }

      return {
        isAuthenticated: true,
        username: decoded.username,
        role: decoded.role || 'admin',
        loginTime: new Date(decoded.loginTime),
        expiresAt: expiresAt
      };

    } catch (error) {
      console.error('Session validation error:', error);
      return { isAuthenticated: false };
    }
  }

  // Create admin session after successful login
  // Now accepts optional secret parameter for Workers environment
  static async createSession(username: string, secret?: string, role: string = 'admin'): Promise<{ sessionCookie: string; expiresAt: Date }> {
    const signingSecret = secret || getSessionSecret();
    const loginTime = new Date();
    const expiresAt = new Date(loginTime.getTime() + this.SESSION_DURATION);

    const sessionData = {
      username,
      role,
      loginTime: loginTime.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    // Create payload
    const payload = btoa(JSON.stringify(sessionData));

    // Sign with HMAC-SHA256
    const signature = await createHmacSignature(payload, signingSecret);

    // Combine: payload.signature
    const signedToken = `${payload}.${signature}`;

    // Cookie with HttpOnly, SameSite, and Secure flags
    const sessionCookie = `${this.SESSION_KEY}=${signedToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${this.SESSION_DURATION / 1000}; Secure`;

    return { sessionCookie, expiresAt };
  }

  // Create logout cookie
  static createLogoutCookie(): string {
    return `${this.SESSION_KEY}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
  }

  // Rate limiting for login attempts
  private static loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

  static checkRateLimit(ip: string): boolean {
    const now = new Date();
    const attempts = this.loginAttempts.get(ip);

    if (!attempts) {
      this.loginAttempts.set(ip, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset counter after 15 minutes
    if (now.getTime() - attempts.lastAttempt.getTime() > 15 * 60 * 1000) {
      this.loginAttempts.set(ip, { count: 1, lastAttempt: now });
      return true;
    }

    // Allow max 5 attempts per 15 minutes
    if (attempts.count >= 5) {
      return false;
    }

    attempts.count++;
    attempts.lastAttempt = now;
    return true;
  }
}
