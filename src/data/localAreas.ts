// Local-SEO landing areas — one honest, substantial page per town (not doorway
// spam). Each entry carries REAL local context (neighborhoods, language mix,
// business character) so the pages are genuinely distinct, not name-swapped
// clones. The region list lives in `servedTowns`. Towns with their own page
// carry a `slug` and get cross-linked.
//
// EVERYTHING the visitor reads is per-town, including the offer cards, FAQ
// answers, and serving blurb (an earlier version shared those across towns and
// the four pages measured ~60% identical in main content — bad for local SEO).
// FAQ QUESTIONS stay parallel on purpose: "How much does a website cost in
// <town>, MA?" is the literal search query. Only the answers vary.
//
// FACTS that must stay exact in every town's paraphrase (do not drift):
//  - $95/mo plan: custom 1–3 page site, hosting + SSL, Remi answering 24/7,
//    Google Business Profile setup, technical SEO, maintenance, multilingual
//    standard, month-to-month, prepay a year = 2 months free.
//  - $245/mo plan: full multi-page site + your own admin + Remi booking.
//  - Credential: twenty years enterprise/startup engineering incl. enterprise
//    eCommerce and consulting at Accenture. Based in Springfield.
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
  offers: { title: string; body: string }[]; // 4 value-prop cards, written per town
  plansLine: string; // the "$95/mo" line under the offer cards (keep the fact, vary the words)
  faqPricing: string; // answer: how much does a website cost here
  faqBusinesses: string; // answer: what kinds of businesses (town business mix + shape of the work)
  faqOutside: string; // answer: do you work outside <town> — real geography from this town's vantage
  faqExisting: string; // answer: can you fix the site I have
  faqDifferent: string; // answer: vs big agency / DIY (credential facts exact)
  servingBlurb: string; // line under "Serving all of Western Mass" — based-in-Springfield, from this town's vantage
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
    offers: [
      {
        title: 'Win the most competitive search in Western Mass',
        body: 'More businesses fight for page one in Springfield than anywhere else in the region. We build from scratch for exactly that fight: 90+ Lighthouse speed, mobile-first, technical SEO in the foundation — not bolted on after.',
      },
      {
        title: 'English and Spanish, standard',
        body: "Springfield does business in two languages, and half a presence reaches half a city. Site, SEO, and AI agent all ship bilingual — included, never an add-on.",
      },
      {
        title: 'Booked while you work',
        body: "Whether you're on a job in Sixteen Acres or closed for the night downtown, your site answers questions and books the appointment. Remi works the hours you can't.",
      },
      {
        title: 'Maintained by your neighbor, not a ticket queue',
        body: "We're based in Springfield, and we don't disappear after launch. Monthly plans keep your site fast, secure, and ranking — with a plain-English report every month.",
      },
    ],
    plansLine:
      'All of it starts at $95/mo — website, AI agent, SEO, and maintenance in one plan.',
    faqPricing:
      "Plans start at $95/mo, and that first tier is complete, not a teaser: a custom-designed 1–3 page site, hosting and SSL, Remi answering customers 24/7, Google Business Profile setup, technical SEO, and ongoing maintenance. English and Spanish are standard at every tier. It's month-to-month with nothing extra to start — prepay a year and two months are free. Need a full multi-page site with your own admin and Remi booking appointments? That's $245/mo. One-time builds are available too, and every plan gets scoped to your actual business.",
    faqBusinesses:
      "Springfield's whole range: contractors in Sixteen Acres, restaurants downtown, medical and professional offices, churches, shops. If your customers find you by searching, the work is the same underneath — rank for what Springfield actually types into Google, answer when you can't reach the phone, and keep the site maintained long after launch day.",
    faqOutside:
      "Yes. Springfield is home base, and the rest of Western Mass is our backyard — Chicopee right across the river, Holyoke and Northampton up I-91, Westfield, Agawam, Ludlow, Amherst. We also work remotely with businesses anywhere.",
    faqExisting:
      "Absolutely — you don't have to start over. We audit the site you have, fix what's costing you customers (speed, technical SEO, mobile problems, pages that don't convert), and then take over the maintenance so it stays fixed.",
    faqDifferent:
      "You get twenty years of engineering for enterprise and startups — including enterprise eCommerce and consulting at Accenture — at prices scoped for a Springfield business, not a Fortune 500 budget. And you talk directly to the people doing the work. No account manager, no runaround.",
    servingBlurb:
      "We're based right here in Springfield — in person across the city when it helps, remote when it's faster.",
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
      'Web design for Holyoke, MA businesses — fast bilingual (English & Spanish) websites with AI booking agents and technical SEO. From $95/mo.',
    heroIntro:
      'In the Paper City, your next customer is searching on their phone before they ever call. We build fast, bilingual websites with an AI agent that answers and books around the clock — so Holyoke businesses get found and get the job.',
    angleHeading: 'Holyoke runs in two languages — so should your site',
    angleBody:
      "Holyoke has one of the largest Puerto Rican communities in the country, and a business here needs to reach customers in the language they actually use. We build every site, every SEO setup, and every AI agent in English and Spanish by default — no add-on, no afterthought. From High Street to the Holyoke Mall, that's how you reach the whole city, not half of it.",
    neighborhoods: ['Downtown / High Street', 'The Flats', 'Churchill', 'Elmwood', 'Ingleside', 'Springdale'],
    languageNote:
      'English and Spanish come standard on everything we build — site, SEO, and AI agent — so every customer gets answered in their own language.',
    offers: [
      {
        title: 'Found by the whole city',
        body: "When someone in Holyoke searches for what you do — in English or in Spanish — you should be the answer both times. We build the site and the SEO to rank for how this city actually searches.",
      },
      {
        title: 'Bilingüe de verdad, not a translate button',
        body: 'Your site, your Google presence, and your AI agent all work in Spanish and English from day one. In a city where that decides who calls you, it comes included — never as an upsell.',
      },
      {
        title: 'An agent that never closes',
        body: "High Street keeps shop hours; your customers don't. Remi answers questions and books work at 10pm in whichever language the customer opens with.",
      },
      {
        title: 'Built to last, kept to last',
        body: "The Paper City built things that outlived their builders. Your site should hold the same standard: monthly maintenance keeps it fast, secure, and ranking — with a report in plain words, not jargon.",
      },
    ],
    plansLine:
      'The whole package — site, bilingual AI agent, SEO, maintenance — starts at $95/mo.',
    faqPricing:
      "From $95/mo — and in Holyoke that buys the bilingual setup outright, because Spanish is standard with us, not a line item. The first tier includes a custom 1–3 page site, hosting and SSL, Remi answering customers around the clock, Google Business Profile setup, technical SEO, and ongoing maintenance. Month-to-month, nothing extra up front; prepay a year and you get two months free. A full multi-page site with your own admin and Remi booking appointments runs $245/mo, and one-time builds are on the table too — every plan is scoped to the business, not the other way around.",
    faqBusinesses:
      "The businesses that make Holyoke run: family restaurants on High Street, trades and contractors, shops from downtown to the Mall, services in every neighborhood between. What they get is the same spine — a fast site that ranks for the searches Holyoke really makes, an agent answering in Spanish or English when you're busy, and someone still tending the site a year after launch.",
    faqOutside:
      "Claro — Holyoke is a few exits up I-91 from our Springfield base, and we cover the whole valley: Chicopee, Northampton, Westfield, Agawam, Amherst, Easthampton and beyond. Remote works too, for businesses anywhere.",
    faqExisting:
      "Yes — and it's often the fastest win. We audit your current site, fix the speed, technical SEO, and mobile issues that are quietly costing you calls, add the Spanish side if you're missing half the city, and then keep it all maintained.",
    faqDifferent:
      "Big-agency skill without the big-agency machinery: twenty years engineering for enterprise and startups — enterprise eCommerce, consulting at Accenture — pointed at Holyoke-sized budgets. You deal directly with the builder, in English or Spanish, not with an account manager reading a status sheet.",
    servingBlurb:
      "Home base is Springfield, a few exits down I-91 — close enough to meet at your shop, remote when that's quicker.",
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
      'Web design for Chicopee, MA businesses — fast websites with AI booking agents and technical SEO. Turn your reputation into leads. From $95/mo.',
    heroIntro:
      'Chicopee is built on family businesses — and family businesses win on reputation and word of mouth. We put that reputation online: a fast website, technical SEO that ranks you locally, and an AI agent that answers customers day and night.',
    angleHeading: 'Where Willimansett, Aldenville, and the Falls find you',
    angleBody:
      "From Chicopee Falls to Fairview, Aldenville to Willimansett, customers find local businesses the same way now — a quick search on the phone. We make sure that when someone nearby looks for what you do, you're the one they find, you load fast, and there's something ready to answer them even after you've closed for the day.",
    neighborhoods: ['Chicopee Falls', 'Willimansett', 'Aldenville', 'Fairview', 'Chicopee Center', 'Burnett Road'],
    languageNote:
      'English and Spanish come standard on everything we build — site, SEO, and AI agent — so you can serve every customer who walks through the door.',
    offers: [
      {
        title: 'Your reputation, findable',
        body: "Chicopee businesses earn their name the old way — good work, told neighbor to neighbor. We make sure the same name wins the new way too: a fast site, built from scratch, that ranks when Fairview or the Falls goes searching.",
      },
      {
        title: 'Every customer, either language',
        body: 'English and Spanish are standard across your site, your SEO, and your AI agent — so nobody who walks through your door finds a website that can\'t talk to them.',
      },
      {
        title: 'Estimates booked from the job site',
        body: "Trades can't answer phones from a ladder. Remi takes the questions, qualifies the customer, and books the estimate — at lunch, after close, whenever they actually call.",
      },
      {
        title: 'No surprises, month to month',
        body: "Published prices, plans you can leave anytime, and maintenance that keeps the site fast and ranking — with a monthly report written the way you'd explain it to family.",
      },
    ],
    plansLine:
      'Website, AI agent, SEO, and upkeep together from $95/mo — the price is on the page, not behind a call.',
    faqPricing:
      "It starts at $95/mo, published right here because that's how we'd want to be sold to. That gets a Chicopee business a custom 1–3 page site, hosting and SSL, Remi answering customers 24/7, Google Business Profile setup, technical SEO, and ongoing maintenance — with English and Spanish standard. Month-to-month with nothing extra to start, and prepaying a year takes two months off. If you need a bigger multi-page site with your own admin and appointment booking, that tier is $245/mo. One-time builds exist too; either way we scope it to your business before you pay anything.",
    faqBusinesses:
      "Family businesses, mostly — the shops in Chicopee Center, contractors and tradespeople, restaurants in the Falls, services along Memorial Drive. The pattern rarely changes: get found for the searches your neighbors actually make, have something answering when you're mid-job, and keep the site cared for years past launch.",
    faqOutside:
      "Of course — Springfield is literally across the river from us (home base is there), and the rest of the valley is minutes away: Holyoke, Westfield, Ludlow, Agawam, up to Northampton and Amherst. Businesses further out we handle remotely, which works just as well.",
    faqExisting:
      "Yes, and you keep what you paid for. We start with an audit of the existing site, repair what's dragging it down — load speed, technical SEO, mobile layout, forms nobody completes — and then maintain it going forward so the fixes stick.",
    faqDifferent:
      "The short version: enterprise engineering at family-business prices. Twenty years building for enterprise and startups, including enterprise eCommerce and consulting at Accenture — and when you call, you get the person doing the work, not an account manager between you and the answer.",
    servingBlurb:
      "Based in Springfield, right across the river — easy to stop by in person, just as easy to handle remotely.",
    proofBusiness: 'JK Daycare',
    proofHeading: 'Proof from Western Massachusetts',
    marketData: {
      heading: 'Why our prices are on the site instead of behind a phone call',
      body: "When Massachusetts small business owners were surveyed in 2025, the obstacle they named most often wasn't the economy and it wasn't funding — it was being unable to get clear, trusted information about what to do next. In a city like Chicopee, where the median household runs near $67,000 and every monthly bill gets weighed on its own merits, that gap costs real money in one of two directions: you overpay an agency that quotes you in jargon you can't check, or you do nothing and stay invisible while a competitor doesn't. It's why our pricing is published, our plans are month-to-month, and we'll say plainly when the $95 plan is genuinely all your business needs.",
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
      "Web design for Northampton, MA businesses — beautiful, fast websites with technical SEO and AI booking agents. From $95/mo.",
    heroIntro:
      "Northampton sets a high bar for design — your website should meet it. We build beautiful, blazing-fast sites for NoHo's restaurants, shops, and studios, with technical SEO and an AI agent that turns browsers into booked customers.",
    angleHeading: 'A site as considered as Main Street',
    angleBody:
      'Northampton customers notice design, and they expect the businesses they love to look the part online. We build sites as polished as the storefronts on Main Street — fast, accessible, and easy to book from — whether you run a restaurant, a boutique, a wellness practice, or a studio. Then we keep them ranking, so visitors to NoHo find you first.',
    neighborhoods: ['Downtown / Main Street', 'Florence', 'Leeds', 'Bay State', 'Smith College area'],
    languageNote:
      'Multilingual by default — English, Spanish, or any language your customers use — across your site, SEO, and AI agent.',
    offers: [
      {
        title: 'Ranked and beautiful — you need both here',
        body: "In Northampton a site can rank and still lose the customer if it doesn't carry itself like the storefront does. We design from scratch for both tests: the Google result and the first impression, at 90+ Lighthouse speed.",
      },
      {
        title: 'Every language your customers bring',
        body: "NoHo draws visitors from everywhere. Your site, SEO, and AI agent ship multilingual as standard — English, Spanish, or whatever languages your customers actually use.",
      },
      {
        title: 'From browsing to booked',
        body: 'A studio, a restaurant, a wellness practice — they all live on appointments. Remi answers the questions people ask before committing and books them in, including at midnight after the show lets out.',
      },
      {
        title: 'Kept as polished as opening day',
        body: "Design ages; maintained design doesn't. Monthly plans keep the site fast, current, secure, and ranking — and the monthly report reads like a note from a colleague, not a server log.",
      },
    ],
    plansLine:
      'Design, AI agent, SEO, and maintenance start together at $95/mo.',
    faqPricing:
      "From $95/mo. Independent shops ask this first, so here's the whole answer: a custom-designed 1–3 page site (designed, not templated), hosting and SSL, Remi answering visitors 24/7, Google Business Profile setup, technical SEO, and ongoing maintenance — multilingual included at every tier. Month-to-month with nothing extra up front; a prepaid year earns two months free. A larger multi-page site with your own admin and Remi booking appointments is $245/mo, and one-time builds are available when a subscription isn't the right fit. Everything is scoped to your business first.",
    faqBusinesses:
      "The independents that make Northampton Northampton: restaurants and cafés downtown, boutiques and galleries, wellness practices, studios out in Florence. Underneath the aesthetics the job is constant — rank for what people search on their way to NoHo, answer and book while you're with a customer, and keep the site tended long after it launches.",
    faqOutside:
      "Yes — we're based in Springfield, a straight shot down I-91, and we work across the valley: Easthampton, Amherst, Holyoke, Chicopee, Westfield and the rest of Western Mass. Remote engagements work anywhere.",
    faqExisting:
      "Definitely. Plenty of Northampton sites are lovely and slow, or fast and invisible. We audit yours, fix what's underperforming — speed, technical SEO, mobile experience, booking flow — without throwing away the design equity you've built, then maintain it from there.",
    faqDifferent:
      "The pairing is the point: twenty years of enterprise and startup engineering — enterprise eCommerce, consulting at Accenture — with the design standards a Main Street business actually needs, at independent-shop prices. And you work with the builder directly; no account manager translating in the middle.",
    servingBlurb:
      "Based in Springfield, thirty minutes down I-91 — up in Hamp regularly, remote whenever that serves you better.",
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
