import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { url } = await request.json();
    const r2 = (locals as any).runtime?.env?.MANNYKNOWS_R2;
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!r2) {
      return new Response(JSON.stringify({ error: 'R2 storage not available' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate URL
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const analysisId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Fetch website content
    let htmlContent = '';
    let statusCode = 0;
    let responseTime = 0;
    
    try {
      const startTime = Date.now();
      const response = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'MannyKnows Website Analyzer/1.0'
        }
      });
      responseTime = Date.now() - startTime;
      statusCode = response.status;
      
      if (response.ok) {
        htmlContent = await response.text();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ 
        error: `Failed to fetch website: ${errorMessage}` 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Basic website analysis
    const analysis = analyzeWebsiteContent(htmlContent, statusCode, responseTime);
    
    // Store HTML content in R2
    if (htmlContent) {
      await r2.put(`html/${analysisId}.html`, htmlContent, {
        httpMetadata: {
          contentType: 'text/html',
        },
      });
    }
    
    // Store analysis report in R2
    const report = {
      analysisId,
      url: targetUrl.toString(),
      timestamp,
      statusCode,
      responseTime,
      analysis,
      htmlStoragePath: htmlContent ? `html/${analysisId}.html` : null
    };
    
    await r2.put(`reports/${analysisId}.json`, JSON.stringify(report, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
      },
    });
    
    // Store analysis metadata in KV for quick lookup
    if (kv) {
      await kv.put(`analysis:${analysisId}`, JSON.stringify({
        url: targetUrl.toString(),
        timestamp,
        statusCode,
        analysisScore: analysis.overallScore,
        reportPath: `reports/${analysisId}.json`
      }));
    }
    
    return new Response(JSON.stringify({
      success: true,
      analysisId,
      url: targetUrl.toString(),
      analysis,
      reportUrl: `/api/files/reports/${analysisId}.json`,
      htmlUrl: htmlContent ? `/api/files/html/${analysisId}.html` : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Website analysis error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error during analysis' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Basic website content analysis
function analyzeWebsiteContent(html: string, statusCode: number, responseTime: number) {
  if (!html) {
    return {
      overallScore: 0,
      issues: ['Website not accessible'],
      recommendations: ['Check if the website is online and accessible']
    };
  }

  const issues = [];
  const recommendations = [];
  let score = 100;

  // Performance analysis
  if (responseTime > 3000) {
    issues.push(`Slow response time: ${responseTime}ms`);
    recommendations.push('Consider optimizing server response time');
    score -= 20;
  } else if (responseTime > 1000) {
    issues.push(`Moderate response time: ${responseTime}ms`);
    score -= 10;
  }

  // Basic SEO analysis
  if (!html.includes('<title>')) {
    issues.push('Missing page title');
    recommendations.push('Add a descriptive title tag');
    score -= 15;
  }

  if (!html.includes('description')) {
    issues.push('Missing meta description');
    recommendations.push('Add a meta description for better SEO');
    score -= 10;
  }

  // Basic accessibility analysis
  const imgTags = (html.match(/<img/g) || []).length;
  const imgAltTags = (html.match(/alt=/g) || []).length;
  
  if (imgTags > 0 && imgAltTags < imgTags) {
    issues.push(`${imgTags - imgAltTags} images missing alt text`);
    recommendations.push('Add alt text to all images for accessibility');
    score -= 10;
  }

  // Mobile-friendliness check
  if (!html.includes('viewport')) {
    issues.push('Missing viewport meta tag');
    recommendations.push('Add viewport meta tag for mobile responsiveness');
    score -= 15;
  }

  // Security analysis
  if (!html.includes('https://') && html.includes('http://')) {
    issues.push('Non-secure HTTP links detected');
    recommendations.push('Use HTTPS for all links and resources');
    score -= 10;
  }

  return {
    overallScore: Math.max(0, score),
    performanceScore: responseTime < 1000 ? 100 : responseTime < 3000 ? 70 : 30,
    seoScore: html.includes('<title>') && html.includes('description') ? 90 : 50,
    accessibilityScore: imgTags === 0 || imgAltTags === imgTags ? 100 : 60,
    responseTime,
    statusCode,
    totalImages: imgTags,
    imagesWithAlt: imgAltTags,
    issues,
    recommendations
  };
}
