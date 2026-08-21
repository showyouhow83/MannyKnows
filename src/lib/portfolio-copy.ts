// Shared portfolio marketing-copy generation (title + description) used by both
// the manual "Polish" button (/api/admin/polish-portfolio) and the automatic
// run when a project is promoted to a portfolio. Centralized so the prompt +
// title normalization stay consistent.
//
// Also the single source for the portfolio CATEGORY list, kept value-aligned
// with the service list in src/data/serviceTypes.ts so a project's service
// maps 1:1 onto its portfolio category.

export const PORTFOLIO_TYPES = [
  { value: 'website', label: 'Website' },
  { value: 'ecommerce', label: 'Online Store' },
  { value: 'ai-agent', label: 'AI Agent' },
  { value: 'app', label: 'Business App' },
  { value: 'seo', label: 'Local SEO' },
  { value: 'other', label: 'Other' },
] as const;

// Legacy categories from the contractor-era port — rows saved under these
// values still display with their old label; new entries use the list above.
export const LEGACY_PORTFOLIO_LABELS: Record<string, string> = {
  kitchen_remodel: 'Kitchen Remodeling',
  bathroom_remodel: 'Bathroom Remodeling',
  interior_painting: 'Interior Painting',
  flooring: 'Flooring',
  general_repairs: 'General Repairs & Handyman',
};

export const PORTFOLIO_TYPE_VALUES: string[] = PORTFOLIO_TYPES.map((t) => t.value);

export const PORTFOLIO_TYPE_LABELS: Record<string, string> = {
  ...LEGACY_PORTFOLIO_LABELS,
  ...Object.fromEntries(PORTFOLIO_TYPES.map((t) => [t.value, t.label])),
};

// "Belchertown" → "Belchertown, MA". Normalises a spelled-out state to its code.
export function formatCity(city: string | null | undefined): string {
  if (!city) return '';
  const trimmed = city.trim();
  if (!trimmed) return '';
  if (/,\s*Massachusetts\b/i.test(trimmed)) return trimmed.replace(/,\s*Massachusetts\b/i, ', MA');
  if (/,\s*Connecticut\b/i.test(trimmed)) return trimmed.replace(/,\s*Connecticut\b/i, ', CT');
  if (/,\s*(MA|CT)\b/i.test(trimmed)) return trimmed;
  return `${trimmed}, MA`;
}

// Normalize a portfolio title: uppercase a 2-letter state code after a comma
// ("Longmeadow, Ma" → ", MA"), and reorder a leading location
// ("Longmeadow, MA Kitchen Remodel" → "Kitchen Remodel in Longmeadow, MA").
const US_STATE = /^(MA|CT|RI|NH|VT|NY|ME)$/i;
export function normalizeTitle(t: string | null | undefined): string {
  let s = String(t || '').trim().replace(/\s+/g, ' ');
  if (!s) return s;
  s = s.replace(/,\s*([A-Za-z]{2})\b/g, (m, st) => (US_STATE.test(st) ? ', ' + st.toUpperCase() : m));
  const lead = s.match(/^([A-Za-z .'\-]+,\s*(?:MA|CT|RI|NH|VT|NY|ME))\s+(.+)$/);
  if (lead) s = `${lead[2].trim()} in ${lead[1].trim()}`;
  return s;
}

const PROMPT_HEAD = `You are writing portfolio copy for MannyKnows, a web design and AI agency serving Springfield, MA and the surrounding Western Massachusetts area. Services: AI-powered websites, online stores, AI agents (chat and booking), business apps and integrations, and local SEO.

Use the project CONTEXT below to generate ONE polished portfolio entry. Output STRICT JSON:
{
  "title": "...",       // 3–7 words, Title Case
  "description": "..."  // 2–4 short sentences, distinctive to THIS project
}

TITLE RULES
- 3–7 words. Title Case.
- State code MUST be uppercase: "MA", "CT", never "Ma"/"Ct", never spell out "Massachusetts".
- Location goes LAST, never first. Format the geo as "<work> in <City>, MA": e.g. "Dental Practice Website in Springfield, MA", NOT "Springfield, MA Dental Practice Website".
- Geo-anchor only when it strengthens the title; don't pad with city if the title already reads well.
- Lead with the most distinctive detail you can: the industry, the feature built, the integration, the result, anything in CONTEXT that sets this project apart.

DESCRIPTION RULES
- 2–4 short sentences. No sign-off, no emojis, no superlatives.
- BANNED openings, never start with any of these or paraphrases of them:
  - "MannyKnows completed…"
  - "We refreshed…"
  - "This project transformed…"
  - "Beautiful…", "Stunning…"
  - "We provided…", "We delivered…"
- Lead with a CONCRETE detail from CONTEXT (the stack or platform, a feature shipped, an integration, a migration step, duration).
- Each description must contain at least TWO specifics drawn from CONTEXT. If CONTEXT is thin, use whatever specifics are present: don't invent.
- Plain, factual, builder tone. Read like the developer explaining the work, not a marketing brochure.
- Never invent traffic numbers, prices, client results, or details the context does not include.
- Mention platforms or products (e.g. Shopify, Twilio, a specific integration) ONLY when the context actually names them.
- Customer first name is optional: use it sparingly for warmth, never invent a name, never use a last name.

GOOD EXAMPLES (style reference: do NOT copy phrases verbatim)
- Title: "Painting Contractor Website in Springfield, MA"
  Description: "Full rebuild on a modern stack with an AI agent trained on the crew's services and prices. Quote requests land in the owner's admin with photos attached, and the old domain's rankings carried over through a redirect map. Live in twelve days."
- Title: "Shopify Store & AI Shopping Assistant"
  Description: "A 300-product catalog moved onto Shopify with SEO-written descriptions, and Remi AI answering sizing and shipping questions around the clock. Email flows for abandoned carts went live in week two."

BAD EXAMPLES (do not produce or paraphrase)
- "MannyKnows completed a website project in Springfield."
- "We refreshed the company's online presence, providing a modern and attractive site."

CONTEXT
`;

// Generate { title, description } from pre-built context lines. Returns null on
// any failure (missing key, API error, malformed JSON) so callers can fall back.
export async function generatePortfolioCopy(
  env: any,
  contextLines: string[]
): Promise<{ title: string; description: string } | null> {
  const apiKey = env?.GEMINI_API_KEY;
  if (!apiKey) return null;
  const prompt = `${PROMPT_HEAD}${contextLines.join('\n')}\n\nReply with ONLY the JSON object. No markdown fences, no commentary.`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.55,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
    if (!res.ok) {
      console.error('[portfolio-copy] Gemini error', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = (await res.json()) as any;
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!raw) return null;
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned) as { title?: string; description?: string };
    const title = normalizeTitle(parsed?.title);
    const description = String(parsed?.description || '').trim();
    if (!title || !description) return null;
    return { title, description };
  } catch (e) {
    console.error('[portfolio-copy] failed:', e);
    return null;
  }
}
