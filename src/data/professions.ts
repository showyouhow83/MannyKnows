// Profession / vertical landing pages. One record per trade, rendered by
// src/components/sections/ProfessionPage.astro via thin wrappers at
// src/pages/websites-for-<slug>.astro.
//
// These target real search intent ("website for contractors", "daycare
// website") for the verticals we actually serve. Per the local-SEO research,
// each page must be genuinely differentiated — real pain points, a real proof
// case study where we have one — never a template with the trade name swapped.
//
// HONESTY: `proofBusiness` must match a published testimonial in
// testimonials.ts. Leave it undefined for verticals we can't yet prove, rather
// than borrowing someone else's result.

type Illustration = 'website' | 'seo' | 'agent' | 'audit' | 'automation' | 'store' | 'ads' | 'multimedia';

export interface Profession {
  slug: string;            // /websites-for-<slug>
  name: string;            // "Contractors"
  metaTitle: string;
  metaDescription: string;
  badge: string;           // eyebrow pill
  h1: string;              // gradient headline
  heroIntro: string;
  illustration: Illustration;
  // The problems this trade actually feels — specific, not generic.
  painPoints: { title: string; body: string }[];
  // What we do about them.
  offer: { title: string; body: string }[];
  // Proof (optional — only if real).
  proofBusiness?: string;  // testimonials.ts business name
  proofHeading?: string;
  faqs: { q: string; a: string }[];
}

export const professions: Profession[] = [
  {
    slug: 'contractors',
    name: 'Contractors',
    metaTitle: 'Websites for Contractors in Western Mass | MannyKnows',
    metaDescription:
      'Websites that rank #1 on Google and book jobs for painters, remodelers, roofers, and home-service contractors across Western Massachusetts — with an AI agent that answers and books estimates 24/7. From $350/mo.',
    badge: 'For contractors & home services',
    h1: 'Websites for contractors that actually book jobs',
    heroIntro:
      "Stop renting leads from Angi and Thumbtack. A fast, findable site that ranks in your town, shows off your work, and lets an AI agent answer questions and book estimates around the clock — so the jobs come to you.",
    illustration: 'website',
    painPoints: [
      {
        title: 'You’re paying for leads you should own',
        body: "Angi and Thumbtack rent you the same lead they sold three competitors. A site that ranks for your trade in your town brings you leads nobody else is bidding on — and you stop paying per click for them.",
      },
      {
        title: 'Homeowners check you out before they call',
        body: "They Google your name, look for photos of real work, read reviews, and judge in ten seconds. A dead or clunky site quietly sends them to the contractor whose site looks the part.",
      },
      {
        title: 'Missed calls are missed jobs',
        body: "You’re on a ladder, not by the phone. An AI agent answers instantly — day, night, weekend — qualifies the job, and books the estimate before the homeowner calls the next name on the list.",
      },
    ],
    offer: [
      {
        title: 'Rank in your town, organically',
        body: 'We build the site and the technical SEO so you show up for “<your trade> near me” — the free, top-of-page result, not an ad you keep paying for.',
      },
      {
        title: 'Show the work',
        body: 'Fast photo and 360° galleries of your projects, before-and-afters, and reviews — structured so Google understands them and homeowners trust them.',
      },
      {
        title: 'An AI agent that books estimates 24/7',
        body: 'Answers common questions, qualifies the lead, and books the appointment right there — in English or Spanish — then hands you the details.',
      },
      {
        title: 'Google Business Profile, done right',
        body: 'Set up, verified, and optimized so you own the map pack for your service area — where ready-to-hire homeowners actually look.',
      },
    ],
    proofBusiness: 'SL Painting',
    proofHeading: 'A contractor we put at #1',
    faqs: [
      {
        q: 'How much does a contractor website cost?',
        a: 'Our Smart Website (AI) plan starts at $350/mo with no big upfront bill — the site, the AI booking agent, Google Business Profile, technical SEO, and ongoing upkeep included. Prefer a one-time build? We do that too, billed at a flat $75/hr and quoted up front.',
      },
      {
        q: 'How long until I rank on Google?',
        a: 'The technical foundation goes in at launch; local ranking builds over weeks to a few months depending on your town and competition. We built SL Painting a site that today ranks #1 organically for “Exterior Painting” in Springfield — real, not promised.',
      },
      {
        q: 'Do I have to stop using Angi or Thumbtack?',
        a: 'No — keep them while your own site ramps up. Most contractors lean on them less over time as their site brings in leads they don’t have to pay per click for.',
      },
      {
        q: 'Can the AI agent really book estimates?',
        a: 'Yes. It’s trained on your services, service area, and how you work — it answers questions, qualifies the job, and books the appointment, then sends you the details. You review how it responds before it ever talks to a customer.',
      },
    ],
  },
  {
    slug: 'daycares',
    name: 'Daycares',
    metaTitle: 'Websites for Daycares & Childcare in Western Mass | MannyKnows',
    metaDescription:
      'Warm, trustworthy websites for daycares and childcare centers across Western Massachusetts — parent communication, enrollment questions answered 24/7 by an AI agent, and multilingual by default. From $350/mo.',
    badge: 'For daycares & childcare',
    h1: 'Websites for daycares that fill your waitlist',
    heroIntro:
      "Parents choose with their hearts and their research. A warm, fast, trustworthy site — with an admin to manage your children and families, and an AI agent that answers enrollment questions any hour — turns quiet website visits into booked tours.",
    illustration: 'agent',
    painPoints: [
      {
        title: 'Parents research long before they call',
        body: "A parent decides how they feel about your center from your website — photos, safety, hours, warmth — often at 10 p.m. after the kids are asleep. If the site doesn’t reassure them, they never call.",
      },
      {
        title: 'You’re answering the same questions all day',
        body: "Ages, hours, rates, openings, what to bring — the same handful of questions, over and over, pulling you away from the children. An AI agent answers them instantly so you don’t have to.",
      },
      {
        title: 'Families speak more than one language',
        body: "In Western Mass, many parents are more comfortable in Spanish. A site and an agent that speak their language — not a bolted-on translation — is the difference between a tour booked and a tab closed.",
      },
    ],
    offer: [
      {
        title: 'A site parents trust in seconds',
        body: 'Bright, fast, and reassuring — your program, your staff, your space, your safety, and real reviews, laid out the way a searching parent reads them.',
      },
      {
        title: 'Manage children & families',
        body: 'An admin to keep your enrollment, your children, and parent communication in one place — easy enough to actually use, fast enough to not get in the way.',
      },
      {
        title: 'Enrollment questions answered 24/7',
        body: 'An AI agent handles the repeat questions and books tours around the clock, in English or Spanish, so a late-night search becomes a booked visit.',
      },
      {
        title: 'Found on Google & the map',
        body: 'Technical SEO and a verified Google Business Profile so local parents searching “daycare near me” find you first.',
      },
    ],
    proofBusiness: 'JK Daycare',
    proofHeading: 'A daycare already growing',
    faqs: [
      {
        q: 'How much does a daycare website cost?',
        a: 'Our Smart Website (AI) plan starts at $350/mo with no big upfront bill — the site, the admin, the AI agent, Google Business Profile, technical SEO, and upkeep included. One-time builds are available too, billed at a flat $75/hr and quoted up front.',
      },
      {
        q: 'Can you help us manage enrollment and parents?',
        a: 'Yes — we build an admin to manage your children and communicate with their parents, and it’s designed to be genuinely easy to use. JK Daycare runs on exactly this and told us it’s “so easy to use — and fast.”',
      },
      {
        q: 'Will the site work in Spanish?',
        a: 'Yes, multilingual is standard, not an add-on. The site and the AI agent both work in Spanish and English, written for Spanish-speaking families rather than run through a translator.',
      },
      {
        q: 'We’re brand new online — is that a problem?',
        a: 'Not at all — that’s the best time to start. JK Daycare had only been live a week when they started seeing their traffic grow day by day. We build the foundation right so it compounds from here.',
      },
    ],
  },
];

export function getProfession(slug: string): Profession | undefined {
  return professions.find((p) => p.slug === slug);
}
