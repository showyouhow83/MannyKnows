// User Profile Management System for Architecture 2
// Progressive engagement tracking and email collection

export interface UserProfile {
  id: string;
  type: 'anonymous' | 'verified';
  created: number;
  lastSeen: number;
  
  // Engagement Tracking
  interactions: number;
  sessionsCount: number;
  totalTimeSpent: number;
  
  // Trust & Engagement Scoring
  trustScore: number;
  engagementScore: number;
  
  // Service Usage
  freeServicesUsed: string[];
  premiumServicesAttempted: string[];
  premiumServicesUsed: string[];
  
  // Email Collection
  email?: string;
  emailRequested: boolean;
  emailRequestedAt?: number;
  emailVerified: boolean;
  emailVerifiedAt?: number;
  
  // Session Management
  currentSessionId: string;
  sessionIds: string[];
  
  // Business Intelligence
  preferences: Record<string, any>;
  behaviorPatterns: Record<string, any>;
  conversionPotential: number;
}

export class ProfileManager {
  private kv: any;

  constructor(kv: any) {
    this.kv = kv;
  }

  /**
   * Get or create user profile
   */
  async getUserProfile(sessionId: string): Promise<UserProfile> {
    // Try to get existing profile by session
    const sessionData = await this.kv.get(`session:${sessionId}`);
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session.profileId) {
        const profile = await this.kv.get(`profile:${session.profileId}`);
        if (profile) {
          const userProfile = JSON.parse(profile);
          userProfile.currentSessionId = sessionId;
          userProfile.lastSeen = Date.now();
          return userProfile;
        }
      }
    }

    // Create new anonymous profile
    const newProfile: UserProfile = {
      id: `anon_${crypto.randomUUID()}`,
      type: 'anonymous',
      created: Date.now(),
      lastSeen: Date.now(),
      interactions: 0,
      sessionsCount: 1,
      totalTimeSpent: 0,
      trustScore: 0,
      engagementScore: 0,
      freeServicesUsed: [],
      premiumServicesAttempted: [],
      premiumServicesUsed: [],
      emailRequested: false,
      emailVerified: false,
      currentSessionId: sessionId,
      sessionIds: [sessionId],
      preferences: {},
      behaviorPatterns: {},
      conversionPotential: 0
    };

    await this.saveProfile(newProfile);
    await this.linkSessionToProfile(sessionId, newProfile.id);

    return newProfile;
  }

  /**
   * Update profile after interaction
   */
  async trackInteraction(profile: UserProfile, interactionType: string, metadata: Record<string, any> = {}): Promise<UserProfile> {
    profile.interactions++;
    profile.lastSeen = Date.now();
    
    // Update trust score based on interaction type
    const trustIncrement = this.calculateTrustIncrement(interactionType, metadata);
    profile.trustScore += trustIncrement;
    
    // Update engagement score
    profile.engagementScore = this.calculateEngagementScore(profile);
    
    // Update conversion potential
    profile.conversionPotential = this.calculateConversionPotential(profile);
    
    // Track behavior patterns
    this.updateBehaviorPatterns(profile, interactionType, metadata);
    
    await this.saveProfile(profile);
    return profile;
  }

  /**
   * Track service usage
   */
  async trackServiceUsage(profile: UserProfile, serviceName: string, serviceType: 'free' | 'premium', success: boolean = true): Promise<UserProfile> {
    if (serviceType === 'free' && success) {
      if (!profile.freeServicesUsed.includes(serviceName)) {
        profile.freeServicesUsed.push(serviceName);
      }
    } else if (serviceType === 'premium') {
      if (success) {
        if (!profile.premiumServicesUsed.includes(serviceName)) {
          profile.premiumServicesUsed.push(serviceName);
        }
      } else {
        // Attempted but failed (likely due to email requirement)
        if (!profile.premiumServicesAttempted.includes(serviceName)) {
          profile.premiumServicesAttempted.push(serviceName);
        }
      }
    }

    return await this.trackInteraction(profile, 'service_usage', {
      serviceName,
      serviceType,
      success
    });
  }

  /**
   * Mark email as requested
   */
  async markEmailRequested(profile: UserProfile): Promise<UserProfile> {
    profile.emailRequested = true;
    profile.emailRequestedAt = Date.now();
    
    return await this.trackInteraction(profile, 'email_requested');
  }

  /**
   * Verify user email
   */
  async verifyEmail(profile: UserProfile, email: string): Promise<UserProfile> {
    profile.email = email;
    profile.emailVerified = true;
    profile.emailVerifiedAt = Date.now();
    profile.type = 'verified';
    
    // Boost trust score for email verification
    profile.trustScore += 20;
    
    // Update profile ID to use email
    const oldId = profile.id;
    profile.id = `user:${email}`;
    
    // Save with new ID and clean up old ID
    await this.saveProfile(profile);
    await this.kv.delete(`profile:${oldId}`);
    
    return profile;
  }

  /**
   * Check if user should be asked for email
   */
  shouldRequestEmail(profile: UserProfile, context: { serviceName?: string; message?: string }): boolean {
    // Never ask if already requested or verified
    if (profile.emailRequested || profile.emailVerified) {
      return false;
    }

    const triggers = [
      // Engagement-based triggers
      profile.interactions >= 3,
      profile.freeServicesUsed.length >= 2,
      profile.trustScore >= 10,
      profile.engagementScore >= 15,
      
      // Premium service attempts
      profile.premiumServicesAttempted.length > 0,
      
      // Service-specific triggers
      context.serviceName === 'analyze_website',
      context.message?.toLowerCase().includes('detailed report'),
      context.message?.toLowerCase().includes('comprehensive analysis'),
      
      // High conversion potential
      profile.conversionPotential >= 0.7
    ];

    return triggers.some(Boolean);
  }

  /**
   * Calculate trust increment based on interaction
   */
  private calculateTrustIncrement(interactionType: string, metadata: Record<string, any>): number {
    const trustMap: Record<string, number> = {
      'message_sent': 1,
      'service_usage': 2,
      'free_service_completed': 3,
      'premium_service_attempted': 1,
      'email_provided': 5,
      'email_verified': 20,
      'return_visit': 2
    };

    return trustMap[interactionType] || 0;
  }

  /**
   * Calculate overall engagement score
   */
  private calculateEngagementScore(profile: UserProfile): number {
    const baseScore = profile.interactions * 2;
    const serviceBonus = profile.freeServicesUsed.length * 5;
    const discoveryCallBonus = profile.freeServicesUsed.includes('schedule_discovery_call') ? 25 : 0;
    const timeBonus = Math.min(profile.totalTimeSpent / 60000, 10); // Max 10 points for time
    const returnVisitBonus = profile.sessionsCount * 3;

    return Math.min(baseScore + serviceBonus + discoveryCallBonus + timeBonus + returnVisitBonus, 100);
  }

  /**
   * Calculate conversion potential (0-1 scale)
   */
  private calculateConversionPotential(profile: UserProfile): number {
    const factors = [
      profile.interactions >= 3 ? 0.2 : 0,
      profile.freeServicesUsed.length >= 2 ? 0.25 : 0,
      profile.premiumServicesAttempted.length > 0 ? 0.3 : 0,
      profile.freeServicesUsed.includes('schedule_discovery_call') ? 0.4 : 0, // Discovery call scheduled = high intent
      profile.trustScore >= 15 ? 0.15 : 0,
      profile.sessionsCount >= 2 ? 0.1 : 0
    ];

    return Math.min(factors.reduce((sum, factor) => sum + factor, 0), 1);
  }

  /**
   * Update behavior patterns
   */
  private updateBehaviorPatterns(profile: UserProfile, interactionType: string, metadata: Record<string, any>): void {
    if (!profile.behaviorPatterns[interactionType]) {
      profile.behaviorPatterns[interactionType] = 0;
    }
    profile.behaviorPatterns[interactionType]++;

    // Track time-based patterns
    const hour = new Date().getHours();
    const timeSlot = `hour_${hour}`;
    if (!profile.behaviorPatterns[timeSlot]) {
      profile.behaviorPatterns[timeSlot] = 0;
    }
    profile.behaviorPatterns[timeSlot]++;
  }

  /**
   * Save profile to KV storage
   */
  private async saveProfile(profile: UserProfile): Promise<void> {
    await this.kv.put(`profile:${profile.id}`, JSON.stringify(profile));
  }

  /**
   * Link session to profile
   */
  private async linkSessionToProfile(sessionId: string, profileId: string): Promise<void> {
    await this.kv.put(`session:${sessionId}`, JSON.stringify({ profileId }));
  }
}
