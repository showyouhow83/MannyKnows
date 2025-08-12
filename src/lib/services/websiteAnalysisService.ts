import { Service, ServiceRegistry } from './serviceFramework';
import { IntelligentResponseGenerator } from './intelligentResponseGenerator';
import {
  fetchWebsiteComponent,
  seoAnalysisComponent,
  performanceComponent,
  securityComponent,
  opportunityDetectionComponent
} from './components/websiteComponents';
import { createEmailAnalysisService } from './components/emailComponents';

// Create the Website Analysis Service
export function createWebsiteAnalysisService(): Service {
  const service = new Service('website_analysis', {
    enabled: true,
    requiresVerification: true,
    maxExecutionTime: 30000
  });

  // Add all components in priority order
  service.addComponent('fetch_website', fetchWebsiteComponent);
  service.addComponent('seo_analysis', seoAnalysisComponent);
  service.addComponent('performance_analysis', performanceComponent);
  service.addComponent('security_analysis', securityComponent);
  service.addComponent('opportunity_detection', opportunityDetectionComponent);

  return service;
}

// Enhanced service executor with sales response generation
export async function executeWebsiteAnalysis(websiteUrl: string, email: string): Promise<{
  success: boolean;
  analysisData: any;
  salesResponse: any;
  errors?: string[];
}> {
  try {
    const service = serviceRegistry.get('website_analysis');
    if (!service) {
      throw new Error('Website analysis service not found');
    }

    // Execute the service
    const result = await service.execute({
      url: websiteUrl,
      email,
      startTime: Date.now()
    });

    if (!result.success) {
      return {
        success: false,
        analysisData: null,
        salesResponse: null,
        errors: result.errors
      };
    }

    // Generate intelligent service-aware response
    const serviceResults = [{
      serviceName: 'website_analysis',
      success: true,
      data: result.data
    }];
    
    const salesResponse = IntelligentResponseGenerator.generateServiceAwareResponse(
      serviceResults,
      serviceRegistry,
      { url: websiteUrl, email }
    );

    // Format for backward compatibility with existing system
    const analysisData = {
      analysis: {
        overallScore: result.data.opportunity_detection.overallScore,
        scores: {
          seo: result.data.seo_analysis.score,
          performance: result.data.performance_analysis.score,
          security: result.data.security_analysis.score,
          accessibility: 85, // Default for now
          content: 80 // Default for now
        },
        metrics: {
          responseTime: result.data.fetch_website.responseTime,
          pageSizeKB: result.data.performance_analysis.pageSizeKB,
          totalImages: result.data.seo_analysis.totalImages,
          imagesWithAlt: result.data.seo_analysis.imagesWithAlt,
          title: result.data.seo_analysis.title,
          titleLength: result.data.seo_analysis.titleLength,
          wordCount: Math.floor(result.data.fetch_website.html.length / 6) // Rough estimate
        },
        issues: [
          ...result.data.seo_analysis.issues,
          ...result.data.performance_analysis.issues,
          ...result.data.security_analysis.issues
        ],
        warnings: [
          ...result.data.seo_analysis.recommendations,
          ...result.data.performance_analysis.recommendations,
          ...result.data.security_analysis.recommendations
        ],
        recommendations: result.data.opportunity_detection.opportunities.map((opp: any) => opp.description)
      }
    };

    return {
      success: true,
      analysisData,
      salesResponse,
      errors: result.errors
    };

  } catch (error) {
    return {
      success: false,
      analysisData: null,
      salesResponse: null,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

// Global service registry
export const serviceRegistry = new ServiceRegistry();

// Initialize services
export function initializeServices() {
  // Register the website analysis service
  serviceRegistry.register(createWebsiteAnalysisService());
  
  // Register the email analysis service
  serviceRegistry.register(createEmailAnalysisService());
  
  console.log('Services initialized:', serviceRegistry.list().map(s => s.name));
}

// Auto-initialize when module loads
initializeServices();
