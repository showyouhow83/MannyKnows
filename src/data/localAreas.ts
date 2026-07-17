// Local-SEO landing areas — one honest, substantial page per town (not doorway
// spam). Each entry carries REAL local context (neighborhoods, language mix,
// business character) so the pages are genuinely distinct, not name-swapped
// clones. Shared service copy lives in `offers`; the region list in
// `servedTowns`. Towns with their own page carry a `slug` and get cross-linked.
//
// To add a town: append an entry here + drop a 4-line wrapper page at
// src/pages/web-design-<slug>-ma.astro that renders <LocalAreaPage area={..} />.

export interface LocalArea {
  slug: string; // 'holyoke' -> /web-design-holyoke-ma
  name: string; // 'Holyoke'
  badge: string; // pill above the H1
  metaTitle: string;
  metaDescription: string;
  heroIntro: string; // distinct hero paragraph
  angleHeading: string; // local-context section heading
  angleBody: string; // 1–2 paragraphs of real local context
  neighborhoods: string[]; // real neighborhoods / areas
  languageNote: string; // town-specific multilingual angle
  industries: string; // example-business phrase used in the FAQ
  proofBusiness: string; // testimonials.ts business to feature
  proofHeading: string; // heading above the quote (honest about location)
}

// Shared service value props — about what we deliver, not the town, so they
// read identically everywhere and keep each page's distinctiveness in the
// town-specific fields above.
export const offers = [
  {
    title: 'Websites that get found',
    body: 'Designed and built from scratch — fast (near-perfect Lighthouse scores), mobile-first, and with technical SEO baked in from day one, not bolted on later.',
  },
  {
    title: 'Multilingual by default',
    body: "Your customers don't all speak English — so your website shouldn't either. English and Spanish, or any language your customers use, come standard on everything we build: site, SEO, and AI agent alike.",
  },
  {
    title: 'An AI agent that books jobs',
    body: "Your site can answer customer questions and book appointments 24/7 — even while you're on a job, closed for the night, or fully booked.",
  },
  {
    title: 'Maintained, not abandoned',
    body: "We don't hand over a site and disappear. Monthly plans keep it fast, secure, ranking, and up to date — with a plain-English report so you always know what's happening.",
  },
];

// Region we serve. Towns with a `slug` have their own page and get linked.
export const servedTowns: { name: string; slug?: string }[] = [
  { name: 'Springfield', slug: 'springfield' },
  { name: 'Chicopee', slug: 'chicopee' },
  { name: 'Holyoke', slug: 'holyoke' },
  { name: 'Northampton', slug: 'northampton' },
  { name: 'West Springfield' },
  { name: 'Westfield' },
  { name: 'Agawam' },
  { name: 'Ludlow' },
  { name: 'Amherst' },
  { name: 'Easthampton' },
];

export const localAreas: LocalArea[] = [
  {
    slug: 'springfield',
    name: 'Springfield',
    badge: 'Springfield · Western Massachusetts',
    metaTitle: 'Web Design in Springfield, MA — Websites, SEO & AI | MannyKnows',
    metaDescription:
      'Web design for Springfield and Western Massachusetts businesses — multilingual websites with AI booking agents, technical SEO, and monthly maintenance. Twenty years of enterprise engineering, priced for local business. From $200/mo.',
    heroIntro:
      "Websites that get found on Google, book jobs while you work, and speak your customers' language — built and maintained right here in Springfield, with twenty years of enterprise engineering behind them.",
    angleHeading: 'Built for how Springfield does business',
    angleBody:
      "Springfield is the biggest city in Western Mass and the most competitive place to get noticed online — from Forest Park and Sixteen Acres to Indian Orchard and downtown. We build sites that win the local search, load fast on the phones your customers actually use, and answer in English or Spanish, because Springfield does business in both.",
    neighborhoods: ['Forest Park', 'Sixteen Acres', 'East Forest Park', 'Indian Orchard', 'Downtown', 'Liberty Heights'],
    languageNote:
      'Springfield is one of the most linguistically diverse cities in the state, with a large Puerto Rican community and Spanish spoken across the city. Every site, SEO setup, and AI agent we build works in English and Spanish out of the box.',
    industries: 'a contractor in Sixteen Acres, a restaurant downtown, or a medical office on the edge of the city',
    proofBusiness: 'SL Painting',
    proofHeading: 'Proof, right here in Springfield',
  },
  {
    slug: 'holyoke',
    name: 'Holyoke',
    badge: 'Holyoke · Western Massachusetts',
    metaTitle: 'Web Design in Holyoke, MA — Bilingual Websites, SEO & AI | MannyKnows',
    metaDescription:
      'Web design for Holyoke businesses — fast, bilingual (English & Spanish) websites with AI booking agents, technical SEO, and monthly maintenance. Get found in the Paper City. From $200/mo.',
    heroIntro:
      'In the Paper City, your next customer is searching on their phone before they ever call. We build fast, bilingual websites with an AI agent that answers and books around the clock — so Holyoke businesses get found and get the job.',
    angleHeading: 'Holyoke runs in two languages — so should your site',
    angleBody:
      "Holyoke has one of the largest Puerto Rican communities in the country, and a business here needs to reach customers in the language they actually use. We build every site, every SEO setup, and every AI agent in English and Spanish by default — no add-on, no afterthought. From High Street to the Holyoke Mall, that's how you reach the whole city, not half of it.",
    neighborhoods: ['Downtown / High Street', 'The Flats', 'Churchill', 'Elmwood', 'Ingleside', 'Springdale'],
    languageNote:
      'English and Spanish come standard on everything we build — site, SEO, and AI agent — so every customer gets answered in their own language.',
    industries: 'a family restaurant on High Street, a trade business, or a shop near the Holyoke Mall',
    proofBusiness: 'VL Home Services',
    proofHeading: 'Proof from Western Massachusetts',
  },
  {
    slug: 'chicopee',
    name: 'Chicopee',
    badge: 'Chicopee · Western Massachusetts',
    metaTitle: 'Web Design in Chicopee, MA — Websites, SEO & AI | MannyKnows',
    metaDescription:
      'Web design for Chicopee businesses — fast websites with AI booking agents, technical SEO, and monthly maintenance. Turn your reputation into online leads. From $200/mo.',
    heroIntro:
      'Chicopee is built on family businesses — and family businesses win on reputation and word of mouth. We put that reputation online: a fast website, technical SEO that ranks you locally, and an AI agent that answers customers day and night.',
    angleHeading: 'Where Willimansett, Aldenville, and the Falls find you',
    angleBody:
      "From Chicopee Falls to Fairview, Aldenville to Willimansett, customers find local businesses the same way now — a quick search on the phone. We make sure that when someone nearby looks for what you do, you're the one they find, you load fast, and there's something ready to answer them even after you've closed for the day.",
    neighborhoods: ['Chicopee Falls', 'Willimansett', 'Aldenville', 'Fairview', 'Chicopee Center', 'Burnett Road'],
    languageNote:
      'English and Spanish come standard on everything we build — site, SEO, and AI agent — so you can serve every customer who walks through the door.',
    industries: 'a family shop in Chicopee Center, a contractor, or a restaurant in the Falls',
    proofBusiness: 'JK Daycare',
    proofHeading: 'Proof from Western Massachusetts',
  },
  {
    slug: 'northampton',
    name: 'Northampton',
    badge: 'Northampton · Western Massachusetts',
    metaTitle: 'Web Design in Northampton, MA — Websites, SEO & AI | MannyKnows',
    metaDescription:
      "Web design for Northampton (NoHo) businesses — beautiful, blazing-fast websites with technical SEO and AI booking agents. As considered as Main Street. From $200/mo.",
    heroIntro:
      "Northampton sets a high bar for design — your website should meet it. We build beautiful, blazing-fast sites for NoHo's restaurants, shops, and studios, with technical SEO and an AI agent that turns browsers into booked customers.",
    angleHeading: 'A site as considered as Main Street',
    angleBody:
      'Northampton customers notice design, and they expect the businesses they love to look the part online. We build sites as polished as the storefronts on Main Street — fast, accessible, and easy to book from — whether you run a restaurant, a boutique, a wellness practice, or a studio. Then we keep them ranking, so visitors to NoHo find you first.',
    neighborhoods: ['Downtown / Main Street', 'Florence', 'Leeds', 'Bay State', 'Smith College area'],
    languageNote:
      'Multilingual by default — English, Spanish, or any language your customers use — across your site, SEO, and AI agent.',
    industries: 'a restaurant downtown, a boutique in Florence, or a wellness studio near Smith',
    proofBusiness: 'VL Home Services',
    proofHeading: 'Proof from Western Massachusetts',
  },
];

export function getLocalArea(slug: string): LocalArea | undefined {
  return localAreas.find((a) => a.slug === slug);
}
