// Canonical service-type list — shared by the admin Lead / Quote / Project
// forms so all three offer the SAME services. `other` lets an admin type a
// custom service; the custom text is stored as the service_type value itself
// (display code falls back to the raw value for anything not in this list).
//
// This is the MannyKnows catalog: the monthly plans, the AI Agents Team, custom
// builds, the SEO packages, and the two free lead magnets people actually write
// in about. Every price in a label is DERIVED from the data file that owns it
// (plans.ts / remi.ts / aiWebsite.ts / aiTeam.ts / apps.ts / localSeo.ts) —
// never type a number here, so a reprice in one of those files can't strand the
// public quote form (rendered by QuoteFormModal on every page). Keep values
// stable once quotes reference them — labels can change freely.
import { plans } from './plans';
import { remiLiteMonthly, remiProMonthly, remiSetupFee } from './remi';
import { mannyAiTiers, mannyAiStartingPrice, aiTeamSetupFee } from './aiTeam';
import { aiWebsiteSetupFee, aiWebsiteMonthly } from './aiWebsite';
import { TIERS as APP_TIERS } from './apps';
import { PACKAGES as SEO_PACKAGES, ONDEMAND as SEO_ONDEMAND } from './localSeo';

export interface ServiceType {
  value: string;
  label: string;
}

const mannyAiTopPrice = Math.max(...mannyAiTiers.map((t) => t.price));
const fmt = (n: number) => n.toLocaleString('en-US');
const plan = (slug: string) => plans.find((p) => p.slug === slug)!;
// "Setup + monthly" — the setup fee is waived on a prepaid year, which the
// quote itself spells out.
const setupPlusMonthly = (slug: string) => {
  const p = plan(slug);
  return `$${fmt(p.setupFee!)} + $${fmt(p.price)}/mo`;
};
const appTier = (service: string) => APP_TIERS.find((t) => t.service === service)!;
const seoPackage = (service: string) => SEO_PACKAGES.find((p) => p.service === service)!;
const seoOneTime = (service: string) => SEO_ONDEMAND.find((o) => o.service === service)!;
const seoOneTimeLabel = (service: string) => {
  const o = seoOneTime(service);
  return o.exact ? `$${fmt(o.min)} one-time` : `from $${fmt(o.min)}`;
};

const businessAds = plan('business-ads');
const agency = plan('multimedia-agency');

export const SERVICE_TYPES: ServiceType[] = [
  { value: 'ai-website', label: `One-Page Website — Remi AI Lite with the page included ($${fmt(aiWebsiteSetupFee)} + $${fmt(aiWebsiteMonthly)}/mo)` },
  { value: 'website-basic', label: `Get Found (${setupPlusMonthly('get-found')})` },
  { value: 'website-plus', label: `Get Booked (${setupPlusMonthly('get-booked')})` },
  { value: 'website-smart', label: `Get Growing (${setupPlusMonthly('get-growing')})` },
  { value: 'get-ahead', label: `Get Ahead (${setupPlusMonthly('get-ahead')})` },
  { value: 'ecommerce', label: `Online Store (from ${setupPlusMonthly('sell-online')})` },
  { value: 'business-ads', label: `Business Ads (from $${fmt(businessAds.price)}/mo)` },
  { value: 'multimedia-agency', label: `Multimedia Agency (from $${fmt(agency.price)}${agency.priceUnit || '/mo'})` },
  // Remi AI's own ladder (src/data/remi.ts): Lite → Pro, all + one setup fee
  // (waived on a prepaid year). Custom builds are quoted.
  { value: 'remi-ai', label: `Remi AI ($${fmt(remiLiteMonthly)}–$${fmt(remiProMonthly)}/mo + $${fmt(remiSetupFee)} setup)` },
  // Manny AI is priced per workflow (aiTeam.ts mannyAiTiers), never per agent;
  // Remi AI has its own line above.
  { value: 'ai-team', label: `AI Agents Team, Manny AI per workflow ($${fmt(mannyAiStartingPrice)}–$${fmt(mannyAiTopPrice)}/mo + $${fmt(aiTeamSetupFee)} setup)` },
  // Business Apps tiers — the cards on /apps/ (src/data/apps.ts).
  { value: 'custom-app', label: `Business App: custom build (from $${fmt(appTier('custom-app').price)})` },
  { value: 'app-scripts', label: `Scripts & Tools (from $${fmt(appTier('app-scripts').price)})` },
  { value: 'app-integration', label: `Connected Apps: integrations & MCP (from $${fmt(appTier('app-integration').price)})` },
  // The free 360° photo lead magnet (paid photography lives in the SEO
  // packages and the Virtual Tour Shoot below).
  { value: '360-photo', label: 'Free 360° Photo' },
  // Local SEO packages — the cards on /local-seo/ (src/data/localSeo.ts).
  { value: 'seo-on-the-map', label: `On the Map: Local SEO + 360° media ($${fmt(seoPackage('seo-on-the-map').price)}/mo)` },
  { value: 'seo-own-the-map', label: `Own the Map: Local SEO + virtual tour ($${fmt(seoPackage('seo-own-the-map').price)}/mo)` },
  { value: 'seo-own-the-market', label: `Own the Market: full SEO program ($${fmt(seoPackage('seo-own-the-market').price)}/mo)` },
  // One-time SEO services — the on-demand strip on /local-seo/.
  { value: 'seo-audit', label: `Deep SEO & AI-Readiness Audit (${seoOneTimeLabel('seo-audit')})` },
  { value: 'seo-migration', label: `Site Migration SEO (${seoOneTimeLabel('seo-migration')})` },
  { value: 'virtual-tour', label: `Virtual Tour Shoot (${seoOneTimeLabel('virtual-tour')})` },
  { value: 'gbp-rescue', label: `Google Profile Rescue (${seoOneTimeLabel('gbp-rescue')})` },
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

// Short display name for tight admin UI (dropdowns, type pills): the label
// with its price tail and subtitle stripped — "Get Booked", "Remi AI",
// "On the Map". Derived, so a label rewrite can't strand the admin pages.
export function shortServiceLabel(value: string): string {
  const label = SERVICE_LABELS[value];
  if (!label) return value;
  return label.split(' (')[0].split(' — ')[0].split(':')[0].split(',')[0].trim();
}

// [{value, label: short}] for admin selects; same order as SERVICE_TYPES.
export const SERVICE_TYPES_SHORT: ServiceType[] = SERVICE_TYPES.map((s) => ({
  value: s.value,
  label: shortServiceLabel(s.value),
}));
