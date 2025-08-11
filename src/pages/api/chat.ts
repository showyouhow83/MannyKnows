import type { APIRoute } from 'astro';
import { createPromptBuilder } from '../../lib/chatbot/promptBuilder';
import { errorLog, devLog } from '../../utils/debug';

export const prerender = false;

// Development storage (in-memory)
const devLeads: Array<{
  name?: string;
  email?: string;
  phone?: string;
  message: string;
  timestamp: string;
  sessionId: string;
}> = [];

// Storage functions that adapt based on environment
async function saveLeadToStorage(lead: any, environment: string, kv?: any) {
  if (environment === 'production' && kv) {
    // Save to KV storage
    const leadId = crypto.randomUUID();
    const leadData = { ...lead, id: leadId, created_at: new Date().toISOString() };
    await kv.put(`lead:${leadId}`, JSON.stringify(leadData));
    devLog('Lead saved to KV storage:', leadId);
  } else {
    // Save to memory for development
    devLeads.push(lead);
    devLog('Lead saved to memory storage');
  }
}

async function getLeadsFromStorage(environment: string, kv?: any) {
  if (environment === 'production' && kv) {
    // Get from KV storage
    try {
      const keys = await kv.list({ prefix: 'lead:' });
      const leads = [];
      for (const key of keys.keys) {
        const leadData = await kv.get(key.name);
        if (leadData) {
          leads.push(JSON.parse(leadData));
        }
      }
      return leads.sort((a, b) => new Date(b.created_at || b.timestamp).getTime() - new Date(a.created_at || a.timestamp).getTime());
    } catch (error) {
      errorLog('Error fetching leads from KV:', error);
      return [];
    }
  } else {
    // Return from memory for development
    return devLeads;
  }
}

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
      
      // Create dynamic, intelligent response based on actual analysis data
      const analysis = analysisResult.analysis;
      const biggestProblem = analysis.scores.seo < 60 ? 'SEO' : 
                           analysis.scores.performance < 70 ? 'performance' : 
                           analysis.scores.security < 80 ? 'security' : 'optimization';
      
      const lostRevenue = analysis.scores.performance < 70 ? 
        `Your ${analysis.metrics.responseTime}ms load time is killing conversions - that's potentially thousands in lost sales monthly` :
        analysis.scores.seo < 60 ? 
        `With SEO at ${analysis.scores.seo}/100, you're invisible to customers actively searching for what you sell` :
        `Multiple critical issues are bleeding potential customers before they even see your offer`;

      const urgentIssue = analysis.issues.length > 0 ? analysis.issues[0] : 
                         analysis.warnings?.length > 0 ? analysis.warnings[0] : 
                         'optimization opportunities';

      const reply = `Just analyzed ${websiteUrl} - and I need to be direct with you.

${lostRevenue}. 

The specific issue I'm most concerned about: ${urgentIssue.toLowerCase()}. This isn't just a technical problem - it's costing you real money right now while your competitors capture the customers you should be getting.

Look, I could walk you through all the details, but what you really need is Manny to map out exactly how to fix this and turn these problems into profit drivers.

I'm blocking out 20 minutes on his calendar right now. What's your phone number and best time this week? 

Because every day we wait on this, you're literally paying your competitors to take your customers.`;

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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Access KV storage from Cloudflare runtime
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    // Check if API key is available
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      errorLog('OPENAI_API_KEY environment variable is not set');
      return new Response(JSON.stringify({
        reply: 'Chat service is currently unavailable. Please try again later.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      errorLog('JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        reply: 'Invalid request format. Please try again.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { message, session_id = 'default', conversation_history = [] } = body;
    devLog('Chat API request:', { message, session_id, history_length: conversation_history.length });

    // Check if this is just an email address (for verification flow)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isJustEmail = emailRegex.test(message.trim()) && !message.includes(' ');
    
    if (isJustEmail) {
      // Check if this email is already verified
      const email = message.trim();
      const userData = await kv?.get(`user:${email}`);
      
      if (userData) {
        const user = JSON.parse(userData);
        if (user.verified) {
          // Check if they previously requested website analysis
          const lastMessage = conversation_history.length > 0 ? conversation_history[conversation_history.length - 1] : null;
          const previousUserMessage = conversation_history.length >= 2 ? conversation_history[conversation_history.length - 2] : null;
          
          // Look for previous website analysis request
          let websiteUrl = null;
          if (previousUserMessage?.role === 'user') {
            const urlMatch = previousUserMessage.content.match(/https?:\/\/[^\s]+/) || 
                            previousUserMessage.content.match(/[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.([a-zA-Z]{2,6})/);
            if (urlMatch) {
              websiteUrl = urlMatch[0];
            }
          }
          
          if (websiteUrl) {
            // User is verified and we have their website URL - proceed with analysis
            return await analyzeWebsiteForUser(email, websiteUrl, request, locals, session_id);
          }
          
          // Store verified email in session
          await kv?.put(`session:${session_id}`, JSON.stringify({
            userEmail: email,
            verified: true,
            timestamp: new Date().toISOString()
          }), { expirationTtl: 3600 });
          
          return new Response(JSON.stringify({
            reply: `Great! I see **${email}** is already verified. ✅\n\nI'm ready to analyze your website! Just provide your website URL like:\n• "analyze mannyknows.com"\n• "check https://yoursite.com"\n• "review mywebsite.org"\n\nWhat website would you like me to analyze?`,
            session_id
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      
      // User provided email, check if they previously requested website analysis
      const lastMessage = conversation_history.length > 0 ? conversation_history[conversation_history.length - 1] : null;
      const previousUserMessage = conversation_history.length >= 2 ? conversation_history[conversation_history.length - 2] : null;
      
      // Look for previous website analysis request
      let websiteUrl = null;
      if (previousUserMessage?.role === 'user') {
        const urlMatch = previousUserMessage.content.match(/https?:\/\/[^\s]+/) || 
                        previousUserMessage.content.match(/[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.([a-zA-Z]{2,6})/);
        if (urlMatch) {
          websiteUrl = urlMatch[0];
        }
      }
      
      if (websiteUrl) {
        const email = message.trim();
        devLog('Email provided for verification with website:', { email, websiteUrl });
        
        try {
          // Start verification process
          const verificationResponse = await fetch(`${new URL(request.url).origin}/api/verify-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, websiteUrl })
          });
          
          const verificationData = await verificationResponse.json();
          
          if (verificationResponse.ok) {
            if (verificationData.needsVerification) {
              // Store session data
              await kv?.put(`session:${session_id}`, JSON.stringify({
                userEmail: email,
                pendingWebsiteUrl: websiteUrl,
                verificationRequested: true,
                timestamp: new Date().toISOString()
              }), { expirationTtl: 3600 });

              const reply = `Perfect! I've sent a verification email to **${email}**.

📧 **Next Steps:**
1. Check your email inbox (and spam folder)
2. Click the verification link 
3. Come back here and I'll analyze **${websiteUrl}** for you!

${verificationData.domainAnalysis ? `\n🔍 **Initial Insights:**\n${verificationData.domainAnalysis}` : ''}

⏰ **Verification link expires in 1 hour**

Once verified, I'll provide a comprehensive analysis covering performance, SEO, security, accessibility, and content quality!`;

              return new Response(JSON.stringify({
                reply,
                session_id,
                verification_sent: true,
                email,
                website_url: websiteUrl
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            } else {
              // User already verified, proceed with analysis
              return await analyzeWebsiteForUser(email, websiteUrl, request, locals, session_id);
            }
          } else {
            return new Response(JSON.stringify({
              reply: `I had trouble with that email address: ${verificationData.error}\n\nPlease provide a different business email address to continue.`,
              session_id
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (error) {
          devLog('Verification process failed:', error);
          return new Response(JSON.stringify({
            reply: 'I encountered an issue during verification. Please try again or contact support.',
            session_id
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } else {
        return new Response(JSON.stringify({
          reply: `I see you provided an email address (${message.trim()}), but I need to know which website you'd like me to analyze first.\n\nPlease provide your website URL, like:\n• "analyze mannyknows.com"\n• "check https://yoursite.com"\n• "review mywebsite.org"`,
          session_id
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Initialize chatbot system
    const environment = import.meta.env.MODE === 'development' ? 'development' : 'production';
    const environmentsConfig = await import('../../config/chatbot/environments.json');
    const envSettings = environmentsConfig.default[environment];
    
    const promptBuilder = createPromptBuilder(envSettings.persona, envSettings.goals, environment);
    const guardrails = promptBuilder.getGuardrails();
    
    // Enforce message limits
    const maxMessages = guardrails.response_limits.max_conversation_length;
    const currentMessageCount = conversation_history.filter((msg: any) => msg.role === 'user').length + 1;
    
    if (currentMessageCount > maxMessages) {
      devLog(`Message limit exceeded: ${currentMessageCount}/${maxMessages} for session ${session_id}`);
      return new Response(JSON.stringify({
        reply: `I appreciate your interest! After ${maxMessages} messages, I need to connect you with Manny for a proper consultation. Please call us at (555) 123-4567 or email hello@mannyknows.com to continue.`,
        message_limit_reached: true,
        session_id: session_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if chatbot is enabled
    if (!envSettings.chatbot_enabled) {
      return new Response(JSON.stringify({
        reply: "Thank you for reaching out! Our AI assistant is currently offline. Please contact us directly at (555) 123-4567 or email hello@mannyknows.com for assistance.",
        chatbot_offline: true,
        session_id: session_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build system prompt
    const systemPrompt = promptBuilder.buildSystemPrompt();

    // Check for website analysis request
    const urlMatch = message.match(/https?:\/\/[^\s]+/) || message.match(/[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.([a-zA-Z]{2,6})/);
    const isAnalysisRequest = (message.toLowerCase().includes('analyze') || 
                              message.toLowerCase().includes('review') || 
                              message.toLowerCase().includes('check')) && urlMatch;
    
    // Check if user is verified and provided just a domain
    const sessionData = await kv?.get(`session:${session_id}`);
    let verifiedEmail = null;
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session.userEmail && session.verified) {
        verifiedEmail = session.userEmail;
      }
    }
    
    // If user is verified and provides just a URL (no keywords), treat it as analysis request
    const isVerifiedUserDomainRequest = verifiedEmail && urlMatch && !message.includes(' ') && urlMatch[0] === message.trim();
    
    if ((isAnalysisRequest && urlMatch) || isVerifiedUserDomainRequest) {
      const url = urlMatch[0];
      devLog('Website analysis requested for:', url);
      
      if (verifiedEmail) {
        // User is verified, proceed directly with analysis
        return await analyzeWebsiteForUser(verifiedEmail, url, request, locals, session_id);
      }
      
      // Check if user provided email for verification
      const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      
      if (!emailMatch) {
        const emailRequestReply = `I'd love to analyze ${url} for you! To provide this comprehensive analysis, I need to verify your email address first.

🔒 **Why email verification?**
• Prevents abuse of our analysis system
• Allows me to save your analysis history
• Enables personalized recommendations based on your website

📧 **Please provide your email** in this format:
"Analyze ${url} using email@yourdomain.com"

💡 **Pro tip:** If you use an email with the same domain as your website, I can provide additional domain management insights!`;

        return new Response(JSON.stringify({
          reply: emailRequestReply,
          session_id: session_id,
          requires_email: true,
          website_url: url
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const email = emailMatch[0];
      
      try {
        // Call our website analysis API with email
        const analysisResponse = await fetch(`${new URL(request.url).origin}/api/analyze-website`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, email })
        });
        
        const analysisResult = await analysisResponse.json();
        
        if (analysisResponse.status === 401 && analysisResult.requiresVerification) {
          // User needs to verify email
          const verificationReply = `I need to verify your email address (${email}) before I can analyze ${url}.

🔐 **Next Steps:**
1. I'll send a verification link to ${email}
2. Click the link in your email to verify
3. Come back here and ask me to analyze your website again

📧 **Sending verification email now...**

${analysisResult.action === 'verify_email' ? 'This is your first time - I\'ll set up your account!' : 'Please check your email and click the verification link.'}`;

          // Trigger email verification
          try {
            await fetch(`${new URL(request.url).origin}/api/verify-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, websiteUrl: url })
            });
          } catch (verifyError) {
            devLog('Email verification request failed:', verifyError);
          }

          return new Response(JSON.stringify({
            reply: verificationReply,
            session_id: session_id,
            requires_verification: true,
            email: email,
            website_url: url
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          
          const analysisReply = `I've completed a comprehensive analysis of ${url}! Here's your detailed report:

📊 **Overall Score: ${analysisResult.analysis.overallScore}/100**

🎯 **Category Breakdown:**
🚀 Performance: ${analysisResult.analysis.scores.performance}/100 (${analysisResult.analysis.metrics.responseTime}ms)
🔍 SEO: ${analysisResult.analysis.scores.seo}/100
♿ Accessibility: ${analysisResult.analysis.scores.accessibility}/100  
� Security: ${analysisResult.analysis.scores.security}/100
📝 Content: ${analysisResult.analysis.scores.content}/100

📈 **Key Metrics:**
• Page Size: ${analysisResult.analysis.metrics.pageSizeKB}KB
• Word Count: ~${analysisResult.analysis.metrics.wordCount} words
• Images: ${analysisResult.analysis.metrics.totalImages} (${analysisResult.analysis.metrics.imagesWithAlt} with alt text)
${analysisResult.analysis.metrics.title ? `• Title: "${analysisResult.analysis.metrics.title}" (${analysisResult.analysis.metrics.titleLength} chars)` : ''}

${analysisResult.analysis.issues.length > 0 ? `\n🚨 **Critical Issues (${analysisResult.analysis.issues.length}):**\n${analysisResult.analysis.issues.slice(0, 5).map((issue: string) => `• ${issue}`).join('\n')}${analysisResult.analysis.issues.length > 5 ? '\n• ...and more in full report' : ''}` : ''}

${analysisResult.analysis.warnings && analysisResult.analysis.warnings.length > 0 ? `\n⚠️ **Warnings (${analysisResult.analysis.warnings.length}):**\n${analysisResult.analysis.warnings.slice(0, 3).map((warning: string) => `• ${warning}`).join('\n')}${analysisResult.analysis.warnings.length > 3 ? '\n• ...see full report for all warnings' : ''}` : ''}

${analysisResult.analysis.recommendations.length > 0 ? `\n💡 **Top Recommendations:**\n${analysisResult.analysis.recommendations.slice(0, 5).map((rec: string) => `• ${rec}`).join('\n')}${analysisResult.analysis.recommendations.length > 5 ? '\n• ...plus more recommendations in detailed report' : ''}` : ''}

📄 **Full Analysis Report**: ${analysisResult.reportUrl}
${analysisResult.htmlUrl ? `🌐 **Original HTML**: ${analysisResult.htmlUrl}` : ''}

This comprehensive analysis covers performance, SEO, accessibility, security, and content quality. Would you like me to dive deeper into any specific area or help you prioritize these improvements?`;

          return new Response(JSON.stringify({
            reply: analysisReply,
            session_id: session_id,
            analysis_data: analysisResult
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        devLog('Website analysis failed:', error);
        // Continue with normal chat flow if analysis fails
      }
    }

    // Build conversation messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const requestBody: any = {
      model: envSettings.model,
      messages: messages,
      temperature: envSettings.temperature,
    };
    
    // Add max_tokens for older models
    if (!envSettings.model.includes('gpt-5') && !envSettings.model.includes('o1')) {
      requestBody.max_tokens = envSettings.max_tokens;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    devLog('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      errorLog(`OpenAI API error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({
        reply: 'Sorry, I encountered an error. Please try again later.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    devLog('OpenAI API response data:', data);
    
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];
      let replyContent = choice.message?.content || '';
      
      // Validate response against guardrails
      if (replyContent) {
        const validation = promptBuilder.validateResponse(replyContent);
        if (!validation.valid && environment === 'production') {
          replyContent = 'I apologize, but I need to rephrase my response. Could you please ask your question again?';
        }
      }

      // Simple lead capture (only in production and if enabled)
      if (envSettings.lead_capture_enabled && environment === 'production') {
        const leadInfo = extractSimpleLeadInfo(message, conversation_history);
        if (leadInfo.hasContactInfo) {
          const leadData = {
            ...leadInfo,
            message,
            timestamp: new Date().toISOString(),
            sessionId: session_id
          };
          await saveLeadToStorage(leadData, environment, kv);
          devLog('Lead captured:', leadInfo);
        }
      }
      
      return new Response(JSON.stringify({
        reply: replyContent || 'I received your message but had trouble generating a response. Please try again.',
        session_id: session_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      reply: 'I apologize, but I encountered an issue. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    errorLog('Chat API error:', error);
    return new Response(JSON.stringify({
      reply: 'Sorry, I encountered an error. Please try again later.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Export leads for admin access
export const getLeads = async (environment?: string, kv?: any) => {
  const env = environment || (import.meta.env.MODE === 'development' ? 'development' : 'production');
  return await getLeadsFromStorage(env, kv);
};

// Delete a specific lead by timestamp or index
export const deleteLead = async (leadId: string, environment?: string, kv?: any): Promise<boolean> => {
  const env = environment || (import.meta.env.MODE === 'development' ? 'development' : 'production');
  
  if (env === 'production' && kv) {
    // Delete from KV storage
    try {
      const leads = await getLeadsFromStorage(env, kv);
      const lead = leads.find((l: any) => l.timestamp === leadId || l.id === leadId);
      if (lead) {
        await kv.delete(`lead:${lead.id || leadId}`);
        return true;
      }
      return false;
    } catch (error) {
      errorLog('Error deleting lead from KV:', error);
      return false;
    }
  } else {
    // Delete from memory for development
    const initialLength = devLeads.length;
    
    // Try to find by timestamp first
    let index = devLeads.findIndex((lead: any) => lead.timestamp === leadId);
    
    // If not found by timestamp, try by array index
    if (index === -1) {
      const numericId = parseInt(leadId);
      if (!isNaN(numericId) && numericId >= 0 && numericId < devLeads.length) {
        index = numericId;
      }
    }
    
    if (index !== -1) {
      devLeads.splice(index, 1);
      return true;
    }
    
    return false;
  }
};

// Clear all leads
export const clearAllLeads = async (environment?: string, kv?: any): Promise<void> => {
  const env = environment || (import.meta.env.MODE === 'development' ? 'development' : 'production');
  
  if (env === 'production' && kv) {
    // Clear KV storage
    try {
      const keys = await kv.list({ prefix: 'lead:' });
      for (const key of keys.keys) {
        await kv.delete(key.name);
      }
    } catch (error) {
      errorLog('Error clearing leads from KV:', error);
    }
  } else {
    // Clear memory for development
    devLeads.length = 0;
  }
};

// Simple lead extraction function
function extractSimpleLeadInfo(message: string, history: any[]) {
  const fullText = [...history.map((msg: any) => msg.content), message].join(' ');
  
  const leadInfo: any = { hasContactInfo: false };
  
  // Extract email
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    leadInfo.email = emailMatch[0];
    leadInfo.hasContactInfo = true;
  }
  
  // Extract phone
  const phoneMatch = fullText.match(/(\d{3})[-\s]?(\d{3})[-\s]?(\d{4})/);
  if (phoneMatch) {
    leadInfo.phone = phoneMatch[0];
    leadInfo.hasContactInfo = true;
  }
  
  // Extract name
  const nameMatch = fullText.match(/(?:i'm|my name is|i am|call me)\s+([a-zA-Z]+)/i);
  if (nameMatch) {
    leadInfo.name = nameMatch[1];
    leadInfo.hasContactInfo = true;
  }
  
  return leadInfo;
}
