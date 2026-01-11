// Service and Product Architecture with Progressive Access Control
// Manages business services and products with user tier-based access and token allocation
// Services: Consultations/Projects loaded from MK_KV_SERVICES
// Products: Software tools/solutions loaded from MK_KV_PRODUCTS

export interface BusinessService {
  name: string;
  displayName: string;
  description: string;
  accessLevel: 'public' | 'verified' | 'premium';
  serviceType: 'ai_tool' | 'business_service' | 'business_product' | 'hybrid';
  businessCategory: 'ecommerce' | 'web_design' | 'automation' | 'ai_agents' | 'photography' | '360_services' | 'analytics' | 'content' | 'training';
  deliveryMethod: 'instant' | 'consultation' | 'project' | 'hybrid';
  hasAIAssistance: boolean;
  canDemoInChat: boolean;
  aiCostLevel: 'low' | 'medium' | 'high';
  processingTime: string;
  functionName?: string;
  shortDescription?: string;
  price?: string;
  isActive?: boolean;
  sortOrder?: number;
  components?: string[]; // Array of component names for dynamic service execution
}

export interface BusinessProduct {
  name: string;
  displayName: string;
  description: string;
  accessLevel: 'public' | 'verified' | 'premium';
  serviceType: 'ai_tool' | 'business_product' | 'hybrid';
  businessCategory: 'ecommerce' | 'web_design' | 'automation' | 'ai_agents' | 'photography' | '360_services' | 'analytics' | 'content' | 'training';
  deliveryMethod: 'instant' | 'consultation' | 'project' | 'hybrid';
  hasAIAssistance: boolean;
  canDemoInChat: boolean;
  aiCostLevel: 'low' | 'medium' | 'high';
  processingTime: string;
  functionName?: string;
  parameters?: Record<string, any>;
  components?: string[]; // List of component names to execute for this product
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

export interface KVProductData {
  products: BusinessProduct[];
  lastUpdated: string;
  version: string;
}

// Cache for KV data with 5-minute TTL
interface ServiceCache {
  data: BusinessService[];
  timestamp: number;
  ttl: number;
}

interface ProductCache {
  data: BusinessProduct[];
  timestamp: number;
  ttl: number;
}

let serviceCache: ServiceCache | null = null;
let productCache: ProductCache | null = null;

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
  private products: Map<string, BusinessProduct> = new Map();
  private servicesInitialized: boolean = false;
  private productsInitialized: boolean = false;
  private environment: any;

  constructor(environment?: any) {
    this.environment = environment;
  }

  // Load services from KV first, fallback to hardcoded defaults
  async ensureServicesLoaded(): Promise<void> {
    if (this.servicesInitialized && this.isServiceCacheValid()) {
      console.log('Using cached services');
      return;
    }

    console.log('Loading services...');

    try {
      // Try loading from KV_SERVICES first
      const kvServices = await this.loadServicesFromKV();
      if (kvServices && kvServices.length > 0) {
        console.log(`Successfully loaded ${kvServices.length} services from KV_SERVICES`);
        this.loadServicesFromArray(kvServices);
        this.updateServiceCache(kvServices);
        this.servicesInitialized = true;
        return;
      }
    } catch (error) {
      console.warn('Failed to load services from KV_SERVICES, falling back to defaults:', error);
    }

    // Fallback to default services
    console.log('Loading default services as fallback');
    this.loadDefaultServices();
    this.servicesInitialized = true;
  }

  // Load products from KV_PRODUCTS
  async ensureProductsLoaded(): Promise<void> {
    if (this.productsInitialized && this.isProductCacheValid()) {
      console.log('Using cached products');
      return;
    }

    console.log('Loading products...');

    try {
      // Try loading from KV_PRODUCTS
      const kvProducts = await this.loadProductsFromKV();
      if (kvProducts && kvProducts.length > 0) {
        console.log(`Successfully loaded ${kvProducts.length} products from KV_PRODUCTS`);
        this.loadProductsFromArray(kvProducts);
        this.updateProductCache(kvProducts);
        this.productsInitialized = true;
        return;
      }
    } catch (error) {
      console.warn('Failed to load products from KV_PRODUCTS:', error);
    }

    console.log('No products found in KV_PRODUCTS - products will be empty');
    this.productsInitialized = true;
  }

  // Ensure both services and products are loaded
  async ensureAllLoaded(): Promise<void> {
    await Promise.all([
      this.ensureServicesLoaded(),
      this.ensureProductsLoaded()
    ]);
  }

  private async loadServicesFromKV(): Promise<BusinessService[] | null> {
    // Use KV_SERVICES binding as specified in wrangler.jsonc
    const kvNamespace = this.environment?.KV_SERVICES;
    if (!kvNamespace) {
      console.log('KV_SERVICES namespace not available in environment');
      return null;
    }

    try {
      // Get latest version pointer
      const latestVersion = await kvNamespace.get('services_latest');
      if (!latestVersion) {
        console.log('No services_latest pointer found in KV_SERVICES');
        return null;
      }

      console.log('Loading services from KV_SERVICES version:', latestVersion);

      // Load the actual service data
      const serviceDataRaw = await kvNamespace.get(latestVersion);
      if (!serviceDataRaw) {
        console.log('No service data found for version:', latestVersion);
        return null;
      }

      const serviceData: KVServiceData = JSON.parse(serviceDataRaw);
      console.log(`Loaded ${serviceData.services.length} services from KV_SERVICES`);
      
      return serviceData.services.filter(service => service.isActive !== false);
    } catch (error) {
      console.error('Error loading services from KV_SERVICES:', error);
      return null;
    }
  }

  private async loadProductsFromKV(): Promise<BusinessProduct[] | null> {
    // Use KV_PRODUCTS binding
    const kvNamespace = this.environment?.KV_PRODUCTS;
    if (!kvNamespace) {
      console.log('KV_PRODUCTS namespace not available in environment');
      return null;
    }

    try {
      // Get latest version pointer
      const latestVersion = await kvNamespace.get('products_latest');
      if (!latestVersion) {
        console.log('No products_latest pointer found in KV_PRODUCTS');
        return null;
      }

      console.log('Loading products from KV_PRODUCTS version:', latestVersion);

      // Load the actual product data
      const productDataRaw = await kvNamespace.get(latestVersion);
      if (!productDataRaw) {
        console.log('No product data found for version:', latestVersion);
        return null;
      }

      const productData: KVProductData = JSON.parse(productDataRaw);
      console.log(`Loaded ${productData.products.length} products from KV_PRODUCTS`);
      
      return productData.products.filter(product => product.isActive !== false);
    } catch (error) {
      console.error('Error loading products from KV_PRODUCTS:', error);
      return null;
    }
  }

  private isServiceCacheValid(): boolean {
    if (!serviceCache) return false;
    const now = Date.now();
    return (now - serviceCache.timestamp) < serviceCache.ttl;
  }

  private isProductCacheValid(): boolean {
    if (!productCache) return false;
    const now = Date.now();
    return (now - productCache.timestamp) < productCache.ttl;
  }

  private updateCache(services: BusinessService[]): void {
    serviceCache = {
      data: services,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutes
    };
  }

  private updateServiceCache(services: BusinessService[]): void {
    serviceCache = {
      data: services,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutes
    };
  }

  private updateProductCache(products: BusinessProduct[]): void {
    productCache = {
      data: products,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutes
    };
  }

  private loadProductsFromArray(products: BusinessProduct[]): void {
    this.products.clear();
    products.forEach(product => {
      this.products.set(product.name, product);
    });
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
  getServicesByType(serviceType: 'ai_tool' | 'business_service' | 'business_product' | 'hybrid'): BusinessService[] {
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

  // PRODUCT MANAGEMENT METHODS
  // Products are software tools/solutions with parameters and components

  addProduct(product: BusinessProduct): void {
    this.products.set(product.name, product);
  }

  removeProduct(name: string): void {
    this.products.delete(name);
  }

  getProduct(name: string): BusinessProduct | undefined {
    return this.products.get(name);
  }

  getProductsByCategory(category: 'ecommerce' | 'web_design' | 'automation' | 'ai_agents' | 'photography' | '360_services' | 'analytics' | 'content' | 'training'): BusinessProduct[] {
    return Array.from(this.products.values())
      .filter(product => product.businessCategory === category)
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  getProductsByType(serviceType: 'ai_tool' | 'business_product' | 'hybrid'): BusinessProduct[] {
    return Array.from(this.products.values())
      .filter(product => product.serviceType === serviceType)
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  getProductsByAccessLevel(accessLevel: 'public' | 'verified' | 'premium'): BusinessProduct[] {
    return Array.from(this.products.values())
      .filter(product => product.accessLevel === accessLevel)
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  checkProductAccess(productName: string, userTier: 'anonymous' | 'verified' | 'premium'): boolean {
    const product = this.getProduct(productName);
    if (!product) return false;

    const accessLevelMap = {
      anonymous: ['public'],
      verified: ['public', 'verified'],
      premium: ['public', 'verified', 'premium']
    };

    return accessLevelMap[userTier].includes(product.accessLevel);
  }

  getAccessibleProducts(profile: any): BusinessProduct[] {
    const userTier = this.determineUserTier(profile);
    const accessLevels = this.getAccessLevelsForTier(userTier);
    
    return Array.from(this.products.values())
      .filter(product => accessLevels.includes(product.accessLevel))
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  getDemoableProducts(userTier: 'anonymous' | 'verified' | 'premium'): BusinessProduct[] {
    return this.getAccessibleProducts({ isVerified: userTier !== 'anonymous', isPremium: userTier === 'premium' })
      .filter(product => product.canDemoInChat);
  }

  getInstantProducts(userTier: 'anonymous' | 'verified' | 'premium'): BusinessProduct[] {
    return this.getAccessibleProducts({ isVerified: userTier !== 'anonymous', isPremium: userTier === 'premium' })
      .filter(product => product.deliveryMethod === 'instant');
  }

  getAllProducts(): BusinessProduct[] {
    return Array.from(this.products.values())
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  getProductCount(): number {
    return this.products.size;
  }

  // Get products with components (functional products)
  getFunctionalProducts(): BusinessProduct[] {
    return Array.from(this.products.values())
      .filter(product => product.components && product.components.length > 0)
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }

  // Get product by function name (for AI execution)
  getProductByFunction(functionName: string): BusinessProduct | undefined {
    return Array.from(this.products.values())
      .find(product => product.functionName === functionName);
  }

  // COMBINED METHODS FOR SERVICES AND PRODUCTS
  
  // Get all offerings (services + products) by category
  getAllOfferingsByCategory(category: 'ecommerce' | 'web_design' | 'automation' | 'ai_agents' | 'photography' | '360_services' | 'analytics' | 'content' | 'training') {
    return {
      services: this.getServicesByCategory(category),
      products: this.getProductsByCategory(category)
    };
  }

  // Get all accessible offerings for a user
  getAllAccessibleOfferings(profile: any) {
    return {
      services: this.getAccessibleServices(profile),
      products: this.getAccessibleProducts(profile)
    };
  }

  // Get total count of all offerings
  getTotalOfferingsCount(): number {
    return this.services.size + this.products.size;
  }
}

// Default export for easy importing
export default ServiceArchitecture;
