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
  {
    slug: 'law-firms',
    name: 'Law Firms',
    metaTitle: 'Websites for Law Firms & Attorneys in Western Mass | MannyKnows',
    metaDescription:
      'Authoritative, fast websites for law firms and solo attorneys across Western Massachusetts — practice-area SEO, an AI intake agent that qualifies and books consultations 24/7, and multilingual by default. From $350/mo.',
    badge: 'For law firms & attorneys',
    h1: 'Websites for law firms that win the intake',
    heroIntro:
      "A potential client judges your firm in seconds and calls two others. An authoritative site that ranks for your practice areas — with an AI intake agent that qualifies and books consultations day or night — makes sure the one they retain is you.",
    illustration: 'audit',
    painPoints: [
      {
        title: 'Credibility is decided in seconds',
        body: "Someone facing a legal problem is anxious and comparing firms fast. A dated or slow site reads as a dated practice — and they call the firm whose site looks like it can handle their case.",
      },
      {
        title: 'The first firm to answer usually wins',
        body: "Legal clients call down the list until someone picks up. Miss the call — evenings, weekends, mid-hearing — and the retainer goes to whoever answered. An AI intake agent answers every time.",
      },
      {
        title: 'You’re bidding against everyone for the same ad clicks',
        body: "Legal keywords are some of the most expensive on Google. Ranking organically for your practice areas in your county brings clients you don’t pay per click to reach.",
      },
    ],
    offer: [
      {
        title: 'An authoritative, fast site',
        body: 'Clean, credible, and quick — your practice areas, your results, your bar credentials and reviews, structured so both clients and Google take you seriously.',
      },
      {
        title: 'Practice-area & local SEO',
        body: 'Built to rank for the areas you practice, in the towns you serve — the organic results, not just the paid ones.',
      },
      {
        title: 'An AI intake agent, 24/7',
        body: 'Answers common questions, screens the matter, and books the consultation around the clock — in English or Spanish — then hands you a qualified lead, not a voicemail.',
      },
      {
        title: 'Privacy-conscious contact',
        body: 'Intake forms and contact flows set up thoughtfully, so a first message reaches you cleanly without being scattered across the web.',
      },
    ],
    // No published law-firm case study yet — no borrowed proof.
    faqs: [
      {
        q: 'How much does a law firm website cost?',
        a: 'Our Smart Website (AI) plan starts at $350/mo with no big upfront bill — the site, the AI intake agent, practice-area and local SEO, Google Business Profile, and ongoing upkeep included. One-time builds are available too, billed at a flat $75/hr and quoted up front.',
      },
      {
        q: 'Can the AI agent handle client intake?',
        a: 'It handles the first step: answering common questions, screening the matter against the criteria you set, and booking a consultation — then handing you the details. It’s not legal advice and never pretends to be; it gets the right prospects onto your calendar.',
      },
      {
        q: 'Will it work for Spanish-speaking clients?',
        a: 'Yes — multilingual is standard. The site and the intake agent both work in Spanish and English, which matters for much of Western Massachusetts.',
      },
      {
        q: 'Can you rank us for our practice areas?',
        a: 'We build the technical SEO and content structure to compete for your practice areas in your county. Rankings build over time; we report honestly on progress against Google’s own data — no invented numbers.',
      },
    ],
  },
  {
    slug: 'clinics',
    name: 'Clinics',
    metaTitle: 'Websites for Clinics, Dentists & Medical Practices in Western Mass | MannyKnows',
    metaDescription:
      'Clean, trustworthy websites for clinics, dental and medical practices across Western Massachusetts — “near me” local SEO, an AI agent that answers and books appointments 24/7, and multilingual by default. From $350/mo.',
    badge: 'For clinics & practices',
    h1: 'Websites for clinics that keep the schedule full',
    heroIntro:
      "Patients search, compare, and expect to book without a phone call. A clean, trustworthy site that ranks for “near me,” with an AI agent that answers questions and books appointments any hour, keeps your chairs full and your front desk free.",
    illustration: 'agent',
    painPoints: [
      {
        title: 'Patients want to book without calling',
        body: "More and more patients choose the practice they can research and book online at 9 p.m. If your site can’t answer and schedule, they pick the one down the street that can.",
      },
      {
        title: 'Your front desk is buried in the phone',
        body: "Hours, insurance, new-patient questions, rescheduling — the same calls all day, pulling staff away from patients in the room. An AI agent handles the repeat questions and books appointments so your team can breathe.",
      },
      {
        title: 'Many patients are more comfortable in Spanish',
        body: "In Western Mass, language is often the deciding factor in where a family seeks care. A site and an agent that speak Spanish natively earn the trust a translated page never will.",
      },
    ],
    offer: [
      {
        title: 'A clean, trustworthy site',
        body: 'Calm, fast, and reassuring — your services, your providers, your hours and locations, and real reviews, laid out the way a patient actually reads them.',
      },
      {
        title: '“Near me” local SEO',
        body: 'Technical SEO and a verified Google Business Profile so patients searching “dentist near me” or “clinic in [your town]” find you at the top of the map.',
      },
      {
        title: 'An AI agent that books appointments 24/7',
        body: 'Answers the common questions and books appointments around the clock, in English or Spanish, turning a late-night search into a filled slot.',
      },
      {
        title: 'Privacy-conscious by design',
        body: 'Contact and booking flows set up to avoid collecting sensitive details in the wrong place — thoughtful defaults, not an afterthought.',
      },
    ],
    // No published clinic case study yet — no borrowed proof.
    faqs: [
      {
        q: 'How much does a clinic or practice website cost?',
        a: 'Our Smart Website (AI) plan starts at $350/mo with no big upfront bill — the site, the AI scheduling agent, “near me” local SEO, Google Business Profile, and upkeep included. One-time builds are available too, billed at a flat $75/hr and quoted up front.',
      },
      {
        q: 'Can patients book appointments through the site?',
        a: 'Yes — the AI agent answers common questions and books appointments 24/7, then hands the details to your front desk. We scope it to how your practice schedules so it fits your workflow, not the other way around.',
      },
      {
        q: 'Is this HIPAA-safe?',
        a: 'We build privacy-conscious contact and booking flows and avoid collecting sensitive medical detail where it doesn’t belong. For anything that touches protected health information, we scope the tools and agreements with you up front so the setup fits your obligations — we’ll never hand-wave a compliance question.',
      },
      {
        q: 'Will it work in Spanish?',
        a: 'Yes, multilingual is standard. The site and the agent both work in Spanish and English, written for Spanish-speaking patients rather than run through a translator.',
      },
    ],
  },
];

export function getProfession(slug: string): Profession | undefined {
  return professions.find((p) => p.slug === slug);
}
