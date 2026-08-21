// AI Text Polishing Endpoint — for quote/contract scope content.
//
// Different from /api/admin/polish-message (which is tuned for customer
// messaging — no greetings, casual tone). This endpoint is tuned for the
// short, structured content that lives inside a quote scope: bullet text,
// note paragraphs, color line labels, subtotal labels, section/scope
// titles. The polish must:
//   • Fix typos + grammar (e.g. "a cording" → "according")
//   • Translate Spanish → English when admin writes in Spanish
//   • Preserve exact numbers, brand names, and any specific terms
//   • Keep the same meaning; do NOT rephrase aggressively
//   • Return ONLY the polished text — no quotes, no commentary, no markdown
//
// Single text in / single text out. The client decides which items get
// polished; this endpoint does not know about scopes or items.
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const prerender = false;

const MAX_INPUT_CHARS = 2000;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return j({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await request.json().catch(() => null) as { text?: string; kind?: string } | null;
    const raw = (body?.text || '').trim();
    if (!raw) return j({ success: false, error: 'text is required' }, 400);
    if (raw.length > MAX_INPUT_CHARS) {
      return j({ success: false, error: `text too long (max ${MAX_INPUT_CHARS} chars)` }, 400);
    }

    // Graceful degradation: no Gemini key → return the original text
    // unchanged so the UI flow keeps working (just without AI polish).
    const apiKey = env?.GEMINI_API_KEY;
    if (!apiKey) return j({ success: true, polished: raw, degraded: 'GEMINI_API_KEY not configured' });

    // `kind` lets the client give the AI a hint about what the string is for.
    // Optional — falls back to a generic "field" framing.
    const kind = (body?.kind || 'field').toString().slice(0, 40);

    const prompt = `You are polishing a single piece of text from a web design and AI agency's quote / contract document. The text type is "${kind}".

Rules: follow strictly:
1. Fix obvious typos and grammar (e.g. "a cording" → "according", missing articles, run-on punctuation).
2. If the text is in Spanish (in part or in whole), translate it to professional English.
3. PRESERVE all numbers, dates, color codes, brand names (Sherwin Williams, Benjamin Moore, etc.), and quoted phrases verbatim.
4. Keep the same meaning and the same level of detail. Do NOT add information that wasn't there. Do NOT shorten or summarize.
5. Use professional but plain language, no marketing fluff, no greetings, no sign-offs.
6. Do NOT wrap the output in quotes. Do NOT add commentary, headers, or markdown. Output ONLY the polished text and nothing else.
7. If the input is already clean English, return it unchanged.

Text to polish:
${raw}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,         // deterministic edits, not creative rewrites
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingBudget: 0 }, // 2.5 thinking would eat the token budget + truncate
            // Single-string response (no JSON wrapping needed) — we'll just
            // trim any stray quotes / whitespace the model might add.
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[polish-text] Gemini API error:', geminiRes.status, errText);
      return j({ success: false, error: `Gemini API error: ${geminiRes.status}` }, 500);
    }

    const geminiData = await geminiRes.json() as any;
    let polished = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    if (!polished) {
      console.error('[polish-text] Empty Gemini response:', JSON.stringify(geminiData).slice(0, 500));
      return j({ success: false, error: 'AI returned empty response' }, 500);
    }

    // Strip wrapping quotes the model sometimes adds despite the rule.
    if ((polished.startsWith('"') && polished.endsWith('"')) ||
        (polished.startsWith('“') && polished.endsWith('”')) ||
        (polished.startsWith("'") && polished.endsWith("'"))) {
      polished = polished.slice(1, -1).trim();
    }

    return j({ success: true, polished });
  } catch (error) {
    console.error('[polish-text] error:', error);
    return j({ success: false, error: 'Failed to polish text' }, 500);
  }
};

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
