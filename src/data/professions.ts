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

import { plans } from './plans';

type Illustration = 'website' | 'seo' | 'agent' | 'audit' | 'automation' | 'store' | 'ads' | 'multimedia';

// Prices interpolate from plans.ts so a reprice can't leave a stale figure
// here (Aug 2026 — they used to be typed by hand). Cost FAQs are the only
// place a price may appear on these pages (house rule).
const getFound = plans.find((x) => x.slug === 'get-found')!;
const getBooked = plans.find((x) => x.slug === 'get-booked')!;
const FOUND_MO = `$${getFound.price}/mo`;
const FOUND_SETUP = `$${getFound.setupFee!.toLocaleString('en-US')}`;
const BOOKED_MO = `$${getBooked.price}/mo`;
const HOURLY = '$75/hr'; // flat one-time-build rate (apps.astro TIERS, plans.ts FAQs)

export interface Profession {
  slug: string;            // /websites-for-<slug>
  name: string;            // "Contractors"
  metaTitle: string;
  metaDescription: string;
  badge: string;           // eyebrow pill
  h1: string;              // gradient headline
  heroIntro: string;
  illustration: Illustration;
  // What a weak site costs this trade — "patients", "jobs", "families". Drives
  // the combined problems→fixes section heading.
  lossNoun: string;
  // "your <businessNoun> website" — practice / contractor / daycare.
  businessNoun: string;
  // One-line intro under that heading.
  fixIntro: string;
  // Hero panel ("What you get" at a glance): one-line intro + closing proof
  // line. Both must be facts already published elsewhere on the site.
  panelIntro: string;
  panelNote: string;
  // The problems this trade actually feels — specific, not generic.
  painPoints: { title: string; body: string }[];
  // What we do about them.
  offer: { title: string; body: string }[];
  // Proof (optional — only if real).
  proofBusiness?: string;  // testimonials.ts business name
  proofHeading?: string;
  faqs: { q: string; a: string; html?: boolean }[];
}

export const professions: Profession[] = [
  {
    slug: 'clinics',
    name: 'Clinics',
    // The niche MannyKnows leads with (Manny, Aug 2026): web design & marketing
    // for dental & medical practices — backed by the MedNet experience below.
    metaTitle: 'Web Design for Dental & Medical Practices, MA | MannyKnows',
    metaDescription:
      'Website design and marketing for dental & medical practices in Western Mass, built on hundreds of practice websites. Remi AI answers patients 24/7.',
    badge: 'For dental & medical practices',
    h1: 'Websites for dental & medical practices that keep the schedule full',
    heroIntro:
      "Patients search, compare, and expect to book without a phone call. A clean, trustworthy site that ranks for “near me,” with an AI agent that answers questions and books appointments any hour, keeps your chairs full and your front desk free. It's the work Manny knows deepest — he oversaw hundreds of practice websites at MedNet Technologies in New York before building for Western Mass.",
    illustration: 'agent',
    lossNoun: 'patients',
    businessNoun: 'practice',
    panelIntro: 'One practice website, built to answer patients, book them, and rank in your town.',
    panelNote: 'Built on experience overseeing hundreds of dental and medical practice websites at MedNet Technologies in New York.',
    fixIntro:
      'The same three leaks show up in practice after practice, and the same site fixes them. Here is what a patient runs into today, and what they find instead.',
    painPoints: [
      {
        title: 'Patients want to book without calling',
        body: "More and more patients choose the practice they can research and book online at 9 p.m. If your site can’t answer and schedule, they pick the one down the street that can.",
      },
      {
        title: 'Your front desk is buried in the phone',
        body: "Hours, insurance, new-patient questions, rescheduling: the same calls all day, pulling staff away from patients in the room. An AI agent handles the repeat questions and books appointments so your team can breathe.",
      },
      {
        title: 'Many patients are more comfortable in Spanish',
        body: "In Western Mass, language is often the deciding factor in where a family seeks care. A site and an agent that speak Spanish natively earn the trust a translated page never will.",
      },
    ],
    offer: [
      {
        title: 'A clean, trustworthy site',
        body: 'Calm, fast, and reassuring: your services, your providers, your hours and locations, and real reviews, laid out the way a patient actually reads them.',
      },
      {
        title: '“Near me” local SEO',
        body: 'Technical SEO and a verified Google Business Profile so patients find you at the top of the map, on Google and when they ask an AI like ChatGPT for a “dentist near me.”',
      },
      {
        title: 'An AI agent that books appointments 24/7',
        body: 'Answers the common questions and books appointments around the clock, in English or Spanish, turning a late-night search into a filled slot.',
      },
      {
        title: 'Privacy-conscious by design',
        body: 'Contact and booking flows set up to avoid collecting sensitive details in the wrong place: thoughtful defaults, not an afterthought.',
      },
    ],
    // No published clinic case study — the medical work predates MannyKnows and
    // belonged to an employer, so it's stated as experience, never shown as a
    // portfolio piece. Do not add screenshots or links for it.
    faqs: [
      {
        q: 'Have you built websites for medical practices before?',
        a: "Hundreds of them. Before MannyKnows, Manny worked at MedNet Technologies in New York, a medical web company, and oversaw hundreds of dental and medical practice websites there. Each site started with a phone call to the doctor. He would ask how new patients found the practice, which procedures they wanted more of, what the front desk was asked all day, and what made a patient trust one office over another. Then he designed the site, built it, launched it, shaped the copy with the SEO team, and kept it current for years. That is where the pattern on this page comes from. Patients decide in seconds whether an office looks trustworthy, insurance and hours questions eat the front desk, and a practice ranks for “near me” when its site is structured the way Google reads a practice rather than the way a template does. MedNet was later acquired and folded into another company, and those sites belong to that work, so we describe the experience rather than showing it. What you get is someone who has already solved a practice’s website hundreds of times and starts yours knowing what it needs.",
      },
      {
        q: 'How much does a clinic or practice website cost?',
        a: `Our website plans start at ${FOUND_MO} for a custom-designed 1–3 page site with hosting and SSL, Remi AI answering patients 24/7, “near me” local SEO, a Google Business Profile, and upkeep included. The build is a one-time ${FOUND_SETUP} setup fee, then ${FOUND_MO} with no term. Prepay the year and the setup fee is waived and two months are free. A full multi-page site with your own admin and Remi AI booking appointments is ${BOOKED_MO}. One-time builds are available too, billed at a flat ${HOURLY} and quoted up front.`,
      },
      {
        q: 'Can patients book appointments through the site?',
        a: 'Yes: the AI agent answers common questions and books appointments 24/7, then hands the details to your front desk. We scope it to how your practice schedules so it fits your workflow, not the other way around.',
      },
      {
        q: 'Is this HIPAA-safe?',
        a: 'We build privacy-conscious contact and booking flows and avoid collecting sensitive medical detail where it doesn’t belong. For anything that touches protected health information, we scope the tools and agreements with you up front so the setup fits your obligations: we’ll never hand-wave a compliance question.',
      },
      {
        q: 'Will it work in Spanish?',
        a: 'Yes, multilingual is standard. The site and the agent both work in Spanish and English, written for Spanish-speaking patients rather than run through a translator.',
      },
    ],
  },
  {
    slug: 'contractors',
    name: 'Contractors',
    metaTitle: 'Websites for Contractors in Western Mass | MannyKnows',
    metaDescription:
      `Websites that rank on Google and book jobs for Western Mass contractors: an AI agent answers homeowners 24/7, and books estimates on higher plans. From ${FOUND_MO}.`,
    badge: 'For contractors & home services',
    h1: 'Websites for contractors that actually book jobs',
    heroIntro:
      "Stop renting leads from Angi and Thumbtack. A fast, findable site that ranks in your town, shows off your work, and lets an AI agent answer questions and book estimates around the clock, so the jobs come to you.",
    illustration: 'website',
    lossNoun: 'jobs',
    businessNoun: 'contractor',
    panelIntro: 'One contractor website, built to rank in your town, show the work, and book the estimate.',
    panelNote: 'SL Painting runs on exactly this and ranks #1 organically for “Exterior Painting” in Springfield.',
    fixIntro:
      'The same three leaks show up in trade after trade, and the same site fixes them. Here is what a homeowner runs into today, and what they find instead.',
    painPoints: [
      {
        title: 'You’re paying for leads you should own',
        body: "Angi and Thumbtack rent you the same lead they sold three competitors. A site that ranks for your trade in your town brings you leads nobody else is bidding on, and you stop paying per click for them.",
      },
      {
        title: 'Homeowners check you out before they call',
        body: "They Google your name, look for photos of real work, read reviews, and judge in ten seconds. A dead or clunky site quietly sends them to the contractor whose site looks the part.",
      },
      {
        title: 'Missed calls are missed jobs',
        body: "You’re on a ladder, not by the phone. An AI agent answers instantly (day, night, weekend) qualifies the job, and books the estimate before the homeowner calls the next name on the list.",
      },
    ],
    offer: [
      {
        title: 'Rank in your town, organically',
        body: 'We build the site and the technical SEO so you show up for “<your trade> near me”, on Google and when homeowners ask an AI like ChatGPT or Google’s AI Overview. The free, top-of-page result, not an ad you keep paying for.',
      },
      {
        title: 'Show the work',
        body: 'Fast photo and 360° galleries of your projects, before-and-afters, and reviews: structured so Google understands them and homeowners trust them.',
      },
      {
        title: 'An AI agent that books estimates 24/7',
        body: 'Answers common questions, qualifies the lead, and books the appointment right there, in English or Spanish, then hands you the details.',
      },
      {
        title: 'Google Business Profile, done right',
        body: 'Set up, verified, and optimized so you own the map pack for your service area: where ready-to-hire homeowners actually look.',
      },
    ],
    proofBusiness: 'SL Painting',
    proofHeading: 'A contractor we put at #1',
    faqs: [
      {
        q: 'How much does a contractor website cost?',
        a: `Our website plans start at ${FOUND_MO} for a custom-designed 1–3 page site with hosting and SSL, Remi AI answering customers 24/7, a Google Business Profile, technical SEO, and ongoing upkeep included. The build is a one-time ${FOUND_SETUP} setup fee, then ${FOUND_MO} with no term. Prepay the year and the setup fee is waived and two months are free. A full multi-page site with Remi AI booking estimates for you is ${BOOKED_MO}, and every plan includes your own admin. Prefer a one-time build? We do that too, billed at a flat ${HOURLY} and quoted up front.`,
      },
      {
        q: 'How long until I rank on Google?',
        a: 'The technical foundation goes in at launch; local ranking builds over weeks to a few months depending on your town and competition. We built SL Painting a site that today ranks #1 organically for “Exterior Painting” in Springfield: real, not promised.',
      },
      {
        q: 'Do I have to stop using Angi or Thumbtack?',
        a: 'No: keep them while your own site ramps up. Most contractors lean on them less over time as their site brings in leads they don’t have to pay per click for.',
      },
      {
        q: 'Can the AI agent really book estimates?',
        a: 'Yes. It’s trained on your services, service area, and how you work. It answers questions, qualifies the job, and books the appointment, then sends you the details. You review how it responds before it ever talks to a customer.',
      },
    ],
  },
  {
    slug: 'daycares',
    name: 'Daycares',
    metaTitle: 'Websites for Daycares in Western Mass | MannyKnows',
    metaDescription:
      `Warm, fast websites for Western Mass daycares: parent and enrollment questions answered 24/7 by an AI agent, in English and Spanish. From ${FOUND_MO}.`,
    badge: 'For daycares & childcare',
    h1: 'Websites for daycares that fill your waitlist',
    heroIntro:
      "Parents choose with their hearts and their research. A warm, fast, trustworthy site (with an admin to manage your children and families, and an AI agent that answers enrollment questions any hour) turns quiet website visits into booked tours.",
    illustration: 'agent',
    lossNoun: 'families',
    businessNoun: 'daycare',
    panelIntro: 'One daycare website, built to reassure parents, answer them any hour, and book the tour.',
    panelNote: 'JK Daycare runs on exactly this and told us it’s “so easy to use, and fast.”',
    fixIntro:
      'The same three leaks show up in center after center, and the same site fixes them. Here is what a parent runs into today, and what they find instead.',
    painPoints: [
      {
        title: 'Parents research long before they call',
        body: "A parent decides how they feel about your center from your website (photos, safety, hours, warmth) often at 10 p.m. after the kids are asleep. If the site doesn’t reassure them, they never call.",
      },
      {
        title: 'You’re answering the same questions all day',
        body: "Ages, hours, rates, openings, what to bring: the same handful of questions, over and over, pulling you away from the children. An AI agent answers them instantly so you don’t have to.",
      },
      {
        title: 'Families speak more than one language',
        body: "In Western Mass, many parents are more comfortable in Spanish. A site and an agent that speak their language, not a bolted-on translation, is the difference between a tour booked and a tab closed.",
      },
    ],
    offer: [
      {
        title: 'A site parents trust in seconds',
        body: 'Bright, fast, and reassuring: your program, your staff, your space, your safety, and real reviews, laid out the way a searching parent reads them.',
      },
      {
        title: 'Manage children & families',
        body: 'An admin to keep your enrollment, your children, and parent communication in one place: easy enough to actually use, fast enough to not get in the way.',
      },
      {
        title: 'Enrollment questions answered 24/7',
        body: 'An AI agent handles the repeat questions and books tours around the clock, in English or Spanish, so a late-night search becomes a booked visit.',
      },
      {
        title: 'Found on Google & the map',
        body: 'Technical SEO and a verified Google Business Profile so local parents find you first, on Google and when they ask an AI assistant for a “daycare near me.”',
      },
    ],
    proofBusiness: 'JK Daycare',
    proofHeading: 'A daycare already growing',
    faqs: [
      {
        q: 'How much does a daycare website cost?',
        a: `Our website plans start at ${FOUND_MO} for a custom-designed 1–3 page site with hosting and SSL, Remi AI answering parents 24/7, a Google Business Profile, technical SEO, and upkeep included. The build is a one-time ${FOUND_SETUP} setup fee, then ${FOUND_MO} with no term. Prepay the year and the setup fee is waived and two months are free. A full multi-page site with Remi AI booking tours for you starts at ${BOOKED_MO}, and every plan includes your own admin to track enrollment inquiries and update the site yourself. One-time builds are available too, billed at a flat ${HOURLY} and quoted up front.`,
      },
      {
        q: 'Can you help us manage enrollment and parents?',
        a: 'Yes. We build an admin to manage your children and communicate with their parents, and it’s designed to be easy to use. JK Daycare runs on exactly this and told us it’s “so easy to use, and fast.”',
      },
      {
        q: 'Will the site work in Spanish?',
        a: 'Yes, multilingual is standard, not an add-on. The site and the AI agent both work in Spanish and English, written for Spanish-speaking families rather than run through a translator.',
      },
      {
        q: 'We’re brand new online: is that a problem?',
        a: 'Not at all: that’s the best time to start. JK Daycare had only been live a week when they started seeing their traffic grow day by day. We build the foundation right so it compounds from here.',
      },
    ],
  },
];

export function getProfession(slug: string): Profession | undefined {
  return professions.find((p) => p.slug === slug);
}
