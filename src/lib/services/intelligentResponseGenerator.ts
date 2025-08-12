import type { SalesResponse } from './types';
import type { ServiceRegistry } from './serviceFramework';

interface ServiceResult {
  serviceName: string;
  success: boolean;
  data: any;
  errors?: string[];
}

export class IntelligentResponseGenerator {
  private static serviceDescriptions: Record<string, string> = {
    'website_analysis': 'comprehensive website performance, SEO, and security analysis',
    'email_verification': 'email deliverability and domain authentication checks',
    'lead_scoring': 'lead qualification and conversion probability assessment',
    'content_audit': 'content quality and SEO optimization review',
    'competitor_analysis': 'competitive landscape and positioning research',
    'conversion_optimization': 'user experience and conversion funnel analysis',
    'social_media_audit': 'social media presence and engagement analysis',
    'brand_analysis': 'brand consistency and market positioning evaluation'
  };

  static generateServiceAwareResponse(
    serviceResults: ServiceResult[], 
    registry: ServiceRegistry,
    requestContext: { url?: string; email?: string; query?: string }
  ): SalesResponse {
    
    const availableServices = registry.getAvailableServices();
    const executedServices = serviceResults.filter(r => r.success);
    const failedServices = serviceResults.filter(r => !r.success);
    
    // Build dynamic response based on what actually happened
    const response = this.buildDynamicResponse(
      executedServices, 
      failedServices, 
      availableServices, 
      requestContext
    );
    
    // Calculate overall lead score from service results
    const leadScore = this.calculateCompositeLeadScore(executedServices);
    
    // Determine urgency based on findings across services
    const urgency = this.determineOverallUrgency(executedServices);
    
    // Extract opportunities from all executed services
    const opportunities = this.extractAllOpportunities(executedServices);
    
    return {
      reply: response,
      urgency: urgency,
      leadScore: leadScore,
      nextAction: leadScore > 60 ? 'schedule' : 'follow_up',
      opportunities: opportunities,
      servicesExecuted: executedServices.map(s => s.serviceName),
      servicesAvailable: availableServices
    };
  }

  private static buildDynamicResponse(
    executedServices: ServiceResult[],
    failedServices: ServiceResult[],
    availableServices: string[],
    context: { url?: string; email?: string; query?: string }
  ): string {
    
    let response = '';
    
    // Dynamic opening based on what was analyzed
    if (context.url) {
      response += `I've completed analysis on ${context.url} using ${executedServices.length} service${executedServices.length > 1 ? 's' : ''}:\n\n`;
    } else if (context.email) {
      response += `I've analyzed the information for ${context.email}:\n\n`;
    } else {
      response += `Analysis complete! Here's what I found:\n\n`;
    }
    
    // Report on each service that executed
    for (const service of executedServices) {
      const serviceDescription = this.serviceDescriptions[service.serviceName] || service.serviceName;
      response += this.formatServiceResults(service, serviceDescription);
    }
    
    // Handle any failed services gracefully
    if (failedServices.length > 0) {
      response += `\n⚠️ **Note:** Some services couldn't complete (${failedServices.map(s => s.serviceName).join(', ')}), but I still have valuable insights to share.\n`;
    }
    
    // Show what other services are available
    const unusedServices = availableServices.filter(s => 
      !executedServices.some(exec => exec.serviceName === s) &&
      !failedServices.some(fail => fail.serviceName === s)
    );
    
    if (unusedServices.length > 0) {
      response += `\n🔍 **Additional Analysis Available:**\n`;
      response += `I can also help with: ${unusedServices.map(s => this.serviceDescriptions[s] || s).join(', ')}\n`;
    }
    
    // Intelligent next steps based on what was found
    response += this.generateIntelligentNextSteps(executedServices, context);
    
    return response;
  }

  private static formatServiceResults(service: ServiceResult, description: string): string {
    const data = service.data;
    let section = `📊 **${this.capitalizeFirst(service.serviceName.replace('_', ' '))}**\n`;
    
    // Dynamic formatting based on service type and data structure
    if (service.serviceName === 'website_analysis' && data.seo_analysis && data.performance_analysis) {
      section += `• SEO Score: ${data.seo_analysis.score}/100\n`;
      section += `• Performance: ${data.performance_analysis.responseTime || 'N/A'}ms load time\n`;
      section += `• Security: ${data.security_analysis.isHTTPS ? '✅ HTTPS enabled' : '⚠️ HTTPS needed'}\n`;
      
      if (data.seo_analysis.issues && data.seo_analysis.issues.length > 0) {
        section += `• Key finding: ${data.seo_analysis.issues[0]}\n`;
      }
    } else if (service.serviceName === 'email_verification' && data.isValid !== undefined) {
      section += `• Email validity: ${data.isValid ? '✅ Valid' : '❌ Invalid'}\n`;
      section += `• Domain status: ${data.domainExists ? '✅ Active' : '❌ Inactive'}\n`;
    } else {
      // Generic formatting for unknown service types
      section += `• Status: ✅ Analysis completed\n`;
      if (data.score !== undefined) {
        section += `• Score: ${data.score}/100\n`;
      }
      if (data.issues && Array.isArray(data.issues) && data.issues.length > 0) {
        section += `• Key finding: ${data.issues[0]}\n`;
      }
    }
    
    return section + '\n';
  }

  private static generateIntelligentNextSteps(executedServices: ServiceResult[], context: any): string {
    let nextSteps = '\n🎯 **Recommended Next Steps:**\n';
    
    const hasWebsiteAnalysis = executedServices.some(s => s.serviceName === 'website_analysis');
    const hasEmailVerification = executedServices.some(s => s.serviceName === 'email_verification');
    
    if (hasWebsiteAnalysis) {
      nextSteps += '• Review the specific optimization opportunities identified\n';
      nextSteps += '• Consider prioritizing fixes based on impact potential\n';
    }
    
    if (hasEmailVerification) {
      nextSteps += '• Ensure email deliverability is optimized\n';
    }
    
    nextSteps += '\nWould you like me to:\n';
    nextSteps += '1. Dive deeper into any specific area\n';
    nextSteps += '2. Run additional analysis services\n';
    nextSteps += '3. Discuss implementation strategies with Manny\n\n';
    nextSteps += 'I can arrange a consultation to create a custom action plan based on these findings.';
    
    return nextSteps;
  }

  private static calculateCompositeLeadScore(services: ServiceResult[]): number {
    if (services.length === 0) return 0;
    
    let totalScore = 0;
    let scoredServices = 0;
    
    for (const service of services) {
      if (service.data?.opportunity_detection?.leadScore) {
        totalScore += service.data.opportunity_detection.leadScore;
        scoredServices++;
      } else if (service.data?.score) {
        // Convert service scores to lead score equivalent
        totalScore += Math.min(service.data.score * 0.8, 100);
        scoredServices++;
      }
    }
    
    return scoredServices > 0 ? Math.round(totalScore / scoredServices) : 50;
  }

  private static determineOverallUrgency(services: ServiceResult[]): 'low' | 'medium' | 'high' {
    let urgencyPoints = 0;
    
    for (const service of services) {
      if (service.data?.opportunity_detection?.urgencyLevel === 'high') urgencyPoints += 3;
      else if (service.data?.opportunity_detection?.urgencyLevel === 'medium') urgencyPoints += 2;
      else if (service.data?.opportunity_detection?.urgencyLevel === 'low') urgencyPoints += 1;
      
      // Check for critical issues
      if (service.data?.security_analysis?.isHTTPS === false) urgencyPoints += 2;
      if (service.data?.seo_analysis?.score < 30) urgencyPoints += 2;
      if (service.data?.performance_analysis?.responseTime > 3000) urgencyPoints += 2;
    }
    
    if (urgencyPoints >= 6) return 'high';
    if (urgencyPoints >= 3) return 'medium';
    return 'low';
  }

  private static extractAllOpportunities(services: ServiceResult[]): any[] {
    const allOpportunities: any[] = [];
    
    for (const service of services) {
      if (service.data?.opportunity_detection?.opportunities) {
        allOpportunities.push(...service.data.opportunity_detection.opportunities);
      }
      
      // Extract opportunities from issues as well
      if (service.data?.seo_analysis?.issues) {
        service.data.seo_analysis.issues.forEach((issue: string) => {
          allOpportunities.push({
            category: 'SEO',
            description: issue,
            impact: 'medium',
            effort: 'medium'
          });
        });
      }
    }
    
    return allOpportunities;
  }

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
