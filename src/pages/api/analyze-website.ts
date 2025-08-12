import type { APIRoute } from "astro";
import { executeWebsiteAnalysis } from "../../lib/services/websiteAnalysisService";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { url, email } = await request.json();
    const kv = (locals as any).runtime?.env?.CHATBOT_KV;
    
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required for website analysis" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check user verification status in KV
    if (kv) {
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
    }

    // Execute modular website analysis
    const analysisResult = await executeWebsiteAnalysis(url, email);
    
    if (!analysisResult.success) {
      return new Response(JSON.stringify({ 
        error: "Website analysis failed",
        details: analysisResult.errors
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      ...analysisResult.analysisData,
      salesResponse: analysisResult.salesResponse,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Website analysis error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error during website analysis",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
