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
    name: 'Kitchen Remodel — Starter',
    project_type: 'kitchen_remodel',
    is_default: true,
    sections: [
      {
        id: 'sec-kit-prep',
        title: 'Preparation & Protection',
        items: [
          { id: 'it-kit-prep-1', type: 'bullet', text: 'Protect adjacent floors, walls, and furnishings before work begins' },
          { id: 'it-kit-prep-2', type: 'bullet', text: 'Set up dust containment at the kitchen entry' },
          { id: 'it-kit-prep-3', type: 'bullet', text: 'Coordinate plumbing and electrical disconnects at work areas as agreed' },
        ],
      },
      {
        id: 'sec-kit-demo',
        title: 'Demolition & Removal',
        items: [
          { id: 'it-kit-demo-1', type: 'bullet', text: 'Remove existing cabinets, countertops, and fixtures per the agreed scope' },
          { id: 'it-kit-demo-2', type: 'bullet', text: 'Haul away and dispose of demolition debris' },
        ],
      },
      {
        id: 'sec-kit-install',
        title: 'Installation',
        items: [
          { id: 'it-kit-inst-1', type: 'bullet', text: 'Install new cabinets and hardware' },
          { id: 'it-kit-inst-2', type: 'bullet', text: 'Install new countertops' },
          { id: 'it-kit-inst-3', type: 'bullet', text: 'Install backsplash' },
          { id: 'it-kit-inst-4', type: 'fillable', label: 'Cabinet style / finish', value: '' },
          { id: 'it-kit-inst-5', type: 'fillable', label: 'Countertop material', value: '' },
          { id: 'it-kit-inst-6', type: 'fillable', label: 'Backsplash selection', value: '' },
        ],
      },
      {
        id: 'sec-kit-finish',
        title: 'Finishing & Cleanup',
        items: [
          { id: 'it-kit-fin-1', type: 'bullet', text: 'Caulk, touch up, and complete final detail work' },
          { id: 'it-kit-fin-2', type: 'bullet', text: 'Full cleanup and debris removal' },
          { id: 'it-kit-fin-3', type: 'bullet', text: 'Final walkthrough with the homeowner' },
          { id: 'it-kit-fin-4', type: 'subtotal', label: 'Total — labor and materials', amount: 0 },
        ],
      },
    ],
  },
  {
    name: 'Bathroom Remodel — Starter',
    project_type: 'bathroom_remodel',
    is_default: true,
    sections: [
      {
        id: 'sec-bath-prep',
        title: 'Preparation & Protection',
        items: [
          { id: 'it-bath-prep-1', type: 'bullet', text: 'Protect adjacent floors and walls before work begins' },
          { id: 'it-bath-prep-2', type: 'bullet', text: 'Coordinate plumbing and electrical disconnects at work areas as agreed' },
        ],
      },
      {
        id: 'sec-bath-demo',
        title: 'Demolition & Removal',
        items: [
          { id: 'it-bath-demo-1', type: 'bullet', text: 'Remove existing vanity, fixtures, and finishes per the agreed scope' },
          { id: 'it-bath-demo-2', type: 'bullet', text: 'Haul away and dispose of demolition debris' },
        ],
      },
      {
        id: 'sec-bath-install',
        title: 'Installation',
        items: [
          { id: 'it-bath-inst-1', type: 'bullet', text: 'Install new vanity, fixtures, and hardware' },
          { id: 'it-bath-inst-2', type: 'bullet', text: 'Install tile (floor and/or shower surround) per the agreed scope' },
          { id: 'it-bath-inst-3', type: 'fillable', label: 'Vanity / fixture selections', value: '' },
          { id: 'it-bath-inst-4', type: 'fillable', label: 'Tile selection', value: '' },
        ],
      },
      {
        id: 'sec-bath-finish',
        title: 'Finishing & Cleanup',
        items: [
          { id: 'it-bath-fin-1', type: 'bullet', text: 'Caulk, seal, and complete final detail work' },
          { id: 'it-bath-fin-2', type: 'bullet', text: 'Full cleanup and debris removal' },
          { id: 'it-bath-fin-3', type: 'bullet', text: 'Final walkthrough with the homeowner' },
          { id: 'it-bath-fin-4', type: 'subtotal', label: 'Total — labor and materials', amount: 0 },
        ],
      },
    ],
  },
  {
    name: 'Interior Painting — Starter',
    project_type: 'interior_painting',
    is_default: true,
    sections: [
      {
        id: 'sec-pnt-prep',
        title: 'Preparation',
        items: [
          { id: 'it-pnt-prep-1', type: 'bullet', text: 'Protect floors, furniture, and fixtures with coverings' },
          { id: 'it-pnt-prep-2', type: 'bullet', text: 'Fill nail holes, caulk gaps, and sand surfaces as needed' },
          { id: 'it-pnt-prep-3', type: 'bullet', text: 'Spot-prime patched and repaired areas' },
        ],
      },
      {
        id: 'sec-pnt-paint',
        title: 'Painting',
        items: [
          { id: 'it-pnt-pnt-1', type: 'bullet', text: 'Apply finish coats to the walls, ceilings, and trim included in this quote' },
          { id: 'it-pnt-pnt-2', type: 'fillable', label: 'Wall color', value: '', product_type: 'paint' },
          { id: 'it-pnt-pnt-3', type: 'fillable', label: 'Trim color', value: '', product_type: 'paint' },
          { id: 'it-pnt-pnt-4', type: 'choice', label: 'Sheen', value: '', options: ['Flat', 'Matte', 'Eggshell', 'Satin', 'Semi-gloss'] },
        ],
      },
      {
        id: 'sec-pnt-finish',
        title: 'Finishing & Cleanup',
        items: [
          { id: 'it-pnt-fin-1', type: 'bullet', text: 'Touch-up pass and final inspection with the homeowner' },
          { id: 'it-pnt-fin-2', type: 'bullet', text: 'Full cleanup and removal of all materials' },
          { id: 'it-pnt-fin-3', type: 'subtotal', label: 'Total — labor and materials', amount: 0 },
        ],
      },
    ],
  },
  {
    name: 'Flooring — Starter',
    project_type: 'flooring',
    is_default: true,
    sections: [
      {
        id: 'sec-flr-prep',
        title: 'Preparation',
        items: [
          { id: 'it-flr-prep-1', type: 'bullet', text: 'Remove and dispose of existing flooring per the agreed scope' },
          { id: 'it-flr-prep-2', type: 'bullet', text: 'Inspect and prepare the subfloor (level and repair as needed)' },
        ],
      },
      {
        id: 'sec-flr-install',
        title: 'Installation',
        items: [
          { id: 'it-flr-inst-1', type: 'bullet', text: 'Install new flooring in the areas included in this quote' },
          { id: 'it-flr-inst-2', type: 'bullet', text: 'Install transitions, thresholds, and trim as needed' },
          { id: 'it-flr-inst-3', type: 'choice', label: 'Flooring type', value: '', options: ['Hardwood', 'Tile', 'LVP'] },
          { id: 'it-flr-inst-4', type: 'fillable', label: 'Flooring product / color', value: '' },
        ],
      },
      {
        id: 'sec-flr-finish',
        title: 'Finishing & Cleanup',
        items: [
          { id: 'it-flr-fin-1', type: 'bullet', text: 'Full cleanup and debris removal' },
          { id: 'it-flr-fin-2', type: 'bullet', text: 'Final walkthrough with the homeowner' },
          { id: 'it-flr-fin-3', type: 'subtotal', label: 'Total — labor and materials', amount: 0 },
        ],
      },
    ],
  },
  {
    name: 'General Repairs — Starter',
    project_type: 'general_repairs',
    is_default: true,
    sections: [
      {
        id: 'sec-rep-scope',
        title: 'Scope of Work',
        items: [
          { id: 'it-rep-scope-1', type: 'note', text: 'The repair items below reflect what we discussed during the walkthrough. Anything not listed is outside this quote.' },
          { id: 'it-rep-scope-2', type: 'bullet', text: 'Complete the repair items listed in this quote' },
          { id: 'it-rep-scope-3', type: 'bullet', text: 'Supply materials as agreed (homeowner-supplied items noted per line)' },
        ],
      },
      {
        id: 'sec-rep-finish',
        title: 'Finishing & Cleanup',
        items: [
          { id: 'it-rep-fin-1', type: 'bullet', text: 'Clean the work areas and remove all debris' },
          { id: 'it-rep-fin-2', type: 'bullet', text: 'Final walkthrough with the homeowner' },
          { id: 'it-rep-fin-3', type: 'subtotal', label: 'Total — labor and materials', amount: 0 },
        ],
      },
    ],
  },
];
