import type { BusinessService } from './ServiceArchitecture';
import { ServiceOrchestrator } from './serviceOrchestrator';
import { Service } from './serviceFramework';

// Import all available components
import {
  fetchWebsiteComponent,
  seoAnalysisComponent,
  performanceComponent,
  securityComponent,
  opportunityDetectionComponent,
  aiReadinessComponent
} from './components/websiteComponents';

import {
  emailVerificationAIComponent,
  phoneVerificationAIComponent,
  sessionManagementAIComponent
} from './components/aiServices';

// Registry of all available components
const COMPONENT_REGISTRY = {
  // Website Analysis Components
  'fetch_website': fetchWebsiteComponent,
  'seo_analysis': seoAnalysisComponent,
  'performance_analysis': performanceComponent,
  'security_analysis': securityComponent,
  'opportunity_detection': opportunityDetectionComponent,
  'ai_readiness_analysis': aiReadinessComponent,
  
  // AI Service Components
  'email_verification_ai': emailVerificationAIComponent,
  'phone_verification_ai': phoneVerificationAIComponent,
  'session_management_ai': sessionManagementAIComponent,
};

export class DynamicServiceExecutor {
  private serviceOrchestrator: ServiceOrchestrator;

  constructor() {
    this.serviceOrchestrator = new ServiceOrchestrator();
  }

  /**
   * Execute a service dynamically based on Google Sheets configuration
   */
  async executeService(
    service: BusinessService,
    input: any,
    context: { session_id: string; email?: string; kv: any }
  ): Promise<any> {
    
    // If service has components defined, create dynamic service
    if (service.components && Array.isArray(service.components)) {
      return await this.executeDynamicService(service, input, context);
    }
    
    // Fallback to serviceOrchestrator for hardcoded services
    if (service.functionName) {
      return await this.serviceOrchestrator.executeUserService(
        service.functionName,
        input,
        context
      );
    }
    
    throw new Error(`Service ${service.name} has no execution method defined`);
  }

  /**
   * Create and execute a service dynamically from components
   */
  private async executeDynamicService(
    service: BusinessService,
    input: any,
    context: { session_id: string; email?: string; kv: any }
  ): Promise<any> {
    
    try {
      // Create dynamic service with specified components
      const dynamicService = this.createDynamicService(service);
      
      // Execute through serviceOrchestrator
      return await this.serviceOrchestrator.executeUserService(
        service.name,
        input,
        context
      );
      
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: [error instanceof Error ? error.message : 'Service execution failed'],
        aiServicesExecuted: [],
        userServiceExecuted: service.name
      };
    }
  }

  /**
   * Create a service dynamically from component list
   */
  private createDynamicService(service: BusinessService) {
    const dynamicService = new Service(service.name, {
      enabled: service.isActive ?? true,
      requiresVerification: service.accessLevel === 'verified' || service.accessLevel === 'premium',
      maxExecutionTime: this.getTimeoutFromProcessingTime(service.processingTime)
    });

    // Add components specified in Google Sheets
    if (service.components) {
      for (const componentName of service.components) {
        const component = COMPONENT_REGISTRY[componentName as keyof typeof COMPONENT_REGISTRY];
        if (component) {
          dynamicService.addComponent(componentName, component);
        } else {
          console.warn(`Component ${componentName} not found in registry`);
        }
      }
    }

    return dynamicService;
  }

  /**
   * Convert processing time string to timeout milliseconds
   */
  private getTimeoutFromProcessingTime(processingTime: string): number {
    // Convert "1 hour", "4-8 weeks", etc. to reasonable timeout
    const timeStr = processingTime.toLowerCase();
    
    if (timeStr.includes('minute')) return 60000; // 1 minute
    if (timeStr.includes('hour')) return 3600000; // 1 hour  
    if (timeStr.includes('day')) return 300000; // 5 minutes for day-long processes
    if (timeStr.includes('week')) return 300000; // 5 minutes for week-long processes
    
    return 30000; // 30 seconds default
  }

  /**
   * Get all available components for service configuration
   */
  getAvailableComponents(): string[] {
    return Object.keys(COMPONENT_REGISTRY);
  }

  /**
   * Validate service configuration
   */
  validateServiceConfig(service: BusinessService): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!service.name) errors.push('Service name is required');
    if (!service.functionName && !service.components) {
      errors.push('Service must have either functionName or components defined');
    }

    if (service.components) {
      for (const componentName of service.components) {
        if (!COMPONENT_REGISTRY[componentName as keyof typeof COMPONENT_REGISTRY]) {
          errors.push(`Component ${componentName} not found in registry`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export default DynamicServiceExecutor;
