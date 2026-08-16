// The one place that maps the pricing data files onto PricingCards rows
// (Aug 2026). /pricing renders every product's grid with the SAME cards the
// product page renders, so the two can never drift — a page and the menu
// import the same builder. If a card's copy or CTA needs to change, change it
// here and both surfaces follow.
//
//   product page                 builder
//   /plans (PricingPlans.astro)  websitePlanCards()
//   /ecommerce                   storeCards()
//   /ai-booking-agent            remiCards()
//   /ai-website                  remiCards()[0]  (the One-Page Website IS Remi AI Lite)
//   /local-seo                   localSeoCards() + seoOneTimeCards()
//   /ai-team                     mannyAiCards()   (Manny AI, priced per workflow)
//   /apps                        appTierCards()
//   /plans/business-ads          serviceTierCards('business-ads')
//   /plans/multimedia-agency     serviceTierCards('multimedia-agency')
import type { PricingCard } from '../components/pricing/PricingCards.astro';
import { plans, websitePlans, ecommercePlans } from '../data/plans';
import { remiTiers, remiSetupFee } from '../data/remi';
import { PACKAGES, ONDEMAND } from '../data/localSeo';
import { TIERS, APPS_HOURLY } from '../data/apps';
import { mannyAiTiers, aiTeamSetupFee } from '../data/aiTeam';

export const websitePlanCards = (): PricingCard[] =>
  websitePlans.map((p) => ({
    name: p.name,
    audience: p.audience,
    price: p.price,
    setupFee: p.setupFee,
    scope: p.scope,
    scopeLines: p.scopeLines,
    tagline: p.tagline,
    builtOn: p.builtOn,
    features: p.highlights,
    featured: p.featured,
    primary: { label: 'See everything included', href: `/plans/${p.slug}/` },
    secondary: { label: 'Get started', href: '#contact', context: `${p.name} plan` },
  }));

export const storeCards = (): PricingCard[] =>
  ecommercePlans[0].tiers!.map((t) => ({
    name: t.name,
    audience: t.audience,
    price: t.price,
    setupFee: t.setupFee,
    scope: t.scope,
    scopeLines: t.scopeLines,
    tagline: t.description,
    builtOn: t.builtOn,
    features: t.features,
    featured: t.featured,
    primary: { label: 'Get started', href: '#contact', context: `Online Store: ${t.name}` },
  }));

export const remiCards = (): PricingCard[] =>
  remiTiers.map((t) => ({
    name: t.name,
    audience: t.audience,
    price: t.price,
    setupFee: remiSetupFee,
    scope: t.scope,
    tagline: t.tagline,
    features: t.features,
    featured: t.featured,
    primary: { label: `Start with ${t.name}`, href: '#contact', context: `Remi AI plans: ${t.name}` },
  }));

export const localSeoCards = (): PricingCard[] =>
  PACKAGES.map((p) => ({
    name: p.name,
    audience: p.audience,
    price: p.price,
    priceUnit: '/mo',
    priceNote: 'Month-to-month, cancel anytime',
    scope: p.scope,
    scopeLines: p.scopeLines,
    tagline: p.description,
    builtOn: p.builtOn,
    features: p.features,
    featured: p.featured,
    primary: { label: `Start with ${p.name}`, href: '#quote', quoteContext: p.service },
  }));

// The one-time SEO services ("One-time, on demand" on /local-seo). Same shape
// as the app tiers: one price, quoted flat at the public hourly, no yearly.
export const seoOneTimeCards = (): PricingCard[] =>
  ONDEMAND.map((s) => ({
    name: s.name,
    audience: s.audience,
    price: s.min,
    priceUnit: 'one-time',
    priceNote: s.exact ? 'Flat price, quoted up front' : `Starting at, quoted flat at $${APPS_HOURLY}/hr`,
    scope: s.scope,
    scopeLines: s.scopeLines,
    tagline: s.body,
    features: s.features,
    primary: { label: 'Get a quote', href: '#quote', quoteContext: s.service },
  }));

// Manny AI on its own, priced per WORKFLOW (Manny, Aug 16 2026) — never per
// agent. Monthly billing with the setup fee, waived on a prepaid year, like
// every other subscription ladder.
export const mannyAiCards = (): PricingCard[] =>
  mannyAiTiers.map((t) => ({
    name: t.name,
    audience: t.audience,
    price: t.price,
    setupFee: aiTeamSetupFee,
    scope: t.scope,
    scopeLines: t.scopeLines,
    tagline: t.tagline,
    builtOn: t.builtOn,
    features: t.features,
    featured: t.featured,
    primary: { label: `Start with ${t.name}`, href: '#contact', context: `Manny AI: ${t.name}` },
  }));

export const appTierCards = (): PricingCard[] =>
  TIERS.map((t) => ({
    name: t.name,
    audience: t.audience,
    price: t.price,
    priceUnit: 'one-time',
    priceNote: `Starting at, quoted flat at $${APPS_HOURLY}/hr`,
    scope: t.scope,
    scopeLines: t.scopeLines,
    tagline: t.description,
    features: t.features,
    featured: t.featured,
    badge: t.kind,
    primary: { label: 'Get a quote', href: '#quote', quoteContext: t.service },
  }));

// Business Ads / Multimedia Agency: services that front no build and publish
// no yearly rate — one price, its own unit (billing='none').
export const serviceTierCards = (slug: string): PricingCard[] | null => {
  const plan = plans.find((p) => p.slug === slug);
  if (!plan?.tiers) return null;
  return plan.tiers.map((t) => ({
    name: t.name,
    audience: t.audience,
    price: t.price,
    priceUnit: t.unit,
    priceNote: t.note,
    scope: t.scope,
    scopeLines: t.scopeLines,
    tagline: t.description,
    builtOn: t.builtOn,
    features: t.features,
    featured: t.featured,
    primary: { label: `Start with ${t.name}`, href: '#contact', context: `${plan.name}: ${t.name}` },
  }));
};

// NOTE: no per-agent or bundle builder on purpose — the AI Agents Team is sold
// as Manny AI per workflow (mannyAiCards above); Remi AI has its own ladder.
