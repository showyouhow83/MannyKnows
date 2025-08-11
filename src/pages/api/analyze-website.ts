import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { url, email } = await request.json();
    const r2 = (locals as any).runtime?.env?.MANNYKNOWS_R2;
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required for website analysis' }), { 
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

    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV storage not available' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check user verification status
    const userData = await kv.get(`user:${email}`);
    if (!userData) {
      return new Response(JSON.stringify({ 
        error: 'User not found. Please complete email verification first.',
        requiresVerification: true,
        action: 'verify_email'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = JSON.parse(userData);
    if (!user.verified) {
      return new Response(JSON.stringify({ 
        error: 'Email verification required. Please check your email and click the verification link.',
        requiresVerification: true,
        action: 'check_email'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enhanced URL validation with security checks
    let targetUrl;
    let normalizedUrl = url.trim();
    
    // Auto-add https:// if no protocol is provided
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    try {
      targetUrl = new URL(normalizedUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Security validations
    const protocol = targetUrl.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') {
      return new Response(JSON.stringify({ 
        error: 'Only HTTP and HTTPS URLs are allowed' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Block internal/private network addresses (SSRF protection)
    const hostname = targetUrl.hostname.toLowerCase();
    const blockedPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '10.',        // Private class A
      '172.16.',    // Private class B  
      '172.17.',
      '172.18.',
      '172.19.',
      '172.20.',
      '172.21.',
      '172.22.',
      '172.23.',
      '172.24.',
      '172.25.',
      '172.26.',
      '172.27.',
      '172.28.',
      '172.29.',
      '172.30.',
      '172.31.',
      '192.168.',   // Private class C
      '169.254.',   // Link-local
      'metadata.',  // Cloud metadata services
      '169.254.169.254'  // AWS/GCP metadata
    ];

    const isBlocked = blockedPatterns.some(pattern => 
      hostname.includes(pattern) || hostname.startsWith(pattern)
    );

    if (isBlocked) {
      return new Response(JSON.stringify({ 
        error: 'Analysis of internal/private networks is not allowed' 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Additional domain validation
    if (!hostname.includes('.') || hostname.length < 4) {
      return new Response(JSON.stringify({ 
        error: 'Please provide a valid domain name' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Block common malicious patterns (check original input too)
    const suspiciousPatterns = ['javascript:', 'data:', 'vbscript:', 'about:'];
    if (suspiciousPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
      return new Response(JSON.stringify({ 
        error: 'Suspicious URL pattern detected' 
      }), { 
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

    // Comprehensive Website Analysis
    const analysis = analyzeWebsiteContent(htmlContent, statusCode, responseTime, targetUrl);
    
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

      // Store analysis under user profile for sales opportunities
      const userAnalyses = await kv.get(`user_analyses:${email}`);
      const existingAnalyses = userAnalyses ? JSON.parse(userAnalyses) : [];
      
      const userAnalysisRecord = {
        analysisId,
        url: targetUrl.toString(),
        timestamp,
        overallScore: analysis.overallScore,
        scores: analysis.scores,
        totalIssues: analysis.issues.length,
        totalOpportunities: analysis.recommendations.length,
        businessOpportunities: extractBusinessOpportunities(analysis),
        reportPath: `reports/${analysisId}.json`
      };
      
      existingAnalyses.push(userAnalysisRecord);
      
      // Keep only last 10 analyses per user
      if (existingAnalyses.length > 10) {
        existingAnalyses.splice(0, existingAnalyses.length - 10);
      }
      
      await kv.put(`user_analyses:${email}`, JSON.stringify(existingAnalyses));
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

// Comprehensive website content analysis
function analyzeWebsiteContent(html: string, statusCode: number, responseTime: number, targetUrl: URL) {
  if (!html) {
    return {
      overallScore: 0,
      issues: ['Website not accessible'],
      recommendations: ['Check if the website is online and accessible']
    };
  }

  const issues = [];
  const recommendations = [];
  const warnings = [];
  
  // Initialize scores
  let performanceScore = 100;
  let seoScore = 100;
  let accessibilityScore = 100;
  let securityScore = 100;
  let contentScore = 100;

  // === PERFORMANCE ANALYSIS ===
  if (responseTime > 5000) {
    issues.push(`Very slow response time: ${responseTime}ms`);
    recommendations.push('Critical: Optimize server response time and consider CDN');
    performanceScore -= 40;
  } else if (responseTime > 3000) {
    issues.push(`Slow response time: ${responseTime}ms`);
    recommendations.push('Optimize server response time and database queries');
    performanceScore -= 25;
  } else if (responseTime > 1000) {
    warnings.push(`Moderate response time: ${responseTime}ms`);
    recommendations.push('Consider optimizing response time for better UX');
    performanceScore -= 15;
  }

  // Estimate page size
  const pageSizeKB = Math.round(html.length / 1024);
  if (pageSizeKB > 1000) {
    issues.push(`Large page size: ${pageSizeKB}KB`);
    recommendations.push('Compress HTML and optimize content delivery');
    performanceScore -= 15;
  } else if (pageSizeKB > 500) {
    warnings.push(`Moderate page size: ${pageSizeKB}KB`);
    performanceScore -= 10;
  }

  // === COMPREHENSIVE SEO ANALYSIS ===
  
  // Title analysis
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  if (!title) {
    issues.push('Missing page title');
    recommendations.push('Add a descriptive, keyword-rich title tag (50-60 characters)');
    seoScore -= 20;
  } else if (title.length < 30) {
    warnings.push(`Short title: ${title.length} characters`);
    recommendations.push('Expand title to 50-60 characters for better SEO');
    seoScore -= 10;
  } else if (title.length > 60) {
    warnings.push(`Long title: ${title.length} characters`);
    recommendations.push('Shorten title to under 60 characters to avoid truncation');
    seoScore -= 5;
  }

  // Meta description analysis
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
  const metaDesc = metaDescMatch ? metaDescMatch[1] : '';
  
  if (!metaDesc) {
    issues.push('Missing meta description');
    recommendations.push('Add meta description (150-160 characters) to improve click-through rates');
    seoScore -= 15;
  } else if (metaDesc.length < 120) {
    warnings.push(`Short meta description: ${metaDesc.length} characters`);
    recommendations.push('Expand meta description to 150-160 characters');
    seoScore -= 8;
  } else if (metaDesc.length > 160) {
    warnings.push(`Long meta description: ${metaDesc.length} characters`);
    recommendations.push('Shorten meta description to under 160 characters');
    seoScore -= 5;
  }

  // Heading structure analysis
  const h1Tags = (html.match(/<h1[^>]*>/gi) || []).length;
  const h2Tags = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Tags = (html.match(/<h3[^>]*>/gi) || []).length;
  
  if (h1Tags === 0) {
    issues.push('Missing H1 tag');
    recommendations.push('Add exactly one H1 tag with your primary keyword');
    seoScore -= 15;
  } else if (h1Tags > 1) {
    issues.push(`Multiple H1 tags found: ${h1Tags}`);
    recommendations.push('Use only one H1 tag per page');
    seoScore -= 10;
  }

  if (h2Tags === 0 && html.length > 2000) {
    warnings.push('No H2 tags found for content structure');
    recommendations.push('Add H2 tags to structure your content');
    seoScore -= 5;
  }

  // Open Graph and social media
  const hasOG = html.includes('og:title') && html.includes('og:description');
  if (!hasOG) {
    warnings.push('Missing Open Graph tags');
    recommendations.push('Add Open Graph meta tags for better social media sharing');
    seoScore -= 8;
  }

  // Canonical URL
  const hasCanonical = html.includes('rel="canonical"');
  if (!hasCanonical) {
    warnings.push('Missing canonical URL');
    recommendations.push('Add canonical URL to prevent duplicate content issues');
    seoScore -= 5;
  }

  // Schema markup
  const hasSchema = html.includes('schema.org') || html.includes('application/ld+json');
  if (!hasSchema) {
    warnings.push('No structured data found');
    recommendations.push('Add schema markup for rich snippets');
    seoScore -= 10;
  }

  // === ACCESSIBILITY ANALYSIS ===
  
  // Image accessibility
  const imgTags = (html.match(/<img[^>]*>/gi) || []).length;
  const imgAltTags = (html.match(/alt\s*=\s*["'][^"']+["']/gi) || []).length;
  const emptyAltTags = (html.match(/alt\s*=\s*["']\s*["']/gi) || []).length;
  
  if (imgTags > 0) {
    const imagesWithoutAlt = imgTags - imgAltTags;
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} images missing alt text`);
      recommendations.push('Add descriptive alt text to all images for screen readers');
      accessibilityScore -= Math.min(25, imagesWithoutAlt * 5);
    }
    
    if (emptyAltTags > 0) {
      warnings.push(`${emptyAltTags} images with empty alt attributes`);
      recommendations.push('Provide meaningful alt text or use empty alt="" for decorative images');
      accessibilityScore -= Math.min(15, emptyAltTags * 3);
    }
  }

  // Form accessibility
  const formTags = (html.match(/<form[^>]*>/gi) || []).length;
  const labelTags = (html.match(/<label[^>]*>/gi) || []).length;
  if (formTags > 0 && labelTags === 0) {
    issues.push('Forms without proper labels detected');
    recommendations.push('Add label elements to form inputs for accessibility');
    accessibilityScore -= 15;
  }

  // Color contrast (basic check for low contrast indicators)
  const hasLowContrastKeywords = /color:\s*#[a-f0-9]{3,6}.*background.*#[a-f0-9]{3,6}/i.test(html);
  if (hasLowContrastKeywords) {
    warnings.push('Potential color contrast issues detected');
    recommendations.push('Ensure sufficient color contrast (4.5:1 ratio minimum)');
    accessibilityScore -= 10;
  }

  // === MOBILE & RESPONSIVE DESIGN ===
  
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)/i);
  if (!viewportMatch) {
    issues.push('Missing viewport meta tag');
    recommendations.push('Add viewport meta tag for mobile responsiveness');
    accessibilityScore -= 20;
  } else {
    const viewport = viewportMatch[1];
    if (!viewport.includes('width=device-width')) {
      warnings.push('Viewport may not be optimized for mobile');
      recommendations.push('Ensure viewport includes width=device-width');
      accessibilityScore -= 10;
    }
  }

  // === SECURITY ANALYSIS ===
  
  // Website HTTPS check (based on the URL we successfully fetched)
  const websiteUsesHTTPS = targetUrl.protocol === 'https:';
  if (!websiteUsesHTTPS) {
    issues.push('🔒 Website not using HTTPS encryption');
    recommendations.push('BUSINESS OPPORTUNITY: Implement SSL certificate for security and SEO benefits');
    securityScore -= 25;
  }
  
  // Insecure links within content
  const insecureLinksInContent = (html.match(/href=["']http:\/\/[^"']*["']/gi) || []).length;
  if (insecureLinksInContent > 0) {
    issues.push(`${insecureLinksInContent} insecure HTTP links found in content`);
    recommendations.push('Update all internal links to use HTTPS');
    securityScore -= 15;
  }

  // External links security
  const externalLinks = (html.match(/target=["']_blank["']/gi) || []).length;
  const secureExternalLinks = (html.match(/rel=["'][^"']*noopener[^"']*["']/gi) || []).length;
  if (externalLinks > secureExternalLinks) {
    warnings.push('External links without rel="noopener" detected');
    recommendations.push('Add rel="noopener noreferrer" to external links opening in new tabs');
    securityScore -= 10;
  }

  // === CONTENT ANALYSIS ===
  
  // Text content extraction (rough estimate)
  const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(word => word.length > 0).length;
  
  if (wordCount < 300) {
    warnings.push(`Low content volume: ~${wordCount} words`);
    recommendations.push('Consider adding more valuable content (aim for 300+ words)');
    contentScore -= 15;
  }

  // Duplicate content indicators
  const repeatedPhrases = textContent.match(/(.{20,})\1/g);
  if (repeatedPhrases && repeatedPhrases.length > 2) {
    warnings.push('Potential duplicate content detected');
    recommendations.push('Review content for unnecessary repetition');
    contentScore -= 10;
  }

  // === TECHNICAL SEO ===
  
  // Analytics tracking
  const hasAnalytics = html.includes('google-analytics') || html.includes('gtag') || html.includes('ga(');
  if (!hasAnalytics) {
    warnings.push('No analytics tracking detected');
    recommendations.push('Consider adding Google Analytics or similar tracking');
  }

  // Language declaration
  const hasLang = html.includes('lang=') || html.includes('<html lang');
  if (!hasLang) {
    warnings.push('Missing language declaration');
    recommendations.push('Add lang attribute to <html> tag for internationalization');
    seoScore -= 5;
  }

  // Calculate overall score
  const overallScore = Math.round(
    (performanceScore + seoScore + accessibilityScore + securityScore + contentScore) / 5
  );

  return {
    overallScore: Math.max(0, overallScore),
    scores: {
      performance: Math.max(0, performanceScore),
      seo: Math.max(0, seoScore),
      accessibility: Math.max(0, accessibilityScore),
      security: Math.max(0, securityScore),
      content: Math.max(0, contentScore)
    },
    metrics: {
      responseTime,
      statusCode,
      pageSizeKB,
      wordCount,
      totalImages: imgTags,
      imagesWithAlt: imgAltTags,
      h1Count: h1Tags,
      h2Count: h2Tags,
      h3Count: h3Tags,
      title: title,
      titleLength: title.length,
      metaDescription: metaDesc,
      metaDescLength: metaDesc.length,
      hasOpenGraph: hasOG,
      hasSchema: hasSchema,
      hasCanonical: hasCanonical,
      hasAnalytics: hasAnalytics
    },
    issues,
    warnings,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  };
}

// Extract business opportunities from analysis for sales conversations
function extractBusinessOpportunities(analysis: any): string[] {
  const opportunities: string[] = [];
  
  // Security opportunities
  if (analysis.scores.security < 90) {
    opportunities.push('🔒 **Security Enhancement** - Improve website security score and build customer trust');
  }
  
  // SEO opportunities  
  if (analysis.scores.seo < 80) {
    opportunities.push('📈 **SEO Optimization** - Boost search rankings and organic traffic');
  }
  
  // Performance opportunities
  if (analysis.scores.performance < 85) {
    opportunities.push('⚡ **Performance Optimization** - Faster loading = higher conversions');
  }
  
  // Accessibility opportunities
  if (analysis.scores.accessibility < 85) {
    opportunities.push('♿ **Accessibility Compliance** - Reach wider audience and meet legal requirements');
  }
  
  // Content opportunities
  if (analysis.scores.content < 80) {
    opportunities.push('✍️ **Content Strategy** - Improve engagement and search visibility');
  }
  
  // Specific technical opportunities
  if (analysis.issues.some((issue: string) => issue.includes('HTTPS'))) {
    opportunities.push('🛡️ **SSL Certificate Installation** - Essential for security and SEO');
  }
  
  if (analysis.issues.some((issue: string) => issue.includes('meta description'))) {
    opportunities.push('📝 **Meta Description Optimization** - Improve click-through rates from search');
  }
  
  if (analysis.issues.some((issue: string) => issue.includes('alt text'))) {
    opportunities.push('🖼️ **Image SEO** - Optimize images for search engines and accessibility');
  }
  
  return opportunities;
}
