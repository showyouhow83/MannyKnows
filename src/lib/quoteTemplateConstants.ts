// Shared constants + rendering helpers for quote-template output.
// Used by:
//   - /admin/quotes/[id]/preview (the print-to-PDF page)
//   - /quote/[token] (Phase 3 — customer view)
//   - lib/quote-emails.ts (Phase 3 — customer email)
//
// Single source of truth for the MannyKnows header / warranty boilerplate
// that appears on every quote.

export const COMPANY_HEADER = {
  name: 'MannyKnows',
  licenseLabel: 'MA HIC License',
  // TODO(CONTENT_TODOS: company-license-number): real MannyKnows MA HIC
  // number goes here once Manny provides it. Leave '' until then — render sites
  // hide the license line when empty. Never invent a number.
  licenseNumber: '',
  contactName: 'Manny',
  phone: '(413) 361-8451',
  email: 'mm@mannyknows.com',
  website: 'https://mannyknows.com',
};

// Closing terms paragraph that ends every quote. Deliberately neutral — the
// SL Painting original claimed a 30% deposit and a 30-month workmanship
// warranty, which are NOT MannyKnows' confirmed terms. Do not add a
// warranty duration, deposit percentage, or insurance claim here until Manny
// confirms the real ones (tracked in CONTENT_TODOS.md: quotes-terms-copy).
export const WARRANTY_TERMS =
  'Scope, pricing, and scheduling are confirmed in a written contract before any work begins. Questions about this quote? Call us at (413) 361-8451 or email mm@mannyknows.com.';

// ─────────────────────────────────────────────────────────────────────────────
// Section / item shapes (kept here so server endpoints + Astro pages can share
// the type without importing from each other).
// ─────────────────────────────────────────────────────────────────────────────

// `choice` is a generic admin-defined dropdown: admin chooses the label
// (e.g. "Sheen", "Paint type", "Brand"), the option list (e.g.
// ["Matte", "Eggshell", "Semi-gloss"]), and the currently-selected value.
// `paint_line` is the legacy hardcoded paint/stain variant — kept in the
// type union for backwards-compat with already-saved data; new items
// should use `choice`.
export type SectionItem =
  | { id: string; type: 'bullet'; text: string }
  | { id: string; type: 'note'; text: string }
  | { id: string; type: 'fillable'; label: string; value: string; product_type?: 'paint' | 'stain'; finish?: string }
  | { id: string; type: 'subtotal'; label: string; amount: number }
  | { id: string; type: 'choice'; label: string; value: string; options: string[] }
  | { id: string; type: 'paint_line'; label: string; value: string; product_type?: 'paint' | 'stain' };

export interface QuoteSection {
  id: string;
  title: string;
  items: SectionItem[];
}

// v5 (Phase 5): a Quote owns N "scopes of work". Each scope wraps its own
// sections. Backward compat is handled at parse time — legacy data (a flat
// QuoteSection[]) is wrapped into a single "Main scope" automatically.
export interface QuoteScope {
  id: string;
  title: string;
  template_id?: number | null;
  sections: QuoteSection[];
}

// Detect whether a parsed JSON value is already in the new scoped shape.
// A scope object has a `sections` array; a legacy section object has `items`.
function isScopeShape(arr: any[]): boolean {
  if (!arr.length) return false;
  const first = arr[0];
  return !!first && typeof first === 'object' && Array.isArray(first.sections);
}

// Tolerant parse → returns the new scoped shape regardless of what's in the
// DB. Old flat data gets wrapped as `[{title: 'Main scope', sections: <legacy>}]`
// so every downstream caller sees a consistent QuoteScope[] structure.
export function parseScopes(raw: string | null | undefined): QuoteScope[] {
  if (!raw) return [];
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(parsed) || parsed.length === 0) return [];
  if (isScopeShape(parsed)) return parsed as QuoteScope[];
  // Legacy flat shape — wrap as one scope so the rest of the pipeline
  // doesn't need to special-case it.
  return [{
    id: 'scope-legacy',
    title: 'Main scope',
    template_id: null,
    sections: parsed as QuoteSection[],
  }];
}

// Tolerant parse → flat sections list. Kept for callers that haven't been
// updated to scopes yet. Returns sections across ALL scopes flattened.
export function parseSections(raw: string | null | undefined): QuoteSection[] {
  return parseScopes(raw).flatMap(s => Array.isArray(s.sections) ? s.sections : []);
}

// Phase 5 transition: many existing quotes still hold pricing in legacy
// `materials` + `labor` JSON columns instead of `template_sections`. The
// new scope-only renderers (customer email, customer view, crew + client
// portals) would otherwise show nothing for those rows, so we synthesize a
// single "Main scope" from the legacy fields on the fly. Once the admin
// re-saves such a quote with real scopes the synthesis is no longer used.
//
// Returns a QuoteScope[] for ANY input shape:
//   - already scoped → returned as-is
//   - legacy flat sections → wrapped as one scope (via parseScopes)
//   - null template_sections but has materials/labor → synthesized scope
//   - completely empty → []
export function quoteToScopes(quote: {
  template_sections?: string | null;
  materials?: string | null;
  labor?: string | null;
  labor_total?: number | null;
}): QuoteScope[] {
  const parsed = parseScopes(quote.template_sections);
  if (parsed.length > 0) return parsed;

  // Synthesize a Main scope from legacy materials + labor JSON.
  const sections: QuoteSection[] = [];
  try {
    const materials = quote.materials ? JSON.parse(quote.materials) : [];
    if (Array.isArray(materials) && materials.length > 0) {
      sections.push({
        id: 'sec-legacy-materials',
        title: 'Materials',
        items: materials
          .map((m: any, i: number) => ({
            id: `item-legacy-mat-${i}`,
            type: 'bullet' as const,
            text: String(m?.name || m?.description || '').trim(),
          }))
          .filter(it => it.text),
      });
    }
  } catch {}

  try {
    const labor = quote.labor ? JSON.parse(quote.labor) : [];
    if (Array.isArray(labor) && labor.length > 0) {
      const items: SectionItem[] = labor
        .map((l: any, i: number) => {
          const desc = String(l?.description || l?.name || '').trim();
          if (!desc) return null;
          const qty = Number(l?.qty);
          return {
            id: `item-legacy-lab-${i}`,
            type: 'bullet' as const,
            text: qty > 1 ? `${desc} (x${qty})` : desc,
          };
        })
        .filter((x): x is { id: string; type: 'bullet'; text: string } => !!x);
      // Append a Subtotal item carrying labor_total so scope-driven pricing
      // surfaces the right number without needing a DB rewrite.
      const laborTotal = Number(quote.labor_total);
      if (Number.isFinite(laborTotal) && laborTotal > 0) {
        items.push({
          id: 'item-legacy-lab-total',
          type: 'subtotal',
          label: 'Labor total',
          amount: laborTotal,
        });
      }
      if (items.length > 0) {
        sections.push({
          id: 'sec-legacy-labor',
          title: 'Labor',
          items,
        });
      }
    }
  } catch {}

  if (sections.length === 0) return [];
  return [{
    id: 'scope-legacy-synth',
    title: 'Main scope',
    template_id: null,
    sections,
  }];
}

// Sum every `subtotal`-typed item's `amount` across every section in every
// scope. Accepts either a QuoteSection[] (legacy callers) or a QuoteScope[]
// (new callers) — discriminates by checking whether the first element has
// `sections` (scope) or `items` (section).
export function sumSubtotals(input: QuoteSection[] | QuoteScope[] | null | undefined): number {
  if (!Array.isArray(input) || input.length === 0) return 0;
  const sections: QuoteSection[] = isScopeShape(input as any[])
    ? (input as QuoteScope[]).flatMap(s => Array.isArray(s.sections) ? s.sections : [])
    : (input as QuoteSection[]);
  let total = 0;
  for (const s of sections) {
    if (!Array.isArray(s?.items)) continue;
    for (const it of s.items) {
      if (it && (it as any).type === 'subtotal') {
        const amt = Number((it as any).amount);
        if (Number.isFinite(amt)) total += amt;
      }
    }
  }
  return total;
}

// Sum only one scope's subtotals — used by per-scope subtotal badges in the
// editor and by the per-scope preview page.
export function sumScopeSubtotals(scope: QuoteScope | null | undefined): number {
  if (!scope || !Array.isArray(scope.sections)) return 0;
  return sumSubtotals(scope.sections);
}

// HTML-escape — same shape as the helper used elsewhere in the codebase.
function escapeHtml(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatMoney(amount: number | string | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// Render a single item as inline-styled HTML. Inline styles only so the same
// markup works in (a) the print preview page, (b) the customer-facing page,
// and (c) the email — none of those share a stylesheet.
export function renderItemHtml(item: SectionItem): string {
  if (item.type === 'bullet') {
    return `<li style="margin:0 0 6px 0; line-height:1.5;">${escapeHtml(item.text)}</li>`;
  }
  if (item.type === 'note') {
    return `<p style="margin:0 0 10px 0; line-height:1.55; color:#1f2937;">${escapeHtml(item.text)}</p>`;
  }
  if (item.type === 'fillable') {
    const val = item.value && item.value.trim()
      ? `<span style="font-weight:600; color:#111827;">${escapeHtml(item.value)}</span>`
      : `<span style="display:inline-block; min-width:120px; border-bottom:1px solid #94a3b8;">&nbsp;</span>`;
    // Optional Paint/Stain chip + finish — mirrors the editor's color card so
    // the admin's type/finish choices surface on the customer document.
    let extra = '';
    if (item.product_type === 'paint' || item.product_type === 'stain') {
      const productType = item.product_type === 'stain' ? 'Stain' : 'Paint';
      const chipColor = item.product_type === 'stain' ? '#9a3412' : '#1d4ed8';
      const chipBg = item.product_type === 'stain' ? '#fff7ed' : '#eff6ff';
      const chipBorder = item.product_type === 'stain' ? '#fdba74' : '#bfdbfe';
      extra += `<span style="display:inline-block; margin-left:8px; padding:1px 8px; font-size:11px; font-weight:700; color:${chipColor}; background:${chipBg}; border:1px solid ${chipBorder}; border-radius:999px; vertical-align:middle;">${productType}</span>`;
    }
    if (item.finish && item.finish.trim()) {
      extra += `<span style="margin-left:6px; font-size:12px; color:#6b7280;">${escapeHtml(item.finish)}</span>`;
    }
    return `<li style="margin:0 0 6px 0; line-height:1.5;"><span>${escapeHtml(item.label)}:</span> ${val}${extra}</li>`;
  }
  if (item.type === 'choice') {
    // Admin-defined dropdown. Renders as "Label: SelectedValue" — same
    // visual treatment as fillable so it sits cleanly in the bullet list.
    // If the value is empty (template not yet filled in), show an
    // underline placeholder. Options array is admin-only metadata; we
    // don't render the unselected options in the customer document.
    const val = item.value && item.value.trim()
      ? `<span style="font-weight:600; color:#111827;">${escapeHtml(item.value)}</span>`
      : `<span style="display:inline-block; min-width:120px; border-bottom:1px solid #94a3b8;">&nbsp;</span>`;
    return `<li style="margin:0 0 6px 0; line-height:1.5;"><span>${escapeHtml(item.label)}:</span> ${val}</li>`;
  }
  if (item.type === 'paint_line') {
    // Legacy — paint/stain chip variant kept so already-saved rows render
    // correctly. New items use `choice` instead.
    const val = item.value && item.value.trim()
      ? `<span style="font-weight:600; color:#111827;">${escapeHtml(item.value)}</span>`
      : `<span style="display:inline-block; min-width:120px; border-bottom:1px solid #94a3b8;">&nbsp;</span>`;
    const productType = item.product_type === 'stain' ? 'Stain' : 'Paint';
    const chipColor = item.product_type === 'stain' ? '#9a3412' : '#1d4ed8';
    const chipBg = item.product_type === 'stain' ? '#fff7ed' : '#eff6ff';
    const chipBorder = item.product_type === 'stain' ? '#fdba74' : '#bfdbfe';
    const chip = `<span style="display:inline-block; margin-left:8px; padding:1px 8px; font-size:11px; font-weight:700; color:${chipColor}; background:${chipBg}; border:1px solid ${chipBorder}; border-radius:999px; vertical-align:middle;">${productType}</span>`;
    return `<li style="margin:0 0 6px 0; line-height:1.5;"><span>${escapeHtml(item.label)}:</span> ${val}${chip}</li>`;
  }
  if (item.type === 'subtotal') {
    const amt = formatMoney(item.amount);
    // Use a table for the subtotal row instead of flexbox — Outlook + several
    // older mail clients silently drop `display:flex` which used to collapse
    // the label and amount into one run ("Labor total$1,000.00"). A 100%-width
    // table with explicit left + right alignment renders identically in every
    // client.
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:6px; border-top:1px solid #cbd5e1;">
      <tr>
        <td style="padding:8px 0; font-weight:700; text-align:left;">${escapeHtml(item.label)}</td>
        <td style="padding:8px 0; font-weight:700; font-size:16px; text-align:right; white-space:nowrap;">${amt || '$0.00'}</td>
      </tr>
    </table>`;
  }
  return '';
}

// Render a single section block. Bullets + fillables wrap in a <ul>;
// subtotals + notes render as block-level rows. `hidePricing` drops every
// `subtotal` item so crew/client portals can render scopes without prices.
export function renderSectionHtml(
  section: QuoteSection,
  opts?: { hidePricing?: boolean }
): string {
  const hide = !!opts?.hidePricing;
  const items = hide ? section.items.filter(i => i.type !== 'subtotal') : section.items;
  if (items.length === 0) return '';
  // `choice` and `paint_line` render as <li> inside the same bullet list
  // as fillables — they're all labeled rows that fit the same visual.
  const bulletyItems = items.filter(i => i.type === 'bullet' || i.type === 'fillable' || i.type === 'choice' || i.type === 'paint_line');
  const otherItems = items.filter(i => i.type !== 'bullet' && i.type !== 'fillable' && i.type !== 'choice' && i.type !== 'paint_line');

  const bulletList = bulletyItems.length
    ? `<ul style="list-style:disc; padding-left:22px; margin:0 0 10px 0;">${bulletyItems.map(renderItemHtml).join('')}</ul>`
    : '';
  const other = otherItems.map(renderItemHtml).join('');

  return `<section style="margin:0 0 22px 0; page-break-inside:avoid;">
    <h3 style="margin:0 0 10px 0; font-size:15px; font-weight:700; color:#111827; border-bottom:1px solid #e5e7eb; padding-bottom:5px;">${escapeHtml(section.title)}</h3>
    ${bulletList}
    ${other}
  </section>`;
}

// Render the full sections list. Returns an empty string if there's nothing
// to draw.
export function renderSectionsHtml(
  sections: QuoteSection[],
  opts?: { hidePricing?: boolean }
): string {
  if (!Array.isArray(sections) || sections.length === 0) return '';
  return sections.map(s => renderSectionHtml(s, opts)).join('');
}

// Render a single scope: title heading + its sections. Used by per-scope
// previews and by the multi-scope renderer below.
export function renderScopeHtml(
  scope: QuoteScope,
  opts?: { hidePricing?: boolean }
): string {
  if (!scope || !Array.isArray(scope.sections)) return '';
  const sectionsHtml = scope.sections.map(s => renderSectionHtml(s, opts)).join('');
  return `<article style="margin:0 0 32px 0; page-break-inside:auto;">
    <h2 style="margin:0 0 14px 0; padding:8px 12px; font-size:18px; font-weight:700; color:#fff; background:#0f172a; border-radius:4px;">${escapeHtml(scope.title || 'Scope of Work')}</h2>
    ${sectionsHtml}
  </article>`;
}

// Render multiple scopes — each gets its own title heading + sections.
// Options:
//   • opts.scopeId — filter to a single scope (per-scope preview URL).
//   • opts.hidePricing — drop subtotal items (used by crew + client portals).
export function renderScopesHtml(
  scopes: QuoteScope[],
  opts?: { scopeId?: string; hidePricing?: boolean }
): string {
  if (!Array.isArray(scopes) || scopes.length === 0) return '';
  const filtered = opts?.scopeId
    ? scopes.filter(s => s.id === opts.scopeId)
    : scopes;
  return filtered.map(s => renderScopeHtml(s, opts)).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Starter quote templates — one generic scope-of-work skeleton per
// Services service line. Seeded from /admin/quote-templates ("Add starter
// templates"); the admin edits every line before a quote ever goes out.
//
// Ground rules for this data (per project design principles):
//   • No prices — every subtotal starts at 0; the admin types the real number.
//   • No brand names, warranty claims, certifications, or timeframes.
//   • Bullets describe work generically; anything customer-specific is a
//     fillable/choice line the admin completes per quote.
// project_type values mirror src/data/serviceTypes.ts.
// ─────────────────────────────────────────────────────────────────────────────

export interface StarterTemplate {
  name: string;
  project_type: string;
  is_default: boolean;
  sections: QuoteSection[];
}

export const DEFAULT_QUOTE_TEMPLATES: StarterTemplate[] = [
  {
    name: 'Smart Website — Launch',
    project_type: 'website-basic',
    is_default: true,
    sections: [
      {
        id: 'sec-web-build',
        title: 'What We Build',
        items: [
          { id: 'it-web-build-1', type: 'bullet', text: 'Design and build your full multi-page website — layout, copy, and photos included' },
          { id: 'it-web-build-2', type: 'bullet', text: 'Train Remi, your AI agent, on your business — services, prices, hours, and how you talk — to answer customers 24/7' },
          { id: 'it-web-build-3', type: 'bullet', text: 'Set up your own admin: leads, contacts, and content you can manage yourself' },
          { id: 'it-web-build-4', type: 'bullet', text: 'English + Spanish as standard — written, not machine-translated' },
          { id: 'it-web-build-5', type: 'bullet', text: 'SSL, caching, hosting, and a domain if you need one — included in the plan' },
        ],
      },
      {
        id: 'sec-web-billing',
        title: 'Plan & Billing',
        items: [
          { id: 'it-web-bill-1', type: 'choice', label: 'Plan tier', value: '', options: ['Get Found — $99/mo', 'Get Booked — $249/mo', 'Get Growing — $550/mo', 'Get Ahead — $899/mo'] },
          { id: 'it-web-bill-2', type: 'subtotal', label: 'One-time setup', amount: 0 },
          { id: 'it-web-bill-3', type: 'subtotal', label: 'Due at start (setup + first month)', amount: 0 },
          { id: 'it-web-bill-4', type: 'note', text: 'The plan then continues month-to-month — cancel anytime. Prepay the year and get the equivalent of 2 months free.' },
        ],
      },
      {
        id: 'sec-web-launch',
        title: 'Timeline & Approval',
        items: [
          { id: 'it-web-launch-1', type: 'fillable', label: 'Target launch', value: '' },
          { id: 'it-web-launch-2', type: 'bullet', text: 'You review the full site on a private preview link before anything goes live' },
          { id: 'it-web-launch-3', type: 'bullet', text: 'After launch: the plan keeps the site fast, ranking, and up to date — with a plain-English monthly report' },
        ],
      },
    ],
  },
  {
    name: 'Sell Online — Launch',
    project_type: 'ecommerce',
    is_default: true,
    sections: [
      {
        id: 'sec-store-build',
        title: 'What We Build',
        items: [
          { id: 'it-store-build-1', type: 'bullet', text: 'Design and build your online store — theme, branding, and checkout, built to sell' },
          { id: 'it-store-build-2', type: 'bullet', text: 'Load your starting catalog: products, photos, descriptions, and prices' },
          { id: 'it-store-build-3', type: 'bullet', text: 'Train Remi to sell — answer shoppers, steer them to the right product, and hand you the hard questions' },
          { id: 'it-store-build-4', type: 'bullet', text: 'Your admin covers the store too: products, inventory, orders, and promos in one place' },
        ],
      },
      {
        id: 'sec-store-billing',
        title: 'Plan & Billing',
        items: [
          { id: 'it-store-bill-1', type: 'subtotal', label: 'One-time setup', amount: 0 },
          { id: 'it-store-bill-2', type: 'subtotal', label: 'Due at start (setup + first month at $699/mo)', amount: 0 },
          { id: 'it-store-bill-3', type: 'note', text: 'The Sell Online plan continues at $699/mo, month-to-month. Shopify bills its own subscription and payment-processing fees directly to you — standard for any store; we never mark those up.' },
        ],
      },
      {
        id: 'sec-store-launch',
        title: 'Timeline & Approval',
        items: [
          { id: 'it-store-launch-1', type: 'fillable', label: 'Target launch', value: '' },
          { id: 'it-store-launch-2', type: 'bullet', text: 'You review the full store on a private preview before it takes a single order' },
        ],
      },
    ],
  },
  {
    name: 'AI Team — Hire Agents',
    project_type: 'ai-team',
    is_default: true,
    sections: [
      {
        id: 'sec-team-roster',
        title: 'Agents Hired',
        items: [
          { id: 'it-team-roster-1', type: 'fillable', label: 'Agent 1 (name + role)', value: '' },
          { id: 'it-team-roster-2', type: 'fillable', label: 'Agent 2 (name + role)', value: '' },
          { id: 'it-team-roster-3', type: 'fillable', label: 'Agent 3 (name + role)', value: '' },
          { id: 'it-team-roster-4', type: 'note', text: 'Agents run $99–$249/mo each (roster and pricing at mannyknows.com/ai-team). Manny, the manager who coordinates the team, is included with any hire.' },
        ],
      },
      {
        id: 'sec-team-setup',
        title: 'One-Time Setup',
        items: [
          { id: 'it-team-setup-1', type: 'bullet', text: 'Working sessions to capture your voice, services, prices, and customers' },
          { id: 'it-team-setup-2', type: 'bullet', text: 'Build your Brand Brain — the shared knowledge base every agent reads from' },
          { id: 'it-team-setup-3', type: 'bullet', text: 'Set up each hired agent and wire its handoffs through Manny' },
          { id: 'it-team-setup-4', type: 'bullet', text: 'Run it alongside you and fine-tune until the output earns your approval' },
          { id: 'it-team-setup-5', type: 'subtotal', label: 'One-time setup', amount: 199 },
        ],
      },
      {
        id: 'sec-team-monthly',
        title: 'Monthly',
        items: [
          { id: 'it-team-monthly-1', type: 'subtotal', label: 'Monthly total (agents hired)', amount: 0 },
          { id: 'it-team-monthly-2', type: 'note', text: 'Month-to-month — add or remove agents anytime. Nothing publishes without your approval.' },
        ],
      },
    ],
  },
  {
    name: 'Custom Web App — Scoped Build',
    project_type: 'custom-app',
    is_default: true,
    sections: [
      {
        id: 'sec-app-discovery',
        title: 'Discovery & Design',
        items: [
          { id: 'it-app-disc-1', type: 'bullet', text: 'Map the process the app replaces — how the work actually flows today' },
          { id: 'it-app-disc-2', type: 'bullet', text: 'Spec and wireframes for your approval before any build starts' },
        ],
      },
      {
        id: 'sec-app-build',
        title: 'Build & Launch',
        items: [
          { id: 'it-app-build-1', type: 'bullet', text: 'Build the app around how you work — not the other way around' },
          { id: 'it-app-build-2', type: 'bullet', text: 'Test together with real data before anything goes live' },
          { id: 'it-app-build-3', type: 'bullet', text: 'Launch, plus hands-on training for you and your team' },
        ],
      },
      {
        id: 'sec-app-billing',
        title: 'Investment',
        items: [
          { id: 'it-app-bill-1', type: 'fillable', label: 'Milestone 1', value: '' },
          { id: 'it-app-bill-2', type: 'fillable', label: 'Milestone 2', value: '' },
          { id: 'it-app-bill-3', type: 'subtotal', label: 'Project total', amount: 0 },
          { id: 'it-app-bill-4', type: 'note', text: 'Milestones, amounts, and the payment schedule are confirmed in the written contract before work begins.' },
        ],
      },
    ],
  },
];
