import type { SalesResponse } from './types';

export class SalesResponseGenerator {
  static generateResponse(analysisData: any, websiteUrl: string): SalesResponse {
    const { opportunity_detection, seo_analysis, performance_analysis, security_analysis } = analysisData;
    
    // Determine the main area for improvement
    const primaryFocus = this.determinePrimaryFocus(seo_analysis, performance_analysis, security_analysis);
    
    // Create helpful summary message
    const summaryMessage = this.createSummaryMessage(primaryFocus, analysisData);
    
    // Get specific improvement opportunity
    const keyOpportunity = this.getKeyOpportunity(analysisData);
    
    // Generate helpful, consultative response
    const reply = `I've completed a comprehensive analysis of ${websiteUrl}. Here's what I found:

${summaryMessage}

**Key improvement opportunity:** ${keyOpportunity}

📊 **Quick Summary:**
• SEO Score: ${seo_analysis.score}/100
• Performance: ${performance_analysis.responseTime || 'N/A'}ms load time
• Security: ${security_analysis.isHTTPS ? '✅ HTTPS enabled' : '⚠️ HTTPS needed'}

${this.generateActionableInsights(opportunity_detection.opportunities)}

Would you like me to dive deeper into any specific area, or would you prefer to discuss how Manny can help implement these improvements? I can arrange a brief consultation to create a custom roadmap for your website.`;

    return {
      reply,
      urgency: opportunity_detection.urgencyLevel,
      leadScore: opportunity_detection.leadScore,
      nextAction: opportunity_detection.leadScore > 60 ? 'schedule' : 'follow_up',
      opportunities: opportunity_detection.opportunities
    };
  }

  private static determinePrimaryFocus(seo: any, performance: any, security: any): string {
    const areas = [
      { type: 'SEO', score: seo.score },
      { type: 'performance', score: performance.score },
      { type: 'security', score: security.score }
    ];
    
    return areas.reduce((lowest, current) => 
      current.score < lowest.score ? current : lowest
    ).type;
  }

  private static createSummaryMessage(primaryFocus: string, data: any): string {
    const { seo_analysis, performance_analysis, security_analysis } = data;
    
    switch (primaryFocus) {
      case 'performance':
        return `**Performance Analysis:** Your site loads in ${performance_analysis.responseTime}ms. There are opportunities to improve user experience and potentially increase conversions.`;
      
      case 'SEO':
        return `**SEO Analysis:** Current SEO score is ${seo_analysis.score}/100. I've identified several optimization opportunities to improve search visibility.`;
      
      case 'security':
        if (!security_analysis.isHTTPS) {
          return `**Security Analysis:** Your site would benefit from HTTPS implementation for better security and search ranking.`;
        }
        return `**Security Analysis:** Overall security is good, with some minor improvements possible.`;
      
      default:
        return `**Comprehensive Analysis:** I've reviewed SEO, performance, and security aspects of your website.`;
    }
  }

  private static getKeyOpportunity(data: any): string {
    const allIssues = [
      ...data.seo_analysis.issues,
      ...data.performance_analysis.issues,
      ...data.security_analysis.issues
    ];
    
    if (allIssues.length === 0) {
      return 'Your website is performing well overall. We can explore advanced optimization strategies.';
    }
    
    // Prioritize user-friendly descriptions
    const issuePriority = [
      'Not using HTTPS',
      'Multiple H1 tags found',
      'Missing page title',
      'Missing meta description',
      'Slow response time'
    ];
    
    for (const priority of issuePriority) {
      const found = allIssues.find(issue => issue.includes(priority.split(':')[0]));
      if (found) return found;
    }
    
    return allIssues[0];
  }

  private static generateActionableInsights(opportunities: any[]): string {
    if (!opportunities || opportunities.length === 0) {
      return `🎯 **Next Steps:** Your website has a solid foundation. Let's discuss advanced optimization strategies to stay ahead of the competition.`;
    }

    const topOpportunities = opportunities.slice(0, 3);
    const insights = topOpportunities.map((opp, index) => 
      `${index + 1}. ${opp.description}`
    ).join('\n');

    return `🎯 **Top Opportunities:**\n${insights}\n\nThese improvements can help enhance user experience and potentially improve your website's performance.`;
  }
}
