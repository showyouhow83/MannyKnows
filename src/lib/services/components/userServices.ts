import { Service } from '../serviceFramework';
import {
  fetchWebsiteComponent,
  seoAnalysisComponent,
  performanceComponent,
  securityComponent,
  opportunityDetectionComponent,
  aiReadinessComponent
} from './websiteComponents';

/**
 * USER SERVICES - Customer-facing services with catchy branding
 * These are what customers directly request and pay for
 */

// Advanced AI Web Analysis Service (previously "Website Analysis")
export function createAdvancedWebAnalysisService(): Service {
  const service = new Service('advanced_web_analysis', {
    enabled: true,
    requiresVerification: true,
    maxExecutionTime: 30000
  });

  // Add components for comprehensive web analysis
  service.addComponent('fetch_website', fetchWebsiteComponent);
  service.addComponent('seo_analysis', seoAnalysisComponent);
  service.addComponent('performance_analysis', performanceComponent);
  service.addComponent('security_analysis', securityComponent);
  service.addComponent('opportunity_detection', opportunityDetectionComponent);
  service.addComponent('ai_readiness_analysis', aiReadinessComponent);

  return service;
}

// Future: Competitive Intelligence Service 
export function createCompetitiveIntelligenceService(): Service {
  const service = new Service('competitive_intelligence', {
    enabled: false, // Will enable when components are ready
    requiresVerification: true,
    maxExecutionTime: 45000
  });

  // TODO: Add components:
  // - competitor_discovery
  // - market_analysis  
  // - positioning_analysis
  // - opportunity_gaps
  // - pricing_analysis

  return service;
}

// Future: Digital Marketing Audit Service
export function createDigitalMarketingAuditService(): Service {
  const service = new Service('digital_marketing_audit', {
    enabled: false,
    requiresVerification: true,
    maxExecutionTime: 40000
  });

  // TODO: Add components:
  // - social_media_presence
  // - content_strategy_analysis
  // - email_marketing_audit
  // - advertising_analysis
  // - brand_consistency_check

  return service;
}

// Future: Business Growth Optimizer Service
export function createBusinessGrowthOptimizerService(): Service {
  const service = new Service('business_growth_optimizer', {
    enabled: false,
    requiresVerification: true,
    requiresPhoneVerification: true, // This will require phone verification
    maxExecutionTime: 60000
  });

  // TODO: Add components:
  // - revenue_analysis
  // - conversion_funnel_audit
  // - customer_journey_mapping
  // - growth_opportunity_scoring
  // - roi_projection

  return service;
}

/**
 * SERVICE BRANDING CONFIGURATION
 * Maps internal service names to user-facing branding
 */
export const USER_SERVICE_BRANDING = {
  'advanced_web_analysis': {
    displayName: 'AI Web Intelligence Scan',
    shortDescription: 'Advanced AI-powered website analysis + AI readiness assessment',
    detailedDescription: 'Comprehensive analysis covering performance, SEO, security, growth opportunities, and AI automation readiness',
    icon: '🔍',
    category: 'Website Analysis',
    estimatedTime: '2-3 minutes',
    shortcutText: 'AI Web Scan'
  },
  'competitive_intelligence': {
    displayName: 'Market Intelligence Report',
    shortDescription: 'Competitive landscape and positioning analysis',
    detailedDescription: 'Deep dive into your competition, market positioning, and growth opportunities',
    icon: '🎯',
    category: 'Market Research',
    estimatedTime: '5-7 minutes',
    shortcutText: 'Market Intelligence'
  },
  'digital_marketing_audit': {
    displayName: 'Digital Presence Optimizer',
    shortDescription: 'Complete digital marketing performance audit',
    detailedDescription: 'Analysis of social media, content strategy, email marketing, and brand consistency',
    icon: '📈',
    category: 'Marketing Analysis',
    estimatedTime: '4-6 minutes',
    shortcutText: 'Marketing Audit'
  },
  'business_growth_optimizer': {
    displayName: 'Growth Acceleration Analysis',
    shortDescription: 'Advanced business growth and revenue optimization',
    detailedDescription: 'Comprehensive revenue analysis, conversion optimization, and growth projections',
    icon: '🚀',
    category: 'Business Strategy',
    estimatedTime: '7-10 minutes',
    shortcutText: 'Growth Optimizer',
    requiresPhone: true
  }
};

/**
 * Get available user services with branding
 */
export function getAvailableUserServices() {
  return Object.entries(USER_SERVICE_BRANDING)
    .map(([serviceId, branding]) => ({
      id: serviceId,
      ...branding,
      enabled: true // TODO: Check actual service status
    }));
}

/**
 * Get service branding by ID
 */
export function getServiceBranding(serviceId: string) {
  return (USER_SERVICE_BRANDING as any)[serviceId] || null;
}
