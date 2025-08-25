/**
 * Advanced Rate Limiter for Admin Endpoints
 * Prevents brute force attacks and abuse
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
  skipSuccessfulRequests: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
  reason?: string;
}

export class AdminRateLimiter {
  private kv: any;
  private configs: Map<string, RateLimitConfig>;

  constructor(kv: any) {
    this.kv = kv;
    this.configs = new Map([
      ['admin_login', {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 login attempts per 15 minutes
        blockDurationMs: 30 * 60 * 1000, // 30 minute block
        skipSuccessfulRequests: true
      }],
      ['admin_api', {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 API calls per minute
        blockDurationMs: 5 * 60 * 1000, // 5 minute block
        skipSuccessfulRequests: false
      }],
      ['admin_newsletter_export', {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 5, // 5 exports per hour
        blockDurationMs: 60 * 60 * 1000, // 1 hour block
        skipSuccessfulRequests: false
      }]
    ]);
  }

  /**
   * Check rate limit for admin operations
   */
  async checkAdminRateLimit(
    identifier: string, 
    action: string, 
    success: boolean = false
  ): Promise<RateLimitResult> {
    const config = this.configs.get(action);
    if (!config) {
      return { allowed: true, remaining: 999, resetTime: 0, blocked: false };
    }

    const now = Date.now();
    const windowKey = `rate_limit:${action}:${identifier}:${Math.floor(now / config.windowMs)}`;
    const blockKey = `rate_limit_block:${action}:${identifier}`;

    // Check if currently blocked
    const blockData = await this.kv.get(blockKey);
    if (blockData) {
      const blockInfo = JSON.parse(blockData);
      if (now < blockInfo.unblockTime) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockInfo.unblockTime,
          blocked: true,
          reason: 'IP temporarily blocked due to rate limit violation'
        };
      } else {
        // Block expired, remove it
        await this.kv.delete(blockKey);
      }
    }

    // Skip counting if it's a successful request and config says to skip
    if (success && config.skipSuccessfulRequests) {
      return { allowed: true, remaining: config.maxRequests, resetTime: 0, blocked: false };
    }

    // Get current request count
    let requestCount = 0;
    const countData = await this.kv.get(windowKey);
    if (countData) {
      requestCount = parseInt(countData);
    }

    // Check if limit exceeded
    if (requestCount >= config.maxRequests) {
      // Block the identifier
      const blockInfo = {
        blockedAt: now,
        unblockTime: now + config.blockDurationMs,
        reason: `Rate limit exceeded for ${action}`,
        requestCount
      };

      await this.kv.put(
        blockKey, 
        JSON.stringify(blockInfo),
        { expirationTtl: Math.floor(config.blockDurationMs / 1000) }
      );

      return {
        allowed: false,
        remaining: 0,
        resetTime: blockInfo.unblockTime,
        blocked: true,
        reason: `Rate limit exceeded. Blocked for ${Math.floor(config.blockDurationMs / 60000)} minutes.`
      };
    }

    // Increment counter
    const newCount = requestCount + 1;
    await this.kv.put(
      windowKey, 
      newCount.toString(),
      { expirationTtl: Math.floor(config.windowMs / 1000) }
    );

    const windowEnd = Math.floor(now / config.windowMs + 1) * config.windowMs;

    return {
      allowed: true,
      remaining: config.maxRequests - newCount,
      resetTime: windowEnd,
      blocked: false
    };
  }

  /**
   * Get rate limit status without incrementing
   */
  async getRateLimitStatus(identifier: string, action: string): Promise<RateLimitResult> {
    const config = this.configs.get(action);
    if (!config) {
      return { allowed: true, remaining: 999, resetTime: 0, blocked: false };
    }

    const now = Date.now();
    const windowKey = `rate_limit:${action}:${identifier}:${Math.floor(now / config.windowMs)}`;
    const blockKey = `rate_limit_block:${action}:${identifier}`;

    // Check if blocked
    const blockData = await this.kv.get(blockKey);
    if (blockData) {
      const blockInfo = JSON.parse(blockData);
      if (now < blockInfo.unblockTime) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockInfo.unblockTime,
          blocked: true,
          reason: 'Currently blocked'
        };
      }
    }

    // Get current count
    let requestCount = 0;
    const countData = await this.kv.get(windowKey);
    if (countData) {
      requestCount = parseInt(countData);
    }

    const windowEnd = Math.floor(now / config.windowMs + 1) * config.windowMs;

    return {
      allowed: requestCount < config.maxRequests,
      remaining: Math.max(0, config.maxRequests - requestCount),
      resetTime: windowEnd,
      blocked: false
    };
  }

  /**
   * Clear rate limit for identifier (admin override)
   */
  async clearRateLimit(identifier: string, action: string): Promise<void> {
    const now = Date.now();
    const windowKey = `rate_limit:${action}:${identifier}:${Math.floor(now / this.configs.get(action)!.windowMs)}`;
    const blockKey = `rate_limit_block:${action}:${identifier}`;

    await this.kv.delete(windowKey);
    await this.kv.delete(blockKey);
  }
}

export default AdminRateLimiter;
