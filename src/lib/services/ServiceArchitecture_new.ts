// Service Architecture with Progressive Access Control
// Manages business services with user tier-based access and token allocation
// Loads from Cloudflare KV (Google Sheets CMS) with local fallback

export interface BusinessService {
  name: string;
  displayName: string;
  description: string;
  accessLevel: 'public' | 'verified' | 'premium';
  serviceType: 'ai_tool' | 'business_service' | 'hybrid';
  businessCategory: 'ecommerce' | 'web_design' | 'automation' | 'ai_agents' | 'photography' | '360_services' | 'analytics' | 'content' | 'training';
  deliveryMethod: 'instant' | 'consultation' | 'project' | 'hybrid';
  hasAIAssistance: boolean;
  canDemoInChat: boolean;
  aiCostLevel: 'low' | 'medium' | 'high';
  processingTime: string;
  functionName?: string;
  parameters?: Record<string, any>;
  shortDescription?: string;
  price?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface KVServiceData {
  services: BusinessService[];
  lastUpdated: string;
  version: string;
}

// Cache for KV data with 5-minute TTL
interface ServiceCache {
  data: BusinessService[];
  timestamp: number;
  ttl: number;
}

let serviceCache: ServiceCache | null = null;

// Legacy interface for backward compatibility
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  suggestedAction?: 'engage_more' | 'request_email' | 'upgrade_plan';
  message?: string;
}

// Factory function to create ServiceArchitecture with environment
export function createServiceArchitecture(environment?: any): ServiceArchitecture {
  return new ServiceArchitecture(environment);
}

export class ServiceArchitecture {
  private services: Map<string, BusinessService> = new Map();
  private initialized: boolean = false;
  private environment: any;

  constructor(environment?: any) {
    this.environment = environment;
  }

  // Load services from KV first, fallback to hardcoded defaults
  async ensureServicesLoaded(): Promise<void> {
    if (this.initialized && this.isCacheValid()) {
      return;
    }

    try {
      // Try loading from KV first
      const kvServices = await this.loadFromKV();
      if (kvServices && kvServices.length > 0) {
        this.loadServicesFromArray(kvServices);
        this.updateCache(kvServices);
        this.initialized = true;
        return;
      }
    } catch (error) {
      console.warn('Failed to load services from KV, falling back to defaults:', error);
    }

    // Fallback to default services
    this.loadDefaultServices();
    this.initialized = true;
  }

  private async loadFromKV(): Promise<BusinessService[] | null> {
    if (!this.environment?.KV_SERVICES) {
      return null;
    }

    try {
      // Get latest version pointer
      const latestVersion = await this.environment.KV_SERVICES.get('services_latest');
      if (!latestVersion) {
        return null;
      }

      // Load the actual service data
      const serviceDataRaw = await this.environment.KV_SERVICES.get(latestVersion);
      if (!serviceDataRaw) {
        return null;
      }

      const serviceData: KVServiceData = JSON.parse(serviceDataRaw);
      return serviceData.services.filter(service => service.isActive !== false);
    } catch (error) {
      console.error('Error loading services from KV:', error);
      return null;
    }
  }

  private isCacheValid(): boolean {
    if (!serviceCache) return false;
    const now = Date.now();
    return (now - serviceCache.timestamp) < serviceCache.ttl;
  }

  private updateCache(services: BusinessService[]): void {
    serviceCache = {
      data: services,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutes
    };
  }

  private loadServicesFromArray(services: BusinessService[]): void {
    this.services.clear();
    services.forEach(service => {
      this.services.set(service.name, service);
    });
  }

  private loadDefaultServices(): void {
    const defaultServices: BusinessService[] = [
      // Core AI Tools - Available to all users
      {
        name: 'website_analysis',
        displayName: 'Website Analysis',
        description: 'Comprehensive analysis of website performance, SEO, and conversion optimization opportunities.',
        accessLevel: 'public',
        serviceType: 'ai_tool',
        businessCategory: 'analytics',
        deliveryMethod: 'instant',
        hasAIAssistance: true,
        canDemoInChat: true,
        aiCostLevel: 'medium',
        processingTime: 'instant',
        functionName: 'analyze_website',
        parameters: { url: 'string', depth: 'number' },
        shortDescription: 'SEO & Performance Analysis',
        price: 'Free Analysis',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'competitor_analysis',
        displayName: 'Competitive Intelligence',
        description: 'Comprehensive competitor analysis including traffic analysis, keyword research, and strategic positioning insights.',
        accessLevel: 'public',
        serviceType: 'ai_tool',
        businessCategory: 'analytics',
        deliveryMethod: 'instant',
        hasAIAssistance: true,
        canDemoInChat: true,
        aiCostLevel: 'medium',
        processingTime: 'instant',
        functionName: 'analyze_competitors',
        parameters: { competitor_urls: 'array', analysis_focus: 'array', your_website: 'string' },
        shortDescription: 'Know Your Competition',
        price: 'Free Analysis',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'ai_content_generator',
        displayName: 'AI Content Creation',
        description: 'AI-powered content generation for blogs, social media, product descriptions, and marketing copy with brand voice training.',
        accessLevel: 'public',
        serviceType: 'ai_tool',
        businessCategory: 'content',
        deliveryMethod: 'instant',
        hasAIAssistance: true,
        canDemoInChat: true,
        aiCostLevel: 'low',
        processingTime: 'instant',
        functionName: 'generate_content',
        parameters: { content_type: 'string', topic: 'string', brand_voice: 'string', target_length: 'number' },
        shortDescription: 'Instant Quality Content',
        price: 'Free Trial',
        isActive: true,
        sortOrder: 3
      },
      // Premium AI Services
      {
        name: 'chatbot_development',
        displayName: 'Custom AI Chatbots',
        description: 'Intelligent chatbots trained on your business data to handle customer service, sales qualification, and lead generation 24/7.',
        accessLevel: 'premium',
        serviceType: 'ai_tool',
        businessCategory: 'ai_agents',
        deliveryMethod: 'project',
        hasAIAssistance: true,
        canDemoInChat: true,
        aiCostLevel: 'high',
        processingTime: '1-2 weeks',
        functionName: 'create_custom_chatbot',
        parameters: { business_type: 'string', use_cases: 'array', integration_requirements: 'array' },
        shortDescription: '24/7 AI Assistant',
        price: 'Starting at $797',
        isActive: true,
        sortOrder: 4
      },
      // Business Services
      {
        name: 'website_redesign',
        displayName: 'Website Redesign',
        description: 'Complete website redesign focused on modern UX/UI principles, mobile optimization, and conversion-driven design.',
        accessLevel: 'verified',
        serviceType: 'business_service',
        businessCategory: 'web_design',
        deliveryMethod: 'project',
        hasAIAssistance: true,
        canDemoInChat: false,
        aiCostLevel: 'low',
        processingTime: '2-4 weeks',
        functionName: 'plan_website_redesign',
        parameters: { current_site: 'string', goals: 'array', budget_range: 'string' },
        shortDescription: 'Modern Website Design',
        price: 'Starting at $2,497',
        isActive: true,
        sortOrder: 5
      },
      // Show Available Services Function
      {
        name: 'show_available_services',
        displayName: 'Available Services',
        description: 'Show all available AI services and business solutions based on user access level.',
        accessLevel: 'public',
        serviceType: 'ai_tool',
        businessCategory: 'analytics',
        deliveryMethod: 'instant',
        hasAIAssistance: true,
        canDemoInChat: true,
        aiCostLevel: 'low',
        processingTime: 'instant',
        functionName: 'show_available_services',
        parameters: {},
        shortDescription: 'Explore All Services',
        price: 'Free',
        isActive: true,
        sortOrder: 0
      }
    ];

    this.loadServicesFromArray(defaultServices);
  }

  addService(service: BusinessService): void {
    this.services.set(service.name, service);
  }

  removeService(name: string): void {
    this.services.delete(name);
  }

  getService(name: string): BusinessService | undefined {
    return this.services.get(name);
  }

  // Updated to use businessCategory instead of old category system
  getServicesByCategory(category: 'ecommerce' | 'web_design' | 'automation' | 'ai_agents' | 'photography' | '360_services' | 'analytics' | 'content' | 'training'): BusinessService[] {
    return Array.from(this.services.values())
      .filter(service => service.businessCategory === category)
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  // Get services by access level
  getServicesByAccessLevel(accessLevel: 'public' | 'verified' | 'premium'): BusinessService[] {
    return Array.from(this.services.values())
      .filter(service => service.accessLevel === accessLevel)
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  // Get services by type
  getServicesByType(serviceType: 'ai_tool' | 'business_service' | 'hybrid'): BusinessService[] {
    return Array.from(this.services.values())
      .filter(service => service.serviceType === serviceType)
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  // Check if user has access to specific service
  checkServiceAccess(serviceName: string, userTier: 'anonymous' | 'verified' | 'premium'): boolean {
    const service = this.getService(serviceName);
    if (!service) return false;

    const accessLevelMap = {
      anonymous: ['public'],
      verified: ['public', 'verified'],
      premium: ['public', 'verified', 'premium']
    };

    return accessLevelMap[userTier].includes(service.accessLevel);
  }

  getAccessibleServices(profile: any): BusinessService[] {
    const userTier = this.determineUserTier(profile);
    const accessLevels = this.getAccessLevelsForTier(userTier);
    
    return Array.from(this.services.values())
      .filter(service => accessLevels.includes(service.accessLevel))
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  getUserFacingServices(): BusinessService[] {
    // Return all active services that can be shown to users
    return Array.from(this.services.values())
      .filter(service => service.isActive !== false)
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  private determineUserTier(profile: any): 'anonymous' | 'verified' | 'premium' {
    if (!profile) return 'anonymous';
    if (profile.isPremium) return 'premium';
    if (profile.isVerified || profile.email) return 'verified';
    return 'anonymous';
  }

  private getAccessLevelsForTier(userTier: 'anonymous' | 'verified' | 'premium'): string[] {
    switch (userTier) {
      case 'premium':
        return ['public', 'verified', 'premium'];
      case 'verified':
        return ['public', 'verified'];
      case 'anonymous':
      default:
        return ['public'];
    }
  }

  // Get services that can be demonstrated in chat
  getDemoableServices(userTier: 'anonymous' | 'verified' | 'premium'): BusinessService[] {
    return this.getAccessibleServices({ isVerified: userTier !== 'anonymous', isPremium: userTier === 'premium' })
      .filter(service => service.canDemoInChat);
  }

  // Get AI-powered services only
  getAIServices(userTier: 'anonymous' | 'verified' | 'premium'): BusinessService[] {
    return this.getAccessibleServices({ isVerified: userTier !== 'anonymous', isPremium: userTier === 'premium' })
      .filter(service => service.hasAIAssistance);
  }

  // Get instant delivery services
  getInstantServices(userTier: 'anonymous' | 'verified' | 'premium'): BusinessService[] {
    return this.getAccessibleServices({ isVerified: userTier !== 'anonymous', isPremium: userTier === 'premium' })
      .filter(service => service.deliveryMethod === 'instant');
  }

  getAllServices(): BusinessService[] {
    return Array.from(this.services.values())
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  getServiceCount(): number {
    return this.services.size;
  }

  // Smart service recommendations based on user profile
  getRecommendedServices(profile: any): BusinessService[] {
    const accessibleServices = this.getAccessibleServices(profile);
    
    // Simple recommendation logic - can be enhanced with ML later
    return accessibleServices
      .filter(service => service.canDemoInChat || service.deliveryMethod === 'instant')
      .slice(0, 5);
  }

  // Get services suitable for first-time users
  getOnboardingServices(): BusinessService[] {
    return Array.from(this.services.values())
      .filter(service => 
        service.accessLevel === 'public' && 
        service.canDemoInChat === true &&
        service.deliveryMethod === 'instant'
      )
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999))
      .slice(0, 3);
  }

  // Legacy compatibility methods
  checkAccess(serviceName: string, profile: any): AccessCheckResult {
    const userTier = this.determineUserTier(profile);
    const hasAccess = this.checkServiceAccess(serviceName, userTier);
    
    if (hasAccess) {
      return { allowed: true };
    }

    const service = this.getService(serviceName);
    if (!service) {
      return { 
        allowed: false, 
        reason: 'Service not found',
        message: 'The requested service is not available.'
      };
    }

    // Determine suggestion based on required access level
    let suggestedAction: 'engage_more' | 'request_email' | 'upgrade_plan';
    let message: string;

    if (service.accessLevel === 'verified' && userTier === 'anonymous') {
      suggestedAction = 'request_email';
      message = 'Please provide your email to access this service.';
    } else if (service.accessLevel === 'premium') {
      suggestedAction = 'upgrade_plan';
      message = 'This is a premium service. Upgrade to access advanced features.';
    } else {
      suggestedAction = 'engage_more';
      message = 'Continue engaging to unlock more services.';
    }

    return {
      allowed: false,
      reason: `Requires ${service.accessLevel} access`,
      suggestedAction,
      message
    };
  }
}

// Default export for easy importing
export default ServiceArchitecture;
