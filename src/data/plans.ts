// Single source of truth for the monthly plans (homepage cards, /plans cards,
// and the /plans/<slug> detail pages). Prices are "Starting at" — they climb as
// scope is tailored to each client. Plans are standalone (not incremental).
// Multilingual sites are standard.
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
  icon: string;
  price: number;        // monthly $ (month-to-month), shown as "Starting at $X/mo"
  tagline: string;      // one-line promise on the card
  highlights: string[]; // 4–6 punchy bullets for the card
  featured?: boolean;   // "most popular"
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
    slug: 'smart-website',
    name: 'Smart Website (AI)',
    icon: '🌐',
    price: 350,
    tagline: 'A multilingual site with an AI agent that sells and books jobs 24/7 — no big upfront bill.',
    highlights: [
      'Multilingual website, designed & built',
      'AI Sales & Booking Agent — answers, qualifies, sells, and books appointments 24/7',
      'Google Business Profile — setup & verification',
      'Technical SEO + speed tuning (near-100 Lighthouse)',
      'Monthly fixes, monitoring & a plain-English report',
    ],
    headline: 'Your website, working around the clock',
    blurb:
      "Most local businesses lose the customers they never hear from — the ones who searched at 9 p.m., found nothing (or a dead site), and called someone else. The Smart Website (AI) plan fixes that: a fast, multilingual website with an AI Sales & Booking Agent that answers questions, qualifies leads, and books appointments 24/7, kept ranking and up to date by us — for a monthly price instead of a big upfront bill.",
    whoFor:
      'Service businesses, restaurants, offices, and shops whose customers search Google and call — painters, contractors, daycares, salons, clinics.',
    deliverables: [
      {
        title: 'The website',
        items: [
          'Designed and built for your business — not a template with your logo on it',
          'Multilingual as standard (English + Spanish, or the languages your customers speak)',
          'Mobile-first and fast: tuned for near-perfect speed scores',
          'Your services, photos, service area, and reviews — structured so Google understands them',
        ],
      },
      {
        title: 'The AI Sales & Booking Agent',
        items: [
          'Not a chatbot — it answers, qualifies, and sells, then books the appointment right there',
          'Works your site 24/7 in your customer\u2019s language, even after closing',
          'Trained on your business: your services, prices, hours, and how you talk',
          'Every conversation becomes a lead in your admin; hands off to you when a human should take over',
        ],
      },
      {
        title: 'Getting found',
        items: [
          'Google Business Profile — created or cleaned up, and verified',
          'Technical SEO built in: structure, speed, metadata, local signals',
          '360° image galleries — customers can step inside your business before they visit',
          '360° videos — immersive walkthroughs for your site and your Google listing',
          'Google Search Console integration — we monitor indexing, crawl coverage, and search-query performance against Google\u2019s own data',
        ],
      },
      {
        title: 'Kept running, every month',
        items: [
          'Content updates and fixes — send us changes, we handle them',
          'Monitoring, security, and backups',
          'A plain-English monthly report: what we did, what changed, what’s next',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'A short call: what you do, who your customers are, what a good month looks like. That’s all we need to start.' },
      { title: 'We design & build', body: 'You see the design before it goes live and we adjust until it’s right. Typically a few weeks from kickoff to launch.' },
      { title: 'The AI learns your business', body: 'We train the agent on your business — then test it hard before it ever talks to a customer.' },
      { title: 'Every month after', body: 'Fixes, updates, monitoring, and tuning — plus a report you can read in two minutes.' },
    ],
    faq: [
      { q: 'I already have a website — do I have to start over?', a: 'No. If your current site has good bones, we optimize it and add the AI agent and SEO on top. If it’s holding you back, we rebuild it — same plan either way.' },
      { q: 'Do I own the website?', a: 'Yes. The domain is yours, the content is yours, and if you ever leave, the site goes with you. The plan covers the work and the upkeep, not a rental.' },
      { q: 'How does the AI Sales & Booking Agent know what to say?', a: 'We train it on your business — services, prices, hours, service area, and the questions customers keep asking you. You review how it answers before it goes live, and we keep refining it.' },
      { q: 'What does "multilingual" include?', a: 'The site and the AI agent both work in the languages your customers speak — for most of Western Mass that means English and Spanish, but it’s not limited to that.' },
      { q: 'What happens if I cancel?', a: 'Month-to-month, you can cancel anytime and keep your domain and content. Prepaid annual terms aren\u2019t refundable once the year starts — the details are in our terms of service.' },
    ],
  },
  {
    slug: 'online-store',
    name: 'Online Store (AI)',
    icon: '🛒',
    price: 650,
    tagline: 'A full online store that sells — designed, themed, and optimized.',
    highlights: [
      'Multilingual storefront with an AI shopping assistant',
      'A full online store (Shopify) with a custom theme, set up for you',
      'eCommerce SEO + product enhancement (images, copy, sizing)',
      'Email automations — welcome, abandoned cart, receipts',
      'Promo codes, discounts, payments & checkout',
    ],
    featured: true,
    headline: 'A store that sells while the shop is closed',
    blurb:
      "Setting up a store is easy. Setting up a store that sells — right products, right photos, right copy, emails that bring people back, and a checkout nobody abandons — is a job. We do that job: a multilingual Shopify storefront with a custom theme and an AI shopping assistant, run like the eCommerce operations we spent years building for a national retailer.",
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
          'AI shopping assistant that helps customers find and choose products 24/7',
          'Email automations: welcome series, abandoned cart, receipts, win-backs',
          'Analytics wired up so we know what sells and what stalls',
        ],
      },
      {
        title: 'Kept selling, every month',
        items: [
          'New products, promos, and seasonal updates handled for you',
          'Ongoing optimization of pages that underperform',
          'A plain-English monthly report on traffic, sales, and what’s next',
        ],
      },
    ],
    steps: [
      { title: 'Kickoff', body: 'We look at what you sell, how you fulfill, and what’s worked so far — in your shop or on a call.' },
      { title: 'Store build', body: 'Theme design, product setup, payments, shipping, emails — we build the whole machine and you approve it before launch.' },
      { title: 'Launch & learn', body: 'The store goes live with the AI shopping assistant trained on your catalog. Early traffic tells us what to tune first.' },
      { title: 'Every month after', body: 'Promos, new products, fixes, and optimization — plus the monthly report.' },
    ],
    faq: [
      { q: 'Why Shopify?', a: 'It’s the most reliable platform for small-business eCommerce — payments, shipping, and inventory just work, and you never need us just to operate your own store. We customize the theme so it doesn’t look like everyone else’s.' },
      { q: 'Are Shopify’s own fees included?', a: 'No — Shopify charges its own subscription and payment processing fees directly to you (that’s standard for any store). Our plan covers the design, build, optimization, and monthly operation.' },
      { q: 'I already have a store that isn’t selling. Can you fix it?', a: 'Yes — that’s half the work we do. We audit it, fix the theme, products, SEO, and emails, and run it forward under the same plan.' },
      { q: 'Who handles the orders?', a: 'You do — it’s your business. We build and run the machine that brings the orders in and makes them easy to manage.' },
      { q: 'How many products can I have?', a: 'The starting price assumes a focused catalog (roughly dozens, not thousands). Bigger catalogs are fine — we scope the price to the real work.' },
    ],
  },
  {
    slug: 'business-ads',
    name: 'Business Ads',
    icon: '📣',
    price: 950,
    tagline: 'The social, ads, and SEO that get you seen — and traffic built to convert.',
    highlights: [
      'Social media growth across the platforms that fit — content, posting, branding',
      'Google Ads & social ads, managed (you fund the ad spend)',
      'Promotional banners, videos & interactive widgets that turn the traffic we drive into engagement',
      'SEO content campaigns + landing pages',
      'We watch how your traffic responds and keep correcting & improving',
    ],
    headline: 'Get seen — by the right people, ready to buy',
    blurb:
      "Traffic isn’t the goal; customers are. The Business Ads plan runs your visibility end to end — social content, managed Google and social ads, SEO campaigns — and then makes the traffic count with landing pages, banners, videos, and widgets built to convert. We watch what the numbers do and keep correcting.",
    whoFor:
      'Businesses whose website or store already works — and who now need more of the right people finding it, steadily, not in one lucky spike.',
    deliverables: [
      {
        title: 'Social media growth',
        items: [
          'Content created, branded, and posted for you',
          'A consistent presence on the platforms that fit your business — Facebook, Instagram, LinkedIn, TikTok, WhatsApp, YouTube, X, and more',
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
      { q: 'Is ad spend included in the plan price?', a: 'No — ad spend goes directly from you to Google or the social platforms, at whatever budget we agree makes sense. The plan covers strategy, creative, management, and optimization. We never mark up your spend.' },
      { q: 'How much ad spend do I need?', a: 'It depends on your market and goals — some businesses get meaningful results from a few hundred dollars a month. We’ll recommend a starting budget in the kickoff and adjust from real results.' },
      { q: 'How fast will I see results?', a: 'Ads produce data within days and leads within weeks; SEO content compounds over months. We report both honestly — no invented numbers, ever.' },
      { q: 'Which platforms do you manage?', a: 'The ones your customers actually use — and we figure out the formula for each. Google, Facebook, Instagram, LinkedIn, TikTok, WhatsApp, YouTube, X, and others as they fit your business. It\u2019s chosen and tuned per business, not a fixed menu.' },
      { q: 'My website is weak — should I still buy ads?', a: 'Honestly: no. Ads pointed at a weak site burn money. Start with the Smart Website (AI) or Online Store (AI) plan (or pair them), then pour traffic on.' },
    ],
  },
  {
    slug: 'multimedia-agency',
    name: 'Multimedia Agency',
    icon: '🧩',
    price: 1800,
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
      "One plan, everything handled: your website or store built and run, your advertising and promotion managed, and senior engineering on call for custom software, AI automation, and data work. It’s the closest thing to having your own media and technology department — for less than a single hire.",
    whoFor:
      'Businesses ready to grow on every front at once — or owners who simply want one accountable team for all of it instead of juggling vendors.',
    deliverables: [
      {
        title: 'Web & store',
        items: [
          'Your website designed, built, and kept fast — or your existing one rebuilt right',
          'A full online store added whenever you’re ready, done for you',
          'Everything in the Smart Website (AI) and Online Store (AI) plans, under one roof',
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
      { q: 'How do we decide what gets done each month?', a: 'A shared roadmap we review together monthly. You bring what’s changed in the business; we bring the numbers; the roadmap gets reprioritized accordingly.' },
      { q: 'How does this compare to hiring?', a: 'A single junior marketing or IT hire costs several times this plan — and gives you one skill set. This puts engineering, design, marketing, and AI expertise on one retainer.' },
      { q: 'Can we start smaller and upgrade?', a: 'Yes — many clients start with Smart Website (AI) or Online Store (AI) and move up when they’re ready for the full team. The work carries forward when you upgrade, so nothing is wasted.' },
      { q: 'Is there a minimum commitment?', a: 'Month-to-month at the standard rate, cancel anytime. The discounted yearly rate is one upfront payment for 12 months — details in our terms of service.' },
    ],
  },
];
