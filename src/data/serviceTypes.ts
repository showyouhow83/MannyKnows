// Canonical service-type list — shared by the admin Lead / Quote / Project
// forms so all three offer the SAME services. `other` lets an admin type a
// custom service; the custom text is stored as the service_type value itself
// (display code falls back to the raw value for anything not in this list).
//
// This is the MannyKnows catalog: the six monthly plans (src/data/plans.ts is
// the pricing source of truth — labels here show the starting price for quick
// reference in dropdowns), the AI Agents Team, custom builds, and the two free lead
// magnets people actually write in about. Keep values stable once quotes
// reference them — labels can change freely. Manny is still finalizing the
// offer list; add/trim entries here and every admin form follows.
export interface ServiceType {
  value: string;
  label: string;
}

export const SERVICE_TYPES: ServiceType[] = [
  { value: 'ai-website', label: 'One-Page Website ($195 + $40/mo)' },
  { value: 'website-basic', label: 'Get Found ($95/mo)' },
  { value: 'website-plus', label: 'Get Booked ($245/mo)' },
  { value: 'website-smart', label: 'Get Growing ($545/mo)' },
  { value: 'get-ahead', label: 'Get Ahead ($895/mo)' },
  { value: 'ecommerce', label: 'Online Store (from $150/mo)' },
  { value: 'business-ads', label: 'Business Ads (from $350/mo)' },
  { value: 'multimedia-agency', label: 'Multimedia Agency (from $2,350/wk)' },
  { value: 'ai-team', label: 'AI Agents Team, hire agents (from $95/mo each)' },
  { value: 'custom-app', label: 'Business App: custom build (from $2,500)' },
  // Business Apps tiers — the cards on /apps/ (Aug 2026).
  { value: 'app-scripts', label: 'Scripts & Tools (from $300)' },
  { value: 'app-integration', label: 'Connected Apps: integrations & MCP (from $600)' },
  // 360° / Google Business Profile packages — these are the cards on
  // /free-360-photo, and the quote form has to be able to offer every one of
  // them or a visitor clicking "Set mine up" lands on a dropdown that can't
  // describe what they just clicked.
  { value: '360-photo', label: 'Free 360° Photo' },
  { value: '360-photo-pack', label: '360° Photo Pack (from $195)' },
  { value: 'gbp-setup', label: 'Google Profile Setup + Verification (from $145)' },
  // Local SEO packages — the cards on /local-seo/ (Aug 2026): monthly GBP +
  // 360° media + reviews bundles.
  { value: 'seo-on-the-map', label: 'On the Map: Local SEO + 360° media ($245/mo)' },
  { value: 'seo-own-the-map', label: 'Own the Map: Local SEO + virtual tour ($495/mo)' },
  { value: 'seo-own-the-market', label: 'Own the Market: full SEO program ($995/mo)' },
  // One-time SEO services — the on-demand strip on /local-seo/ (Aug 2026).
  { value: 'seo-audit', label: 'Deep SEO & AI-Readiness Audit ($375 one-time)' },
  { value: 'seo-migration', label: 'Site Migration SEO (from $750)' },
  { value: 'virtual-tour', label: 'Virtual Tour Shoot (from $495)' },
  { value: 'gbp-rescue', label: 'Google Profile Rescue (from $245)' },
  { value: 'website-analysis', label: 'Free AI Website Analysis' },
  { value: 'other', label: 'Other (enter custom)' },
];

// value -> label lookup for known services.
export const SERVICE_LABELS: Record<string, string> =
  Object.fromEntries(SERVICE_TYPES.map((s) => [s.value, s.label]));

// Human label for a stored service_type; custom values return themselves.
export function serviceLabel(value: string | null | undefined): string {
  if (!value) return '';
  return SERVICE_LABELS[value] || value;
}

// Is this a known (non-custom) service value?
export function isKnownService(value: string | null | undefined): boolean {
  return !!value && value !== 'other' && value in SERVICE_LABELS;
}
