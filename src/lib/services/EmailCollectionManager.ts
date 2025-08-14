// Progressive Email Collection System
// Smart email request logic based on user engagement

import { ProfileManager } from '../user/ProfileManager.js';
import type { UserProfile } from '../user/ProfileManager.js';
import { createServiceArchitecture, type ServiceArchitecture } from './ServiceArchitecture.js';

export interface EmailCollectionContext {
  serviceName?: string;
  message?: string;
  userIntent?: string;
  urgencyLevel?: 'low' | 'medium' | 'high';
}

export interface EmailCollectionResult {
  shouldRequest: boolean;
  strategy: 'immediate' | 'soft_nudge' | 'value_demonstration' | 'urgency_based';
  message: string;
  timing: 'now' | 'after_service' | 'next_interaction';
  reason: string;
}

export class EmailCollectionManager {
  private profileManager: ProfileManager;

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
  }

  /**
   * Determine if and how to request email from user
   */
  async evaluateEmailRequest(
    profile: UserProfile, 
    context: EmailCollectionContext
  ): Promise<EmailCollectionResult> {
    
    // Never request if already requested or verified
    if (profile.emailRequested || profile.emailVerified) {
      return {
        shouldRequest: false,
        strategy: 'immediate',
        message: '',
        timing: 'now',
        reason: 'already_handled'
      };
    }

    // Evaluate different triggers
    const triggers = this.evaluateTriggers(profile, context);
    
    if (!triggers.shouldRequest) {
      return {
        shouldRequest: false,
        strategy: 'value_demonstration',
        message: '',
        timing: 'next_interaction',
        reason: 'insufficient_engagement'
      };
    }

    // Determine strategy based on trigger type and user state
    return this.determineCollectionStrategy(profile, context, triggers);
  }

  /**
   * Evaluate all possible triggers for email collection
   */
  private evaluateTriggers(profile: UserProfile, context: EmailCollectionContext): {
    shouldRequest: boolean;
    triggerType: string;
    confidence: number;
  } {
    const triggers = [
      // Engagement-based triggers
      {
        name: 'high_engagement',
        condition: profile.interactions >= 3 && profile.trustScore >= 10,
        confidence: 0.8,
        weight: 1.0
      },
      {
        name: 'multiple_free_services',
        condition: profile.freeServicesUsed.length >= 2,
        confidence: 0.75,
        weight: 0.9
      },
      {
        name: 'return_visitor',
        condition: profile.sessionsCount >= 2,
        confidence: 0.7,
        weight: 0.8
      },
      
      // Service-based triggers
      {
        name: 'premium_service_request',
        condition: context.serviceName && serviceArchitecture.isPremiumService(context.serviceName),
        confidence: 0.9,
        weight: 1.2
      },
      {
        name: 'premium_service_attempted',
        condition: profile.premiumServicesAttempted.length > 0,
        confidence: 0.85,
        weight: 1.1
      },
      
      // Intent-based triggers
      {
        name: 'analysis_request',
        condition: context.message?.toLowerCase().includes('analyz') || 
                  context.message?.toLowerCase().includes('report') ||
                  context.message?.toLowerCase().includes('detailed'),
        confidence: 0.8,
        weight: 1.0
      },
      {
        name: 'business_inquiry',
        condition: context.message?.toLowerCase().includes('business') ||
                  context.message?.toLowerCase().includes('website') ||
                  context.message?.toLowerCase().includes('seo'),
        confidence: 0.6,
        weight: 0.7
      },
      
      // Conversion indicators
      {
        name: 'high_conversion_potential',
        condition: profile.conversionPotential >= 0.7,
        confidence: 0.9,
        weight: 1.3
      },
      {
        name: 'engaged_session',
        condition: profile.interactions >= 2 && profile.engagementScore >= 15,
        confidence: 0.75,
        weight: 0.9
      }
    ];

    // Calculate weighted score
    const activeTriggers = triggers.filter(t => t.condition);
    if (activeTriggers.length === 0) {
      return { shouldRequest: false, triggerType: 'none', confidence: 0 };
    }

    const totalWeight = activeTriggers.reduce((sum, t) => sum + (t.confidence * t.weight), 0);
    const maxPossibleWeight = activeTriggers.reduce((sum, t) => sum + t.weight, 0);
    const confidence = totalWeight / maxPossibleWeight;

    // Threshold for email request
    const shouldRequest = confidence >= 0.6;
    const primaryTrigger = activeTriggers.reduce((prev, current) => 
      (prev.confidence * prev.weight) > (current.confidence * current.weight) ? prev : current
    );

    return {
      shouldRequest,
      triggerType: primaryTrigger.name,
      confidence
    };
  }

  /**
   * Determine the best strategy for collecting email
   */
  private determineCollectionStrategy(
    profile: UserProfile, 
    context: EmailCollectionContext,
    triggers: { shouldRequest: boolean; triggerType: string; confidence: number }
  ): EmailCollectionResult {
    
    const { triggerType, confidence } = triggers;

    // High confidence, immediate request strategies
    if (confidence >= 0.8) {
      if (triggerType === 'premium_service_request') {
        return {
          shouldRequest: true,
          strategy: 'immediate',
          message: `I'd love to run that ${context.serviceName?.replace('_', ' ')} for you! To save your detailed results and send you the comprehensive report, I'll need your email address.`,
          timing: 'now',
          reason: 'premium_service_gate'
        };
      }

      if (triggerType === 'high_conversion_potential') {
        return {
          shouldRequest: true,
          strategy: 'urgency_based',
          message: "You're clearly serious about improving your business! Let me run a comprehensive analysis and send you a detailed report. What's your email address?",
          timing: 'now',
          reason: 'high_intent_detected'
        };
      }
    }

    // Medium confidence, soft approach
    if (confidence >= 0.6) {
      if (triggerType === 'multiple_free_services' || triggerType === 'high_engagement') {
        return {
          shouldRequest: true,
          strategy: 'soft_nudge',
          message: "I can see you're getting value from these tools! Want me to save your progress and send you personalized recommendations? Just need your email.",
          timing: 'after_service',
          reason: 'value_demonstrated'
        };
      }

      if (triggerType === 'return_visitor') {
        return {
          shouldRequest: true,
          strategy: 'value_demonstration',
          message: "Welcome back! Since you're a returning visitor, I can provide more personalized insights. Mind sharing your email so I can tailor recommendations for you?",
          timing: 'now',
          reason: 'returning_user'
        };
      }
    }

    // Default soft approach for lower confidence
    return {
      shouldRequest: true,
      strategy: 'soft_nudge',
      message: "I have some great insights that would help your business. Want me to send you a detailed analysis? I'll just need your email address.",
      timing: 'after_service',
      reason: 'general_engagement'
    };
  }

  /**
   * Get email request message based on context
   */
  async getEmailRequestMessage(profile: UserProfile, context: EmailCollectionContext): Promise<string> {
    const evaluation = await this.evaluateEmailRequest(profile, context);
    return evaluation.message;
  }

  /**
   * Handle successful email collection
   */
  async handleEmailProvided(profile: UserProfile, email: string): Promise<UserProfile> {
    // Mark email as provided but not yet verified
    profile.email = email;
    profile.emailRequested = true;
    profile.emailRequestedAt = Date.now();
    
    // Boost trust score for providing email
    profile.trustScore += 15;
    
    return await this.profileManager.trackInteraction(profile, 'email_provided', { email });
  }

  /**
   * Handle successful email verification
   */
  async handleEmailVerified(profile: UserProfile): Promise<UserProfile> {
    return await this.profileManager.verifyEmail(profile, profile.email!);
  }

  /**
   * Get email verification message
   */
  getEmailVerificationMessage(email: string): string {
    return `Perfect! I've sent a verification link to ${email}. Please check your inbox and click the link to unlock premium features. The link is valid for 24 hours.`;
  }

  /**
   * Handle email collection refusal
   */
  async handleEmailRefused(profile: UserProfile, reason?: string): Promise<UserProfile> {
    // Track refusal but don't mark as requested (can try again later)
    return await this.profileManager.trackInteraction(profile, 'email_refused', { reason });
  }

  /**
   * Get alternative value proposition for email refusal
   */
  getAlternativeValue(profile: UserProfile): string {
    const freeServices = serviceArchitecture.getServicesByCategory('free');
    const accessibleFree = freeServices.filter(service => {
      const access = serviceArchitecture.checkServiceAccess(service.name, profile);
      return access.allowed;
    });

    if (accessibleFree.length > 0) {
      const serviceNames = accessibleFree.slice(0, 2).map(s => s.displayName).join(' and ');
      return `No problem! You can still use ${serviceNames} without providing your email. Just ask me about them anytime!`;
    }

    return "No worries! I'm here to help with general questions and tips anytime. Feel free to ask me anything about your website or business!";
  }
}

export default EmailCollectionManager;
