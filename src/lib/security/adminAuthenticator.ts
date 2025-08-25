/**
 * Secure Admin Authentication System
 * Multi-layer security for newsletter administration
 */

export interface AdminSession {
  sessionId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
  lastAccess: number;
}

export interface AdminConfig {
  allowedIPs: string[];
  sessionTimeout: number; // in milliseconds
  maxConcurrentSessions: number;
  requireTwoFactor: boolean;
}

export class AdminAuthenticator {
  private kv: any;
  private config: AdminConfig;

  constructor(kv: any, config?: Partial<AdminConfig>) {
    this.kv = kv;
    this.config = {
      allowedIPs: [], // Empty means allow all IPs
      sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
      maxConcurrentSessions: 3,
      requireTwoFactor: false,
      ...config
    };
  }

  /**
   * Generate a secure admin session token
   */
  async createAdminSession(email: string, ipAddress: string, userAgent: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    
    const session: AdminSession = {
      sessionId,
      email,
      createdAt: now,
      expiresAt: now + this.config.sessionTimeout,
      ipAddress,
      userAgent,
      lastAccess: now
    };

    // Store session with expiration
    await this.kv.put(
      `admin_session:${sessionId}`, 
      JSON.stringify(session),
      { expirationTtl: Math.floor(this.config.sessionTimeout / 1000) }
    );

    // Log admin access
    await this.logAdminAccess('session_created', email, ipAddress, userAgent);

    return sessionId;
  }

  /**
   * Validate admin session and check security constraints
   */
  async validateAdminSession(sessionId: string, ipAddress: string, userAgent: string): Promise<{
    valid: boolean;
    session?: AdminSession;
    reason?: string;
  }> {
    try {
      // Check if session exists
      const sessionData = await this.kv.get(`admin_session:${sessionId}`);
      if (!sessionData) {
        return { valid: false, reason: 'Session not found' };
      }

      const session: AdminSession = JSON.parse(sessionData);

      // Check expiration
      if (Date.now() > session.expiresAt) {
        await this.kv.delete(`admin_session:${sessionId}`);
        return { valid: false, reason: 'Session expired' };
      }

      // Check IP address consistency (if configured)
      if (this.config.allowedIPs.length > 0 && !this.config.allowedIPs.includes(ipAddress)) {
        return { valid: false, reason: 'IP not allowed' };
      }

      // Check if IP changed during session (security feature)
      if (session.ipAddress !== ipAddress) {
        await this.kv.delete(`admin_session:${sessionId}`);
        await this.logAdminAccess('session_ip_change', session.email, ipAddress, userAgent, {
          originalIP: session.ipAddress,
          newIP: ipAddress
        });
        return { valid: false, reason: 'IP address changed' };
      }

      // Update last access time
      session.lastAccess = Date.now();
      await this.kv.put(
        `admin_session:${sessionId}`, 
        JSON.stringify(session),
        { expirationTtl: Math.floor(this.config.sessionTimeout / 1000) }
      );

      return { valid: true, session };

    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Generate secure one-time access token
   */
  async generateOneTimeToken(adminEmail: string, purpose: string, validForMinutes: number = 30): Promise<string> {
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiresAt = Date.now() + (validForMinutes * 60 * 1000);
    
    const tokenData = {
      token,
      adminEmail,
      purpose,
      createdAt: Date.now(),
      expiresAt,
      used: false
    };

    await this.kv.put(
      `one_time_token:${token}`, 
      JSON.stringify(tokenData),
      { expirationTtl: validForMinutes * 60 }
    );

    return token;
  }

  /**
   * Validate and consume one-time token
   */
  async validateOneTimeToken(token: string, purpose: string): Promise<{
    valid: boolean;
    adminEmail?: string;
    reason?: string;
  }> {
    try {
      const tokenData = await this.kv.get(`one_time_token:${token}`);
      if (!tokenData) {
        return { valid: false, reason: 'Token not found' };
      }

      const data = JSON.parse(tokenData);

      if (data.used) {
        return { valid: false, reason: 'Token already used' };
      }

      if (Date.now() > data.expiresAt) {
        await this.kv.delete(`one_time_token:${token}`);
        return { valid: false, reason: 'Token expired' };
      }

      if (data.purpose !== purpose) {
        return { valid: false, reason: 'Invalid token purpose' };
      }

      // Mark token as used
      data.used = true;
      await this.kv.put(`one_time_token:${token}`, JSON.stringify(data));

      return { valid: true, adminEmail: data.adminEmail };

    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Log admin access for security auditing
   */
  async logAdminAccess(action: string, email: string, ipAddress: string, userAgent: string, metadata?: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      email,
      ipAddress,
      userAgent,
      metadata: metadata || {}
    };

    const logKey = `admin_log:${Date.now()}-${crypto.randomUUID()}`;
    
    // Store log with 90-day retention
    await this.kv.put(
      logKey, 
      JSON.stringify(logEntry),
      { expirationTtl: 90 * 24 * 60 * 60 } // 90 days
    );
  }

  /**
   * Revoke admin session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const sessionData = await this.kv.get(`admin_session:${sessionId}`);
    if (sessionData) {
      const session: AdminSession = JSON.parse(sessionData);
      await this.logAdminAccess('session_revoked', session.email, session.ipAddress, session.userAgent);
    }
    
    await this.kv.delete(`admin_session:${sessionId}`);
  }

  /**
   * Get admin access logs
   */
  async getAdminLogs(limit: number = 100): Promise<any[]> {
    const logs = [];
    const { keys } = await this.kv.list({ prefix: 'admin_log:', limit });
    
    for (const key of keys) {
      try {
        const logData = await this.kv.get(key.name);
        if (logData) {
          logs.push(JSON.parse(logData));
        }
      } catch (error) {
        console.error(`Error reading log ${key.name}:`, error);
      }
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Check if IP is in allowed list
   */
  isIPAllowed(ipAddress: string): boolean {
    if (this.config.allowedIPs.length === 0) {
      return true; // Allow all if no restrictions
    }
    return this.config.allowedIPs.includes(ipAddress);
  }

  /**
   * Generate secure admin key with entropy
   */
  static generateSecureAdminKey(): string {
    const timestamp = Date.now().toString(36);
    const randomPart1 = crypto.randomUUID().replace(/-/g, '');
    const randomPart2 = crypto.randomUUID().replace(/-/g, '');
    return `mk_admin_${timestamp}_${randomPart1.substring(0, 16)}_${randomPart2.substring(0, 16)}`;
  }
}

export default AdminAuthenticator;
