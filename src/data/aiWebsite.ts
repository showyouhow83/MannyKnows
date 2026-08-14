// One-Page Website — the single source of truth for the product.
//
// Sold in three places, all reading from this file so they can never drift:
//   • /ai-website          — the full sales page
//   • /free-360-photo      — the "#ai-website" section (360° tour angle)
//   • /services            — the "What we build" card
//
// PRICING (Aug 2026 reprice, Manny): the old card read "from $500 one-time +
// optional $79/mo" — the $79 was the monthly equivalent of a retired $950
// price (79 × 12 ≈ 948) and was never explained anywhere on the site. The
// product now follows the AI Agents Team shape: a one-time setup fee, then a flat
// monthly. Change the three constants below and every page follows.
export const aiWebsiteSetupFee = 195;   // one-time: matches the AI Agents Team setup fee
export const aiWebsiteMonthly = 40;     // $/mo to keep it hosted, running & answering
export const aiWebsiteYearly = aiWebsiteMonthly * 12; // $480: the annual equivalent

export const aiWebsitePriceLabel = `$${aiWebsiteSetupFee} setup + $${aiWebsiteMonthly}/mo`;

// What Remi AI does on THIS product. The agent is Remi AI — the same agent that
// ships with every website plan — in its LIGHTEST version (Manny, Aug 2026):
// it converses, answers from the business's own info, and captures the lead.
// It does NOT book appointments or sell — those are the bigger Remis (booking
// starts at Get Booked $245/mo, selling at Get Growing; or hire Remi AI onto an
// existing site via the AI Agents Team). Never claim booking here.
export const aiWebsiteAgent = [
  {
    title: 'Answers in your voice',
    body: "Remi AI is trained on your services, prices, and hours, so a customer at 11pm gets a real answer, not a contact form and a wait.",
    icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    title: 'Any hour, either language',
    body: "English and Spanish are standard, not an add-on: Remi AI replies in whichever language the customer opens with, at whatever hour they show up.",
    icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 010 18M12 3a15.3 15.3 0 000 18',
  },
  {
    title: 'Captures the lead',
    body: "It asks for the name, the number, and what they need, then sends the whole conversation to your inbox, so nothing is lost overnight.",
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    title: 'Hands off to you',
    body: "Remi AI answers and gathers; you close. And when you want it booking jobs or selling, the same Remi AI does that on the website plans: the training carries.",
    icon: 'M17 8l4 4m0 0l-4 4m4-4H3',
  },
];

// The conversation shown in the agent demo. One transcript, reused on every
// page that sells this — edit here and both pages update.
// HONESTY GUARD: this Remi AI answers and captures the lead — it must NOT be
// shown booking an appointment (that's Get Booked). Keep the ending a handoff.
export const aiWebsiteChat = [
  { from: 'them', text: 'Do you do this on weekends? And roughly what does it run?' },
  { from: 'us', text: "We do, Saturdays fill first. For a job that size it's usually $450–$650." },
  { from: 'them', text: 'Okay. Can someone come look at it?' },
  { from: 'us', text: 'Of course. What’s your name and the best number to reach you?' },
  { from: 'them', text: 'Carla, (413) 555-0182. Afternoons are best.' },
  { from: 'us', text: 'Got it, Carla. I’ve passed everything along: you’ll hear back today to set up the visit.' },
];

// The seven blocks that make up the page, in the order they're built. `hero`
// marks the two we lead with: the tour is why a 360° customer wants this at
// all, and the agent-fed FAQ/blog is what gets them quoted by AI answers.
export const aiWebsiteSections = [
  {
    name: 'Virtual tour',
    body: 'Your 360° photos embedded on your own domain: customers walk through your space without ever leaving your page, and the tour counts as content Google indexes under your name, not just Google’s.',
    hero: true,
  },
  {
    name: 'Blog',
    body: 'Short local posts that give Google something fresh to rank and give AI assistants something to quote when someone asks them for a business like yours.',
    hero: true,
  },
  { name: 'Hero', body: 'The first screen: what you do, where you do it, and one obvious next step, call, book, or ask the agent.' },
  { name: 'Products / services', body: 'What you sell, priced or scoped, laid out so a customer understands it in one pass, and so an AI agent reading your page can describe it correctly.' },
  { name: 'Reviews', body: 'Your Google reviews pulled onto the page as proof, where they do the convincing instead of sitting on a listing nobody clicks through to.' },
  { name: 'FAQs', body: 'The questions you answer on the phone all day, written once, marked up so they can win the answer box and feed your agent at the same time.' },
  { name: 'Contact', body: 'Tap-to-call, a short form, your hours, and a map. Every route to you on one screen, thumb-sized on a phone.' },
];

// Google's four Lighthouse categories. We tune to near-perfect rather than
// promising a flat 100 — the same wording the plans use, and honest about the
// fact that a live site's score moves with its network and its traffic.
export const aiWebsiteLighthouse = [
  { name: 'Performance', body: 'Loads fast on a phone on cell data, the difference between a customer reading your page and bouncing before it paints.' },
  { name: 'Accessibility', body: 'Readable contrast, real labels, keyboard-navigable, usable by everyone, and Google counts it.' },
  { name: 'Best practices', body: 'HTTPS, current standards, no console errors, no bloat shipped to the browser.' },
  { name: 'SEO', body: 'Titles, structure, and schema written so Google and the AI answer engines can read what you do and recommend you for it.' },
];

// What the monthly actually buys. This is the line the old card never drew —
// people were being asked for a recurring fee with no stated deliverable.
export const aiWebsiteMonthlyIncludes = [
  'Hosting, SSL, and a global CDN. Nothing else to buy or renew',
  'Remi AI running, retrained whenever your prices, hours, or services change',
  'Every lead Remi AI captures, emailed to you as it happens',
  'Security, backups, and uptime monitoring',
  'Speed and search health checked so the site doesn’t quietly rot',
];

// What the one-time setup buys.
export const aiWebsiteSetupIncludes = [
  'The page designed for your business, not a template with your logo dropped in',
  'Your copy written, your photos placed, your 360° tour embedded',
  'Remi AI trained on your services, prices, hours, and voice',
  'Google Business Profile connected, schema and sitemap submitted',
  'Live on your own domain, tuned to near-perfect Lighthouse scores',
];

export const aiWebsiteSteps = [
  { title: 'One conversation', body: 'We go through what you do, what you charge, the questions customers keep asking, and what a good lead looks like. Usually under an hour.' },
  { title: 'We build the page', body: 'Design, copy, your photos, your 360° tour. You see it and change whatever you want before anyone else does.' },
  { title: 'Remi AI learns your business', body: 'We train it on everything from step one and test it hard: you read how it answers before it ever talks to a customer.' },
  { title: 'It goes live and keeps running', body: 'Your domain, your site. From there the monthly keeps it hosted, fast, and answering; you get the leads.' },
];

export const aiWebsiteFaq = [
  {
    q: `Why a setup fee and a monthly, instead of one price?`,
    a: `Because a website that stops being maintained stops working. The $${aiWebsiteSetupFee} covers designing, writing, and building the page and training Remi AI: real work that happens once. The $${aiWebsiteMonthly}/mo covers what never stops: hosting, security, Remi AI running and being retrained when your prices or hours change, and the leads reaching you. It's the same shape as hiring an AI Agents Team agent: a one-time setup, then a flat monthly.`,
  },
  {
    q: 'Do I own the site?',
    a: 'Yes. The domain, the content, and the page are yours. The monthly covers running and maintaining it, not renting it to you. If you ever leave, the site goes with you. Remi AI itself is service software that runs with the monthly — the leads it captured are yours, but the agent doesn’t transfer.',
  },
  {
    q: 'How is this different from Wix or Squarespace?',
    a: `Wix hands you a builder and the work is yours: the design, the writing, the SEO, the upkeep. Here a developer builds the page for you, tunes it to near-perfect scores on Google's own Lighthouse audit (most DIY builder sites don't come close), and Remi AI, an AI agent trained on your business, answers your customers and captures leads while you work. Comparable money, but you get your evenings back and an employee on the page.`,
  },
  {
    q: 'Can Remi AI book appointments on this?',
    a: `Not on this version. This is the lightest Remi AI: it converses with your customers, answers from what it knows about your business, and captures the lead with its details for you to close. The Remi AI that books jobs into your calendar comes with Get Booked ($245/mo); the one that sells comes with Get Growing. Upgrade anytime: Remi AI's training carries with you.`,
  },
  {
    q: `How is this different from the $95/mo Get Found plan?`,
    a: `Scope and who does the work. This is one page with the lightest Remi AI, built once and kept running: the cheapest way to have a real site that answers customers, at $${aiWebsiteMonthly}/mo after setup. Get Found is $595 to build and $95/mo to run, and it's a service: a 1–3 page multilingual site we design, run, update four times a month, and keep ranking, with your Google Business Profile handled and your own admin to change things yourself. Start here if one page covers you; move up when it doesn't: the work carries forward.`,
  },
  {
    q: 'Can one page really be enough?',
    a: "For most local businesses, yes. Your customer wants to know what you do, whether you're any good, what it costs, and how to reach you. That's one screen of scrolling, and a single fast page ranks and converts better than eight thin ones nobody reads. When you outgrow it, the blog is already there to grow into.",
  },
  {
    q: 'What if I already have 360° photos on Google?',
    a: "Then we embed them. Photos on your Google Business Profile live on Google's property: the tour on your own site is content under your domain, working for your rankings, with Remi AI right next to it ready to answer.",
  },
  {
    q: 'How long does it take?',
    a: 'Most one-page builds are completed within 7 days of the contract being signed. For reference, even a full build (site, AI agent, and a phone system routing every call, for JK Daycare) went live in two weeks.',
  },
  {
    q: 'Does Remi AI speak Spanish?',
    a: 'Yes. English, Spanish, French, German, Italian — all languages are available on everything we build, and Remi AI answers in whichever language the customer opens with.',
  },
  {
    q: 'What if I need more pages later?',
    a: `Nothing is wasted. The design, the copy, Remi AI's training, and your Google setup all carry into a bigger build or a monthly plan: you're moving up from what's already working, not starting over.`,
  },
];

// One-line pitch, reused wherever the product needs a summary (services card,
// search index, meta descriptions).
export const aiWebsiteBlurb =
  `A fast one-page website with Remi AI, an AI agent that answers your customers and captures every lead, built around your business, tuned to near-perfect Google scores, and live on your own domain. $${aiWebsiteSetupFee} to build, $${aiWebsiteMonthly}/mo to run.`;
