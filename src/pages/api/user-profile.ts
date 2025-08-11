import type { APIRoute } from 'astro';
import type { UserVerificationData } from '../../lib/verification/emailVerification.js';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email } = await request.json();
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!kv) {
      return new Response(JSON.stringify({ error: 'Storage not available' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user data
    const userData = await kv.get(`user:${email}`);
    
    if (!userData) {
      return new Response(JSON.stringify({
        success: true,
        profile: null,
        message: 'No profile found for this email'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user: UserVerificationData = JSON.parse(userData);

    // Get user's analysis history
    const userAnalyses = await kv.get(`user_analyses:${email}`);
    const analyses = userAnalyses ? JSON.parse(userAnalyses) : [];

    // Calculate profile statistics
    const totalAnalyses = analyses.length;
    const averageScore = analyses.length > 0 
      ? Math.round(analyses.reduce((sum: number, analysis: any) => sum + analysis.overallScore, 0) / analyses.length)
      : 0;
    
    // Count total opportunities across all analyses
    const totalOpportunities = analyses.reduce((sum: number, analysis: any) => 
      sum + (analysis.totalOpportunities || 0), 0);

    // Get most recent analysis
    const latestAnalysis = analyses.length > 0 ? analyses[analyses.length - 1] : null;

    const profile = {
      user: {
        email: user.email,
        websiteDomain: user.websiteDomain,
        verified: user.verified,
        verifiedAt: user.verifiedAt,
        createdAt: user.createdAt,
        businessIntel: user.businessIntel ? {
          country: user.businessIntel.country,
          city: user.businessIntel.city,
          device: user.businessIntel.device,
          verificationTimestamp: user.businessIntel.timestamp
        } : null
      },
      analytics: {
        totalAnalyses,
        averageScore,
        totalOpportunities,
        latestAnalysis: latestAnalysis ? {
          url: latestAnalysis.url,
          timestamp: latestAnalysis.timestamp,
          overallScore: latestAnalysis.overallScore,
          scores: latestAnalysis.scores
        } : null
      },
      analyses: analyses.slice(-5).reverse(), // Last 5 analyses, most recent first
      businessOpportunities: extractAggregatedOpportunities(analyses)
    };

    return new Response(JSON.stringify({
      success: true,
      profile,
      lastUpdated: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User profile lookup error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error during profile lookup' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Extract aggregated business opportunities across all user analyses
function extractAggregatedOpportunities(analyses: any[]): {
  recurring: string[];
  resolved: string[];
  priority: string[];
} {
  const opportunities = {
    recurring: [] as string[],
    resolved: [] as string[],
    priority: [] as string[]
  };

  if (analyses.length === 0) return opportunities;

  // Count opportunity types across analyses
  const opportunityCount: { [key: string]: number } = {};
  
  analyses.forEach(analysis => {
    if (analysis.businessOpportunities) {
      analysis.businessOpportunities.forEach((opp: string) => {
        const key = opp.split('**')[1]?.split('**')[0] || opp; // Extract opportunity type
        opportunityCount[key] = (opportunityCount[key] || 0) + 1;
      });
    }
  });

  // Identify recurring opportunities (appear in multiple analyses)
  Object.entries(opportunityCount).forEach(([opp, count]) => {
    if (count > 1) {
      opportunities.recurring.push(opp);
    } else if (count === 1) {
      opportunities.resolved.push(opp);
    }
  });

  // Determine priority opportunities based on latest analysis scores
  const latestAnalysis = analyses[analyses.length - 1];
  if (latestAnalysis && latestAnalysis.scores) {
    if (latestAnalysis.scores.security < 85) {
      opportunities.priority.push('Security Enhancement');
    }
    if (latestAnalysis.scores.seo < 75) {
      opportunities.priority.push('SEO Optimization');
    }
    if (latestAnalysis.scores.performance < 80) {
      opportunities.priority.push('Performance Optimization');
    }
  }

  return opportunities;
}
