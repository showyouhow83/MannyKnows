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
  // Cited market context, written per town so these pages stop reading as one
  // page with the name swapped. HONESTY: every number here must be traceable to
  // `source`. Where a town has no verifiable local figure (Northampton), argue
  // from the statewide finding instead of inventing a local one.
  marketData: {
    heading: string;
    body: string;
    source: string;
    sourceUrl: string;
  };
}

// Shared service value props — about what we deliver, not the town, so they
// read identically everywhere and keep each page's distinctiveness in the
// town-specific fields above.
export const offers = [
  {
    title: 'Websites that get found',
    body: 'Designed and built from scratch — fast (90+ Lighthouse scores), mobile-first, and with technical SEO baked in from day one, not bolted on later.',
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
    metaTitle: 'Web Design in Springfield, MA — SEO & AI | MannyKnows',
    metaDescription:
      'Web design for Springfield, MA businesses — fast multilingual websites with AI booking agents and technical SEO. Enterprise experience, local pricing.',
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
    marketData: {
      heading: "What the state's own survey says about businesses like yours",
      body: "In the fall of 2025, 1,049 Massachusetts small business leaders were surveyed about how they actually run and grow. Two findings land hardest in Springfield. First, the businesses started across the state since 2020 are disproportionately owned by Black, Latino, women, and immigrant entrepreneurs — and those owners named strengthening their online presence among their top near-term priorities. Second, the barrier they reported most often wasn't money or ambition; it was not being able to get clear, trustworthy information about what's worth doing. Springfield is the largest and most competitive market in Western Mass, which makes both of those truer here than in any town around it.",
      source: 'Coalition for an Equitable Economy / MassINC Polling Group, 2025 Massachusetts Small Business Survey (1,049 respondents, fielded Sept 5–Oct 13, 2025)',
      sourceUrl: 'https://www.massincpolling.com/our-work/2025-cee-survey',
    },
  },
  {
    slug: 'holyoke',
    name: 'Holyoke',
    badge: 'Holyoke · Western Massachusetts',
    metaTitle: 'Web Design in Holyoke, MA — Bilingual & SEO | MannyKnows',
    metaDescription:
      'Web design for Holyoke, MA businesses — fast bilingual (English & Spanish) websites with AI booking agents and technical SEO. From $99/mo.',
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
    marketData: {
      // "Just over half" is deliberate, not vague. Published Hispanic/Latino
      // estimates for Holyoke range 51.5%-54.6% depending on vintage and source,
      // so a single decimal would be false precision. Do not "fix" this to 52.4%.
      heading: 'Holyoke is already ahead on this — it just gets bad information',
      body: "There's a result in the state's 2025 small business survey worth saying out loud in a city where just over half the population is Hispanic or Latino: Latino, Black, and AAPI business owners in Massachusetts reported using AI regularly at higher rates than white-owned businesses — most often for marketing work. The assumption usually runs the other way. The data doesn't. What those owners said they were missing wasn't willingness or interest, it was clear and trusted information about what's actually worth paying for. That's the gap we're built to close, and it's the reason everything here ships in Spanish and English together rather than one first and the other eventually.",
      source: 'Coalition for an Equitable Economy / MassINC Polling Group, 2025 Massachusetts Small Business Survey; U.S. Census Bureau demographic estimates for Holyoke',
      sourceUrl: 'https://www.massincpolling.com/our-work/2025-cee-survey',
    },
  },
  {
    slug: 'chicopee',
    name: 'Chicopee',
    badge: 'Chicopee · Western Massachusetts',
    metaTitle: 'Web Design in Chicopee, MA — SEO & AI | MannyKnows',
    metaDescription:
      'Web design for Chicopee, MA businesses — fast websites with AI booking agents and technical SEO. Turn your reputation into leads. From $99/mo.',
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
    marketData: {
      heading: 'Why our prices are on the site instead of behind a phone call',
      body: "When Massachusetts small business owners were surveyed in 2025, the obstacle they named most often wasn't the economy and it wasn't funding — it was being unable to get clear, trusted information about what to do next. In a city like Chicopee, where the median household runs near $67,000 and every monthly bill gets weighed on its own merits, that gap costs real money in one of two directions: you overpay an agency that quotes you in jargon you can't check, or you do nothing and stay invisible while a competitor doesn't. It's why our pricing is published, our plans are month-to-month, and we'll say plainly when the $99 plan is genuinely all your business needs.",
      source: 'Coalition for an Equitable Economy / MassINC Polling Group, 2025 Massachusetts Small Business Survey; U.S. Census Bureau median household income for Chicopee (2023)',
      sourceUrl: 'https://www.massincpolling.com/our-work/2025-cee-survey',
    },
  },
  {
    slug: 'northampton',
    name: 'Northampton',
    badge: 'Northampton · Western Massachusetts',
    metaTitle: 'Web Design in Northampton, MA — SEO & AI | MannyKnows',
    metaDescription:
      "Web design for Northampton, MA businesses — beautiful, fast websites with technical SEO and AI booking agents. From $99/mo.",
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
    marketData: {
      heading: 'The statewide picture — and where Northampton differs',
      body: "We don't have a Northampton-specific statistic to quote you, and making one up would be precisely the thing we tell clients never to do. What the state's 2025 survey of 1,049 small business owners does show is a real appetite for growth running alongside a persistent inability to get straight answers about which technology is worth buying. Northampton's own wrinkle is that the bar here is visual as much as technical: a business on Main Street can rank perfectly well and still lose the customer, because the site doesn't carry itself the way the storefront does. So we build for both — the ranking and the first impression — and price it where an independent shop can actually carry the bill.",
      source: 'Coalition for an Equitable Economy / MassINC Polling Group, 2025 Massachusetts Small Business Survey (1,049 respondents)',
      sourceUrl: 'https://www.massincpolling.com/our-work/2025-cee-survey',
    },
  },
];

export function getLocalArea(slug: string): LocalArea | undefined {
  return localAreas.find((a) => a.slug === slug);
}
