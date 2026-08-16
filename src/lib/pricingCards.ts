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
//   /local-seo                   localSeoCards()
//   /apps                        appTierCards()
//   /plans/business-ads          serviceTierCards('business-ads')
//   /plans/multimedia-agency     serviceTierCards('multimedia-agency')
import type { PricingCard } from '../components/pricing/PricingCards.astro';
import { plans, websitePlans, ecommercePlans } from '../data/plans';
import { remiTiers, remiSetupFee } from '../data/remi';
import { PACKAGES } from '../data/localSeo';
import { TIERS, APPS_HOURLY } from '../data/apps';

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

// NOTE: no AI Agents Team builder on purpose — Remi AI is the team's only public
// price (Manny: "no per-agent price tags"; the rest is scoped on the diagnostic).
