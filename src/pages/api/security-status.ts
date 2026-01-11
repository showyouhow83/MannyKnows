import type { APIRoute } from 'astro';
import RateLimiter from '../../lib/security/rateLimiter';
import DomainValidator from '../../lib/security/domainValidator';
import CSRFProtection from '../../lib/security/csrfProtection';
import EncryptedKV from '../../lib/security/kvEncryption';

export const prerender = false;

// Security status endpoint - admin only
export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    // Check for admin authentication (basic implementation)
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

    const kv = (locals as any).runtime?.env?.MK_KV_CHATBOT;
    if (!kv) {
      return new Response(JSON.stringify({
        error: 'KV storage not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize security components
    const encryptionKey = (locals as any).runtime?.env?.KV_ENCRYPTION_KEY || 'default-dev-key-change-in-production';
    const encryptedKv = new EncryptedKV(kv, encryptionKey);
    const csrfProtection = new CSRFProtection(kv);
    const rateLimiter = new RateLimiter(kv);
    const domainValidator = new DomainValidator();

    // Gather security status
    const securityStatus = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      
      // Encryption status
      encryption: await encryptedKv.getEncryptionStats(),
      
      // Domain validation status
      domainValidation: {
        enabled: true,
        allowedDomains: domainValidator.getAllowedDomains(),
        developmentMode: domainValidator.isDevMode()
      },
      
      // CSRF protection status
      csrfProtection: {
        enabled: true,
        enforceHTTPS: true,
        tokenTimeout: 3600000 // 1 hour
      },
      
      // Rate limiting status
      rateLimiting: {
        enabled: true,
        tiers: {
          anonymous: { requestsPerMinute: 30 },
          verified: { requestsPerMinute: 60 },
          premium: { requestsPerMinute: 120 },
          admin: { requestsPerMinute: 1000 }
        }
      },
      
      // Input validation status
      inputValidation: {
        enabled: true,
        sanitizationEnabled: true,
        xssProtection: true,
        sqlInjectionProtection: true,
        commandInjectionProtection: true
      },
      
      // Environment security
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        httpsEnforced: !domainValidator.isDevMode(),
        environmentVariablesSecure: {
          encryptionKey: !!(locals as any).runtime?.env?.KV_ENCRYPTION_KEY,
          adminApiKey: !!(locals as any).runtime?.env?.ADMIN_API_KEY,
          openaiApiKey: !!(locals as any).runtime?.env?.OPENAI_API_KEY
        }
      }
    };

    // Check for security recommendations
    const recommendations = [];
    
    if (securityStatus.encryption.encryptionCoverage < 100) {
      recommendations.push({
        type: 'encryption',
        priority: 'high',
        message: `${securityStatus.encryption.unencryptedSensitiveKeys} sensitive keys are not encrypted`
      });
    }
    
    if (encryptionKey === 'default-dev-key-change-in-production') {
      recommendations.push({
        type: 'encryption',
        priority: 'critical',
        message: 'Using default encryption key - change in production'
      });
    }
    
    if (domainValidator.isDevMode()) {
      recommendations.push({
        type: 'environment',
        priority: 'medium',
        message: 'Running in development mode with relaxed security'
      });
    }

    return new Response(JSON.stringify({
      status: 'operational',
      security: securityStatus,
      recommendations,
      summary: {
        totalSecurityLayers: 6,
        activeSecurityLayers: 6,
        securityScore: Math.round(
          (securityStatus.encryption.encryptionCoverage + 
           (recommendations.filter(r => r.priority === 'critical').length === 0 ? 100 : 50) +
           (domainValidator.isDevMode() ? 75 : 100)) / 3
        )
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Security status error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to retrieve security status',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Security action endpoint for migrations and maintenance
export const POST: APIRoute = async ({ request, locals }) => {
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

    const body = await request.json();
    const { action, parameters } = body;

    const kv = (locals as any).runtime?.env?.MK_KV_CHATBOT;
    if (!kv) {
      return new Response(JSON.stringify({
        error: 'KV storage not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encryptionKey = (locals as any).runtime?.env?.KV_ENCRYPTION_KEY || 'default-dev-key-change-in-production';
    const encryptedKv = new EncryptedKV(kv, encryptionKey);

    let result;

    switch (action) {
      case 'migrate_encryption':
        result = await encryptedKv.migrateToEncryption(
          parameters?.keyPattern ? new RegExp(parameters.keyPattern) : undefined
        );
        break;

      case 'backup_data':
        result = await encryptedKv.backup(
          parameters?.keyPattern ? new RegExp(parameters.keyPattern) : undefined
        );
        break;

      case 'encryption_stats':
        result = await encryptedKv.getEncryptionStats();
        break;

      default:
        return new Response(JSON.stringify({
          error: 'Unknown action',
          availableActions: ['migrate_encryption', 'backup_data', 'encryption_stats']
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
      action,
      result,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Security action error:', error);
    
    return new Response(JSON.stringify({
      error: 'Security action failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
