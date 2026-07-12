// Single source of truth for the monthly plans. Used by the homepage cards
// (PricingPlans.astro) and the /plans comparison table (PlanComparison.astro).
// Prices are "Starting at" — they climb as scope is tailored to each client.
// Bilingual (English + Spanish) is standard on every plan.

export interface Plan {
  slug: string;
  name: string;
  icon: string;
  price: number;        // monthly $, shown as "Starting at $X/mo"; annual = ×10 (2 months free)
  tagline: string;      // one-line promise on the card
  inherits?: string;    // name of the plan below (for "Everything in X, plus:")
  highlights: string[]; // 4–6 punchy bullets for the card (full detail lives in the matrix)
  featured?: boolean;   // "most popular"
}

export const plans: Plan[] = [
  {
    slug: 'website',
    name: 'Website',
    icon: '🌐',
    price: 200,
    tagline: 'A bilingual site with an AI agent that books jobs 24/7 — no big upfront bill.',
    highlights: [
      'Bilingual website (English + Spanish), designed & built',
      'AI agent answers customers & books appointments 24/7',
      'Google Business Profile — setup & verification',
      'Technical SEO + speed tuning (near-100 Lighthouse)',
      'Monthly fixes, monitoring & a plain-English report',
    ],
  },
  {
    slug: 'store',
    name: 'Store',
    icon: '🛒',
    price: 350,
    tagline: 'Everything in Website, plus a full online store that actually sells.',
    inherits: 'Website',
    highlights: [
      'A full online store (Shopify) — set up for you',
      'eCommerce SEO + product enhancement (images, copy, sizing)',
      'Email automations — welcome, abandoned cart, receipts',
      'Promo codes, discounts, payments & checkout',
    ],
    featured: true,
  },
  {
    slug: 'marketing',
    name: 'Marketing',
    icon: '📣',
    price: 800,
    tagline: 'Everything in Store, plus the social, ads and SEO that get you seen.',
    inherits: 'Store',
    highlights: [
      'Social media growth — content, posting, branding',
      'Google Ads & social ads, managed (you fund the ad spend)',
      'SEO content campaigns + landing pages',
      'Conversion / A-B testing + a monthly strategy session',
    ],
  },
  {
    slug: 'everything',
    name: 'Everything',
    icon: '🧩',
    price: 2000,
    tagline: 'Everything, plus your own tech team — custom software, AI & automation.',
    inherits: 'Marketing',
    highlights: [
      'Custom software & internal tools, built to fit',
      'AI automation across your operations',
      'Data pipelines, dashboards & systems integrations',
      'Your part-time tech team, on call',
    ],
  },
];

// Low → high. Cumulative: a row listed "from" a plan is included in that plan
// and every plan to its right.
export const planOrder = ['website', 'store', 'marketing', 'everything'] as const;
export const planIndex = (slug: string) => planOrder.indexOf(slug as (typeof planOrder)[number]);
export const includes = (planSlug: string, fromSlug: string) =>
  planIndex(planSlug) >= planIndex(fromSlug);

export interface FeatureRow { label: string; from: string; footnote?: string }
export interface FeatureGroup { title: string; rows: FeatureRow[] }

export const featureGroups: FeatureGroup[] = [
  {
    title: 'Foundation',
    rows: [
      { label: 'Professional website — designed & built', from: 'website' },
      { label: 'Bilingual — English + Spanish site, SEO & AI agent', from: 'website' },
      { label: 'AI agent — answers questions & books appointments 24/7', from: 'website' },
      { label: 'Google Business Profile — setup & verification', from: 'website' },
      { label: 'Hosting, updates, fast & mobile (≈100 Lighthouse)', from: 'website' },
    ],
  },
  {
    title: 'Always optimized',
    rows: [
      { label: 'Technical SEO', from: 'website' },
      { label: 'Speed / Core Web Vitals tuning', from: 'website' },
      { label: 'AI agent tuning', from: 'website' },
      { label: 'Monthly fixes & small changes', from: 'website' },
      { label: 'Uptime & security monitoring', from: 'website' },
      { label: 'Analytics + plain-English monthly report', from: 'website' },
    ],
  },
  {
    title: 'Sell online',
    rows: [
      { label: 'Online store — Shopify theme setup', from: 'store' },
      { label: 'eCommerce SEO', from: 'store' },
      { label: 'Product enhancement — images, SEO copy, sizing tables', from: 'store' },
      { label: 'Email automations — welcome, abandoned cart, receipts', from: 'store' },
      { label: 'Promo codes & discounts', from: 'store' },
      { label: 'Payments & checkout setup', from: 'store' },
    ],
  },
  {
    title: 'Get seen',
    rows: [
      { label: 'Social media growth — content, posting & strategy', from: 'marketing' },
      { label: 'Social profiles set up & branded across networks', from: 'marketing' },
      { label: 'Google Business Profile — ongoing posts & management', from: 'marketing' },
      { label: 'Google Ads & social ads — campaign management', from: 'marketing', footnote: 'You fund the ad budget directly, so it never eats your plan.' },
      { label: 'SEO content campaigns', from: 'marketing' },
      { label: 'Conversion optimization / A-B testing', from: 'marketing' },
      { label: 'Landing pages & campaigns', from: 'marketing' },
      { label: 'Monthly strategy session', from: 'marketing' },
    ],
  },
  {
    title: 'Your tech team',
    rows: [
      { label: 'Custom software & internal tools built to fit', from: 'everything' },
      { label: 'AI automation across your operations', from: 'everything' },
      { label: 'Data pipelines, dashboards & reporting', from: 'everything' },
      { label: 'API & systems integrations', from: 'everything' },
      { label: 'Twilio phone & SMS systems (call routing, A2P)', from: 'everything' },
      { label: 'Quarterly tech roadmap & strategy', from: 'everything' },
      { label: 'Direct priority access + dedicated dev capacity', from: 'everything' },
    ],
  },
];
