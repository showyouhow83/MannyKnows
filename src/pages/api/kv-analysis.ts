import type { APIRoute } from 'astro';

export const prerender = false;

// Debug endpoint to examine KV data patterns (admin only)
export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('authorization');
    const adminKey = (locals as any).runtime?.env?.ADMIN_API_KEY;
    
    if (!authHeader || !adminKey || authHeader !== `Bearer ${adminKey}`) {
      return new Response(JSON.stringify({
        error: 'Unauthorized - Admin access required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    if (!kv) {
      return new Response(JSON.stringify({
        error: 'KV storage not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get sample size from query params
    const sampleSize = parseInt(url.searchParams.get('sample') || '20');
    const showValues = url.searchParams.get('show_values') === 'true';

    // List all keys
    const allKeys = await kv.list();
    
    // Define key info interface
    interface KeyInfo {
      key: string;
      metadata?: any;
      expiration?: number;
    }
    
    // Categorize keys by pattern
    const keyPatterns: { [key: string]: KeyInfo[] } = {
      sessions: [],
      userProfiles: [],
      auth: [],
      tokens: [],
      verification: [],
      payment: [],
      personal: [],
      rateLimits: [],
      security: [],
      other: []
    };

    // Sensitive patterns we defined in EncryptedKV
    const sensitivePatterns = [
      { name: 'sessions', regex: /^session:.*/ },
      { name: 'userProfiles', regex: /^user:.*:profile/ },
      { name: 'auth', regex: /^auth:.*/ },
      { name: 'tokens', regex: /^token:.*/ },
      { name: 'verification', regex: /^verification:.*/ },
      { name: 'payment', regex: /^payment:.*/ },
      { name: 'personal', regex: /^personal:.*/ }
    ];

    // Sample some data for each category
    for (const keyInfo of allKeys.keys?.slice(0, 100) || []) {
      const key = keyInfo.name;
      let categorized = false;

      // Check against sensitive patterns
      for (const pattern of sensitivePatterns) {
        if (pattern.regex.test(key)) {
          keyPatterns[pattern.name].push({
            key,
            metadata: keyInfo.metadata,
            expiration: keyInfo.expiration
          });
          categorized = true;
          break;
        }
      }

      // Categorize by other common patterns
      if (!categorized) {
        if (key.startsWith('rate_limit:')) {
          keyPatterns.rateLimits.push({ key, metadata: keyInfo.metadata });
        } else if (key.startsWith('security_log:') || key.startsWith('csrf:')) {
          keyPatterns.security.push({ key, metadata: keyInfo.metadata });
        } else {
          keyPatterns.other.push({ key, metadata: keyInfo.metadata });
        }
      }
    }

    // Get sample values if requested (be careful with sensitive data)
    const sampleData: { [key: string]: any } = {};
    if (showValues && sampleSize <= 5) {
      for (const [category, keys] of Object.entries(keyPatterns)) {
        if (keys.length > 0 && ['sessions', 'userProfiles'].includes(category)) {
          const sampleKey = keys[0].key;
          try {
            const value = await kv.get(sampleKey);
            // Truncate long values and mask sensitive parts
            let displayValue = value;
            if (typeof value === 'string' && value.length > 200) {
              displayValue = value.substring(0, 200) + '...[truncated]';
            }
            // Mask email addresses and tokens
            if (typeof displayValue === 'string') {
              displayValue = displayValue
                .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***')
                .replace(/"token":\s*"[^"]+"/g, '"token": "***"')
                .replace(/"apiKey":\s*"[^"]+"/g, '"apiKey": "***"')
                .replace(/sk-[a-zA-Z0-9-]+/g, 'sk-***');
            }
            sampleData[category] = {
              sampleKey,
              sampleValue: displayValue,
              valueType: typeof value
            };
          } catch (error) {
            sampleData[category] = { error: 'Failed to retrieve value' };
          }
        }
      }
    }

    // Calculate statistics
    const stats = {
      totalKeys: allKeys.keys?.length || 0,
      sensitiveKeyBreakdown: Object.fromEntries(
        Object.entries(keyPatterns).map(([category, keys]) => [category, keys.length])
      ),
      totalSensitiveKeys: Object.values(keyPatterns)
        .slice(0, 7) // Only count the actual sensitive categories
        .reduce((sum, keys) => sum + keys.length, 0)
    };

    return new Response(JSON.stringify({
      stats,
      keyPatterns: Object.fromEntries(
        Object.entries(keyPatterns).map(([category, keys]) => [
          category, 
          keys.slice(0, sampleSize).map(k => ({ key: k.key, metadata: k.metadata }))
        ])
      ),
      sampleData: showValues ? sampleData : 'Use ?show_values=true&sample=3 to see sample values',
      recommendations: {
        immediatelyEncrypt: ['sessions', 'userProfiles', 'auth', 'tokens', 'verification'],
        considerEncrypting: ['personal', 'payment'],
        doNotEncrypt: ['rateLimits', 'security', 'other']
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('KV analysis error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to analyze KV data',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
