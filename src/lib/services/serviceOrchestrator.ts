import { Service, ServiceRegistry } from './serviceFramework';
import { 
  emailVerificationAIComponent, 
  phoneVerificationAIComponent, 
  sessionManagementAIComponent 
} from './components/aiServices';
import { 
  createAdvancedWebAnalysisService,
  createCompetitiveIntelligenceService,
  createDigitalMarketingAuditService,
  createBusinessGrowthOptimizerService
} from './components/userServices';

/**
 * AI SERVICES REGISTRY
 * Internal services used by the AI agent for verification, session management, etc.
 */
export function createAIServicesRegistry(): ServiceRegistry {
  const registry = new ServiceRegistry();

  // Email Verification AI Service
  const emailVerificationService = new Service('ai_email_verification', {
    enabled: true,
    requiresVerification: false,
    maxExecutionTime: 10000
  });
  emailVerificationService.addComponent('email_verification_ai', emailVerificationAIComponent);

  // Session Management AI Service  
  const sessionManagementService = new Service('ai_session_management', {
    enabled: true,
    requiresVerification: false,
    maxExecutionTime: 5000
  });
  sessionManagementService.addComponent('session_management_ai', sessionManagementAIComponent);

  // Phone Verification AI Service (Future)
  const phoneVerificationService = new Service('ai_phone_verification', {
    enabled: false,
    requiresVerification: false,
    maxExecutionTime: 15000
  });
  phoneVerificationService.addComponent('phone_verification_ai', phoneVerificationAIComponent);

  // Register AI services
  registry.register(emailVerificationService);
  registry.register(sessionManagementService);
  registry.register(phoneVerificationService);

  return registry;
}

/**
 * USER SERVICES REGISTRY  
 * Customer-facing services that users directly request
 */
export function createUserServicesRegistry(): ServiceRegistry {
  const registry = new ServiceRegistry();

  // Register user services
  registry.register(createAdvancedWebAnalysisService());
  registry.register(createCompetitiveIntelligenceService());
  registry.register(createDigitalMarketingAuditService());
  registry.register(createBusinessGrowthOptimizerService());

  return registry;
}

/**
 * UNIFIED SERVICE ORCHESTRATOR
 * Manages the interaction between AI Services and User Services
 */
export class ServiceOrchestrator {
  private aiServices: ServiceRegistry;
  private userServices: ServiceRegistry;

  constructor() {
    this.aiServices = createAIServicesRegistry();
    this.userServices = createUserServicesRegistry();
  }

  /**
   * Execute a user service with proper AI service verification chain
   */
  async executeUserService(
    serviceName: string, 
    input: any,
    context: { session_id: string; email?: string; kv: any }
  ): Promise<{
    success: boolean;
    data: any;
    errors?: string[];
    aiServicesExecuted: string[];
    userServiceExecuted?: string;
  }> {
    const aiServicesExecuted: string[] = [];
    let sessionData: any = null;

    try {
      // Step 1: Session Management (Always runs first)
      const sessionResult = await this.aiServices.execute('ai_session_management', {
        session_id: context.session_id,
        kv: context.kv
      });
      aiServicesExecuted.push('ai_session_management');
      sessionData = sessionResult.data;

      // Ensure sessionData has the expected structure
      if (!sessionData || !sessionData.data) {
        sessionData = { 
          success: true, 
          data: { 
            serviceHistory: [],
            session_id: context.session_id,
            created_at: new Date().toISOString()
          } 
        };
      }

      // Step 2: Email Verification (if required and email provided)
      const userService = this.userServices.get(serviceName);
      if (!userService) {
        throw new Error(`User service ${serviceName} not found`);
      }

      if (userService.config.requiresVerification && context.email) {
        const emailVerificationResult = await this.aiServices.execute('ai_email_verification', {
          session_id: context.session_id,
          email: context.email,
          kv: context.kv
        });
        aiServicesExecuted.push('ai_email_verification');

        // Check if verification is needed
        if (emailVerificationResult.data.status === 'needs_verification') {
          return {
            success: false,
            data: {
              requiresVerification: true,
              email: context.email,
              sessionData: sessionData
            },
            errors: ['Email verification required before proceeding'],
            aiServicesExecuted
          };
        }
      }

      // Step 3: Phone Verification (if required - future)
      if (userService.config.requiresPhoneVerification) {
        // TODO: Implement phone verification check
        throw new Error('Phone verification not yet implemented');
      }

      // Step 4: Execute the requested User Service
      const userServiceResult = await this.userServices.execute(serviceName, {
        ...input,
        sessionData: sessionData,
        ...context
      });

      // Step 5: Update session with service execution data
      if (userServiceResult.success && context.kv && sessionData?.data) {
        const updatedSession = {
          ...sessionData.data,
          lastServiceExecuted: serviceName,
          lastExecutionTime: new Date().toISOString(),
          serviceHistory: [
            ...(sessionData.data.serviceHistory || []),
            {
              service: serviceName,
              executedAt: new Date().toISOString(),
              success: true
            }
          ]
        };

        // Store session using the passed KV instance (which should be encrypted)
        await context.kv.put(`session:${context.session_id}`, JSON.stringify(updatedSession), {
          expirationTtl: 3600
        });
      }

      return {
        success: true,
        data: userServiceResult.data,
        errors: userServiceResult.errors,
        aiServicesExecuted,
        userServiceExecuted: serviceName
      };

    } catch (error) {
      console.error('Service orchestration error:', error);
      return {
        success: false,
        data: null,
        errors: [error instanceof Error ? error.message : String(error)],
        aiServicesExecuted
      };
    }
  }

  /**
   * Get available user services (enabled only)
   */
  getAvailableUserServices(): string[] {
    return this.userServices.getEnabledServices();
  }

  /**
   * Get AI services status
   */
  getAIServicesStatus() {
    return this.aiServices.list();
  }

  /**
   * Get user services status  
   */
  getUserServicesStatus() {
    return this.userServices.list();
  }
}

// Global orchestrator instance
export const serviceOrchestrator = new ServiceOrchestrator();
