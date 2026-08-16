// Remi AI — the chat agent's OWN product line (Manny, Aug 2026 restructure).
//
// One Remi AI, sold as its own subscription, separate from the AI Agents Team
// and from the website plans. This file is the single source of truth for the
// ladder; every surface that prices Remi reads from here:
//   • /ai-booking-agent   — the Remi plans page (the ladder + admin matrix)
//   • /ai-website         — the One-Page Website derives its price from Lite
//                           (src/data/aiWebsite.ts imports these constants)
//   • /ai-team            — the roster card's "from" price for desi/Remi AI
//
// THE MODEL (kills the "two Remi products" confusion for good): there is ONE
// Remi Lite. Buying it standalone and buying the One-Page Website are the same
// subscription — $195 setup + $40/mo either way. The only difference is where
// Remi lives: embedded on the site you already have, or on a one-page site we
// build and include when you don't have one. The page is included, never the
// product.
//
// THE LADDER (tiers differ by which ADMIN PANELS they unlock, not by managed
// service — Manny configures at setup and trains the client, then the admin is
// theirs):
//   Lite $40  — answers & captures leads. Brand Brain + leads inbox + embed.
//   Remi $75  — + full customization (personality, widget styling, suggested
//               questions, test & correct).
//   Pro  $145 — + booking (books into the admin calendar, synced to the
//               client's own calendar) + opening lines, quick buttons, scoped
//               menus, domain allowlist.
//   Custom    — from $2,500 quoted (phone IVR, deep integrations); its running
//               monthly is quoted with the build.
// Setup is one-time and waived on a prepaid year (2 months free), matching the
// sitewide setup-fee canon. On the website plans nothing changes: booking
// still arrives at Get Booked, selling at Get Growing.

export const remiSetupFee = 195;

export const remiLiteMonthly = 40;
export const remiMidMonthly = 75;
export const remiProMonthly = 145;

export interface RemiTier {
  id: 'lite' | 'mid' | 'pro';
  name: string;
  price: number;
  audience: string;   // "For …" — ONE line (PricingCards layout invariant)
  scope: string;      // spec-box headline — ONE line
  tagline: string;
  features: string[];
  featured?: boolean;
}

export const remiTiers: RemiTier[] = [
  {
    id: 'lite',
    name: 'Remi AI Lite',
    price: remiLiteMonthly,
    audience: 'For answering & capturing leads',
    scope: 'Answers customers, captures every lead',
    tagline:
      'Remi AI trained on your business, answering on your website 24/7 and sending you every lead. We set it up and show you the admin; from there it runs itself.',
    features: [
      'Remi AI answers 24/7 from your Brand Brain',
      'English, Spanish & more, matching the customer',
      'Every lead captured and emailed as it happens',
      'Brand Brain & leads inbox in your own admin',
      'One embed snippet, works on any website',
      'No website? A one-page site is included',
    ],
  },
  {
    id: 'mid',
    name: 'Remi AI',
    price: remiMidMonthly,
    audience: 'For making the agent yours',
    scope: 'Everything in Lite, made yours',
    tagline:
      'The same agent with the full customization admin unlocked, so Remi AI speaks, looks, and behaves exactly the way your business does.',
    featured: true,
    features: [
      'Persona, tone, topics & refusal rules',
      'Name it, restyle it, pick its face & greeting',
      'Suggested questions you choose',
      'Test conversations & correct its answers',
      'Languages tuned to your customers',
      'Everything in Lite included',
    ],
  },
  {
    id: 'pro',
    name: 'Remi AI Pro',
    price: remiProMonthly,
    audience: 'For booking jobs while you work',
    scope: 'Everything in Remi AI, plus booking',
    tagline:
      'Remi AI stops handing you the lead and starts closing the loop, booking the appointment into your calendar while you work.',
    features: [
      'Books into your admin calendar, synced to yours',
      'Opening lines tuned per page',
      'Quick buttons & scoped menus',
      'Domain allowlist for the embed',
      'Everything in Remi AI included',
    ],
  },
];

// The fourth door — a build, not a subscription, so it sits outside the grid.
export const remiCustom = {
  name: 'Remi AI Custom',
  priceLabel: 'From $2,500',
  priceNote: 'scoped and quoted up front · its running monthly is quoted with the build',
  points: [
    'Answers your phone line (IVR), routing every call',
    'Deep integrations with the tools you already run',
    'Custom flows built around your business',
    'Runs on a quoted monthly once it ships, as service software on our side',
  ],
};

// The admin-access matrix — which panels each tier unlocks. This IS the
// product difference between tiers (Manny: "they can do it via the admin; the
// only time I touch it is to configure it for them and while I give them
// training"). Rendered as the comparison table on /ai-booking-agent.
export interface RemiMatrixRow {
  label: string;
  // [Lite, Remi, Pro]
  tiers: [boolean, boolean, boolean];
}

export const remiMatrix: RemiMatrixRow[] = [
  { label: 'Brand Brain — scans your site, learns your business, and you approve every fact it keeps', tiers: [true, true, true] },
  { label: 'Leads inbox — every captured lead in the admin, also emailed to you', tiers: [true, true, true] },
  { label: 'Embed on any website — one snippet, any platform', tiers: [true, true, true] },
  { label: 'Personality & behavior — persona, tone, topics to avoid, refusal rules, languages', tiers: [false, true, true] },
  { label: 'Make it yours — name, colors, greeting, avatar & placement', tiers: [false, true, true] },
  { label: 'Suggested questions — the prompts visitors see first', tiers: [false, true, true] },
  { label: 'Test & correct — try conversations and fix answers before customers see them', tiers: [false, true, true] },
  { label: 'Booking — into your admin calendar, synced to the calendar you already use', tiers: [false, false, true] },
  { label: 'Opening lines — a different greeting per page', tiers: [false, false, true] },
  { label: 'Quick buttons & scoped menus — guided flows for pricing, booking, FAQs', tiers: [false, false, true] },
  { label: 'Domain allowlist — control exactly where the embed runs', tiers: [false, false, true] },
];
