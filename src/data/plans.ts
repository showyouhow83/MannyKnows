// Single source of truth for the monthly plans (homepage cards, /plans cards,
// and the /plans/<slug> detail pages). Prices are "Starting at" — they climb as
// scope is tailored to each client. Multilingual sites are standard.
//
// The four website tiers are an incremental ladder — each one is "everything in
// the tier below, plus…", and the built-in AI agent (Remi) gains capability as
// you climb: answers → books → sells → shopping assistant. Business Ads and
// Multimedia Agency are broader services shown as their own sections on /plans
// (hidden from the pricing grid), not website tiers.
//
// Pricing model:
//   • Month-to-month: `price`/mo, cancel anytime.
//   • Yearly (prepaid): pay the year upfront — yearlyTotal = price × 10, the
//     equivalent of 2 months free. yearlyMonthly = the per-month equivalent,
//     shown for comparison only.

export interface PlanFaq {
  q: string;
  a: string;
}

export interface PlanSection {
  title: string;
  items: string[];
}

// Sub-plans inside a service (e.g. Business Ads: per-network vs full coverage).
// Rendered as pricing cards on the detail page; add features progressively —
// each string is one check-marked line on the card.
export interface PlanTier {
  name: string;
  price: number;        // monthly $
  unit: string;         // shown right after the price, e.g. '/mo per network'
  note: string;         // small line under the price
  description: string;  // one-liner on the tier card
  builtOn?: string;     // "Everything in <tier>, plus" lead line
  features: string[];
  featured?: boolean;   // "best value"
}

export interface Plan {
  slug: string;
  name: string;
  metaTitle?: string;   // detail-page <title> override; default is "<name> Plan: from $X/mo | MannyKnows"
  icon: string;         // SVG path (the `d` attribute of a 24×24 stroke icon)
  price: number;        // monthly $ (month-to-month), shown as "Starting at $X/mo"
  priceUnit?: string;   // overrides the "/mo" after `price` (e.g. '/wk' for weekly retainers)
  tagline: string;      // one-line promise on the card
  // Detail-page CTA overrides. Defaults: "Get started with <name>", "See it in our portfolio",
  // and a "Book a call" button. Set per plan when the sales motion differs.
  ctaLabel?: string;
  portfolioLabel?: string;
  hideBooking?: boolean;
  // Replaces the generic `planIll` line illustration in the detail-page hero.
  heroMascot?: { src: string; width: number; height: number };
  // Overrides the "Month-to-month · cancel anytime · …" line under the CTAs.
  terms?: string;
  builtOn?: string;     // "Everything in <tier>, plus" lead line (incremental ladder)
  highlights: string[]; // punchy bullets for the card (the additions, for tiers that build on another)
  featured?: boolean;   // "most popular"
  hidden?: boolean;     // kept for its detail page + /plans section, but not shown in the pricing grid
  tiers?: PlanTier[];   // sub-plans (replaces the generic price block on the detail page)
  tiersHeading?: string; // heading over the tier cards (defaults to "Pick your plan")
  tiersIntro?: string;   // paragraph under that heading
  // Detail page (/plans/<slug>) content:
  headline: string;     // hero headline on the detail page
  blurb: string;        // hero paragraph on the detail page
  whoFor: string;       // "built for" line
  deliverables: PlanSection[]; // grouped, concrete "what's included"
  steps: { title: string; body: string }[]; // how it works
  faq: PlanFaq[];
}

export const yearlyTotal = (p: Plan) => p.price * 10;
export const yearlyMonthly = (p: Plan) => Math.round((p.price * 10) / 12);

export const plans: Plan[] = [
  {
    slug: 'get-found',
    name: 'Get Found',
    metaTitle: 'Get Found: Local SEO & Website, Western Mass | MannyKnows',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    price: 95,
    tagline: "Everything a new business needs to exist online and be found: nothing it doesn't.",
    highlights: [
      'A custom-designed 1–3 page website',
      'Logo design included',
      'Hosting, SSL, and speed handled: nothing extra to buy',
      'Set up to rank on Google & Maps when locals search for you',
      'A contact form that reaches you the moment someone fills it',
      '“Remi”, your AI agent, answering customer questions 24/7',
      'Linked up to the social accounts you already have',
    ],
    headline: 'Get online, get found, start answering customers',
    blurb:
      "The simple one. A sharp 1\u20133 page website designed for your business (logo included if you need one), hosted and kept fast, set up to show up when locals search you on Google, with a contact form that reaches you and “Remi” answering questions around the clock. If you're just getting online \u2014 or what you have is embarrassing \u2014 this is where you start.",
    whoFor:
      "New and small businesses that need a real website, need to be findable, and don't need anything complicated yet.",
    deliverables: [
      {
        title: 'Your Brand Brain',
        items: [
          'A private AI knowledge base of your business: services, prices, and voice',
          'The site and “Remi” both read from it, so nothing goes stale or off-brand',
        ],
      },
      {
        title: 'The website',
        items: [
          'Designed and built for your business: 1–3 focused pages, not a template',
          'Multilingual as standard, never an add-on (English + Spanish, or your customers’ languages)',
          'Mobile-first and fast, tuned for near-perfect speed scores',
          'Your services, photos, and service area: structured so Google understands them',
        ],
      },
      {
        title: '“Remi”: your AI agent',
        items: [
          'Answers customer questions 24/7, in your customer’s language',
          'Trained on your business: services, prices, hours, and how you talk',
          'Hands off to you the moment a human should take over',
        ],
      },
      {
        title: 'Your own admin',
        items: [
          'Run the site yourself: update pages, posts, photos, and prices without waiting on us',
          'Every lead, contact, and inquiry “Remi” captures, tracked in one place',
          'Control “Remi” from it too: what it knows, what it says, what it hands to you',
          'Built around your business: we add the sections you actually need (estimates, projects, contracts, portfolio) and leave out the ones you don’t',
        ],
      },
      {
        title: 'Getting found & kept running',
        items: [
          'Google Business Profile created or cleaned up and verified',
          'Technical SEO so your site is indexable and fast',
          'Monthly updates, monitoring, security, and backups',
        ],
      },
      {
        title: 'Hosting, security & content',
        items: [
          'SSL certificate, DDoS protection, and content caching across 330+ cities',
          'Unlimited storage and bandwidth, no metered overages or surprise bills',
          'Unlimited stock photography, video, and logos (via our Envato Elements license)',
          'Four content updates a month: most turned around within one business day',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'We learn your business: what you do, who your customers are, and the questions they keep asking.' },
      { title: 'We design & build', body: 'You approve the design before it goes live. Usually a couple of weeks from kickoff.' },
      { title: '“Remi” learns your business', body: 'We train the agent on your services and voice, then test it before it ever talks to a customer.' },
      { title: 'Every month after', body: 'Updates, monitoring, and tuning: you send changes, we handle them.' },
    ],
    faq: [
      { q: '$95 a month seems low. How?', a: 'Here is the math. Get Found is a focused 1–3 page site, not a twenty-page build, so it is less work. It is a monthly plan rather than a one-time project, so the build cost is spread across the relationship instead of landing as a bill up front. And you are hiring one experienced person with almost no overhead, not an agency with a sales team and an office to pay for. If you need a full multi-page site with an agent that books work, that is Get Booked at $245. We would rather point you there than stretch this plan past what it is.' },
      { q: 'Do I own the website?', a: 'Yes. The domain and content are yours; if you ever leave, the site goes with you. The plan covers the work and the upkeep, not a rental.' },
      { q: 'Is there a setup fee?', a: 'No. Designing and building the site is included in the monthly price: work that published 2026 pricing surveys put at $3,000–$15,000 as an up-front project. You pay $95 the first month and $95 every month after.' },
      { q: 'Can “Remi” book appointments on this plan?', a: 'On Get Found, “Remi” answers questions and captures every lead. To have it book jobs into your calendar, move up to Get Booked; to have it sell and point shoppers to products, Get Growing. You can upgrade anytime and the work carries forward.' },
      { q: 'What if I cancel?', a: 'Month-to-month, cancel anytime and keep your domain, your content, and the site itself. Nothing is owed after you leave. Prepaid annual terms aren’t refundable once the year starts: details in our terms.' },
    ],
  },
  {
    slug: 'get-booked',
    name: 'Get Booked',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    price: 245,
    tagline: 'Your AI site now books the job: “Remi” answers, captures leads, and fills your calendar.',
    builtOn: 'Everything in Get Found, plus',
    highlights: [
      'A full multi-page site with deeper self-optimization: more content & SEO kept fresh',
      '“Remi” now books the job into your calendar, not just answers',
      'Local SEO and AI search optimization: rank for what customers search, and get quoted in AI answers',
    ],
    headline: 'A website that answers and books, for you',
    blurb:
      "Everything in Get Found, on a full multi-page site, and now “Remi” books the job. Powered by your Brand Brain, “Remi” answers, captures the lead, and puts appointments straight on your calendar 24/7, in any language. Deeper local SEO helps the right customers find you first. It's the plan for service businesses that live or die by the booked appointment.",
    whoFor:
      'Service businesses (contractors, clinics, daycares, professional offices) that need more than answers: they need the appointment captured while the customer is ready.',
    deliverables: [
      {
        title: 'The website',
        items: [
          'A full multi-page website, designed and built for your business',
          'Mobile-first and fast, structured so Google understands your services',
        ],
      },
      {
        title: '“Remi”: answers & books',
        items: [
          'Answers customers and books appointments straight onto your calendar',
          'Captures every lead into your admin so nothing slips through',
          'Works 24/7 in your customer’s language, trained on your business',
          'Your admin grows with it: calendar and availability you control, and a lead pipeline you can actually work',
        ],
      },
      {
        title: 'Getting found & kept running',
        items: [
          'Deeper local SEO + Google Business Profile, tuned for your area',
          'Readiness for AI answer engines, not just classic search',
          'Monthly content updates, monitoring, security, and backups',
        ],
      },
      {
        title: 'Unlimited content updates',
        items: [
          'From this plan up, there is no cap on change requests and no per-change fee',
          'Send them any way you like: most are turned around within one business day',
          'Covers your existing pages, copy, images, and products (new features and redesigns are quoted separately)',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'We learn your business, your services, and what a booked job is worth to you.' },
      { title: 'We design & build', body: 'The full site, approved by you before launch: typically a few weeks.' },
      { title: '“Remi” learns to book', body: 'We connect “Remi” to your calendar and train it on your booking rules, then test it hard.' },
      { title: 'Every month after', body: 'Updates, fresh content, monitoring, and tuning as the bookings come in.' },
    ],
    faq: [
      { q: 'What does this add over Get Found at $95?', a: 'Two things worth the difference. The site grows from a few pages into a full multi-page build, and “Remi” stops only answering questions and starts booking work into your calendar: which is the part that pays for the plan. Every booking and lead lands in your admin, so nothing slips.' },
      { q: 'How does “Remi” book appointments?', a: 'We connect it to your calendar or booking tool and train it on your availability and rules. It qualifies the customer, offers real times, and books, then logs the lead in your admin.' },
      { q: 'I already have a website, do I have to start over?', a: 'No. If it has good bones, we optimize it and add “Remi” and the SEO on top. If it’s holding you back, we rebuild it: same plan either way.' },
      { q: 'Can I upgrade later?', a: 'Yes, move up to Get Growing to have “Remi” sell and the site keep itself fresh, or add a store with Sell Online. The work carries forward.' },
    ],
  },
  {
    slug: 'get-growing',
    name: 'Get Growing',
    icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 010 18M12 3a15.3 15.3 0 000 18',
    price: 545,
    tagline: 'A website that runs itself: writes its own content, tunes its own SEO & speed, and sells with “Remi”.',
    builtOn: 'Everything in Get Booked, plus',
    highlights: [
      'Full self-optimization: like a web developer on your site 24/7, writing content and tuning SEO & speed continuously',
      '“Remi” sells: steers customers to the right service and asks for the job',
      'Immersive 360° galleries, built to get picked by AI search (ChatGPT, Google AI)',
    ],
    featured: true,
    headline: 'A website that writes, optimizes, and sells on its own',
    blurb:
      "This is where the website comes alive. On top of everything in Get Booked, your site runs itself off the Brand Brain: writing its own fresh content and tuning its own SEO and speed, so it never goes stale, the closest thing to a full-time web developer on your site. “Remi” goes from booking to selling: answering, booking, and steering shoppers to the right product or service, with you approving anything that matters. Need the full content team too? Add the AI Team anytime. A website that works and an agent that works it, for a monthly price, not a big upfront bill.",
    whoFor:
      'Established service businesses and shops whose customers search Google and call (painters, contractors, daycares, clinics, law offices) that want the site and the agent doing the selling.',
    deliverables: [
      {
        title: 'The website',
        items: [
          'Designed and built for your business, or your current one, rebuilt right',
          'Updates itself: fresh, relevant content and SEO kept current for you',
          'Your admin gets the controls for that: review, edit, or roll back anything the site writes, and steer what “Remi” pushes',
        ],
      },
      {
        title: '“Remi”: answers, books & sells',
        items: [
          'Points shoppers to the right product or service in your catalog, and upsells',
          'Answers and books 24/7 in your customer’s language, trained on your business',
          'Every conversation becomes a lead in your admin, with human handoff built in',
        ],
      },
      {
        title: 'Getting found',
        items: [
          'Technical SEO + AI-search (AEO) readiness: structure, speed, schema, local signals',
          '360° image galleries and walkthroughs: customers step inside before they visit',
          'Google Search Console integration: indexing and search performance watched against Google’s own data',
        ],
      },
      {
        title: 'Kept running, every month',
        items: [
          'Content updates and fixes: send us changes, we handle them',
          'Monitoring, security, and backups',
          'Ongoing SEO and conversion tuning as the numbers come in',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'We take the time to really understand your business: what you sell, who buys, how you sound, and what a good month looks like.' },
      { title: 'We design & build', body: 'You see the design before it goes live and we adjust until it’s right. Typically a few weeks from kickoff to launch.' },
      { title: '“Remi” learns to sell', body: 'We train the agent on your catalog, prices, and rules, then test it hard before it ever talks to a customer.' },
      { title: 'Every month after', body: 'Fixes, updates, monitoring, and tuning, plus the site keeping itself fresh.' },
    ],
    faq: [
      { q: 'I already have a website, do I have to start over?', a: 'No. If your current site has good bones, we optimize it and add the AI agent and SEO on top. If it’s holding you back, we rebuild it: same plan either way.' },
      { q: 'Do I own the website?', a: 'Yes. The domain is yours, the content is yours, and if you ever leave, the site goes with you. The plan covers the work and the upkeep, not a rental.' },
      { q: 'How does “Remi” know what to say?', a: 'We train it on your business, services, prices, hours, catalog, and the questions customers keep asking. You review how it answers before it goes live, and we keep refining it.' },
      { q: 'What does "updates itself" mean?', a: 'Low-risk upkeep runs on automation, continuously: speed, search signals, tightening titles and descriptions, adding answers to questions customers keep asking. Anything about your prices, promises, or voice reaches you as a preview for your OK first. Either way the site never goes stale, and your admin keeps the record of everything it changed, ready to review or roll back.' },
      { q: 'What happens if I cancel?', a: 'Month-to-month, cancel anytime and keep your domain and content. Prepaid annual terms aren’t refundable once the year starts: details in our terms.' },
    ],
  },
  {
    slug: 'get-ahead',
    name: 'Get Ahead',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    price: 895,
    tagline: 'Get Growing plus your advertising, run for you: the site brings them in, the ads bring more.',
    builtOn: 'Everything in Get Growing, plus',
    highlights: [
      'Your ads run and managed on two networks (Google and a social platform, or two social): the same Business Ads service, bundled in',
      'Priced as a bundle: $1,245/mo of service for $895. You keep $350 every month',
      'You fund the ad spend directly with the platform; we never mark it up',
      'Landing pages built for each campaign, so ads land somewhere built to convert',
      'A monthly working session with Manny: what the numbers say, what changes next',
    ],
    headline: 'For businesses ready to lead their market',
    blurb:
      "This is Get Growing ($545) with our Business Ads service on two networks ($700) bundled together \u2014 $1,245 a month of service for $895, because these are the two things that actually compound. Your site keeps improving itself and “Remi” keeps selling, while your ads bring new people to it, watched and corrected every month. Ad spend is separate and goes straight to the platform; we never mark it up. Once a month we sit down, read the numbers together, and decide what changes.",
    whoFor:
      'Established businesses that already get work from their site and want to take ground \u2014 multi-crew contractors, busy practices, shops with real competition.',
    deliverables: [
      {
        title: 'Everything in Get Growing',
        items: [
          'The self-optimizing website: writes its own content, tunes its own SEO and speed',
          '“Remi” selling and booking 24/7, your admin, multilingual as standard',
          'Every Get Found and Get Booked capability underneath it',
        ],
      },
      {
        title: 'Managed advertising',
        items: [
          'Your ads on two networks (Google and a social platform, or two social platforms) set up and managed for you',
          'Each network gets its own competitive and market analysis, and its own plan, no two run the same way',
          'Campaigns aimed at booked work (calls, quotes, appointments) not vanity clicks',
          'Your ad budget is separate and paid directly to the platform; we never mark it up or hide it',
          'Need more networks? Add them at the Business Ads rate: $350/mo each',
          'Landing pages built for each campaign, so ads land on pages made to convert',
        ],
      },
      {
        title: 'Manny, every month',
        items: [
          'A monthly working session: what the numbers say, what we change next',
          'A report of what ran, what it cost, and what it brought in',
          'Priority handling: your requests go to the front of the line',
        ],
      },
    ],
    steps: [
      { title: 'Audit & plan', body: "We start with what you have (site, rankings, past ads) and agree on where the money should go before any of it is spent." },
      { title: 'Engine live', body: 'Site tuned, campaigns launched, tracking wired so every dollar is accounted for.' },
      { title: 'Monthly loop', body: "We meet, read the numbers together, and adjust. What's working gets more; what isn't gets cut." },
    ],
    faq: [
      { q: 'Is the ad budget included in the $895?', a: 'No, and no serious agency includes it. Your ad spend is separate, you set the budget, and it goes directly to the platform. We never mark it up, and you see exactly what was spent where in your monthly report.' },
      { q: 'Why is this cheaper than buying the pieces separately?', a: "Because it's the same work coordinated once instead of quoted twice. À la carte, Get Growing is $545 and Business Ads on two networks is $700: $1,245 a month. Bundled it's $895, so you keep $350. We can do that because the ads and the site stop being two separate projects: the landing pages the campaigns need are pages your site already builds itself, and what the ad data teaches us goes straight back into what the site writes next. You're paying once for one loop instead of twice for two halves of it." },
      { q: 'How is this different from a big agency?', a: "Published 2026 pricing guides put full agency retainers at $2,000–$10,000 a month, usually behind a minimum-term contract, and many agencies keep the website if you leave. Get Ahead is month-to-month and everything (the site, the content, the ad accounts) belongs to you." },
      { q: 'Do I need this, or is Get Growing enough?', a: "If your site and “Remi” keep you as busy as you want, Get Growing is enough. Get Ahead is for when you want to actively take ground, outrank and out-advertise the competition, with someone accountable for the whole engine, not just the website." },
    ],
  },
  {
    slug: 'sell-online',
    name: 'Online Store',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 17a2 2 0 100 4 2 2 0 000-4zM9 19a2 2 0 11-4 0 2 2 0 014 0z',
    price: 150,
    tagline: 'Your store built, stocked, and run for you: every tier includes the Shopify subscription.',
    highlights: [
      'A real Shopify store, set up right: theme, payments, shipping, taxes',
      'Your Shopify subscription is included in the price: one bill, not two',
      '“Remi” answers shoppers 24/7 from day one; higher tiers make it sell',
    ],
    headline: 'Online stores that sell while your business is closed',
    blurb:
      "Setting up a store is easy: anyone can click through a signup. Setting up a store that sells is a job: the right products, written right and organized the way people shop, with emails that bring customers back and a checkout nobody abandons. That's the job, and it comes in four sizes, from a well-run store at $150/mo to a store with its own ad engine. Every tier includes your Shopify subscription and is run like the enterprise eCommerce operations we spent years building.",
    whoFor:
      "Retailers, dealers, makers, and brands that want to sell online, starting from zero, or already selling on Etsy, Square, or Instagram. You don't have to leave those channels: one catalog runs them all, from a store you own.",
    // The four tiers ARE the product — modeled on what ecommerce agencies
    // actually sell as monthly retainers (catalog management, product copy,
    // store SEO, email flows/campaigns, CRO, ads), sized down to local-business
    // prices. Every price includes a Shopify subscription, scaled to the tier:
    // Basic ($39/mo retail, 2026) at Sell Online and Sell More; Grow ($105/mo)
    // at Sell Smarter and Sell Everywhere, because stores that size need the
    // staff seats and shipping rates anyway. Advanced/Plus are the enterprise
    // path — client pays Shopify the difference. Margins assume these numbers;
    // don't quote Shopify's prices in copy (theirs change), and never remove
    // the inclusion without repricing.
    tiers: [
      {
        name: 'Sell Online',
        price: 150,
        unit: '/mo',
        note: 'Shopify Basic subscription included',
        description: 'Everything a working store needs: set up right and kept running.',
        features: [
          'Shopify store configured properly: theme, payments, shipping, taxes, checkout',
          'Your Shopify (Basic) subscription included: the account is yours, we run it',
          'Products loaded and organized, up to 10 product adds or changes a month',
          'SEO product descriptions for your whole catalog: drafted with AI from your Brand Brain, reviewed, and optimized to rank',
          'Store SEO basics: titles, metas, and product schema set up right',
          '“Remi” answers shopper questions 24/7, in any language',
          'Your catalog published and synced to Google Shopping, Instagram & Facebook: one catalog, every channel',
          'Discount codes and gift cards set up when you need them',
          'Monitoring, order-email basics, and a clear monthly report',
        ],
      },
      {
        name: 'Sell More',
        price: 325,
        unit: '/mo',
        note: 'Shopify Basic subscription included',
        description: 'The store starts pulling its weight: copy, SEO basics, and email doing the selling.',
        builtOn: 'Everything in Sell Online, plus',
        features: [
          'Store SEO on autopilot: titles, metas, schema, and collections tuned continuously by AI',
          'Email flows set up and running: welcome, abandoned cart, post-purchase',
          'Reviews collected automatically and shown where they convert',
          'Marketplace sync: catalog and inventory kept in step on Etsy, Amazon, or Square, sell everywhere without overselling anywhere',
          'Seasonal promos and campaigns set up for you',
          'Up to 30 product adds or changes a month',
        ],
      },
      {
        name: 'Sell Smarter',
        price: 650,
        unit: '/mo',
        note: 'Shopify Grow subscription included',
        description: 'The full selling machine: an AI shopping assistant, a real SEO program, and a store that improves itself.',
        builtOn: 'Everything in Sell More, plus',
        featured: true,
        features: [
          'Your included Shopify subscription upgrades to Grow: staff accounts and shipping discounts a store this size needs',
          '“Remi” becomes a true AI shopping assistant: recommends, answers, and upsells from your Brand Brain',
          'Full eCommerce SEO program: keyword strategy, collection pages, content that ranks',
          'Email and SMS campaigns every month, not just automated flows',
          'Multilingual storefront as standard',
          'Conversion work: we watch what stalls and fix it, page by page',
          'Your store doubles as your full website: pages, blog, and SEO run the Get Growing way',
          'Up to 100 product adds or changes a month',
        ],
      },
      {
        name: 'Sell Everywhere',
        price: 1095,
        unit: '/mo',
        note: 'Shopify Grow subscription included',
        description: 'The store plus its own ad engine: bought separately this is $1,350/mo of service.',
        builtOn: 'Everything in Sell Smarter, plus',
        features: [
          'Your ads run and managed on two networks: Google Shopping and a social platform, or two social',
          'Product feeds synced where buyers browse: Google, Instagram & Facebook Shops',
          'Landing pages built for each campaign, so ads land somewhere built to convert',
          'Ad spend is separate and paid straight to the platform, never marked up',
          'A monthly working session with Manny: what the numbers say, what changes next',
          'Priced as a bundle: $650 + $700 of Business Ads for $1,095. You keep $255 every month',
        ],
      },
    ],
    deliverables: [
      {
        title: 'The storefront: every tier',
        items: [
          'Shopify store with a theme configured for your brand: payments, taxes, shipping, and checkout done properly',
          'Your Shopify subscription included in the price; the account belongs to you',
          'Moving from Etsy, Wix, Square, or WooCommerce? Migration is part of setup',
          'Domain, SSL, and speed handled: nothing extra to buy',
        ],
      },
      {
        title: 'Your products',
        items: [
          'Products loaded, organized into collections, and kept current: monthly change quotas by tier',
          'SEO product descriptions at every tier: AI drafts them from your product data and Brand Brain, we review and optimize, your whole catalog, no per-product caps',
          'Your admin covers the store too: products, inventory, orders, and promos in one place',
        ],
      },
      {
        title: 'The selling machine',
        items: [
          '“Remi” answers shoppers 24/7 at every tier, and recommends, guides, and upsells from Sell Smarter up',
          'Email that brings people back: flows from Sell More, monthly campaigns from Sell Smarter',
          'Analytics wired up so we know what sells and what stalls',
        ],
      },
      {
        title: 'Kept selling, every month',
        items: [
          'New products, promos, and seasonal updates handled for you',
          'Ongoing optimization of pages that underperform',
          'A monthly report: what ran, what sold, what changes next',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'We learn what you sell, how you fulfill, and what a good month looks like, in your shop or on a call, and scope the right tier for it together.' },
      { title: 'Store build', body: 'Theme, products, payments, shipping, taxes, emails: the whole machine, and you approve it before launch. Existing stores migrate here too.' },
      { title: 'Launch & learn', body: 'Live, with “Remi” trained on your catalog. Early traffic shows us what to tune first.' },
      { title: 'Every month after', body: 'Products stay current, emails keep going out, SEO compounds, and on Sell Everywhere, ads feed the whole engine.' },
    ],
    faq: [
      { q: 'Is the Shopify subscription really included?', a: "Yes, and it scales with your tier. Sell Online and Sell More include Shopify's Basic plan, which is right for most stores starting out. Sell Smarter and Sell Everywhere include Shopify's Grow plan, because a store running campaigns with thousands of products needs its staff accounts and shipping rates anyway. Either way the account is opened in your name, so the store is yours, not ours. Enterprise operations that need Shopify Advanced or Plus: we run those too. You pay Shopify the difference and nothing else changes. Payment processing fees are Shopify's own and apply to every store on the platform; we never mark them up." },
      { q: 'Who actually writes thousands of product descriptions?', a: "AI does the drafting, from your product data, your photos, and your Brand Brain, so every description sounds like your store and is structured to rank. Then it gets reviewed and optimized before it ships; nothing goes live unread. That's why there are no per-product caps at prices a human-only agency can't touch: you approve the voice once, and your whole catalog gets covered." },
      { q: 'Why is the entry price $150 when agencies charge $1,000+ a month?', a: "Because the entry tier is a well-run store, not a growth program. The setup is systemized, the infrastructure is Shopify's, and “Remi” answers customers so you don't pay a person to. What costs $1,000+ at an agency (the going rate in 2026 pricing guides) is the work in the upper tiers (SEO programs, campaigns, ads, and product copy at real catalog scale) and that's exactly what those tiers add, at prices a local business can carry." },
      { q: 'I already have a store. Do I have to start over?', a: "No. We take over existing stores at any tier: audit what you have, fix what's costing you sales, and run it from there. If you're on Etsy, Wix, Square, or WooCommerce, moving your products to Shopify is part of setup." },
      // Twin-ladder model (Manny, Aug 2026): each store tier is a website
      // tier's twin — the delta is the store machinery + the Shopify
      // subscription. Lane switches are plan changes: clone the design, land
      // on whichever tier fits (not forced rung-to-rung), no migration fee.
      // Money rules: month-to-month switches take effect at the next renewal
      // (nothing to refund); prepaid switches within 7 days of kickoff can be
      // refunded in cash; after 7 days there are NO cash refunds — the unused
      // balance converts to service credit spendable on ANY MannyKnows
      // service, dollar for dollar. Side-by-side (two sites, two plans) was
      // deliberately dropped — the store's pages/blog/Remi cover the service
      // side.
      { q: 'Do I still need one of the website plans?', a: "No, each store tier is a website tier's twin, with the store machinery and your Shopify subscription added: Get Found ↔ Sell Online, Get Booked ↔ Sell More, Get Growing ↔ Sell Smarter, Get Ahead ↔ Sell Everywhere. Your store is your website: pages, blog, SEO, and “Remi” are all in it." },
      { q: 'What if I start selling later, or stop?', a: "Switching lanes is a plan change, not a project. We clone your design across: your store looks like your site did, and the other way around, your monthly moves to the new tier's price, and “Remi's” training and your content carry. No migration fee, and you land on whichever tier fits, not automatically the biggest one. Month-to-month, the change simply starts at your next renewal. Prepaid a year? Within 7 days of kickoff you can still get money back; after that the unused balance becomes credit, dollar for dollar, spendable on anything we do: your new plan, the AI Team, ads, photography." },
      { q: 'Is the ad budget included in Sell Everywhere?', a: 'No, and no serious agency includes it. Your ad spend is separate, you set the budget, and it goes directly to the platform. We never mark it up, and you see exactly what was spent where in your monthly report.' },
      { q: 'Can I move between tiers, or cancel?', a: "Month-to-month, move anytime, the work carries forward, so nothing is wasted. Prepay the year and you get 2 months free. And we'll tell you when a smaller tier covers what your store needs." },
      { q: 'Can you build the store as a one-time project instead?', a: "Yes, billed at a flat $75/hr and quoted up front. You'll still need to run it afterward: Shopify subscription, product updates, emails. Most owners hand that back to us with Sell Online at $150/mo once they've priced their own time." },
    ],
  },
  {
    slug: 'business-ads',
    name: 'Business Ads',
    icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    price: 350,
    hidden: true,
    tagline: 'The social, ads, and SEO that get you seen, priced per network, built to convert.',
    highlights: [
      '$350/mo per social network, or 4 major networks for $950/mo',
      'Every network gets its own competitive analysis and market analysis',
      'An individual plan traced per network: its own media types, formats & sizes',
      'Google Ads & social ads, managed (you fund the ad spend)',
      'Landing pages, banners, videos & SEO campaigns: watched and corrected monthly',
    ],
    headline: 'Get seen by the right people, ready to buy',
    blurb:
      "Traffic isn’t the goal; customers are. Business Ads runs your visibility one social network at a time: $350/mo per network, or 4 major networks for $950/mo. No two networks are alike, so no two get the same plan: each starts with a competitive analysis and a market analysis, then gets an individual plan traced for it, its own media types, formats, and sizes. Then we make the traffic count with managed ads, landing pages, and SEO, watching what the numbers do and correcting.",
    whoFor:
      'Businesses whose website or store already works, and who now need more of the right people finding it, steadily, not in one lucky spike.',
    tiersHeading: 'Pick your coverage',
    tiersIntro:
      'Start with one network or run them all. Every network you add gets the same treatment: its own competitive analysis, its own market analysis, and its own plan, because each one is a different world of media, formats, and sizes.',
    tiers: [
      {
        name: 'Per Network',
        price: 350,
        unit: '/mo per network',
        note: 'pick 1, 2, or as many as you need',
        description:
          'Choose the networks that fit your business (Facebook, Instagram, TikTok, YouTube, LinkedIn, X, Pinterest, and more) and pay only for those.',
        features: [
          'A competitive analysis of the network: who’s winning your market there, and how',
          'A market analysis of your audience on that network: who they are, when they’re active, what they respond to',
          'An individual plan traced for the network: its own media types, formats, and sizes',
          'Provided content will be branded, sized, and posted for that network',
          'Comments and messages sorted and answered by “Remi”, our AI agent',
          'An AI-generated monthly report per network: add or drop networks as results come in',
        ],
      },
      {
        name: 'Full Coverage',
        price: 950,
        unit: '/mo',
        note: 'covers 4 major networks',
        featured: true,
        builtOn: 'Everything in Per Network, on 4 major networks, plus',
        description:
          'Run the 4 networks that matter most for your business, for less than the price of 3 à la carte.',
        features: [
          'One coordinated strategy across every network: each still gets its own individual plan',
          'Cross-network reporting: what each network brings in, compared side by side',
          'Budget shifted to the networks that perform: every month',
          'Campaigns, promos, and launches rolled out everywhere at once',
        ],
      },
    ],
    deliverables: [
      {
        title: 'Per-network strategy',
        items: [
          'A competitive analysis for every network you’re on: who’s winning your market there, and how',
          'A market analysis per network: your audience, their habits, and what they respond to',
          'An individual plan traced for each network, because no two are alike: different media, formats, and sizes',
        ],
      },
      {
        title: 'Social media growth',
        items: [
          'Your content branded, sized, and posted for you, formatted for each network',
          'A consistent presence on the networks that fit your business',
          'Comments and messages sorted and answered by “Remi”, our AI agent',
        ],
      },
      {
        title: 'Managed advertising',
        items: [
          'Google Ads and social ads: strategy, setup, creative, and management',
          'You fund the ad spend directly with the platforms: we never mark it up',
          'Budgets, bids, and audiences tuned continuously, not set-and-forgotten',
        ],
      },
      {
        title: 'Traffic that converts',
        items: [
          'Landing pages built for each campaign, not ads pointed at your homepage',
          'Promotional banners, videos, and interactive widgets that turn visits into engagement',
          'SEO content campaigns that compound month over month',
        ],
      },
      {
        title: 'The correction loop',
        items: [
          'We watch how your traffic responds, and keep correcting and improving',
          'An AI-generated monthly report: what ran, what it cost, what it brought in',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'What you sell, who buys it, what a lead is worth, and which networks make sense to start with: one, two, or the full four.' },
      { title: 'Analysis & plan', body: 'For each network: a competitive analysis, a market analysis, and an individual plan traced for it, covering media types, formats, sizes, and cadence.' },
      { title: 'Launch campaigns', body: 'Tracking and landing pages go in first, then content and ads go live: fitted to each network. The early weeks are about learning fast, not vanity numbers.' },
      { title: 'Correct & compound', body: 'Every month: cut what underperforms, scale what works, shift budget to the networks that deliver, and report it clearly.' },
    ],
    faq: [
      { q: 'How does the per-network pricing work?', a: 'Each social network you want us to run is $350/mo, that covers the competitive analysis, the market analysis, an individual plan for that network, and the content and management to execute it. At $950/mo, Full Coverage handles 4 major networks under one coordinated strategy: less than the price of 3 à la carte.' },
      { q: 'Why does each network need its own plan?', a: 'Because each one is different, different audience, different media, different formats and sizes. A vertical Reel isn’t a Pin, and a LinkedIn post isn’t a TikTok. We trace an individual plan per network so the content fits where it lives, instead of being cross-posted everywhere and ignored.' },
      { q: 'Is ad spend included in the price?', a: 'No, ad spend goes directly from you to Google or the social platforms, at whatever budget we agree makes sense. The service covers strategy, creative, management, and optimization. We never mark up your spend.' },
      { q: 'How much ad spend do I need?', a: 'It depends on your market and goals, some businesses get meaningful results from a few hundred dollars a month. We’ll recommend a starting budget in the kickoff and adjust from real results.' },
      { q: 'My website is weak, should I still buy ads?', a: 'No. Ads pointed at a weak site burn money. Start with a website tier (or pair them), then pour traffic on.' },
    ],
  },
  {
    slug: 'multimedia-agency',
    metaTitle: 'Multimedia Agency: Web Development Retainer | MannyKnows',
    name: 'Multimedia Agency',
    icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
    price: 2350,
    priceUnit: '/wk',
    hidden: true,
    ctaLabel: 'Request more information',
    portfolioLabel: 'See it in action',
    hideBooking: true,
    heroMascot: { src: '/mascot/astro-multimedia.webp', width: 380, height: 407 },
    terms: 'Billed weekly or monthly · your domain and content stay yours',
    tagline: 'Hire Manny by the week and direct what gets built.',
    highlights: [
      'A developer on demand: any app, tool, or idea, designed, built & published for you',
      'All media handled: photography, videography, video editing, AI generation & graphic design',
      'All web & SEO: websites, landing pages, content, and continuous optimization',
      'In constant contact through the workday: every request gets a same-day answer',
    ],
    headline: 'A whole agency’s output. One person doing the work.',
    blurb:
      "You’re buying Manny’s time, not a package. One senior builder covers development, design, SEO, photo, and video, with AI multiplying the output, and builds whatever you point at (even the tool that doesn’t exist yet) while you watch and redirect.",
    whoFor:
      'Owners who’d rather sit in on the build than wait for a status update.',
    tiersHeading: 'Pick how you pay',
    tiersIntro:
      'One service, everything included either way, in constant contact through the workday. The only difference is the invoice.',
    tiers: [
      {
        name: 'Agency Weekly',
        price: 2350,
        unit: '/wk',
        note: 'cancel any week',
        description:
          'The full scope, billed week to week: one project at a time, each one finished and published before the next begins.',
        features: [
          'Everything is in scope: apps, websites, software, AI automation, management systems, design, video, photo, SEO',
          'In constant contact through the workday: every request gets a same-day answer, done that day or scheduled onto the roadmap',
          'Scheduled photo & video shoot days on site, as your projects call for them',
          'You direct the work and review it as it is built, not after',
          'Unlimited requests queued on the roadmap: you set the priorities',
        ],
      },
      {
        name: 'Agency Monthly',
        price: 8600,
        unit: '/mo',
        note: 'save about 15% vs weekly',
        featured: true,
        builtOn: 'Everything in Weekly, plus',
        description:
          'The same service on one monthly invoice, at about 15% off the week-to-week rate.',
        features: [
          'About $1,500 a month off the week-to-week rate',
          'One invoice: simpler bookkeeping',
          'Same scope, same schedule: nothing is gated by how you pay',
        ],
      },
    ],
    deliverables: [
      {
        title: 'A developer on demand',
        items: [
          'Custom apps and software for anything that comes to mind, designed, built, and published',
          'Ad campaigns that need an app? Built as part of the campaign',
          'AI automation for the busywork: quoting, scheduling, follow-ups, reporting',
          'Data pipelines and dashboards so decisions come from numbers, not guesses',
        ],
      },
      {
        title: 'All media, produced',
        items: [
          'Photography and videography: scheduled shoot days for your business, products, and campaigns',
          'Video editing and AI generation, handled continuously in between',
          'All graphic design and video design: menus, promos, banners, campaigns',
          'One brand voice across your site, store, ads, and social',
        ],
      },
      {
        title: 'Web, store & SEO',
        items: [
          'Your website designed, built, and kept fast, or your existing one rebuilt right',
          'A full online store added whenever you’re ready, done for you',
          'All SEO and all the HTML behind it. Everything in the Get Growing and Sell Online plans, under one roof',
        ],
      },
      {
        title: 'Promotion',
        items: [
          'Advertising and social handled end to end (you fund the ad spend)',
          'SEO content campaigns and landing pages',
          'Continuous optimization: the correction loop never stops',
        ],
      },
    ],
    steps: [
      { title: 'Tell us what you need built', body: 'A kickoff to hear the idea, the constraints, and what winning looks like. You point, we scope it, and it goes on the roadmap.' },
      { title: 'A shared roadmap', body: 'One prioritized queue across software, media, web, and promotion. Unlimited requests: you set the order, and you always know what we’re building and why.' },
      { title: 'Build, shoot & promote', body: 'The roadmap gets worked one project at a time: each one finished and published before the next begins. Shoot days happen on site as projects call for them; everything else runs remotely, in constant contact through the workday.' },
      { title: 'Review & reprioritize', body: 'A monthly working session plus the monthly report. Priorities shift as your business, and your competition, does.' },
    ],
    faq: [
      { q: 'What does "a developer on demand" mean?', a: 'If your business can imagine it, it’s in scope. An ad campaign that needs an app? Included. Software to organize scheduling, inventory, or quotes? Included. A tool that doesn’t exist anywhere? We design it, build it, and publish it. That’s the point of having a developer on retainer instead of a vendor per project.' },
      { q: 'What does "one active project at a time" mean?', a: 'Your requests are unlimited. They queue on the shared roadmap and you set the order. We work them one at a time, finishing and publishing each before the next begins.' },
      { q: 'Who actually does the work?', a: 'Manny. One senior builder covers development, design, SEO, and automation, with AI multiplying the output, and shoots the photography and video in person. You’re always talking to the person doing the work, not an account manager.' },
      { q: 'How does the weekly rhythm work?', a: 'Everything runs remotely, in constant contact through the workday: every request gets a same-day answer, either done that day or scheduled onto the roadmap with a date. Photo and video are the exception: those get shot on site, as shoot days planned around your projects and campaigns.' },
      { q: 'What’s the difference between weekly and monthly billing?', a: 'Only the invoice. Same scope, same communication. Monthly works out to about 15% less than paying week to week.' },
      { q: 'Are photo and video shoots included?', a: 'Yes, photography and videography are part of the package as scheduled shoot days, planned around your projects and campaigns. Editing, AI generation, and design are handled continuously in between.' },
      { q: 'What exactly does "everything" cover?', a: 'Websites, online stores, advertising, social, SEO, content, graphic design, photography, videography, video editing, AI generation, custom software, AI automation, and data work, queued on a shared roadmap. If your business needs it built, shot, or promoted, it’s in scope.' },
      { q: 'Can we start smaller and upgrade?', a: 'Yes, many clients start with Get Growing or Sell Online and move up when they’re ready for the full agency plan. The work carries forward when you upgrade, so nothing is wasted.' },
    ],
  },
];

// Website tiers shown in the pricing grid (Business Ads / Multimedia are their
// own sections on /plans).
// The four website tiers shown on /plans. The store lives on its own page
// (/ecommerce) — selling online is a different decision from getting found.
export const websitePlans = plans.filter((p) => !p.hidden && p.slug !== 'sell-online');
// Store plans — rendered on /ecommerce.
export const ecommercePlans = plans.filter((p) => p.slug === 'sell-online');
// Broader services shown as their own sections below the grid.
export const servicePlans = plans.filter((p) => p.hidden);
