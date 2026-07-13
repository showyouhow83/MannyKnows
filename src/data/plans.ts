// Single source of truth for the monthly plans (homepage cards + /plans).
// Prices are "Starting at" — they climb as scope is tailored to each client.
// Plans are standalone (not incremental). Multilingual sites are standard.

export interface Plan {
  slug: string;
  name: string;
  icon: string;
  price: number;        // monthly $, shown as "Starting at $X/mo"; annual = ×10 (2 months free)
  tagline: string;      // one-line promise on the card
  highlights: string[]; // 4–6 punchy bullets for the card
  featured?: boolean;   // "most popular"
}

export const plans: Plan[] = [
  {
    slug: 'website',
    name: 'Smart Website (AI)',
    icon: '🌐',
    price: 200,
    tagline: 'A multilingual site with an AI agent that books jobs 24/7 — no big upfront bill.',
    highlights: [
      'Multilingual website, designed & built',
      'AI agent answers customers & books appointments 24/7',
      'Google Business Profile — setup & verification',
      'Technical SEO + speed tuning (near-100 Lighthouse)',
      'Monthly fixes, monitoring & a plain-English report',
    ],
  },
  {
    slug: 'store',
    name: 'Online Store (AI)',
    icon: '🛒',
    price: 350,
    tagline: 'A full online store that actually sells — designed, themed, and optimized.',
    highlights: [
      'Multilingual storefront with an AI shopping assistant',
      'A full online store (Shopify) with a custom theme, set up for you',
      'eCommerce SEO + product enhancement (images, copy, sizing)',
      'Email automations — welcome, abandoned cart, receipts',
      'Promo codes, discounts, payments & checkout',
    ],
    featured: true,
  },
  {
    slug: 'marketing',
    name: 'Business Ads',
    icon: '📣',
    price: 800,
    tagline: 'The social, ads, and SEO that get you seen — and traffic built to convert.',
    highlights: [
      'Social media growth — content, posting, branding',
      'Google Ads & social ads, managed (you fund the ad spend)',
      'Promotional banners, videos & interactive widgets that turn the traffic we drive into engagement',
      'SEO content campaigns + landing pages',
      'We watch how your traffic responds and keep correcting & improving',
    ],
  },
  {
    slug: 'everything',
    name: 'Multimedia Agency',
    icon: '🧩',
    price: 2000,
    tagline: 'Everything, handled — we design, build, promote, and optimize whatever your business needs.',
    highlights: [
      'We build your site — or optimize the one you already have',
      "Add a full online store whenever you're ready, done for you",
      'Advertising, promotion & ongoing optimization, all handled',
      'Custom software, AI automation & data pipelines',
      'Design, video & content produced for you — your full media & tech team',
    ],
  },
];
