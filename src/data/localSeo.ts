// Local SEO packages — the single source of truth for /local-seo and /pricing
// (moved out of local-seo.astro, Aug 2026, so a reprice touches one file and
// the pricing menu can't drift from the page). Month-to-month only: no yearly
// rate has ever been published for these, and inventing one would be an offer
// change. Plan clients add On the Map for the field-layer price below.

export interface LocalSeoPackage {
  name: string;
  audience: string;
  scope: string;
  scopeLines: string[];
  price: number;
  note: string;
  service: string;
  featured?: boolean;
  builtOn?: string;
  description: string;
  features: string[];
}

export interface LocalSeoOneTime {
  name: string;
  min: number;
  exact?: boolean;
  service: string;
  body: string;
}

export const PACKAGES: LocalSeoPackage[] = [
  {
    name: 'On the Map',
    audience: 'For getting on the map',
    scope: 'Your Google profile, run monthly',
    scopeLines: ['Monthly 360° + standard photos', 'Reviews collected and answered'],
    price: 245,
    note: 'month-to-month · cancel anytime',
    service: 'seo-on-the-map',
    description: 'Everything a local profile needs to rank and stay ranked, done for you every month. It starts with a real shoot at your business.',
    features: [
      'Fresh photos published every month — a mix of 360° and standard shots, so your profile never goes stale',
      'Reviews collected and answered every month: a review link & QR for your counter, asks on a schedule, every review replied to',
      'Monthly Google posts, plus on-page SEO fixes on your existing website',
      'Citations built and cleaned — your name, address & phone consistent across the directories Google checks',
      'A monthly report on what moved and what changes next',
      'Month one sets you up: your Google Business Profile claimed, verified, and configured right — category, services, hours, info',
      'Plus the launch shoot: five 360° photos published as a mini "see inside" tour on your listing',
    ],
  },
  {
    name: 'Own the Map',
    audience: 'For owning your neighborhood',
    scope: 'Profile, content and AI search',
    scopeLines: ['Monthly content in your voice', 'Full virtual tour, month one'],
    price: 495,
    note: 'month-to-month · cancel anytime',
    service: 'seo-own-the-map',
    featured: true,
    builtOn: 'Everything in On the Map, plus',
    description: 'The full presence — a virtual tour customers can walk through, content that compounds, and a site structured for AI answers.',
    features: [
      'Monthly content written in your voice, for the searches your customers actually make',
      "AI search optimization, kept current so ChatGPT and Google's AI can read, quote, and recommend you",
      'Keyword & competitor research, refreshed quarterly — what customers search, what rivals rank for, and what we do about it',
      'Map-pack rank tracking across the neighborhoods you serve, reported monthly',
      'Campaign landing pages on demand, whenever a promotion calls for one',
      'Month one builds your full virtual tour from 360° images and video, embedded on your site and your profile',
    ],
  },
  {
    name: 'Own the Market',
    audience: 'For competing beyond the block',
    scope: 'A full SEO department',
    scopeLines: ['Quarterly roadmap + strategy call', 'LLM visibility tracked monthly'],
    price: 995,
    note: 'month-to-month · cancel anytime',
    service: 'seo-own-the-market',
    builtOn: 'Everything in Own the Map, plus',
    description: 'A full SEO department for businesses competing beyond the neighborhood, or with a catalog to rank.',
    features: [
      'An SEO roadmap — a sequenced quarterly plan tied to traffic and revenue targets, reviewed together on a monthly strategy call',
      'The full technical program — Core Web Vitals, schema at scale, crawl & index control, and migrations covered when you redesign',
      'Pillar & cluster content that owns a topic per quarter — a hub page plus supporting articles, interlinked and reviewed before anything ships',
      'Authority building without shortcuts — local links, unlinked mentions reclaimed, toxic links audited and disavowed',
      'LLM visibility tracking — how often ChatGPT, Perplexity, and Google AI actually recommend you, measured monthly',
      'eCommerce SEO where there is a catalog — collection pages, product schema, and content that ranks',
      'A live dashboard of rankings, traffic, calls, and conversions, plus your 360° tour kept current as the business changes',
    ],
  },
];

// One-time services — quoted flat from the same public $75/hr the apps pillar
// uses. The audit price is exact; the rest are floors ("from"), quoted up front.
export const ONDEMAND: LocalSeoOneTime[] = [
  { name: 'Deep SEO & AI-Readiness Audit', min: 375, exact: true, service: 'seo-audit', body: 'Technical, content, local, and AI search in one prioritized fix list. Start any package within 30 days and the full price is credited toward month one.' },
  { name: 'Site Migration SEO', min: 750, service: 'seo-migration', body: 'Keep your rankings through a redesign, replatform, or domain change, with every old URL mapped to its new home.' },
  { name: 'Virtual Tour Shoot', min: 495, service: 'virtual-tour', body: 'A full 360° walkthrough of your business, shot on site and published to your website and your Google listing.' },
  { name: 'Google Profile Rescue', min: 245, service: 'gbp-rescue', body: 'Suspended, duplicate, or hijacked listings recovered, verified, and set back up right.' },
];

// What plan clients pay to add On the Map (the field layer only — their plan
// already covers the digital half). Quoted in the /local-seo FAQ + /pricing.
export const PLAN_CLIENT_ON_THE_MAP = 145;

// "From" anchor for the menu / search index.
export const localSeoStartingPrice = Math.min(...PACKAGES.map((p) => p.price));
