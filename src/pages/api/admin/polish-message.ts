// AI Message Polishing Endpoint
// Uses Gemini Flash REST API directly for reliability on Workers
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);

    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as { message: string; customer_name?: string; type?: 'subject' | 'body' };
    const { message, customer_name, type = 'body' } = body;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Message is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Graceful degradation: no Gemini key → return the original text
    // unchanged so the UI flow keeps working (just without AI polish).
    const apiKey = env?.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ success: true, polished: message, degraded: 'GEMINI_API_KEY not configured' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    const firstName = customer_name?.split(' ')[0] || '';

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = type === 'subject'
      ? `You are editing an email subject line for a home remodeling and repair company. Fix grammar and spelling only. Keep it concise — ideally under 10 words. Return ONLY the corrected subject line. No period at the end. No greeting, no full sentence structure unless the original uses one. Do NOT add or change specific dates or project numbers.

Subject to fix:
${message}`
      : `You are an editor for a home remodeling and repair company. Rewrite the message below in clear, correct, professional English. If the message is written in Spanish, translate it to English. Fix grammar and spelling only — keep the exact same meaning, tone, and facts. Do NOT change the language to anything other than English. Do NOT add greetings, sign-offs, or commentary. Do NOT change, add, or guess specific dates — if the original says "Tuesday" without a date, keep it as "Tuesday". Today is ${today}. Return ONLY the corrected message text and nothing else.${firstName ? ` The customer's name is ${firstName}.` : ''}

Message to fix:
${message}`;

    // Call Gemini REST API directly
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // thinkingBudget: 0 disables Gemini 2.5's internal "thinking",
          // which otherwise consumes maxOutputTokens before the reply and
          // truncates it mid-sentence. Higher cap covers longer messages.
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[Polish] Gemini API error:', geminiRes.status, errText);
      return new Response(JSON.stringify({ success: false, error: `Gemini API error: ${geminiRes.status}` }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiData = await geminiRes.json() as any;
    const polished = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!polished) {
      console.error('[Polish] Gemini response:', JSON.stringify(geminiData));
      return new Response(JSON.stringify({ success: false, error: 'AI returned empty response' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, polished }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Polish] Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to polish message' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
