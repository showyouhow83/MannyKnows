// Text Normalization Library
// Layer 1: Instant case normalization (no AI)
// Layer 2: Gemini grammar/spelling fix (AI)

// US state abbreviations to preserve uppercase
const STATE_ABBRS = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC'
]);

// ============================================================
// LAYER 1: Instant normalization (no AI)
// ============================================================

/** Title Case: "JOHN SMITH" → "John Smith" */
export function titleCase(text: string | null | undefined): string {
  if (!text) return '';
  return text.trim().replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
  );
}

/** Name normalization: titleCase + apostrophe handling
 *  "O'SHAUGHNESSY" → "O'Shaughnessy"
 *  "MCDONALD" → "Mcdonald" (good enough, edge case)
 */
export function normalizeName(text: string | null | undefined): string {
  if (!text) return '';
  const titled = titleCase(text);
  // Fix apostrophes: O'shaughnessy → O'Shaughnessy
  return titled.replace(/(\w)'(\w)/g, (_, before, after) =>
    `${before}'${after.toUpperCase()}`
  );
}

// Abbreviations to preserve uppercase in sentence case
// (paint brands/tech + flooring: LVP = luxury vinyl plank, LVT = luxury vinyl tile)
const PRESERVE_ABBRS = new Set(['SW', 'BM', 'DTM', 'EPA', 'RRP', 'HVLP', 'UV', 'LVP', 'LVT']);

/** Sentence Case: "EXTERIOR PAINTING OF YOUR HOUSE" → "Exterior painting of your house"
 *  Preserves known abbreviations: SW, BM, DTM, etc.
 */
export function sentenceCase(text: string | null | undefined): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  // If text is mostly uppercase (>60% caps), convert to sentence case
  const upperCount = (trimmed.match(/[A-Z]/g) || []).length;
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 0 && upperCount / letterCount > 0.6) {
    const lowered = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    // Restore preserved abbreviations
    return lowered.replace(/\b\w+\b/g, (word) => {
      const upper = word.toUpperCase();
      return PRESERVE_ABBRS.has(upper) ? upper : word;
    });
  }
  // Already mixed case — leave it alone
  return trimmed;
}

/** Normalize address: titleCase but preserve state abbreviations
 *  "123 MAIN ST SPRINGFIELD MA 01108" → "123 Main St Springfield MA 01108"
 */
export function normalizeAddress(text: string | null | undefined): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  return words.map(word => {
    const upper = word.toUpperCase().replace(/[^A-Z]/g, '');
    // Preserve state abbreviations and zip codes
    if (STATE_ABBRS.has(upper) && word.length <= 3) return word.toUpperCase();
    if (/^\d{5}(-\d{4})?$/.test(word)) return word; // zip code
    // Title case the word
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

/** Lowercase email */
export function lowercaseEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

// ============================================================
// LAYER 2: Gemini grammar/spelling fix (AI)
// ============================================================

/** Polish free-form text with Gemini: fix grammar, typos, spelling.
 *  Input should already be sentence-cased (Layer 1).
 *  Returns the original text if Gemini fails (graceful degradation).
 */
export async function geminiPolish(text: string, apiKey: string): Promise<string> {
  if (!text || !apiKey) return text;
  // Skip short text — AI is unreliable on short strings like product names
  if (text.length < 15) return text;

  try {
    const prompt = `You are a text corrector for a web design and AI agency. Fix ONLY spelling mistakes and grammar errors. Do NOT remove words, change meaning, rephrase, or add anything. The text describes websites, AI agents, stores, apps, and SEO/flooring materials, labor, or project scope. Output ONLY the corrected text, nothing else.\n\nText: "${text}"`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } }
        })
      }
    );

    if (!res.ok) return text;

    const data = await res.json() as any;
    const polished = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    // Strict sanity checks — reject if AI changed too much
    if (!polished) return text;
    if (polished.length > text.length * 1.5) return text; // Added too much
    if (polished.length < text.length * 0.5) return text; // Removed too much
    // Check word count didn't change drastically
    const origWords = text.split(/\s+/).length;
    const newWords = polished.split(/\s+/).length;
    if (Math.abs(origWords - newWords) > 2) return text; // Changed word count too much

    return polished;
  } catch {
    return text;
  }
}

// ============================================================
// COMBINED: Apply both layers to common field sets
// ============================================================

/** Normalize a customer name field */
export function normName(val: string | null | undefined): string {
  return normalizeName(val);
}

/** Normalize an email field */
export function normEmail(val: string | null | undefined): string {
  return lowercaseEmail(val);
}

/** Normalize a city field */
export function normCity(val: string | null | undefined): string {
  return titleCase(val);
}

/** Normalize an address field */
export function normAddr(val: string | null | undefined): string {
  return normalizeAddress(val);
}

/** Normalize a state field */
export function normState(val: string | null | undefined): string {
  if (!val) return '';
  return val.trim().toUpperCase();
}

/** Layer 1 + Layer 2: sentence case then AI polish for descriptions */
export async function normDescription(val: string | null | undefined, apiKey?: string): Promise<string> {
  if (!val) return '';
  const cased = sentenceCase(val);
  if (apiKey) return geminiPolish(cased, apiKey);
  return cased;
}
