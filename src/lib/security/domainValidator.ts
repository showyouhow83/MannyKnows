/**
 * Domain and Origin Validation Security
 * Prevents unauthorized API access from external domains
 */

export interface DomainConfig {
  allowedOrigins: string[];
  allowedReferers: string[];
  blockUnknownOrigins: boolean;
  enforceReferer: boolean;
}

export class DomainValidator {
  private config: DomainConfig;

  constructor(config?: Partial<DomainConfig>) {
    this.config = {
      allowedOrigins: [
        'https://mannyknows.com',
        'https://www.mannyknows.com'
      ],
      allowedReferers: [
        'https://mannyknows.com/',
        'https://www.mannyknows.com/'
      ],
      blockUnknownOrigins: true,
      enforceReferer: false, // Can be strict for sensitive operations
      ...config
    };
  }

  /**
   * Validate request origin and referer
   */
  validateRequest(request: Request): {
    valid: boolean;
    reason?: string;
    origin?: string;
    referer?: string;
  } {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Check Origin header
    if (origin) {
      if (!this.isAllowedOrigin(origin)) {
        return {
          valid: false,
          reason: 'Invalid origin',
          origin,
          referer: referer || undefined
        };
      }
    } else if (this.config.blockUnknownOrigins) {
      // Block requests without origin (except GET requests)
      if (request.method !== 'GET') {
        return {
          valid: false,
          reason: 'Missing origin header',
          referer: referer || undefined
        };
      }
    }

    // Check Referer header (optional but recommended)
    if (this.config.enforceReferer && referer) {
      if (!this.isAllowedReferer(referer)) {
        return {
          valid: false,
          reason: 'Invalid referer',
          origin: origin || undefined,
          referer
        };
      }
    }

    return {
      valid: true,
      origin: origin || undefined,
      referer: referer || undefined
    };
  }

  /**
   * Check if origin is allowed
   */
  private isAllowedOrigin(origin: string): boolean {
    // Exact match check
    if (this.config.allowedOrigins.includes(origin)) {
      return true;
    }

    // Check for development environments
    if (this.isDevelopment()) {
      // Allow localhost with any port for development
      const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      if (localhostPattern.test(origin)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if referer is allowed
   */
  private isAllowedReferer(referer: string): boolean {
    // Check if referer starts with any allowed domain
    return this.config.allowedReferers.some(allowed => 
      referer.startsWith(allowed)
    );
  }

  /**
   * Check if we're in development mode
   */
  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || 
           typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  }

  /**
   * Create CORS headers for allowed origins
   */
  getCORSHeaders(requestOrigin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400' // 24 hours
    };

    // Set specific origin if it's allowed, otherwise use the first allowed origin
    if (requestOrigin && this.isAllowedOrigin(requestOrigin)) {
      headers['Access-Control-Allow-Origin'] = requestOrigin;
    } else {
      headers['Access-Control-Allow-Origin'] = this.config.allowedOrigins[0];
    }

    return headers;
  }

  /**
   * Create error response for invalid domain
   */
  createDomainErrorResponse(validation: ReturnType<typeof this.validateRequest>): Response {
    return new Response(JSON.stringify({
      error: 'Access denied: Invalid domain or origin',
      reason: validation.reason,
      timestamp: new Date().toISOString()
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Blocked-Reason': validation.reason || 'Unknown'
      }
    });
  }

  /**
   * Log security violation
   */
  async logSecurityViolation(
    validation: ReturnType<typeof this.validateRequest>, 
    request: Request,
    kv?: any
  ): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      type: 'DOMAIN_VIOLATION',
      reason: validation.reason,
      origin: validation.origin,
      referer: validation.referer,
      ip: request.headers.get('CF-Connecting-IP') || 
          request.headers.get('X-Forwarded-For') || 'unknown',
      userAgent: request.headers.get('User-Agent') || 'unknown',
      method: request.method,
      url: request.url
    };

    // Log to console in development
    if (this.isDevelopment()) {
      console.warn('🚨 Domain Security Violation:', logData);
    }

    // Store in KV for analysis (optional)
    if (kv) {
      try {
        const logKey = `security_log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        await kv.put(logKey, JSON.stringify(logData), { expirationTtl: 604800 }); // 7 days
      } catch (error) {
        console.error('Failed to log security violation:', error);
      }
    }
  }

  /**
   * Public methods for security status monitoring
   */
  getAllowedDomains(): string[] {
    return [...this.config.allowedOrigins];
  }

  isDevMode(): boolean {
    return this.isDevelopment();
  }
}

export default DomainValidator;
