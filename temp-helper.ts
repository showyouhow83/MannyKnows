// Helper function to analyze website for verified user
async function analyzeWebsiteForUser(email: string, websiteUrl: string, request: Request, locals: any, session_id: string) {
  try {
    const analysisResponse = await fetch(`${new URL(request.url).origin}/api/analyze-website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: websiteUrl, email })
    });
    
    if (analysisResponse.ok) {
      const analysisResult = await analysisResponse.json();
      
      const reply = `Great! I've analyzed **${websiteUrl}** and found some interesting opportunities to boost your performance.

**Your Overall Score: ${analysisResult.analysis.overallScore}/100**

I spotted **${analysisResult.analysis.issues.length} critical issues** and **${analysisResult.analysis.warnings?.length || 0} optimization opportunities** that could significantly improve your results.

**Here's what caught my attention:**

${analysisResult.analysis.scores.seo < 80 ? `- **SEO Optimization** (${analysisResult.analysis.scores.seo}/100) - I found ways to boost your search rankings\n` : ''}${analysisResult.analysis.scores.performance < 90 ? `- **Performance** (${analysisResult.analysis.scores.performance}/100) - Your site loads in ${analysisResult.analysis.metrics.responseTime}ms, we can make it faster\n` : ''}${analysisResult.analysis.scores.security < 90 ? `- **Security** (${analysisResult.analysis.scores.security}/100) - Some security improvements that build customer trust\n` : ''}${analysisResult.analysis.scores.accessibility < 90 ? `- **Accessibility** (${analysisResult.analysis.scores.accessibility}/100) - Reach a wider audience with better accessibility\n` : ''}

**Quick Win I Spotted:**
${analysisResult.analysis.issues.length > 0 ? `**${analysisResult.analysis.issues[0]}** - This is something we can fix to improve your search visibility.` : 'Your site is in great shape! Let\'s discuss growth strategies.'}

---

**Want to dive deeper into any of these areas?** I can explain:
• How each improvement impacts your business
• What specific changes would help most  
• Which fixes give you the biggest ROI

Which area interests you most - SEO, performance, security, or accessibility?`;

      return new Response(JSON.stringify({
        reply,
        session_id,
        analysis_complete: true,
        analysis_data: analysisResult
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const errorData = await analysisResponse.json();
      return new Response(JSON.stringify({
        reply: `I encountered an issue analyzing ${websiteUrl}: ${errorData.error}\n\nPlease try again or contact support if the issue persists.`,
        session_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Website analysis failed:', error);
    return new Response(JSON.stringify({
      reply: `I encountered a technical issue while analyzing ${websiteUrl}. Please try again in a moment.`,
      session_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
