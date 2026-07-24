// Single source of truth for the monthly plans (homepage cards, /plans cards,
// and the /plans/<slug> detail pages). Prices are "Starting at" — they climb as
// scope is tailored to each client. Multilingual sites are standard.
//
// The four website tiers are an incremental ladder — each one is "everything in
// the tier below, plus…", and the built-in AI agent (Desi) gains capability as
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

export interface Plan {
  slug: string;
  name: string;
  icon: string;         // SVG path (the `d` attribute of a 24×24 stroke icon)
  price: number;        // monthly $ (month-to-month), shown as "Starting at $X/mo"
  tagline: string;      // one-line promise on the card
  builtOn?: string;     // "Everything in <tier>, plus" lead line (incremental ladder)
  highlights: string[]; // punchy bullets for the card (the additions, for tiers that build on another)
  featured?: boolean;   // "most popular"
  hidden?: boolean;     // kept for its detail page + /plans section, but not shown in the pricing grid
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
    slug: 'basic-website',
    name: 'AI Smart Website I',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    price: 99,
    tagline: 'An AI-driven site on your own Brand Brain — with Desi answering customers 24/7.',
    highlights: [
      'Built on your Brand Brain — a private AI trained on your business',
      'Desi, your AI agent, answers customers 24/7 in their language',
      'A sharp 1–3 page site that optimizes itself — kept fast, current, and ahead of any basic website',
      'Found when locals search you on Google + Maps (profile set up for you)',
    ],
    headline: 'An AI-driven website — not a page that just sits there',
    blurb:
      "An AI-driven website that works, instead of a page that sits there. We build a sharp 1–3 page site on your own Brand Brain — a private AI trained on your business — and put Desi on it, your AI agent that answers customers 24/7 in any language. It's fast, secure, found on Google, and maintained every month. Ready for it to book jobs or sell too? Move up to AI Smart Website II or III anytime — the work carries forward.",
    whoFor:
      'New or smaller businesses that need a clean, credible website and an agent to field the questions that come in — without a big upfront bill.',
    deliverables: [
      {
        title: 'Your Brand Brain',
        items: [
          'A private AI knowledge base of your business — services, prices, and voice',
          'The site and Desi both read from it, so nothing goes stale or off-brand',
        ],
      },
      {
        title: 'The website',
        items: [
          'Designed and built for your business — 1–3 focused pages, not a template',
          'Mobile-first and fast, tuned for near-perfect speed scores',
          'Your services, photos, and service area — structured so Google understands them',
        ],
      },
      {
        title: 'Desi — your AI agent',
        items: [
          'Answers customer questions 24/7, in your customer’s language',
          'Trained on your business: services, prices, hours, and how you talk',
          'Hands off to you the moment a human should take over',
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
    ],
    steps: [
      { title: 'Kickoff', body: 'We learn your business — what you do, who your customers are, and the questions they keep asking.' },
      { title: 'We design & build', body: 'You approve the design before it goes live. Usually a couple of weeks from kickoff.' },
      { title: 'Desi learns your business', body: 'We train the agent on your services and voice, then test it before it ever talks to a customer.' },
      { title: 'Every month after', body: 'Updates, monitoring, and tuning — you send changes, we handle them.' },
    ],
    faq: [
      { q: 'Do I own the website?', a: 'Yes. The domain and content are yours; if you ever leave, the site goes with you. The plan covers the work and the upkeep, not a rental.' },
      { q: 'Can Desi book appointments on this plan?', a: 'On AI Smart Website I, Desi answers questions. To have it book jobs and capture leads, move up to AI Smart Website II; to have it sell and point shoppers to products, AI Smart Website III. You can upgrade anytime and the work carries forward.' },
      { q: 'What if I cancel?', a: 'Month-to-month, cancel anytime and keep your domain and content. Prepaid annual terms aren’t refundable once the year starts — details in our terms.' },
    ],
  },
  {
    slug: 'plus-website',
    name: 'AI Smart Website II',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    price: 199,
    tagline: 'Your AI site now books the job — Desi answers, captures leads, and fills your calendar.',
    builtOn: 'Everything in AI Smart Website I, plus',
    highlights: [
      'A full multi-page site with deeper self-optimization — more content & SEO kept fresh',
      'Desi now books the job & captures the lead — not just answers',
      'Ranks for more of what customers search — locally and in AI answers',
    ],
    headline: 'A website that answers and books — for you',
    blurb:
      "Everything in AI Smart Website I, on a full multi-page site — and now Desi books the job. Powered by your Brand Brain, Desi answers, captures the lead, and puts appointments straight on your calendar 24/7, in any language. Deeper local SEO helps the right customers find you first. It's the plan for service businesses that live or die by the booked appointment.",
    whoFor:
      'Service businesses — contractors, salons, clinics, daycares — that need more than answers: they need the appointment captured while the customer is ready.',
    deliverables: [
      {
        title: 'The website',
        items: [
          'A full multi-page website, designed and built for your business',
          'Multilingual as standard (English + Spanish, or your customers’ languages)',
          'Mobile-first and fast, structured so Google understands your services',
        ],
      },
      {
        title: 'Desi — answers & books',
        items: [
          'Answers customers and books appointments straight onto your calendar',
          'Captures every lead into your admin so nothing slips through',
          'Works 24/7 in your customer’s language, trained on your business',
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
    ],
    steps: [
      { title: 'Kickoff', body: 'We learn your business, your services, and what a booked job is worth to you.' },
      { title: 'We design & build', body: 'The full site, approved by you before launch — typically a few weeks.' },
      { title: 'Desi learns to book', body: 'We connect Desi to your calendar and train it on your booking rules, then test it hard.' },
      { title: 'Every month after', body: 'Updates, fresh content, monitoring, and tuning as the bookings come in.' },
    ],
    faq: [
      { q: 'How does Desi book appointments?', a: 'We connect it to your calendar or booking tool and train it on your availability and rules. It qualifies the customer, offers real times, and books — then logs the lead in your admin.' },
      { q: 'I already have a website — do I have to start over?', a: 'No. If it has good bones, we optimize it and add Desi and the SEO on top. If it’s holding you back, we rebuild it — same plan either way.' },
      { q: 'Can I upgrade later?', a: 'Yes — move up to AI Smart Website III to have Desi sell and the site keep itself fresh, or add a store with AI Smart eCommerce. The work carries forward.' },
    ],
  },
  {
    slug: 'smart-website',
    name: 'AI Smart Website III',
    icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 010 18M12 3a15.3 15.3 0 000 18',
    price: 349,
    tagline: 'A website that runs itself — writes its own content, tunes its own SEO & speed, and sells with Desi.',
    builtOn: 'Everything in AI Smart Website II, plus',
    highlights: [
      'Full self-optimization — like a web developer on your site 24/7, writing content and tuning SEO & speed continuously',
      'Desi sells — steers shoppers to the right product or service, and upsells',
      'Immersive 360° galleries, built to get picked by AI search (ChatGPT, Google AI)',
    ],
    featured: true,
    headline: 'A website that writes, optimizes, and sells — on its own',
    blurb:
      "This is where the website comes alive. On top of everything in AI Smart Website II, your site runs itself off the Brand Brain — writing its own fresh content and tuning its own SEO and speed, so it never goes stale — the closest thing to a full-time web developer on your site. Desi goes from booking to selling: answering, booking, and steering shoppers to the right product or service, with you approving anything that matters. Need the full content team too? Add the AI Team anytime. A website that works and an agent that works it — for a monthly price, not a big upfront bill.",
    whoFor:
      'Established service businesses and shops whose customers search Google and call — painters, contractors, daycares, salons, clinics — that want the site and the agent doing the selling.',
    deliverables: [
      {
        title: 'The website',
        items: [
          'Designed and built for your business — or your current one, rebuilt right',
          'Multilingual as standard, mobile-first, and tuned for near-perfect speed',
          'Updates itself: fresh, relevant content and SEO kept current for you',
        ],
      },
      {
        title: 'Desi — answers, books & sells',
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
          '360° image galleries and walkthroughs — customers step inside before they visit',
          'Google Search Console integration — indexing and search performance watched against Google’s own data',
        ],
      },
      {
        title: 'Kept running, every month',
        items: [
          'Content updates and fixes — send us changes, we handle them',
          'Monitoring, security, and backups',
          'Ongoing SEO and conversion tuning as the numbers come in',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'We take the time to really understand your business — what you sell, who buys, how you sound, and what a good month looks like.' },
      { title: 'We design & build', body: 'You see the design before it goes live and we adjust until it’s right. Typically a few weeks from kickoff to launch.' },
      { title: 'Desi learns to sell', body: 'We train the agent on your catalog, prices, and rules — then test it hard before it ever talks to a customer.' },
      { title: 'Every month after', body: 'Fixes, updates, monitoring, and tuning — plus the site keeping itself fresh.' },
    ],
    faq: [
      { q: 'I already have a website — do I have to start over?', a: 'No. If your current site has good bones, we optimize it and add the AI agent and SEO on top. If it’s holding you back, we rebuild it — same plan either way.' },
      { q: 'Do I own the website?', a: 'Yes. The domain is yours, the content is yours, and if you ever leave, the site goes with you. The plan covers the work and the upkeep, not a rental.' },
      { q: 'How does Desi know what to say?', a: 'We train it on your business — services, prices, hours, catalog, and the questions customers keep asking. You review how it answers before it goes live, and we keep refining it.' },
      { q: 'What does "updates itself" mean?', a: 'We keep your content and SEO current for you — refreshing pages, adding relevant content, and tightening search signals each month — so the site doesn’t go stale.' },
      { q: 'What happens if I cancel?', a: 'Month-to-month, cancel anytime and keep your domain and content. Prepaid annual terms aren’t refundable once the year starts — details in our terms.' },
    ],
  },
  {
    slug: 'online-store',
    name: 'AI Smart eCommerce',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 17a2 2 0 100 4 2 2 0 000-4zM9 19a2 2 0 11-4 0 2 2 0 014 0z',
    price: 399,
    tagline: 'Everything in AI Smart Website III, plus a full online store and an AI shopping assistant.',
    builtOn: 'Everything in AI Smart Website III, plus',
    highlights: [
      'A full online store (Shopify) with a custom theme, set up for you',
      'Desi becomes your AI shopping assistant, helping customers buy',
      'Product pages, checkout & email automations that sell 24/7',
    ],
    headline: 'A store that sells while the shop is closed',
    blurb:
      "Everything in AI Smart Website III, plus a real store. Setting up a store is easy; setting up a store that sells — right products, right photos, right copy, emails that bring people back, and a checkout nobody abandons — is a job. We do that job: a multilingual Shopify storefront with a custom theme and Desi — powered by your Brand Brain — as your AI shopping assistant, run like the enterprise eCommerce operations we spent years building.",
    whoFor:
      'Shops, makers, restaurants, and brands that want to sell online — whether you’re starting from zero or your current store isn’t selling.',
    deliverables: [
      {
        title: 'The storefront',
        items: [
          'Shopify store with a custom theme designed for your brand — not a stock template',
          'Multilingual storefront as standard',
          'Payments, taxes, shipping, and checkout configured properly',
          'Promo codes, discounts, and gift cards set up and ready',
        ],
      },
      {
        title: 'Your products, made to sell',
        items: [
          'Product pages enhanced: images, copy, sizing, variants',
          'eCommerce SEO so your products show up in search',
          'Collections and navigation organized the way customers shop',
        ],
      },
      {
        title: 'The selling machine',
        items: [
          'Desi as an AI shopping assistant that helps customers find and choose products 24/7',
          'Email automations: welcome series, abandoned cart, receipts, win-backs',
          'Analytics wired up so we know what sells and what stalls',
        ],
      },
      {
        title: 'Kept selling, every month',
        items: [
          'New products, promos, and seasonal updates handled for you',
          'Ongoing optimization of pages that underperform',
          'Everything in AI Smart Website III, kept running alongside the store',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'We look at what you sell, how you fulfill, and what’s worked so far — in your shop or on a call.' },
      { title: 'Store build', body: 'Theme design, product setup, payments, shipping, emails — we build the whole machine and you approve it before launch.' },
      { title: 'Launch & learn', body: 'The store goes live with Desi trained on your catalog. Early traffic tells us what to tune first.' },
      { title: 'Every month after', body: 'Promos, new products, fixes, and optimization — plus everything AI Smart Website III keeps running.' },
    ],
    faq: [
      { q: 'Why Shopify?', a: 'It’s the most reliable platform for small-business eCommerce — payments, shipping, and inventory just work, and you never need us just to operate your own store. We customize the theme so it doesn’t look like everyone else’s.' },
      { q: 'Are Shopify’s own fees included?', a: 'No — Shopify charges its own subscription and payment processing fees directly to you (standard for any store). Our plan covers the design, build, optimization, and monthly operation.' },
      { q: 'I already have a store that isn’t selling. Can you fix it?', a: 'Yes — that’s half the work we do. We audit it, fix the theme, products, SEO, and emails, and run it forward under the same plan.' },
      { q: 'How many products can I have?', a: 'The starting price assumes a focused catalog (roughly dozens, not thousands). Bigger catalogs are fine — we scope the price to the real work.' },
    ],
  },
  {
    slug: 'business-ads',
    name: 'Business Ads',
    icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    price: 950,
    hidden: true,
    tagline: 'The social, ads, and SEO that get you seen — and traffic built to convert.',
    highlights: [
      'Social media growth across the platforms that fit — content, posting, branding',
      'Google Ads & social ads, managed (you fund the ad spend)',
      'Promotional banners, videos & interactive widgets that turn traffic into engagement',
      'SEO content campaigns + landing pages',
      'We watch how your traffic responds and keep correcting & improving',
    ],
    headline: 'Get seen — by the right people, ready to buy',
    blurb:
      "Traffic isn’t the goal; customers are. The Business Ads service runs your visibility end to end — social content, managed Google and social ads, SEO campaigns — and then makes the traffic count with landing pages, banners, videos, and widgets built to convert. We watch what the numbers do and keep correcting.",
    whoFor:
      'Businesses whose website or store already works — and who now need more of the right people finding it, steadily, not in one lucky spike.',
    deliverables: [
      {
        title: 'Social media growth',
        items: [
          'Content created, branded, and posted for you',
          'A consistent presence on the platforms that fit your business',
          'Comments and messages answered — engagement watched, not ignored',
        ],
      },
      {
        title: 'Managed advertising',
        items: [
          'Google Ads and social ads: strategy, setup, creative, and management',
          'You fund the ad spend directly with the platforms — we never mark it up',
          'Budgets, bids, and audiences tuned continuously, not set-and-forgotten',
        ],
      },
      {
        title: 'Traffic that converts',
        items: [
          'Landing pages built for each campaign — not ads pointed at your homepage',
          'Promotional banners, videos, and interactive widgets that turn visits into engagement',
          'SEO content campaigns that compound month over month',
        ],
      },
      {
        title: 'The correction loop',
        items: [
          'We watch how your traffic responds — and keep correcting and improving',
          'A plain-English monthly report: what ran, what it cost, what it brought in',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'What you sell, who buys it, what a lead is worth, and how much ad spend makes sense to start.' },
      { title: 'Foundations', body: 'Tracking, landing pages, and creative — so from the first dollar of spend we can see what works.' },
      { title: 'Launch campaigns', body: 'Ads and content go live. The early weeks are about learning fast, not vanity numbers.' },
      { title: 'Correct & compound', body: 'Every month: cut what underperforms, scale what works, and report it in plain English.' },
    ],
    faq: [
      { q: 'Is ad spend included in the price?', a: 'No — ad spend goes directly from you to Google or the social platforms, at whatever budget we agree makes sense. The service covers strategy, creative, management, and optimization. We never mark up your spend.' },
      { q: 'How much ad spend do I need?', a: 'It depends on your market and goals — some businesses get meaningful results from a few hundred dollars a month. We’ll recommend a starting budget in the kickoff and adjust from real results.' },
      { q: 'My website is weak — should I still buy ads?', a: 'Honestly: no. Ads pointed at a weak site burn money. Start with a website tier (or pair them), then pour traffic on.' },
    ],
  },
  {
    slug: 'multimedia-agency',
    name: 'Multimedia Agency',
    icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
    price: 1800,
    hidden: true,
    tagline: 'Everything, handled — we design, build, promote, and optimize whatever your business needs.',
    highlights: [
      'We build your site — or optimize the one you already have',
      "Add a full online store whenever you're ready, done for you",
      'Advertising, promotion & ongoing optimization, all handled',
      'Custom software, AI automation & data pipelines',
      'Design, video & content produced for you — your full media & tech team',
    ],
    headline: 'Your full media & tech team — without hiring one',
    blurb:
      "One engagement, everything handled: your website or store built and run, your advertising and promotion managed, and senior engineering on call for custom software, AI automation, and data work. It’s the closest thing to having your own media and technology department — for less than a single hire.",
    whoFor:
      'Businesses ready to grow on every front at once — or owners who simply want one accountable team for all of it instead of juggling vendors.',
    deliverables: [
      {
        title: 'Web & store',
        items: [
          'Your website designed, built, and kept fast — or your existing one rebuilt right',
          'A full online store added whenever you’re ready, done for you',
          'Everything in the AI Smart Website III and AI Smart eCommerce plans, under one roof',
        ],
      },
      {
        title: 'Promotion',
        items: [
          'Advertising and social handled end to end (you fund the ad spend)',
          'SEO, content campaigns, and landing pages',
          'Continuous optimization — the correction loop never stops',
        ],
      },
      {
        title: 'Software & AI',
        items: [
          'Custom software when your business needs a tool that doesn’t exist',
          'AI automation for the busywork: quoting, scheduling, follow-ups, reporting',
          'Data pipelines and dashboards so decisions come from numbers, not guesses',
        ],
      },
      {
        title: 'Media & content',
        items: [
          'Design, video, and content produced for you — menus, promos, campaigns',
          'One brand voice across your site, store, ads, and social',
          'Priority response: you’re a retainer client, not a ticket in a queue',
        ],
      },
    ],
    steps: [
      { title: 'Deep kickoff', body: 'We map how your business runs — sales, operations, marketing — and agree on what matters most first.' },
      { title: 'A shared roadmap', body: 'One prioritized plan across web, store, promotion, and software. You always know what we’re building and why.' },
      { title: 'Build & promote in parallel', body: 'The tech gets built while the promotion runs — each month ships visible progress on both.' },
      { title: 'Review & reprioritize', body: 'A monthly working session plus the plain-English report. Priorities shift as your business does.' },
    ],
    faq: [
      { q: 'What exactly does "everything" cover?', a: 'Website, online store, advertising, social, SEO, content, design, video, custom software, AI automation, and data work — scoped each month against a shared roadmap. If your business needs it built or promoted, it’s in scope.' },
      { q: 'How does this compare to hiring?', a: 'A single junior marketing or IT hire costs several times this — and gives you one skill set. This puts engineering, design, marketing, and AI expertise on one retainer.' },
      { q: 'Can we start smaller and upgrade?', a: 'Yes — many clients start with AI Smart Website III or AI Smart eCommerce and move up when they’re ready for the full team. The work carries forward when you upgrade, so nothing is wasted.' },
    ],
  },
];

// Website tiers shown in the pricing grid (Business Ads / Multimedia are their
// own sections on /plans).
export const websitePlans = plans.filter((p) => !p.hidden);
// Broader services shown as their own sections below the grid.
export const servicePlans = plans.filter((p) => p.hidden);
