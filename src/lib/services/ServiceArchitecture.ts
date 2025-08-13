// Service Architecture for Progressive Access Control
// Defines service tiers and access requirements

export interface ServiceDefinition {
  name: string;
  displayName: string;
  description: string;
  category: 'free' | 'premium' | 'enterprise';
  
  // Access Requirements
  accessLevel: 'public' | 'engaged' | 'verified' | 'premium';
  minInteractions?: number;
  minTrustScore?: number;
  requiresEmail?: boolean;
  
  // Cost & Resource Information
  aiCostLevel: 'low' | 'medium' | 'high';
  processingTime: 'instant' | 'fast' | 'slow';
  
  // Function calling information
  functionName: string;
  parameters: Record<string, any>;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  suggestedAction?: 'engage_more' | 'request_email' | 'upgrade_plan';
  message?: string;
}

export class ServiceArchitecture {
  private services: Map<string, ServiceDefinition> = new Map();

  constructor() {
    this.initializeDefaultServices();
  }

  /**
   * Initialize default service definitions
   */
  private initializeDefaultServices(): void {
    const defaultServices: ServiceDefinition[] = [
      // FREE SERVICES - Value Building
      {
        name: 'show_available_services',
        displayName: 'Available Services',
        description: 'Show all available AI services',
        category: 'free',
        accessLevel: 'public',
        aiCostLevel: 'low',
        processingTime: 'instant',
        functionName: 'show_available_services',
        parameters: {}
      },
      {
        name: 'get_seo_tips',
        displayName: 'SEO Tips',
        description: 'Get quick SEO improvement tips',
        category: 'free',
        accessLevel: 'public',
        aiCostLevel: 'low',
        processingTime: 'fast',
        functionName: 'get_seo_tips',
        parameters: {
          topic: { type: 'string', description: 'SEO topic to get tips for' }
        }
      },
      {
        name: 'check_domain_status',
        displayName: 'Domain Checker',
        description: 'Check domain availability and basic info',
        category: 'free',
        accessLevel: 'public',
        aiCostLevel: 'low',
        processingTime: 'fast',
        functionName: 'check_domain_status',
        parameters: {
          domain: { type: 'string', description: 'Domain to check' }
        }
      },
      {
        name: 'get_industry_insights',
        displayName: 'Industry Insights',
        description: 'Get general industry performance benchmarks',
        category: 'free',
        accessLevel: 'engaged',
        minInteractions: 2,
        minTrustScore: 5,
        aiCostLevel: 'medium',
        processingTime: 'fast',
        functionName: 'get_industry_insights',
        parameters: {
          industry: { type: 'string', description: 'Industry type' }
        }
      },

      // PREMIUM SERVICES - Email Required
      {
        name: 'analyze_website',
        displayName: 'Website Analysis',
        description: 'Comprehensive AI website analysis with detailed report',
        category: 'premium',
        accessLevel: 'verified',
        requiresEmail: true,
        aiCostLevel: 'high',
        processingTime: 'slow',
        functionName: 'analyze_website',
        parameters: {
          url: { type: 'string', description: 'Website URL to analyze' }
        }
      },
      {
        name: 'competitor_analysis',
        displayName: 'Competitor Analysis',
        description: 'Analyze competitors and market positioning',
        category: 'premium',
        accessLevel: 'verified',
        requiresEmail: true,
        aiCostLevel: 'high',
        processingTime: 'slow',
        functionName: 'competitor_analysis',
        parameters: {
          domain: { type: 'string', description: 'Your domain' },
          competitors: { type: 'array', description: 'Competitor domains' }
        }
      },
      {
        name: 'market_intelligence',
        displayName: 'Market Intelligence',
        description: 'Deep market analysis and opportunities',
        category: 'premium',
        accessLevel: 'verified',
        requiresEmail: true,
        aiCostLevel: 'high',
        processingTime: 'slow',
        functionName: 'market_intelligence',
        parameters: {
          industry: { type: 'string', description: 'Target industry' },
          location: { type: 'string', description: 'Geographic market' }
        }
      },

      // UTILITY SERVICES
      {
        name: 'request_email_verification',
        displayName: 'Email Verification',
        description: 'Verify email for premium access',
        category: 'free',
        accessLevel: 'public',
        aiCostLevel: 'low',
        processingTime: 'instant',
        functionName: 'request_email_verification',
        parameters: {
          email: { type: 'string', description: 'Email address to verify' }
        }
      }
    ];

    defaultServices.forEach(service => {
      this.services.set(service.name, service);
    });
  }

  /**
   * Add or update a service definition
   */
  addService(service: ServiceDefinition): void {
    this.services.set(service.name, service);
  }

  /**
   * Get service definition
   */
  getService(name: string): ServiceDefinition | undefined {
    return this.services.get(name);
  }

  /**
   * Get all services by category
   */
  getServicesByCategory(category: 'free' | 'premium' | 'enterprise'): ServiceDefinition[] {
    return Array.from(this.services.values()).filter(service => service.category === category);
  }

  /**
   * Get all available services for function calling
   */
  getAvailableTools(): any[] {
    return Array.from(this.services.values()).map(service => ({
      type: "function" as const,
      function: {
        name: service.functionName,
        description: service.description,
        parameters: {
          type: "object",
          properties: service.parameters,
          required: Object.keys(service.parameters)
        }
      }
    }));
  }

  /**
   * Get accessible services for a user profile
   */
  getAccessibleServices(profile: any): ServiceDefinition[] {
    return Array.from(this.services.values()).filter(service => {
      const accessCheck = this.checkServiceAccess(service.name, profile);
      return accessCheck.allowed;
    });
  }

  /**
   * Check if user can access a specific service
   */
  checkServiceAccess(serviceName: string, profile: any): AccessCheckResult {
    const service = this.services.get(serviceName);
    
    if (!service) {
      return {
        allowed: false,
        reason: 'service_not_found',
        message: 'Service not available'
      };
    }

    // Check access level requirements
    switch (service.accessLevel) {
      case 'public':
        return { allowed: true };

      case 'engaged':
        if ((service.minInteractions && profile.interactions < service.minInteractions) ||
            (service.minTrustScore && profile.trustScore < service.minTrustScore)) {
          return {
            allowed: false,
            reason: 'insufficient_engagement',
            suggestedAction: 'engage_more',
            message: `Please interact more to unlock ${service.displayName}. You need ${service.minInteractions || 0} interactions and ${service.minTrustScore || 0} trust points.`
          };
        }
        return { allowed: true };

      case 'verified':
        if (!profile.emailVerified) {
          return {
            allowed: false,
            reason: 'email_verification_required',
            suggestedAction: 'request_email',
            message: `${service.displayName} requires email verification for detailed reports and saved results.`
          };
        }
        return { allowed: true };

      case 'premium':
        // Future: Check for premium subscription
        if (!profile.emailVerified) {
          return {
            allowed: false,
            reason: 'premium_subscription_required',
            suggestedAction: 'upgrade_plan',
            message: `${service.displayName} requires premium access. Please verify your email and upgrade.`
          };
        }
        return { allowed: true };

      default:
        return {
          allowed: false,
          reason: 'unknown_access_level',
          message: 'Service access level not recognized'
        };
    }
  }

  /**
   * Get service usage recommendations based on profile
   */
  getRecommendedServices(profile: any): ServiceDefinition[] {
    const accessible = this.getAccessibleServices(profile);
    const unused = accessible.filter(service => 
      !profile.freeServicesUsed.includes(service.name) &&
      !profile.premiumServicesUsed.includes(service.name)
    );

    // Sort by value for user progression
    return unused.sort((a, b) => {
      const scoreA = this.calculateServiceRecommendationScore(a, profile);
      const scoreB = this.calculateServiceRecommendationScore(b, profile);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate recommendation score for a service
   */
  private calculateServiceRecommendationScore(service: ServiceDefinition, profile: any): number {
    let score = 0;

    // Free services get higher scores for new users
    if (service.category === 'free' && profile.interactions < 5) {
      score += 10;
    }

    // Premium services get higher scores for engaged users
    if (service.category === 'premium' && profile.interactions >= 3) {
      score += 15;
    }

    // Boost services user attempted but couldn't access
    if (profile.premiumServicesAttempted.includes(service.name)) {
      score += 20;
    }

    // Fast services for quick wins
    if (service.processingTime === 'instant' || service.processingTime === 'fast') {
      score += 5;
    }

    return score;
  }

  /**
   * Get all service names for easy reference
   */
  getAllServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Check if a service is premium
   */
  isPremiumService(serviceName: string): boolean {
    const service = this.services.get(serviceName);
    return service?.category === 'premium' || service?.requiresEmail === true;
  }

  /**
   * Check if a service is free
   */
  isFreeService(serviceName: string): boolean {
    const service = this.services.get(serviceName);
    return service?.category === 'free' && service?.accessLevel === 'public';
  }
}

// Export singleton instance
export const serviceArchitecture = new ServiceArchitecture();
