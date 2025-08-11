import type { APIRoute } from 'astro';

export const prerender = false;

// Professional email domains whitelist
const PROFESSIONAL_DOMAINS = [
  'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com',
  'protonmail.com', 'aol.com', 'zoho.com', 'mail.com', 'gmx.com'
];

// Temporary/disposable email domains blacklist
const TEMP_EMAIL_DOMAINS = [
  '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
  'throwaway.email', 'temp-mail.org', 'yopmail.com', 'maildrop.cc',
  'trashmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net',
  'spam4.me', 'bccto.me', 'chacuo.net', 'dispostable.com', 'fakenametools.com',
  '20minutemail.it', 'emailondeck.com', 'fakeinbox.com', 'mytemp.email'
];

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email, websiteUrl } = await request.json();
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV storage not available' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        error: 'Please provide a valid email address' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const [localPart, domain] = email.toLowerCase().split('@');
    
    // Check for temp/disposable email domains
    if (TEMP_EMAIL_DOMAINS.includes(domain)) {
      return new Response(JSON.stringify({ 
        error: 'Temporary email addresses are not allowed. Please use a professional email address.',
        businessOpportunity: 'Email Management - Using professional email addresses builds trust and credibility with customers'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract domain from website URL if provided
    let websiteDomain = null;
    let domainAnalysis = '';
    let businessOpportunities = [];
    
    if (websiteUrl) {
      try {
        const urlObj = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
        websiteDomain = urlObj.hostname.toLowerCase().replace('www.', '');
      } catch {
        // Invalid URL, continue without domain matching
      }
    }

    // Check domain matching for additional insights and business opportunities
    if (websiteDomain) {
      if (domain === websiteDomain) {
        domainAnalysis = `✅ **Perfect!** Your email domain matches your website domain - this shows professional brand consistency.`;
      } else if (!PROFESSIONAL_DOMAINS.includes(domain)) {
        domainAnalysis = `🔍 **Domain Analysis**: You're using a custom domain (${domain}) different from your website (${websiteDomain}). This could be intentional or an opportunity for brand alignment.`;
        businessOpportunities.push({
          type: 'brand_consistency',
          priority: 'medium',
          title: 'Brand Consistency Opportunity',
          description: `Consider using email@${websiteDomain} for stronger brand recognition`,
          impact: 'Increases brand trust and professional credibility',
          service: 'Professional Email Setup'
        });
      } else {
        domainAnalysis = `📧 **Email Insight**: You're using ${domain} for email. While this works, a professional email@${websiteDomain} would strengthen your brand identity.`;
        businessOpportunities.push({
          type: 'professional_email',
          priority: 'high',
          title: 'Professional Email Setup',
          description: `Custom domain email addresses (email@${websiteDomain}) increase trust and brand recognition`,
          impact: 'Improves customer trust, email deliverability, and brand consistency',
          service: 'Email System Configuration'
        });
      }

      // Check if we should do WHOIS lookup (for non-major domains)
      if (!PROFESSIONAL_DOMAINS.includes(domain) && domain !== websiteDomain) {
        try {
          // Simple domain validation check
          const domainCheckResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
          if (domainCheckResponse.ok) {
            const dnsData = await domainCheckResponse.json();
            if (dnsData.Answer && dnsData.Answer.length > 0) {
              domainAnalysis += `\n🌐 **Domain Status**: ${domain} has valid email infrastructure.`;
            } else {
              businessOpportunities.push({
                type: 'email_infrastructure',
                priority: 'high',
                title: 'Email Infrastructure Setup',
                description: `${domain} may need proper email configuration`,
                impact: 'Ensures reliable email delivery and professional setup',
                service: 'Email Infrastructure Configuration'
              });
            }
          }
        } catch (error) {
          // DNS check failed, continue without it
          console.log('DNS check failed for domain:', domain);
        }
      }
    }

    // Check if user already exists
    const existingUser = await kv.get(`user:${email}`);
    
    if (existingUser) {
      const user = JSON.parse(existingUser);
      if (user.verified) {
        return new Response(JSON.stringify({ 
          needsVerification: false,
          message: 'User already verified',
          domainAnalysis,
          businessOpportunities
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Create/update user record with detailed business opportunities tracking
    const verificationToken = crypto.randomUUID();
    const userData = {
      email,
      verified: false,
      verificationToken,
      createdAt: new Date().toISOString(),
      websiteDomain: websiteDomain,
      businessOpportunities: businessOpportunities, // Detailed opportunity objects
      domainAnalysis: domainAnalysis,
      lastActivity: new Date().toISOString(),
      leadScore: businessOpportunities.length * 10, // Simple scoring based on opportunities
      customerProfile: {
        emailProvider: domain,
        websiteRequested: websiteUrl,
        hasCustomDomain: !PROFESSIONAL_DOMAINS.includes(domain),
        brandConsistency: domain === websiteDomain ? 'excellent' : 'needs_improvement'
      }
    };

    await kv.put(`user:${email}`, JSON.stringify(userData));
    await kv.put(`verification:${verificationToken}`, email, { expirationTtl: 3600 }); // 1 hour expiry

    // Store business opportunities separately for easy querying
    if (businessOpportunities.length > 0) {
      await kv.put(`opportunities:${email}`, JSON.stringify({
        email,
        opportunities: businessOpportunities,
        createdAt: new Date().toISOString(),
        websiteUrl: websiteUrl,
        totalEstimatedValue: businessOpportunities.length * 100 // Simple scoring without pricing
      }));
    }

    // Send actual verification email using Resend
    const verificationUrl = `${new URL(request.url).origin}/api/verify-email?token=${verificationToken}`;
    
    try {
      const resendApiKey = import.meta.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.error('RESEND_API_KEY not found in environment variables');
        throw new Error('Email service not configured');
      }

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🔐 Verify Your Email</h1>
            <p style="color: #666; font-size: 16px;">Complete your MannyKnows verification to unlock website analysis</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Hello!</h2>
            <p style="color: #666; line-height: 1.6;">You requested a website analysis for <strong>${websiteUrl || 'your website'}</strong>. Click the button below to verify your email and unlock:</p>
            
            <ul style="color: #666; line-height: 1.8;">
              <li>🔍 Comprehensive website analysis</li>
              <li>📊 Performance & SEO scoring</li>
              <li>🔒 Security assessment</li>
              <li>💡 Personalized improvement recommendations</li>
              <li>📈 Business growth opportunities</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              ✅ Verify Email & Analyze Website
            </a>
          </div>
          
          ${domainAnalysis ? `
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
            <h3 style="margin-top: 0; color: #333;">🔍 Initial Domain Insights:</h3>
            <p style="color: #666; margin-bottom: 0;">${domainAnalysis}</p>
          </div>
          ` : ''}
          
          ${businessOpportunities.length > 0 ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 20px;">
            <h3 style="margin-top: 0; color: #333;">💰 Business Opportunities Preview:</h3>
            <ul style="color: #666; margin-bottom: 0;">
              ${businessOpportunities.map(opp => `<li>${opp}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px;">
              This verification link expires in 1 hour.<br>
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 12px;">
              <strong>MannyKnows</strong> - Your Website Performance Partner
            </p>
          </div>
        </div>
      `;

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'MannyKnows <noreply@mannyknows.com>',
          to: [email],
          subject: `🔐 Verify your email to analyze ${websiteUrl || 'your website'}`,
          html: emailContent,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text();
        console.error('Resend API error:', errorData);
        throw new Error(`Email sending failed: ${emailResponse.status}`);
      }

      const emailResult = await emailResponse.json();
      console.log(`✅ Verification email sent successfully to: ${email}`, emailResult.id);
      
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue without failing - store verification anyway for manual follow-up
      console.log(`📧 Verification email FAILED to send to: ${email}`);
      console.log(`🔗 Manual verification link: ${verificationUrl}`);
    }

    return new Response(JSON.stringify({ 
      needsVerification: true,
      message: 'Verification email sent successfully',
      domainAnalysis,
      businessOpportunities: businessOpportunities.map(opp => `${opp.title} - ${opp.description}`),
      leadData: {
        email,
        totalOpportunities: businessOpportunities.length,
        leadScore: businessOpportunities.length * 10, // Simple scoring
        priority: businessOpportunities.some(opp => opp.priority === 'high') ? 'high' : 'medium'
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User verification error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error during verification' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
