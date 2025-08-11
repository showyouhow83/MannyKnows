import type { APIRoute } from 'astro';
import { parseUserAgent, type UserVerificationData, type BusinessIntelData } from '../../lib/verification/emailVerification.js';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!kv) {
      return new Response(createErrorPage('Service temporarily unavailable'), { 
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (!token) {
      return new Response(createErrorPage('Invalid verification link'), { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Lookup verification token
    const tokenData = await kv.get(`token:${token}`);
    if (!tokenData) {
      return new Response(createErrorPage('Verification link expired or invalid'), { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const tokenInfo = JSON.parse(tokenData);
    const { email, expiresAt } = tokenInfo;

    // Check if token is expired
    if (new Date() > new Date(expiresAt)) {
      await kv.delete(`token:${token}`);
      return new Response(createErrorPage('Verification link has expired'), { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Get user data
    const userData = await kv.get(`user:${email}`);
    if (!userData) {
      return new Response(createErrorPage('User data not found'), { 
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const user: UserVerificationData = JSON.parse(userData);

    // Check if already verified
    if (user.verified) {
      return new Response(createSuccessPage('Email already verified', 'Your email has been verified successfully. You can now close this window.'), { 
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Collect business intelligence data
    const userAgent = request.headers.get('user-agent') || '';
    const businessIntel: BusinessIntelData = {
      ip: clientAddress || 'unknown',
      userAgent,
      device: parseUserAgent(userAgent),
      timestamp: new Date().toISOString()
    };

    // Try to get geolocation data (would require external service)
    try {
      const geoData = await getGeolocationData(businessIntel.ip);
      if (geoData) {
        businessIntel.country = geoData.country;
        businessIntel.city = geoData.city;
        businessIntel.latitude = geoData.latitude;
        businessIntel.longitude = geoData.longitude;
        businessIntel.timezone = geoData.timezone;
        businessIntel.isp = geoData.isp;
        businessIntel.organization = geoData.organization;
      }
    } catch (error) {
      console.log('Geolocation lookup failed:', error);
    }

    // Update user as verified
    const verifiedUser: UserVerificationData = {
      ...user,
      verified: true,
      verifiedAt: new Date().toISOString(),
      businessIntel
    };

    // Save updated user data
    await kv.put(`user:${email}`, JSON.stringify(verifiedUser));

    // Clean up verification token
    await kv.delete(`token:${token}`);

    // Log verification for analytics
    console.log(`User verified: ${email} from ${businessIntel.ip} using ${businessIntel.device?.browser} on ${businessIntel.device?.os}`);

    return new Response(createSuccessPage('Email Verified Successfully!', 
      `Welcome! Your email has been verified. You can now access all MannyKnows services. This window will close automatically.`
    ), { 
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return new Response(createErrorPage('An error occurred during verification'), { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

// Get geolocation data from IP (placeholder implementation)
async function getGeolocationData(ip: string): Promise<{
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
} | null> {
  // This would integrate with a service like MaxMind, IPinfo, or similar
  // For now, return null to indicate no geolocation data available
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null;
  }
  
  // Placeholder for external geolocation service
  return null;
}

// Create success page HTML
function createSuccessPage(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        .success-icon {
            font-size: 48px;
            color: #10b981;
            margin-bottom: 20px;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 15px;
            font-size: 24px;
        }
        p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f4f6;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="loading"></div>
        <p><small>Closing automatically...</small></p>
    </div>
    
    <script>
        // Auto-close window after 3 seconds
        setTimeout(() => {
            window.close();
        }, 3000);
        
        // If window.close() doesn't work (popup blockers), show a message
        setTimeout(() => {
            document.querySelector('.loading').style.display = 'none';
            document.querySelector('small').textContent = 'You can safely close this window.';
        }, 3500);
    </script>
</body>
</html>`;
}

// Create error page HTML
function createErrorPage(errorMessage: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        .error-icon {
            font-size: 48px;
            color: #dc2626;
            margin-bottom: 20px;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 15px;
            font-size: 24px;
        }
        p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .btn {
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            font-weight: 500;
        }
        .btn:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Verification Error</h1>
        <p>${errorMessage}</p>
        <a href="/" class="btn">Return to Homepage</a>
    </div>
</body>
</html>`;
}
