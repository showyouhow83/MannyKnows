import { Service } from '../serviceFramework';
import type { ServiceComponent } from '../types/index';

// Email validation component
const emailValidationComponent: ServiceComponent = {
  name: 'email_validation',
  config: {
    enabled: true,
    priority: 1,
    timeout: 5000
  },
  async execute(input: any) {
    const { email } = input;
    
    if (!email) {
      throw new Error('Email is required');
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);
    
    // Extract domain
    const domain = email.split('@')[1];
    
    // Simple domain check (in real world, you'd use DNS lookup)
    const commonDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
      'icloud.com', 'aol.com', 'protonmail.com'
    ];
    
    const isCommonDomain = commonDomains.includes(domain.toLowerCase());
    
    return {
      isValid: isValidFormat,
      domain: domain,
      isCommonDomain: isCommonDomain,
      score: isValidFormat ? (isCommonDomain ? 95 : 80) : 0,
      issues: isValidFormat ? [] : ['Invalid email format'],
      recommendations: isValidFormat ? 
        (isCommonDomain ? ['Email format is excellent'] : ['Consider using a more common email provider for better deliverability']) :
        ['Please provide a valid email address']
    };
  }
};

// Deliverability analysis component
const deliverabilityComponent: ServiceComponent = {
  name: 'deliverability_analysis',
  config: {
    enabled: true,
    priority: 2,
    timeout: 5000
  },
  async execute(input: any) {
    const { email, email_validation } = input;
    
    if (!email_validation?.isValid) {
      return {
        score: 0,
        factors: [],
        recommendations: ['Fix email validation issues first']
      };
    }

    const domain = email_validation.domain;
    const factors = [];
    let score = 70; // Base score

    // Check for business vs personal email
    if (!email_validation.isCommonDomain) {
      factors.push('Business email domain');
      score += 20;
    } else {
      factors.push('Personal email domain');
      score += 10;
    }

    // Check for plus addressing
    if (email.includes('+')) {
      factors.push('Uses plus addressing (good for tracking)');
      score += 5;
    }

    return {
      score: Math.min(score, 100),
      factors: factors,
      domain: domain,
      isBusinessEmail: !email_validation.isCommonDomain,
      recommendations: [
        'Email appears deliverable',
        email_validation.isCommonDomain ? 
          'Consider business email for professional communications' :
          'Business email detected - excellent for B2B communications'
      ]
    };
  }
};

// Create Email Analysis Service
export function createEmailAnalysisService(): Service {
  const service = new Service('email_analysis', {
    enabled: true,
    requiresVerification: false, // Email analysis doesn't need verification
    maxExecutionTime: 10000
  });

  service.addComponent('email_validation', emailValidationComponent);
  service.addComponent('deliverability_analysis', deliverabilityComponent);

  return service;
}
