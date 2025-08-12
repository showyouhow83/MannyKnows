import type { ServiceComponent } from '../types';

// Component: Fetch website content
export const fetchWebsiteComponent: ServiceComponent = {
  name: 'fetch_website',
  config: { enabled: true, priority: 1, timeout: 15000 },
  execute: async (input: { url: string; startTime?: number }) => {
    const startTime = input.startTime || Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(input.url, {
        headers: { 
          'User-Agent': 'MK-WebAnalyzer/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const html = await response.text();
      const responseTime = Date.now() - startTime;
      
      return {
        html,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        responseTime,
        url: response.url, // Final URL after redirects
        success: response.ok
      };
    } catch (error) {
      throw new Error(`Failed to fetch website: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Component: Analyze SEO
export const seoAnalysisComponent: ServiceComponent = {
  name: 'seo_analysis',
  config: { enabled: true, priority: 2 },
  execute: async (input: { fetch_website: { html: string; url: string } }) => {
    const { html, url } = input.fetch_website;
    
    try {
      // Simple HTML parsing (in real environment you'd use proper DOM parser)
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      const metaDescription = metaDescMatch ? metaDescMatch[1] : '';
      
      const h1Matches = html.match(/<h1[^>]*>/gi) || [];
      const h1Count = h1Matches.length;
      
      const imgMatches = html.match(/<img[^>]*>/gi) || [];
      const totalImages = imgMatches.length;
      const imagesWithAlt = imgMatches.filter(img => img.includes('alt=')).length;
      
      // Calculate SEO score
      let score = 100;
      const issues: string[] = [];
      
      if (!title) {
        score -= 20;
        issues.push('Missing page title');
      } else if (title.length < 30 || title.length > 60) {
        score -= 10;
        issues.push(`Title length is ${title.length} characters (optimal: 30-60)`);
      }
      
      if (!metaDescription) {
        score -= 15;
        issues.push('Missing meta description');
      } else if (metaDescription.length < 120 || metaDescription.length > 160) {
        score -= 5;
        issues.push(`Meta description length is ${metaDescription.length} characters (optimal: 120-160)`);
      }
      
      if (h1Count === 0) {
        score -= 15;
        issues.push('Missing H1 tag');
      } else if (h1Count > 1) {
        score -= 10;
        issues.push(`Multiple H1 tags found: ${h1Count}`);
      }
      
      if (totalImages > 0 && imagesWithAlt < totalImages) {
        score -= 10;
        issues.push(`${totalImages - imagesWithAlt} images missing alt text`);
      }
      
      return {
        title,
        titleLength: title.length,
        metaDescription,
        metaDescriptionLength: metaDescription.length,
        h1Count,
        totalImages,
        imagesWithAlt,
        score: Math.max(0, score),
        issues,
        recommendations: generateSEORecommendations(issues)
      };
    } catch (error) {
      throw new Error(`SEO analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Component: Performance Analysis
export const performanceComponent: ServiceComponent = {
  name: 'performance_analysis',
  config: { enabled: true, priority: 3 },
  execute: async (input: { fetch_website: { html: string; responseTime: number } }) => {
    const { html, responseTime } = input.fetch_website;
    
    try {
      const pageSizeKB = Math.round(new Blob([html]).size / 1024);
      
      // Calculate performance score based on response time
      let score = 100;
      if (responseTime > 3000) score -= 40;
      else if (responseTime > 2000) score -= 25;
      else if (responseTime > 1000) score -= 15;
      else if (responseTime > 500) score -= 5;
      
      // Additional performance checks
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      if (responseTime > 3000) {
        issues.push(`Slow response time: ${responseTime}ms`);
        recommendations.push('Optimize server response time');
        recommendations.push('Enable compression');
        recommendations.push('Optimize images');
      }
      
      if (pageSizeKB > 500) {
        score -= 10;
        issues.push(`Large page size: ${pageSizeKB}KB`);
        recommendations.push('Minify CSS and JavaScript');
        recommendations.push('Compress images');
      }
      
      // Check for render-blocking resources
      const cssMatches = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) || [];
      const jsMatches = html.match(/<script[^>]*src=[^>]*><\/script>/gi) || [];
      
      if (cssMatches.length > 3) {
        score -= 5;
        issues.push(`Multiple CSS files: ${cssMatches.length}`);
        recommendations.push('Combine CSS files');
      }
      
      if (jsMatches.length > 3) {
        score -= 5;
        issues.push(`Multiple JavaScript files: ${jsMatches.length}`);
        recommendations.push('Combine JavaScript files');
      }
      
      return {
        responseTime,
        pageSizeKB,
        score: Math.max(0, score),
        issues,
        recommendations,
        cssFiles: cssMatches.length,
        jsFiles: jsMatches.length
      };
    } catch (error) {
      throw new Error(`Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Component: Security Check
export const securityComponent: ServiceComponent = {
  name: 'security_analysis',
  config: { enabled: true, priority: 4 },
  execute: async (input: { fetch_website: { url: string; headers: Record<string, string> } }) => {
    const { url, headers } = input.fetch_website;
    
    try {
      const isHTTPS = url.startsWith('https://');
      const hasHSTS = 'strict-transport-security' in headers;
      const hasXFrameOptions = 'x-frame-options' in headers;
      const hasXContentTypeOptions = 'x-content-type-options' in headers;
      const hasCSP = 'content-security-policy' in headers;
      
      let score = isHTTPS ? 70 : 20; // HTTPS is baseline
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      if (!isHTTPS) {
        issues.push('Not using HTTPS');
        recommendations.push('Implement SSL certificate');
      }
      
      if (!hasHSTS && isHTTPS) {
        score -= 10;
        issues.push('Missing HSTS header');
        recommendations.push('Add Strict-Transport-Security header');
      } else if (hasHSTS) {
        score += 10;
      }
      
      if (!hasXFrameOptions) {
        score -= 5;
        issues.push('Missing X-Frame-Options header');
        recommendations.push('Add X-Frame-Options header to prevent clickjacking');
      } else {
        score += 5;
      }
      
      if (!hasXContentTypeOptions) {
        score -= 5;
        issues.push('Missing X-Content-Type-Options header');
        recommendations.push('Add X-Content-Type-Options: nosniff header');
      } else {
        score += 5;
      }
      
      if (!hasCSP) {
        score -= 10;
        issues.push('Missing Content Security Policy');
        recommendations.push('Implement Content Security Policy');
      } else {
        score += 15;
      }
      
      return {
        isHTTPS,
        hasHSTS,
        hasXFrameOptions,
        hasXContentTypeOptions,
        hasCSP,
        score: Math.max(0, Math.min(100, score)),
        issues,
        recommendations,
        securityHeaders: {
          'strict-transport-security': headers['strict-transport-security'] || null,
          'x-frame-options': headers['x-frame-options'] || null,
          'x-content-type-options': headers['x-content-type-options'] || null,
          'content-security-policy': headers['content-security-policy'] || null
        }
      };
    } catch (error) {
      throw new Error(`Security analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Component: Business Opportunity Detection
export const opportunityDetectionComponent: ServiceComponent = {
  name: 'opportunity_detection',
  config: { enabled: true, priority: 5 },
  execute: async (input: any) => {
    try {
      const opportunities = [];
      const seo = input.seo_analysis;
      const performance = input.performance_analysis;
      const security = input.security_analysis;
      
      // SEO opportunities
      if (seo.score < 70) {
        opportunities.push({
          type: 'seo',
          title: 'SEO Optimization',
          description: 'Poor search visibility limiting organic traffic growth',
          impact: seo.score < 50 ? 'high' : 'medium',
          service: 'seo_optimization',
          urgency: 'high',
          revenue_impact: 'potential thousands in monthly search traffic'
        });
      }
      
      // Performance opportunities
      if (performance.score < 80) {
        opportunities.push({
          type: 'performance',
          title: 'Site Speed Optimization',
          description: 'Slow loading times causing visitor abandonment and lost conversions',
          impact: performance.responseTime > 3000 ? 'high' : 'medium',
          service: 'performance_optimization',
          urgency: 'high',
          revenue_impact: 'up to 25% conversion rate improvement'
        });
      }
      
      // Security opportunities
      if (security.score < 80) {
        opportunities.push({
          type: 'security',
          title: 'Security Enhancement',
          description: 'Security vulnerabilities damaging customer trust and search rankings',
          impact: !security.isHTTPS ? 'high' : 'medium',
          service: 'security_hardening',
          urgency: 'medium',
          revenue_impact: 'improved customer confidence and search rankings'
        });
      }
      
      // Calculate overall lead score
      const leadScore = calculateLeadScore(opportunities, seo, performance, security);
      
      return {
        opportunities,
        leadScore,
        overallScore: Math.round((seo.score + performance.score + security.score) / 3),
        primaryIssue: determinePrimaryIssue(seo, performance, security),
        urgencyLevel: determineUrgencyLevel(opportunities)
      };
    } catch (error) {
      throw new Error(`Opportunity detection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Helper functions
function generateSEORecommendations(issues: string[]): string[] {
  const recommendations: string[] = [];
  
  if (issues.some(issue => issue.includes('title'))) {
    recommendations.push('Add compelling page title (30-60 characters)');
  }
  if (issues.some(issue => issue.includes('meta description'))) {
    recommendations.push('Write compelling meta description (120-160 characters)');
  }
  if (issues.some(issue => issue.includes('H1'))) {
    recommendations.push('Add single, keyword-rich H1 heading');
  }
  if (issues.some(issue => issue.includes('alt text'))) {
    recommendations.push('Add descriptive alt text to all images');
  }
  
  return recommendations;
}

function calculateLeadScore(opportunities: any[], seo: any, performance: any, security: any): number {
  let score = 0;
  
  // Base score from opportunities
  score += opportunities.length * 20;
  
  // Bonus for high-impact issues
  opportunities.forEach(opp => {
    if (opp.impact === 'high') score += 15;
    if (opp.urgency === 'high') score += 10;
  });
  
  // Penalty for very poor scores (indicates potential budget)
  if (seo.score < 50) score += 25;
  if (performance.score < 60) score += 25;
  if (!security.isHTTPS) score += 30;
  
  return Math.min(100, score);
}

function determinePrimaryIssue(seo: any, performance: any, security: any): string {
  const scores = [
    { type: 'seo', score: seo.score },
    { type: 'performance', score: performance.score },
    { type: 'security', score: security.score }
  ];
  
  const lowest = scores.reduce((min, current) => 
    current.score < min.score ? current : min
  );
  
  return lowest.type;
}

function determineUrgencyLevel(opportunities: any[]): 'low' | 'medium' | 'high' {
  const highUrgencyCount = opportunities.filter(opp => opp.urgency === 'high').length;
  
  if (highUrgencyCount >= 2) return 'high';
  if (highUrgencyCount >= 1) return 'medium';
  return 'low';
}

// Component: AI Readiness Analysis
export const aiReadinessComponent: ServiceComponent = {
  name: 'ai_readiness_analysis',
  config: { enabled: true, priority: 6, timeout: 8000 },
  execute: async (input: { url: string; html?: string; seoData?: any; performanceData?: any }) => {
    try {
      const aiReadinessScore = calculateAIReadinessScore(input);
      const automationOpportunities = identifyAutomationOpportunities(input);
      const aiAgentRecommendations = generateAIAgentRecommendations(aiReadinessScore, automationOpportunities);
      
      return {
        success: true,
        data: {
          readinessScore: aiReadinessScore,
          readinessLevel: getReadinessLevel(aiReadinessScore.overall),
          automationOpportunities,
          aiAgentRecommendations,
          businessImpact: calculateBusinessImpact(automationOpportunities),
          nextSteps: generateNextSteps(aiReadinessScore.overall)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI readiness analysis failed'
      };
    }
  }
};

function calculateAIReadinessScore(input: any) {
  // Analyze various factors for AI automation readiness
  const factors = {
    dataQuality: analyzeDataQuality(input),
    technicalInfrastructure: analyzeTechnicalReadiness(input),
    contentStructure: analyzeContentStructure(input),
    userExperience: analyzeUXForAutomation(input),
    businessProcesses: analyzeBusinessProcessMaturity(input)
  };
  
  const overall = Math.round(
    (factors.dataQuality * 0.25) +
    (factors.technicalInfrastructure * 0.20) +
    (factors.contentStructure * 0.20) +
    (factors.userExperience * 0.20) +
    (factors.businessProcesses * 0.15)
  );
  
  return {
    overall,
    breakdown: factors
  };
}

function analyzeDataQuality(input: any): number {
  let score = 100;
  
  // Check for structured data
  if (!input.html?.includes('application/ld+json')) score -= 20;
  if (!input.html?.includes('schema.org')) score -= 15;
  
  // Check for analytics tracking
  if (!input.html?.includes('gtag') && !input.html?.includes('analytics')) score -= 25;
  
  // Check for proper meta data
  if (!input.seoData?.hasMetaDescription) score -= 10;
  if (!input.seoData?.hasTitle) score -= 10;
  
  return Math.max(0, score);
}

function analyzeTechnicalReadiness(input: any): number {
  let score = 100;
  
  // Performance factors affect AI integration capability
  if (input.performanceData?.responseTime > 3000) score -= 30;
  if (input.performanceData?.responseTime > 1500) score -= 15;
  
  // Check for modern frameworks/APIs
  if (!input.html?.includes('api') && !input.html?.includes('json')) score -= 20;
  
  // Mobile readiness affects AI automation potential
  if (!input.html?.includes('viewport')) score -= 15;
  
  return Math.max(0, score);
}

function analyzeContentStructure(input: any): number {
  let score = 100;
  
  const html = input.html || '';
  
  // Check for semantic HTML structure
  if (!html.includes('<header>')) score -= 10;
  if (!html.includes('<main>')) score -= 10;
  if (!html.includes('<nav>')) score -= 10;
  
  // Check for headings hierarchy (important for AI content understanding)
  const h1Count = (html.match(/<h1/g) || []).length;
  const h2Count = (html.match(/<h2/g) || []).length;
  
  if (h1Count !== 1) score -= 15;
  if (h2Count < 2) score -= 10;
  
  // Check for forms (automation opportunities)
  const formCount = (html.match(/<form/g) || []).length;
  if (formCount === 0) score -= 20;
  
  return Math.max(0, score);
}

function analyzeUXForAutomation(input: any): number {
  let score = 100;
  
  // Check for interactive elements that can be automated
  const html = input.html || '';
  
  if (!html.includes('button')) score -= 15;
  if (!html.includes('input')) score -= 20;
  if (!html.includes('chat') && !html.includes('contact')) score -= 25;
  
  // Check for user engagement opportunities
  if (!html.includes('newsletter') && !html.includes('subscribe')) score -= 10;
  if (!html.includes('search')) score -= 10;
  
  return Math.max(0, score);
}

function analyzeBusinessProcessMaturity(input: any): number {
  let score = 100;
  
  const html = input.html || '';
  
  // Check for CRM/automation tool integrations
  if (!html.includes('hubspot') && !html.includes('salesforce') && !html.includes('mailchimp')) score -= 20;
  
  // Check for e-commerce capabilities
  if (html.includes('shop') || html.includes('cart') || html.includes('buy')) score += 15;
  
  // Check for lead generation infrastructure
  if (!html.includes('form') && !html.includes('contact')) score -= 25;
  
  return Math.min(100, Math.max(0, score));
}

function identifyAutomationOpportunities(input: any) {
  const opportunities = [];
  const html = input.html || '';
  
  // Lead Generation Automation
  if (html.includes('form') || html.includes('contact')) {
    opportunities.push({
      category: 'Lead Generation',
      opportunity: 'AI Lead Qualification Agent',
      description: 'Automate lead scoring, qualification, and initial outreach based on visitor behavior and form submissions',
      impact: 'high',
      timeToValue: '2-4 weeks',
      estimatedROI: '300-500%'
    });
  }
  
  // Customer Support Automation
  if (html.includes('support') || html.includes('help') || html.includes('faq')) {
    opportunities.push({
      category: 'Customer Support',
      opportunity: 'AI Support Agent',
      description: 'Deploy 24/7 AI customer support that handles 80% of inquiries automatically',
      impact: 'high',
      timeToValue: '1-3 weeks',
      estimatedROI: '200-400%'
    });
  }
  
  // Content Automation
  if (html.includes('blog') || html.includes('news') || html.includes('article')) {
    opportunities.push({
      category: 'Content Marketing',
      opportunity: 'AI Content Generator Agent',
      description: 'Automatically create, optimize, and publish content based on trending topics and SEO opportunities',
      impact: 'medium',
      timeToValue: '3-6 weeks',
      estimatedROI: '150-300%'
    });
  }
  
  // E-commerce Automation
  if (html.includes('shop') || html.includes('product') || html.includes('cart')) {
    opportunities.push({
      category: 'E-commerce',
      opportunity: 'AI Sales Assistant Agent',
      description: 'Personalized product recommendations, abandoned cart recovery, and dynamic pricing optimization',
      impact: 'high',
      timeToValue: '4-8 weeks',
      estimatedROI: '250-450%'
    });
  }
  
  // SEO Automation
  opportunities.push({
    category: 'SEO Optimization',
    opportunity: 'AI SEO Monitor Agent',
    description: 'Continuously monitor rankings, identify content gaps, and automatically optimize meta tags and content',
    impact: 'medium',
    timeToValue: '2-6 weeks',
    estimatedROI: '180-350%'
  });
  
  return opportunities;
}

function generateAIAgentRecommendations(readinessScore: any, opportunities: any[]) {
  const recommendations = [];
  
  if (readinessScore.overall >= 80) {
    recommendations.push({
      priority: 'immediate',
      agent: 'Full AI Business Intelligence Suite',
      description: 'Your website is highly ready for AI automation. Deploy comprehensive AI agents across all business functions.',
      investment: '$5,000-15,000/month',
      expectedOutcome: 'Complete business process automation with 40-70% operational efficiency gains'
    });
  } else if (readinessScore.overall >= 60) {
    recommendations.push({
      priority: 'high',
      agent: 'Targeted AI Agent Deployment',
      description: 'Focus on 2-3 high-impact AI agents to maximize immediate ROI while building foundation for expansion.',
      investment: '$2,000-8,000/month',
      expectedOutcome: '25-50% improvement in targeted business areas'
    });
  } else if (readinessScore.overall >= 40) {
    recommendations.push({
      priority: 'medium',
      agent: 'AI Readiness Foundation',
      description: 'Implement basic AI infrastructure and one pilot AI agent to demonstrate value and build capabilities.',
      investment: '$1,000-4,000/month',
      expectedOutcome: '15-30% efficiency gain in pilot area plus foundation for future AI expansion'
    });
  } else {
    recommendations.push({
      priority: 'preparation',
      agent: 'AI Foundation Building',
      description: 'Focus on improving technical infrastructure and data quality before deploying AI agents.',
      investment: '$500-2,000/month',
      expectedOutcome: 'AI-ready infrastructure within 3-6 months, then deploy targeted agents'
    });
  }
  
  return recommendations;
}

function calculateBusinessImpact(opportunities: any[]) {
  const highImpactCount = opportunities.filter(opp => opp.impact === 'high').length;
  const totalOpportunities = opportunities.length;
  
  return {
    potentialRevenueLift: `${Math.round((highImpactCount / totalOpportunities) * 100 + 20)}%-${Math.round((highImpactCount / totalOpportunities) * 150 + 50)}%`,
    operationalSavings: `${Math.round(totalOpportunities * 15)}%-${Math.round(totalOpportunities * 35)}%`,
    timeToPositiveROI: totalOpportunities > 3 ? '2-4 months' : '1-3 months',
    riskLevel: totalOpportunities > 4 ? 'low' : 'very-low'
  };
}

function generateNextSteps(overallScore: number) {
  const steps = [
    'Schedule AI readiness consultation with MK team',
    'Prioritize automation opportunities based on business impact',
    'Develop custom AI agent implementation roadmap'
  ];
  
  if (overallScore < 60) {
    steps.unshift('Improve technical infrastructure and data quality');
  }
  
  if (overallScore >= 80) {
    steps.push('Begin full AI transformation program');
  } else {
    steps.push('Start with pilot AI agent deployment');
  }
  
  return steps;
}

function getReadinessLevel(score: number): string {
  if (score >= 80) return 'Highly Ready';
  if (score >= 60) return 'Ready';
  if (score >= 40) return 'Moderately Ready';
  return 'Needs Foundation Work';
}
