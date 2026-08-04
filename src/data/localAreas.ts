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
  faqAgents: string; // answer: can you build AI agents for my <town> business (facts: Remi in every site plan; roster from $95/mo each, managed)
  faqOutside: string; // answer: do you work outside <town> — real geography from this town's vantage
  faqExisting: string; // answer: can you fix the site I have
  faqDifferent: string; // answer: vs big agency / DIY (credential facts exact)
  servingBlurb: string; // line under "Serving all of Western Mass" — based-in-Springfield, from this town's vantage
  proofBusiness: string; // testimonials.ts business to feature
  proofHeading: string; // heading above the quote (honest about location)
  // Published case study to link under the quote (slug in src/content/portfolio,
  // must be draft:false). `line` is the one-sentence per-town framing.
  proofCaseStudy?: { slug: string; line: string };
  // "Beyond the website" cards — the rest of the 2026 catalog (AI Team, stores,
  // GBP, 360°/media), written per town. FACTS that must stay exact:
  //  - AI agents from $95/mo each; Remi is built into every site plan.
  //  - Stores from $150/mo, Shopify subscription included, catalog synced to
  //    Google Shopping / Instagram / Facebook.
  //  - GBP setup/rescue: $145 one-time, or included in every monthly plan.
  //  - Free single 360° photo only within ~10 miles of Springfield (Chicopee &
  //    Holyoke qualify; Northampton does NOT — never promise it free there).
  beyondWebHeading: string;
  beyondWeb: { title: string; body: string; href: string; linkText: string }[];
  // "Right now" section — city facts researched Aug 2026 and adversarially
  // fact-checked before use. HONESTY: every number must trace to a listed
  // source; where the checker corrected a claim, the corrected phrasing is
  // what appears here. Refresh cadence: revisit yearly or when a cited
  // project's status visibly changes.
  cityNow: {
    heading: string;
    paragraphs: string[];
    sources: { label: string; url: string }[];
  };
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
  { name: 'Westfield', slug: 'westfield' },
  { name: 'Agawam', slug: 'agawam' },
  { name: 'Ludlow' },
  { name: 'Amherst' },
  { name: 'Easthampton' },
];

export const localAreas: LocalArea[] = [
  {
    slug: 'springfield',
    name: 'Springfield',
    badge: 'Springfield · Western Massachusetts',
    metaTitle: 'Web Design in Springfield, MA — SEO & AI Agents | MannyKnows',
    metaDescription:
      'Web design for Springfield, MA businesses — fast multilingual websites with AI booking agents and technical SEO. Enterprise experience, local pricing.',
    heroIntro:
      "Web design and development that gets found on Google, books jobs while you work, and speaks your customers' language — built and maintained right here in Springfield, with twenty years of enterprise engineering behind it.",
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
    faqAgents:
      "Yes — it's half of what we do. Remi, the agent built into every site plan, answers questions and books work 24/7 in English and Spanish. Beyond Remi there's a whole roster — agents that write, design, post, run ads, and report — hired like staff from $95/mo each and managed for you. A Springfield painting contractor runs one today: it qualifies leads around the clock while the crew is up a ladder.",
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
    proofCaseStudy: {
      slug: 'sl-painting',
      line: 'SL Painting had nothing online. Today they rank #1 on Google — organically — for exterior painting in Springfield.',
    },
    cityNow: {
      heading: 'Springfield right now, in numbers',
      paragraphs: [
        "This is the third-largest city in Massachusetts — 154,886 people by the 2024 Census estimate — and nearly half of it is Hispanic or Latino, with about a third of the city speaking Spanish at home. A website that only works in English is invisible to a huge share of its own neighborhood. It's also a city of small operations like yours: the SBA counts 13,248 small employers across Springfield's congressional district — 94.6% of all employers here — led by exactly the businesses this page was written for: construction (1,889 firms), repair and personal services (1,518), retail (1,499), and restaurants (1,165).",
        "Downtown is mid-turnaround, too. In October 2025 the city approved converting three historic Main Street buildings into ground-floor retail with 111 apartments, with construction anticipated to start in spring 2026. More people living downtown means more people searching \"near me\" — and the businesses that show up in that search are the ones that get them.",
      ],
      sources: [
        { label: 'U.S. Census Bureau ACS 2024 (Census Reporter)', url: 'https://censusreporter.org/profiles/16000US2567000-springfield-ma/' },
        { label: 'SBA Office of Advocacy, 2026 Massachusetts district profiles', url: 'https://advocacy.sba.gov/wp-content/uploads/2026/02/Massachusetts_Congressional_District_Profiles_2026.pdf' },
        { label: 'The Reminder — downtown revitalization (Oct 2025)', url: 'https://thereminder.com/local-news/hampden-county/springfield/officials-share-plans-progress-on-springfields-downtown-revitalization/' },
      ],
    },
    beyondWebHeading: 'The rest of the toolkit — built in Springfield',
    beyondWeb: [
      {
        title: 'AI employees, hired like staff',
        body: 'Remi answers your site around the clock, and ten more agents write, design, post, run ads, and report — one shared brain, managed by Manny, from $95/mo each.',
        href: '/ai-team/',
        linkText: 'Meet the AI Team',
      },
      {
        title: 'Online stores that sell everywhere',
        body: 'Shopify and beyond: one catalog synced to Google Shopping, Instagram & Facebook, with your Shopify subscription included — from $150/mo.',
        href: '/ecommerce/',
        linkText: 'See store plans',
      },
      {
        title: 'Your Google Business Profile, done right',
        body: 'The map pack is the first screen Springfield sees. Profile setup or rescue: $145 one-time — or included in every monthly plan.',
        href: '/plans/get-found/',
        linkText: 'Get found on Google',
      },
      {
        title: 'A free 360° photo of your business',
        body: "We photograph businesses for their Google profiles, and the first professional 360° photo is free — Springfield is our home city, so you're squarely in the radius.",
        href: '/free-360-photo/',
        linkText: 'Claim the free photo',
      },
    ],
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
    metaTitle: 'Web Design in Holyoke, MA — Bilingual SEO & AI Agents | MannyKnows',
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
    faqAgents:
      "Claro que sí — and here they're bilingual by default, not by upgrade. Remi comes with every site plan and answers customers 24/7 in whichever language they open with; the full roster (from $95/mo per agent) writes, posts, runs ads, and reports, all managed for you. In a city where the first message is as likely to arrive in Spanish as English, an agent that handles both is the difference between a reply and a lost job.",
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
    proofCaseStudy: {
      slug: 'vl-home-services',
      line: 'VL Home Services ran on referrals and paper. Now a website brings in work, an admin tracks it, and an AI agent answers customers in any language.',
    },
    cityNow: {
      heading: 'The Paper City is becoming an AI city',
      paragraphs: [
        "That's not a stretch. The Massachusetts Green High Performance Computing Center sits on Holyoke's canals because of the city's own power — Holyoke Gas & Electric generates roughly two-thirds of the city's electricity from its local hydroelectric system — and in 2025 the state awarded the center $31 million to build hundreds of NVIDIA GPUs into one of the largest state-level AI deployments in the country. The AI wave has a Holyoke address. The agents we build for local businesses are the small-business end of the same shift.",
        "The rest of the city is moving with it: more than 50 cannabis companies hold host-community agreements here; the $55.3 million Residences on Appleton mill conversion filled all 88 apartments within three months of opening in late 2025; and MassDevelopment has put nearly $1 million into High Street storefronts since 2022 — $374,000 of it in February 2025 alone. The state is literally paying to fix Holyoke's physical storefronts. The digital storefront is the half we handle.",
      ],
      sources: [
        { label: 'Massachusetts AI Hub — $31M AICR award at MGHPCC', url: 'https://aihub.masstech.org/news/healey-driscoll-administration-celebrates-selection-cambridge-computer-build-landmark' },
        { label: 'Holyoke Gas & Electric — hydroelectric power', url: 'https://www.hged.com/smart-energy/clean-energy/hydro/default.aspx' },
        { label: 'City of Holyoke — cannabis host community agreements', url: 'https://www.holyoke.org/current-companies/' },
        { label: 'WinnCompanies — Residences on Appleton (Dec 2025)', url: 'https://www.winncompanies.com/news/3285-winncompanies-opens-88-unit-senior-housing-community-after-adaptive-reuse-of-historic-mill-complex-in-holyoke-ma' },
        { label: 'Daily Hampshire Gazette — High Street TDI awards (Feb 2025)', url: 'https://gazettenet.com/2025/02/13/370k-in-state-aid-pours-into-holyoke-s-downtown-59405864/' },
      ],
    },
    beyondWebHeading: 'Más que websites — the whole toolkit, in both languages',
    beyondWeb: [
      {
        title: 'AI agents that speak Holyoke',
        body: 'Agents that answer in Spanish or English — whichever the customer opens with — and book the job at 10pm. From $95/mo each, with Remi built into every site plan.',
        href: '/ai-team/',
        linkText: 'Meet the AI Team',
      },
      {
        title: 'Tiendas online, both languages',
        body: 'A store that sells in Spanish and English and syncs one catalog to Google Shopping, Instagram & Facebook — from $150/mo, Shopify subscription included.',
        href: '/ecommerce/',
        linkText: 'See store plans',
      },
      {
        title: 'Own the map pack, en dos idiomas',
        body: 'The map decides who gets the call on High Street. Google Business Profile setup or rescue: $145 one-time, or included in every monthly plan.',
        href: '/plans/get-found/',
        linkText: 'Get found on Google',
      },
      {
        title: 'A free 360° photo of your shop',
        body: 'Holyoke sits inside our free travel radius: one professional 360° photo for your Google profile, free, no strings — we come to you.',
        href: '/free-360-photo/',
        linkText: 'Claim the free photo',
      },
    ],
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
    metaTitle: 'Web Design in Chicopee, MA — SEO & AI Agents | MannyKnows',
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
    faqAgents:
      "Yes — and for a family business it's the difference between a missed call and a booked estimate. Remi comes with every site plan and answers customers 24/7; the full roster (from $95/mo per agent) writes, posts, runs ads, and reports, managed for you. For a local daycare we paired the site's agent with a phone system that answers and routes every call — the same pattern fits any busy Chicopee shop where nobody can stop to pick up.",
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
    proofCaseStudy: {
      slug: 'jk-daycare',
      line: 'JK Daycare went from no website and missed calls to a site, an AI agent for parents, and a phone system that routes every call — built in two weeks.',
    },
    cityNow: {
      heading: 'Chicopee is building — your storefront should too',
      paragraphs: [
        "The city's quiet numbers are bigger than people assume. Westover is the nation's largest Air Force Reserve base, and the industrial parks on its former land support an estimated $2.2 billion in annual economic output and more than 8,400 jobs statewide. Chicopee even runs its own fiber-optic ISP — Crossroads Fiber, operated by Chicopee Electric Light, has connected over 5,000 customers across the city — so your customers have fast internet, and a slow website has no excuse.",
        "And this is a building stretch: Singing Bridge Residences broke ground at the old Facemate property in October 2025 — eight stories, the tallest building in Chicopee — downtown revitalization now centers on the 700,000-square-foot Cabotville Mill, and Memorial Drive, the city's main retail strip, is in the middle of a $12.5 million reconstruction scheduled to run to 2029. If road work slows the drive-by traffic on Route 33 for the next few years, being the business people find on their phones matters more, not less.",
      ],
      sources: [
        { label: 'UMass Donahue Institute — Westover economic impact', url: 'https://donahue.umass.edu/news-events/media-coverage/westover-chicopee-ma-redevelopment-of-military-land-means-2.2-billion-in-impact' },
        { label: 'City of Chicopee — Westover Air Reserve Base', url: 'https://www.chicopeema.gov/443/Westover-Air-Reserve-Base' },
        { label: 'The Reminder — Singing Bridge groundbreaking (Oct 2025)', url: 'https://thereminder.com/local-news/hampden-county/chicopee/chicopees-tallest-building-breaks-ground-at-former-facemate-property/' },
        { label: 'WAMC — Chicopee 2026 outlook (Cabotville Mill)', url: 'https://www.wamc.org/news/2026-01-08/chicopee-mayor-john-vieau-talks-city-accomplishments-outlook-for-2026' },
        { label: 'Western Mass News — Memorial Drive reconstruction (Jul 2026)', url: 'https://www.westernmassnews.com/2026/07/20/construction-stops-traffic-memorial-drive-chicopee/' },
        { label: 'Community Networks (ILSR) — Crossroads Fiber', url: 'https://communitynetworks.org/content/chicopee-electric-light-sertex-renew-partnership-expand-affordable-fiber-access' },
      ],
    },
    beyondWebHeading: 'More tools your family business can lean on',
    beyondWeb: [
      {
        title: 'AI that answers when you can\'t',
        body: "An agent on your site that takes the questions and books the estimate while you're mid-job — from $95/mo each, with Remi built into every site plan.",
        href: '/ai-team/',
        linkText: 'Meet the AI Team',
      },
      {
        title: 'Sell online without leaving the counter',
        body: 'A store that syncs one catalog to Google Shopping, Instagram & Facebook — from $150/mo, Shopify subscription included, no percentage of your sales.',
        href: '/ecommerce/',
        linkText: 'See store plans',
      },
      {
        title: 'When Willimansett searches, the map decides',
        body: 'Most local picks happen in the map pack before a website ever loads. Google Business Profile setup or rescue: $145 one-time, or included in every plan.',
        href: '/plans/get-found/',
        linkText: 'Get found on Google',
      },
      {
        title: 'A free 360° photo, right across the river',
        body: 'Chicopee is minutes from our Springfield base — well inside the free radius. One professional 360° photo for your Google profile, free.',
        href: '/free-360-photo/',
        linkText: 'Claim the free photo',
      },
    ],
    marketData: {
      heading: 'Why our prices are on the site instead of behind a phone call',
      body: "When Massachusetts small business owners were surveyed in 2025, the obstacle they named most often wasn't the economy and it wasn't funding — it was being unable to get clear, trusted information about what to do next. In a city like Chicopee, where the median household runs near $63,000 and every monthly bill gets weighed on its own merits, that gap costs real money in one of two directions: you overpay an agency that quotes you in jargon you can't check, or you do nothing and stay invisible while a competitor doesn't. It's why our pricing is published, our plans are month-to-month, and we'll say plainly when the $95 plan is genuinely all your business needs.",
      source: 'Coalition for an Equitable Economy / MassINC Polling Group, 2025 Massachusetts Small Business Survey; U.S. Census Bureau median household income for Chicopee (ACS 2024 5-year: $62,615)',
      sourceUrl: 'https://www.massincpolling.com/our-work/2025-cee-survey',
    },
  },
  {
    slug: 'northampton',
    name: 'Northampton',
    badge: 'Northampton · Western Massachusetts',
    metaTitle: 'Web Design in Northampton, MA — SEO & AI Agents | MannyKnows',
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
      "The independents that make Northampton Northampton — restaurants and cafés downtown, boutiques and galleries, wellness practices, studios out in Florence — and the businesses that keep it all running off Main Street: contractors, medical and dental practices, professional offices. Underneath the aesthetics the job is constant — rank for what people search on their way to NoHo, answer and book while you're with a customer, and keep the site tended long after it launches.",
    faqAgents:
      "Yes — appointment businesses get the most out of them, and Northampton runs on appointments. Remi comes with every site plan and answers the pre-booking questions 24/7 — the table after the show, the studio consult, the wellness intake — then books them in. The full roster (from $95/mo per agent) writes, designs, posts, and reports, all managed for you, multilingual as standard.",
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
    proofCaseStudy: {
      slug: 'vl-home-services',
      line: 'VL Home Services went from referrals-only to a complete digital operation — a website that brings in work, an admin that tracks it, and an AI agent answering customers.',
    },
    cityNow: {
      heading: "Main Street's next act is coming — be findable before it starts",
      paragraphs: [
        "Northampton's downtown lives on independents and visitors: the regional EDC counts more than 1,200 businesses with over 17,000 employees here, the Paradise City Cultural District spans roughly fourteen walkable blocks, the Iron Horse has been back open since May 2024, and the local gift card program has pushed over $5.6 million into 125+ independent businesses. Domestic travelers spent about $160 million in Hampshire County in 2022 alone — and a visitor who has never been here decides where to eat, shop, and book from their phone, before they ever see your storefront.",
        "Now the big one: the $43.3 million Picture Main Street redesign filed final plans with MassDOT in July 2026, with construction expected to begin in spring 2028 and run about four construction seasons — two traffic lanes instead of four, separated bike lanes, wider sidewalks. It will be worth it, and it will be disruptive. The businesses that thrive through years of street work are the ones customers can find, contact, and book online — and that runway starts now, not in 2028.",
        "One practical note while you're weighing costs: Massachusetts runs the Empower Digital Grant, a match grant that helps eligible small businesses pay for exactly this kind of work — websites, e-commerce, digital marketing — through Small Business Technical Assistance providers. Ask us and we'll point you at it.",
      ],
      sources: [
        { label: 'Western Mass EDC — Amherst-Northampton profile', url: 'https://www.westernmassedc.com/choose-western-mass/amherst-northampton/industry/' },
        { label: 'Daily Hampshire Gazette — Picture Main Street (Jul 2026)', url: 'https://gazettenet.com/2026/07/30/a-clearer-picture-residents-pop-in-to-mull-main-street-redesign-at-info-session/' },
        { label: 'Greenfield Recorder — regional tourism study (2024)', url: 'https://recorder.com/2024/02/13/tourism-study-reveals-1-billion-impact-to-region-54030551/' },
        { label: 'NEPM — Iron Horse reopening (May 2024)', url: 'https://www.nepm.org/regional-news/2024-05-14/new-owners-reopen-iron-horse-music-hall-this-week-still-waiting-to-hear-about-liquor-license' },
        { label: 'Greater Northampton Gift Card', url: 'https://www.northamptongiftcard.com/' },
        { label: 'Mass.gov — Empower Digital Grant', url: 'https://www.mass.gov/info-details/eoed-programs-and-grants-business-and-innovation' },
      ],
    },
    beyondWebHeading: 'Beyond the website — the rest of a NoHo-grade presence',
    beyondWeb: [
      {
        title: 'AI that books while you\'re with a customer',
        body: 'An agent that answers the questions people ask before committing and fills the calendar — midnight after the show included. From $95/mo each; Remi comes with every site plan.',
        href: '/ai-team/',
        linkText: 'Meet the AI Team',
      },
      {
        title: 'Online stores as considered as the shelf',
        body: 'Boutique-grade storefronts on Shopify and beyond — one catalog synced to Google Shopping, Instagram & Facebook, from $150/mo, subscription included.',
        href: '/ecommerce/',
        linkText: 'See store plans',
      },
      {
        title: 'The map pack reads before Main Street does',
        body: 'Visitors decide where to eat and shop from the map on the walk over. Google Business Profile setup or rescue: $145 one-time, or included in every plan.',
        href: '/plans/get-found/',
        linkText: 'Get found on Google',
      },
      {
        title: 'Photo, video & 360° virtual tours',
        body: "Interiors like Northampton's deserve better than a phone pano. 360° photo packs and Google Street View tours cover the whole valley — Hamp included.",
        href: '/free-360-photo/',
        linkText: 'See 360° packs',
      },
    ],
    marketData: {
      heading: 'The statewide picture — and where Northampton differs',
      body: "We don't have a Northampton-specific statistic to quote you, and making one up would be precisely the thing we tell clients never to do. What the state's 2025 survey of 1,049 small business owners does show is a real appetite for growth running alongside a persistent inability to get straight answers about which technology is worth buying. Northampton's own wrinkle is that the bar here is visual as much as technical: a business on Main Street can rank perfectly well and still lose the customer, because the site doesn't carry itself the way the storefront does. So we build for both — the ranking and the first impression — and price it where an independent shop can actually carry the bill.",
      source: 'Coalition for an Equitable Economy / MassINC Polling Group, 2025 Massachusetts Small Business Survey (1,049 respondents)',
      sourceUrl: 'https://www.massincpolling.com/our-work/2025-cee-survey',
    },
  },
  {
    slug: 'westfield',
    name: 'Westfield',
    badge: 'Westfield · Western Massachusetts',
    metaTitle: 'Web Design in Westfield, MA — SEO & AI Agents | MannyKnows',
    metaDescription:
      'Web design for Westfield, MA businesses — fast websites with AI booking agents and local SEO, built for the Whip City. From $95/mo.',
    heroIntro:
      "Westfield built one of the best fiber networks in New England — your website should be worth the bandwidth. We build fast sites with AI agents that answer and book around the clock, for the businesses of the Whip City.",
    angleHeading: 'A working city deserves a working website',
    angleBody:
      "Westfield still makes things — manufacturing is the city's third-largest employment sector, in a place whose whip industry once named it. Businesses here don't need a pretty brochure; they need a website that pulls its weight: found when Westfield searches, answering when the shop floor is loud, booking while you finish the job. That's what we build, and Whip City Fiber means your customers will load it instantly.",
    neighborhoods: ['Downtown / Elm Street', 'Wyben', 'Munger Hill', 'Little River', 'Hampton Ponds', 'Southampton Road corridor'],
    languageNote:
      "The Westfield area has one of the region's largest Russian- and Ukrainian-speaking communities, alongside Spanish. English and Spanish come standard on everything we build — and our sites are multilingual by design, so adding the languages your customers actually speak is part of the job, not an upsell.",
    offers: [
      {
        title: 'Found when Westfield searches',
        body: 'From Elm Street shops to Southampton Road trades: a fast site, built from scratch with local SEO in the foundation, that shows up when your neighbors search for what you do.',
      },
      {
        title: 'Fast enough for Whip City Fiber',
        body: "Your city runs a municipal fiber network with 2.5-gig service. On connections that fast, a slow website has no excuse — ours are engineered for top Lighthouse scores.",
      },
      {
        title: 'Answered from the shop floor',
        body: "Manufacturers, trades, and shops can't stop to answer chat. Your site's AI agent takes the questions, qualifies the customer, and books the work — any hour.",
      },
      {
        title: 'Kept working, month after month',
        body: 'Monthly plans keep the site fast, secure, and ranking — with a plain-English report of what changed and what it did. Built like the things this city builds: to last.',
      },
    ],
    plansLine:
      'Website, AI agent, SEO, and maintenance together from $95/mo.',
    faqPricing:
      "Plans start at $95/mo and the first tier is complete: a custom-designed 1–3 page site, hosting and SSL, Remi answering customers 24/7, Google Business Profile setup, technical SEO, and ongoing maintenance. Month-to-month, nothing extra to start — prepay a year and two months are free. A full multi-page site with your own admin and Remi booking appointments is $245/mo, and one-time builds get a flat written quote.",
    faqBusinesses:
      "The businesses that make Westfield work: manufacturers and machine shops, contractors and tradespeople, the shops and restaurants of downtown and the Southampton Road corridor, and the services that follow Westfield State's four-and-a-half thousand students. The job underneath is the same — rank for what Westfield searches, answer while you work, and keep the site tended long after launch.",
    faqAgents:
      "Yes — and for a working city they earn their keep fast. Remi comes with every site plan and answers customers 24/7 in English or Spanish; the full roster (from $95/mo per agent) writes, posts, runs ads, and reports, managed for you. If nobody can leave the floor or the ladder to pick up the phone, an agent that answers and books is the difference between a missed call and a scheduled job.",
    faqOutside:
      "Yes — Westfield is about twenty minutes from our Springfield base, and we work across the whole valley: West Springfield, Agawam, Holyoke, Chicopee, Northampton, Southwick and the hilltowns. Remote works anywhere.",
    faqExisting:
      "Absolutely. We audit the site you have, fix what's costing you customers — speed, technical SEO, mobile problems, forms nobody completes — and then take over the maintenance so the fixes stick.",
    faqDifferent:
      "Twenty years of engineering for enterprise and startups — including enterprise eCommerce and consulting at Accenture — at prices scoped for a Westfield business. You talk directly to the person doing the work, no account manager in between.",
    servingBlurb:
      'Based in Springfield, twenty minutes east — on site in Westfield when it helps, remote when it\'s faster.',
    proofBusiness: 'VL Home Services',
    proofHeading: 'Proof from Western Massachusetts',
    proofCaseStudy: {
      slug: 'vl-home-services',
      line: 'VL Home Services ran on referrals and paper. Now a website brings in work, an admin tracks it, and an AI agent answers customers in any language.',
    },
    beyondWebHeading: 'The rest of the toolkit for the Whip City',
    beyondWeb: [
      {
        title: 'AI agents that work your hours',
        body: 'Agents that answer, qualify, and book while you run the shop — from $95/mo each, with Remi built into every site plan.',
        href: '/ai-team/',
        linkText: 'Meet the AI Team',
      },
      {
        title: 'Sell what you make, online',
        body: 'A store that syncs one catalog to Google Shopping, Instagram & Facebook — from $150/mo, platform subscription included.',
        href: '/ecommerce/',
        linkText: 'See store plans',
      },
      {
        title: 'Own the map when Westfield looks',
        body: 'Most local picks happen in the map pack. Google Business Profile setup or rescue: $145 one-time, or included in every monthly plan.',
        href: '/plans/get-found/',
        linkText: 'Get found on Google',
      },
      {
        title: '360° photos & virtual tours',
        body: "Google Street View tours and 360° photo packs cover the whole valley. Westfield sits just past the free-photo radius — we quote any small travel fee up front, always.",
        href: '/free-360-photo/',
        linkText: 'See 360° packs',
      },
    ],
    cityNow: {
      heading: 'Westfield right now: fighter jets, fiber, and a city that still makes things',
      paragraphs: [
        "Westfield's numbers run stronger than most people guess: 40,378 residents with a median household income of $87,753 — and of its 20,417 employed residents, manufacturing is still the third-largest sector (2,509 people), behind health care and education. The Whip City nickname isn't a museum piece; it's a working identity.",
        "The anchors are moving, too. The first F-35A Lightning IIs arrived at Barnes Air National Guard Base in June 2026 — initial jets on loan for training as the 104th Fighter Wing converts from F-15s — securing a base a 2019 state study credited with roughly 2,100 jobs and about $236 million in annual economic output. Westfield State University adds 4,588 students to the city's rhythm.",
        "And the part that matters most for a website: Westfield runs its own municipal fiber network. Whip City Fiber launched 2.5-gig residential service in February 2025 on fiber built out over the last decade. Your customers have some of the fastest home internet in New England — if your website is slow, it's the website.",
      ],
      sources: [
        { label: 'U.S. Census Bureau ACS 2024 (Census Reporter)', url: 'https://censusreporter.org/profiles/16000US2576030-westfield-ma/' },
        { label: 'Data USA — Westfield employment mix', url: 'https://datausa.io/profile/geo/westfield-ma' },
        { label: 'WWLP — F-35s arrive at Barnes (Jun 2026)', url: 'https://www.wwlp.com/news/local-news/hampden-county/f-35-fighter-jets-arrive-at-barnes-air-national-guard-base-in-westfield/' },
        { label: 'Mass.gov — Westfield-Barnes economic impact (2019 study)', url: 'https://www.mass.gov/news/massdot-celebrates-groundbreaking-of-taxiway-b-south-project-at-westfield-barnes-regional-airport' },
        { label: 'Whip City Fiber — 2.5 Gig launch (Feb 2025)', url: 'https://www.whipcityfiber.com/2025/02/14/2-5-gig-now-available-in-westfield' },
      ],
    },
    marketData: {
      heading: "What the state's small-business survey means in a manufacturing city",
      body: "When 1,049 Massachusetts small-business leaders were surveyed in fall 2025, the obstacle they named most often wasn't money — it was not being able to get clear, trustworthy information about which technology is actually worth it. In a city where the third-largest employment sector still makes physical things, that gap shows up as websites treated like a formality while the real work happens on the floor. Our answer is the same one a machine shop would give: published prices, work you can inspect, and tools that either pull their weight or don't ship.",
      source: 'Coalition for an Equitable Economy / MassINC Polling Group, 2025 Massachusetts Small Business Survey (1,049 respondents)',
      sourceUrl: 'https://www.massincpolling.com/our-work/2025-cee-survey',
    },
  },
  {
    slug: 'agawam',
    name: 'Agawam',
    badge: 'Agawam · Western Massachusetts',
    metaTitle: 'Web Design in Agawam, MA — SEO & AI Agents | MannyKnows',
    metaDescription:
      'Web design for Agawam and Feeding Hills businesses — fast websites with AI booking agents and local SEO, right across the river from Springfield. From $95/mo.',
    heroIntro:
      "Agawam does business the established way — family names, long memories, customers who come back. We put that reputation online: web design and development that ranks, an AI agent that answers around the clock, and someone across the river keeping it all working.",
    angleHeading: 'From Agawam Center to Feeding Hills, found first',
    angleBody:
      "Agawam is a town of established businesses — the median resident is 47, the farm stand has been in the same family since 1946, and word of mouth still closes most jobs. But the first look now happens on a phone: when someone in Feeding Hills searches for what you do, the business that shows up, loads fast, and answers first usually gets the call. We make sure that's you.",
    neighborhoods: ['Agawam Center', 'Feeding Hills', 'North Agawam', 'Walnut Street corridor', 'Springfield Street / Route 57'],
    languageNote:
      'English and Spanish come standard on everything we build — site, SEO, and AI agent — so every customer gets answered in their own language.',
    offers: [
      {
        title: 'The name they already trust, found first',
        body: "Agawam businesses run on reputation built over decades. We make the same name win the search: a fast site, built from scratch, ranking for what your neighbors actually type.",
      },
      {
        title: 'Answered while you\'re on the job',
        body: "Trades, services, family shops — nobody can stop to answer chat. Your site's AI agent takes questions, qualifies the customer, and books the estimate, day or night.",
      },
      {
        title: 'Ready for the seasonal wave',
        body: "Six Flags pulls crowds through town all season. A sharp Google profile and a fast site turn that passing traffic into customers who stop, order, and come back.",
      },
      {
        title: 'Cared for from across the river',
        body: 'We\'re minutes away in Springfield. Monthly plans keep the site fast, secure, and ranking — with a plain-English monthly report, and a real person one call away.',
      },
    ],
    plansLine:
      'Website, AI agent, SEO, and maintenance in one plan — from $95/mo.',
    faqPricing:
      "Plans start at $95/mo — a custom-designed 1–3 page site, hosting and SSL, Remi answering customers 24/7, Google Business Profile setup, technical SEO, and ongoing maintenance, with English and Spanish standard. Month-to-month, nothing extra to start; prepay a year and two months are free. The full multi-page tier with your own admin and Remi booking is $245/mo, and one-time builds get a flat written quote up front.",
    faqBusinesses:
      "Agawam's backbone: contractors and tradespeople, family restaurants and shops from Agawam Center to Feeding Hills, farm stands and seasonal businesses, and the services an established town leans on. The work underneath is constant — rank for what Agawam searches, answer when you can't, and keep the site tended for years.",
    faqAgents:
      "Yes — and in a town where most owners ARE the business, an agent that answers while you work is the highest-leverage hire there is. Remi comes with every site plan and answers 24/7 in English or Spanish; the full roster (from $95/mo per agent) writes, posts, runs ads, and reports, managed for you.",
    faqOutside:
      "Of course — Springfield is directly across the river (home base), and the rest of the valley is minutes away: West Springfield, Westfield, Chicopee, Holyoke, up to Northampton. Remote works anywhere.",
    faqExisting:
      "Yes, and you keep what you paid for. We audit the existing site, fix what's dragging it down — speed, technical SEO, mobile layout, forms nobody completes — and maintain it going forward so the fixes stick.",
    faqDifferent:
      "Enterprise engineering at family-business prices: twenty years building for enterprise and startups, including enterprise eCommerce and consulting at Accenture. When you call, you get the person doing the work — in English or Spanish.",
    servingBlurb:
      "Based in Springfield, directly across the river — easy to stop by in person, just as easy to handle remotely.",
    proofBusiness: 'SL Painting',
    proofHeading: 'Proof from across the river',
    proofCaseStudy: {
      slug: 'sl-painting',
      line: 'SL Painting had nothing online. Today they rank #1 on Google — organically — for exterior painting in Springfield, with an AI agent qualifying leads around the clock.',
    },
    beyondWebHeading: 'More tools for an established business',
    beyondWeb: [
      {
        title: 'AI agents, hired like staff',
        body: 'Remi answers your site around the clock, and ten more agents write, post, run ads, and report — from $95/mo each, managed by Manny.',
        href: '/ai-team/',
        linkText: 'Meet the AI Team',
      },
      {
        title: 'A store for what you grow or make',
        body: 'From farm stands to family shops: one catalog synced to Google Shopping, Instagram & Facebook — from $150/mo, platform subscription included.',
        href: '/ecommerce/',
        linkText: 'See store plans',
      },
      {
        title: 'Win the map from Feeding Hills to the Center',
        body: 'Most local picks happen in the map pack before a website ever loads. Profile setup or rescue: $145 one-time, or included in every plan.',
        href: '/plans/get-found/',
        linkText: 'Get found on Google',
      },
      {
        title: 'A free 360° photo of your business',
        body: "Agawam is right across the river — well inside our free travel radius. One professional 360° photo for your Google profile, free, no strings.",
        href: '/free-360-photo/',
        linkText: 'Claim the free photo',
      },
    ],
    cityNow: {
      heading: 'Agawam right now: steady numbers, a seasonal engine, and a town reinvesting',
      paragraphs: [
        "Agawam — officially still the 'Town of Agawam,' though it's legally a city — holds about 28,500 residents with a median household income around $85,000 and a median age near 47: an established, settled market where reputations run long. The businesses match: E. Cecchi Farms has run its Feeding Hills farm stand in the same family since 1946, now in its third generation.",
        "The seasonal engine is real: Six Flags New England, the region's largest theme park, announced hiring for more than 2,000 part-time and seasonal positions for its 2025 season — and its newest coaster, Quantum Accelerator, opened in April 2026 after a delayed debut. Every one of those season's visitors passes through Agawam's corridors deciding where to eat and stop, phone in hand.",
        "And the town is reinvesting where local business lives: in December 2025 Agawam won a $135,000 state community planning grant to revitalize the Walnut Street downtown area. When the street gets its next act, the businesses customers can find online will be the ones that grow with it.",
      ],
      sources: [
        { label: 'U.S. Census Bureau ACS 2024 (Census Reporter)', url: 'http://censusreporter.org/profiles/06000US2501300840-agawam-town-city-hampden-county-ma/' },
        { label: 'NEPM — E. Cecchi Farms, three generations', url: 'https://connectingpoint.nepm.org/e-cecchi-farms-in-agawam-celebrates-76-years-of-local-food' },
        { label: 'Amusement Today — Six Flags 2025 seasonal hiring', url: 'https://amusementtoday.com/2025/02/six-flags-new-england-begins-hiring-for-2025-season-with-more-than-2000-positions/' },
        { label: 'Western Mass News — Walnut Street planning grant (Dec 2025)', url: 'https://www.westernmassnews.com/2025/12/24/agawam-receives-grant-revitalize-neighborhood/' },
      ],
    },
    marketData: {
      heading: 'Why an established town still needs a first impression',
      body: "The state's fall-2025 survey of 1,049 small-business owners found the most common barrier to growth wasn't funding — it was getting clear, trustworthy information about what's worth doing online. Agawam feels that gap differently than a college town: here the business is often decades old, the reputation is settled, and the website was an afterthought because word of mouth carried everything. But the next generation of customers — and the wave of visitors Six Flags pulls through town every season — checks the map and the site first. The reputation deserves a first impression that matches it.",
      source: 'Coalition for an Equitable Economy / MassINC Polling Group, 2025 Massachusetts Small Business Survey (1,049 respondents)',
      sourceUrl: 'https://www.massincpolling.com/our-work/2025-cee-survey',
    },
  },
];

export function getLocalArea(slug: string): LocalArea | undefined {
  return localAreas.find((a) => a.slug === slug);
}
