/**
 * Advanced Rate Limiting System
 * Supports multiple tiers and sliding windows
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export interface RateLimitTiers {
  anonymous: RateLimitConfig;
  verified: RateLimitConfig;
  premium: RateLimitConfig;
  admin: RateLimitConfig;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  tier: string;
}

export class RateLimiter {
  private kv: any;
  private tiers: RateLimitTiers;

  constructor(kv: any) {
    this.kv = kv;
    this.tiers = {
      anonymous: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        message: 'Rate limit exceeded. Please wait before sending more messages.'
      },
      verified: {
        windowMs: 60 * 1000, // 1 minute  
        maxRequests: 60,
        message: 'Rate limit exceeded for verified users.'
      },
      premium: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 120,
        message: 'Rate limit exceeded for premium users.'
      },
      admin: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 1000, // Effectively unlimited
        message: 'Admin rate limit exceeded.'
      }
    };
  }

  /**
   * Check rate limit for a client
   */
  async checkRateLimit(
    clientIP: string, 
    userTier: 'anonymous' | 'verified' | 'premium' | 'admin' = 'anonymous'
  ): Promise<RateLimitResult> {
    const config = this.tiers[userTier];
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    
    // Create unique key for this IP, tier, and time window
    const key = `rate_limit:${userTier}:${clientIP}:${windowStart}`;
    
    try {
      // Get current count for this window
      const currentCountStr = await this.kv.get(key);
      const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;
      
      // Check if limit exceeded
      if (currentCount >= config.maxRequests) {
        const resetTime = windowStart + config.windowMs;
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          tier: userTier
        };
      }
      
      // Increment counter
      const newCount = currentCount + 1;
      const ttl = Math.ceil((windowStart + config.windowMs - now) / 1000);
      await this.kv.put(key, newCount.toString(), { expirationTtl: ttl });
      
      return {
        allowed: true,
        remaining: config.maxRequests - newCount,
        resetTime: windowStart + config.windowMs,
        tier: userTier
      };
      
    } catch (error) {
      // If KV fails, allow request but log error
      console.error('Rate limiter error:', error);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: windowStart + config.windowMs,
        tier: userTier
      };
    }
  }

  /**
   * Get rate limit headers for HTTP responses
   */
  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': this.tiers[result.tier as keyof RateLimitTiers].maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      'X-RateLimit-Tier': result.tier
    };
  }

  /**
   * Create rate limit error response
   */
  createRateLimitResponse(result: RateLimitResult): Response {
    const config = this.tiers[result.tier as keyof RateLimitTiers];
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    
    return new Response(JSON.stringify({
      error: config.message,
      retryAfter,
      tier: result.tier,
      resetTime: result.resetTime
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...this.getRateLimitHeaders(result)
      }
    });
  }

  /**
   * Determine user tier based on session/profile data
   */
  static getUserTier(profile: any, sessionData: any): 'anonymous' | 'verified' | 'premium' | 'admin' {
    // Admin check (if admin password or special header)
    if (sessionData?.isAdmin) {
      return 'admin';
    }

    // Premium user check
    if (profile?.tier === 'premium' || profile?.premiumServicesUsed?.length > 0) {
      return 'premium';
    }

    // Verified user check  
    if (profile?.verified || profile?.trustScore > 50) {
      return 'verified';
    }

    return 'anonymous';
  }
}

export default RateLimiter;
