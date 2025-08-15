/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Generates and validates tokens to prevent unauthorized form submissions
 */

export interface CSRFConfig {
  tokenLength: number;
  sessionTimeout: number; // in milliseconds
  enforceHTTPS: boolean;
  requireDoubleSubmit: boolean;
}

export interface CSRFToken {
  token: string;
  created: number;
  sessionId: string;
  expires: number;
}

export class CSRFProtection {
  private kv: any;
  private config: CSRFConfig;

  constructor(kv: any, config?: Partial<CSRFConfig>) {
    this.kv = kv;
    this.config = {
      tokenLength: 32,
      sessionTimeout: 3600000, // 1 hour
      enforceHTTPS: true,
      requireDoubleSubmit: false,
      ...config
    };
  }

  /**
   * Generate a new CSRF token for a session
   */
  async generateToken(sessionId: string): Promise<string> {
    const token = this.createRandomToken();
    const now = Date.now();
    
    const csrfData: CSRFToken = {
      token,
      created: now,
      sessionId,
      expires: now + this.config.sessionTimeout
    };

    // Store token in KV with expiration
    const key = `csrf:${token}`;
    const ttl = Math.ceil(this.config.sessionTimeout / 1000);
    await this.kv.put(key, JSON.stringify(csrfData), { expirationTtl: ttl });

    // Also store by session for lookup
    const sessionKey = `csrf_session:${sessionId}`;
    await this.kv.put(sessionKey, token, { expirationTtl: ttl });

    return token;
  }

  /**
   * Validate a CSRF token
   */
  async validateToken(
    token: string, 
    sessionId: string, 
    request?: Request
  ): Promise<{ valid: boolean; reason?: string }> {
    if (!token) {
      return { valid: false, reason: 'Missing CSRF token' };
    }

    // Check HTTPS enforcement
    if (this.config.enforceHTTPS && request) {
      const url = new URL(request.url);
      const protocol = request.headers.get('x-forwarded-proto') || 
                      request.headers.get('cf-visitor') || 
                      url.protocol;
      const hostname = url.hostname;
      
      // Allow HTTP for localhost/development
      const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.local');
      
      // For Cloudflare, check cf-visitor header
      let isHttps = protocol === 'https:';
      if (!isHttps && request.headers.get('cf-visitor')) {
        try {
          const cfVisitor = JSON.parse(request.headers.get('cf-visitor') || '{}');
          isHttps = cfVisitor.scheme === 'https';
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      
      if (!isHttps && !isLocalDev) {
        return { valid: false, reason: 'CSRF token requires HTTPS' };
      }
    }

    try {
      // Get token data from KV
      const key = `csrf:${token}`;
      const tokenDataStr = await this.kv.get(key);
      
      if (!tokenDataStr) {
        return { valid: false, reason: 'Invalid or expired CSRF token' };
      }

      const tokenData: CSRFToken = JSON.parse(tokenDataStr);

      // Check expiration
      if (Date.now() > tokenData.expires) {
        // Clean up expired token
        await this.kv.delete(key);
        return { valid: false, reason: 'CSRF token expired' };
      }

      // Check session match
      if (tokenData.sessionId !== sessionId) {
        return { valid: false, reason: 'CSRF token session mismatch' };
      }

      return { valid: true };

    } catch (error) {
      console.error('CSRF validation error:', error);
      return { valid: false, reason: 'CSRF validation failed' };
    }
  }

  /**
   * Create CSRF middleware for API routes with pre-parsed body
   */
  async validateRequestWithBody(
    request: Request, 
    sessionId: string,
    body: any
  ): Promise<{ valid: boolean; reason?: string; token?: string }> {
    // Only validate state-changing operations
    if (!this.requiresCSRFValidation(request.method)) {
      return { valid: true };
    }

    let token: string | undefined;

    // Check for token in headers (for AJAX requests)
    token = request.headers.get('x-csrf-token') || undefined;

    // Check for token in provided body
    if (!token && body && typeof body === 'object') {
      token = body.csrf_token;
    }

    if (!token) {
      return { valid: false, reason: 'CSRF token missing from request' };
    }

    const validation = await this.validateToken(token, sessionId, request);
    return { ...validation, token };
  }

  /**
   * Create CSRF middleware for API routes
   */
  async validateRequest(
    request: Request, 
    sessionId: string
  ): Promise<{ valid: boolean; reason?: string; token?: string }> {
    // Only validate state-changing operations
    if (!this.requiresCSRFValidation(request.method)) {
      return { valid: true };
    }

    let token: string | undefined;

    // Check for token in headers (for AJAX requests)
    token = request.headers.get('x-csrf-token') || undefined;

    // Check for token in body (for form submissions)
    if (!token && request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.clone().json();
        token = body.csrf_token;
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    if (!token) {
      return { valid: false, reason: 'CSRF token missing from request' };
    }

    const validation = await this.validateToken(token, sessionId, request);
    return { ...validation, token };
  }

  /**
   * Get or create CSRF token for session
   */
  async getSessionToken(sessionId: string): Promise<string> {
    try {
      // Check if session already has a token
      const sessionKey = `csrf_session:${sessionId}`;
      const existingToken = await this.kv.get(sessionKey);
      
      if (existingToken) {
        // Verify the token is still valid
        const validation = await this.validateToken(existingToken, sessionId);
        if (validation.valid) {
          return existingToken;
        }
      }

      // Generate new token
      return await this.generateToken(sessionId);
    } catch (error) {
      console.error('Error getting session token:', error);
      return await this.generateToken(sessionId);
    }
  }

  /**
   * Clean up expired tokens for a session
   */
  async cleanupSession(sessionId: string): Promise<void> {
    try {
      const sessionKey = `csrf_session:${sessionId}`;
      const token = await this.kv.get(sessionKey);
      
      if (token) {
        await this.kv.delete(`csrf:${token}`);
        await this.kv.delete(sessionKey);
      }
    } catch (error) {
      console.error('Error cleaning up CSRF session:', error);
    }
  }

  /**
   * Create CSRF error response
   */
  createCSRFErrorResponse(reason: string): Response {
    return new Response(JSON.stringify({
      error: 'CSRF Protection: Request blocked',
      reason,
      timestamp: new Date().toISOString(),
      helpMessage: 'This request was blocked for security reasons. Please refresh the page and try again.'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Protection': 'blocked'
      }
    });
  }

  /**
   * Generate client-side CSRF helper script
   */
  generateClientScript(token: string): string {
    return `
      // CSRF Protection Client Helper
      window.MannyKnowsCSRF = {
        token: '${token}',
        
        // Add CSRF token to fetch requests
        fetch: function(url, options = {}) {
          const headers = options.headers || {};
          headers['X-CSRF-Token'] = this.token;
          return fetch(url, { ...options, headers });
        },
        
        // Add CSRF token to form data
        addToForm: function(formData) {
          formData.append('csrf_token', this.token);
          return formData;
        },
        
        // Add CSRF token to JSON payloads
        addToJSON: function(data) {
          return { ...data, csrf_token: this.token };
        }
      };
    `;
  }

  /**
   * Helper methods
   */
  private createRandomToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < this.config.tokenLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private requiresCSRFValidation(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }
}

export default CSRFProtection;
