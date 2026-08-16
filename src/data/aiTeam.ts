// The AI Agents Team — our flagship offering. A named team of AI agents we build and
// fine-tune around your business (the "product"), billed as a monthly retainer
// per agent (the "plan"). Single source of truth for /ai-team, the flagship card
// on /plans, and the homepage teaser.
//
// Ten specialists + one manager, all reading from and writing to one shared
// "Brand Brain," coordinated by Manny AI:
//   Manny AI=Manager (free), Remi AI=Chat agent, Eve=Research, Elly=Copy,
//   Leo=Graphics & Video, Aria=Voice, Nova=SEO, Piper=Publishing,
//   Max=Paid ads, Finn=Engagement, Vera=Analytics.
// The roster is meant to grow as AI learns to do more.
//
// Remi AI is the one agent that is ALSO a product on its own: its ladder
// lives in src/data/remi.ts and sells at /ai-booking-agent. The roster card
// quotes that ladder's "from" price (imported below) so the two surfaces can
// never publish two different Remi prices.

import { remiLiteMonthly } from './remi';

export type AgentId =
  | 'manny'
  | 'desi'
  | 'eve'
  | 'elly'
  | 'eny'
  | 'mimi'
  | 'essie'
  | 'bap'
  | 'addy'
  | 'upie'
  | 'ana';

export interface Agent {
  id: AgentId;
  name: string;
  role: string;       // short specialty label
  does: string;       // one plain-spoken paragraph: what this agent does for you
  handoff?: string;   // how the agent connects to the rest of the team
  order: number;      // pipeline order (manager → chat agent → research → … → analytics)
  price: number;      // flat monthly rate to "hire" this agent (USD); 0 when included
  included?: boolean; // true for Manny AI, the manager you actually hire
  hidden?: boolean;   // true = works behind the scenes as a Manny AI sub-agent:
                      // no roster card, no homepage tile, no router row (Manny,
                      // Aug 2026 — Leo, Aria, Piper, Max)
  note?: string;      // small qualifier shown next to the price
}

// The team, in the order work flows through them. Each paid agent is hired like
// staff: a flat monthly rate, normal AI usage included.
export const team: Agent[] = [
  {
    id: 'manny',
    name: 'Manny AI',
    role: 'AI Agents Manager',
    does: "Manny AI briefs the right agents, runs the job, files what the team learns into your Brand Brain, and brings the finished work back for your sign-off.",
    order: 0,
    price: 0,
    included: true,
  },
  {
    id: 'desi',
    name: 'Remi AI',
    role: 'Chat Agent — answers, qualifies & captures leads',
    does: "Answers customers 24/7 and captures every lead on the site you have; books appointments and steers shoppers on the Pro tier or the Get Booked/Get Growing plans.",
    handoff: 'Feeds the team. Every question customers ask becomes intel, Remi AI logs the patterns, and Eve uses them to decide what content to make next.',
    order: 1,
    // The "from" price of Remi AI's own ladder — booking is the Pro plan
    // there ($145); on websites it still arrives at Get Booked.
    price: remiLiteMonthly,
    note: 'its own plans, $40 Lite to $145 Pro · included with every website plan',
  },
  {
    id: 'eve',
    name: 'Eve',
    role: 'Research & strategy',
    does: "A daily brief on your market — competitor moves, local trends, and the news that affects your business — tuned to what you want watched. It lands in your dashboard beside the team's SEO, engagement, and analytics work.",
    handoff: 'Hands off to Elly (content briefs), Max (audience & offer targeting), and Manny AI (the plan for your approval).',
    order: 2,
    price: 95,
  },
  {
    id: 'elly',
    name: 'Elly',
    role: 'Copywriting',
    does: "Writes pages, posts, emails, and full sequences in your voice, from Eve's brief and your Brand Brain, never a blank page.",
    handoff: 'Hands off to Leo (copy for design), Aria (scripts for voice), Nova (pages for search tuning), and Piper (finished posts to schedule).',
    order: 3,
    price: 145,
  },
  {
    id: 'eny',
    name: 'Leo',
    role: 'Graphics & video',
    does: "Turns Elly's copy into graphics and short-form video built for each network, always in your brand's look.",
    handoff: 'Hands off to Piper (finished assets to publish) and Max (creative for ads).',
    order: 4,
    price: 245,
    hidden: true,
  },
  {
    id: 'mimi',
    name: 'Aria',
    role: 'Voice & audio',
    does: "Learns your voice from a short sample, then speaks whatever Elly writes (voiceovers, reels, phone greetings) so you never hit record.",
    handoff: 'Hands off to Leo (audio for video) and Piper (finished audio to publish).',
    order: 5,
    price: 145,
    hidden: true,
  },
  {
    id: 'essie',
    name: 'Nova',
    role: 'SEO & local search',
    does: "Maps what your customers search, tunes every page before it ships, and keeps your Google Business Profile active and accurate.",
    handoff: "Hands off to Elly (keyword targets for new content), Vera (rankings to track), and Manny AI (what's climbing, what needs work).",
    order: 6,
    price: 195,
  },
  {
    id: 'bap',
    name: 'Piper',
    role: 'Publisher & scheduling',
    does: "Publishes everything at the right time on every channel, your site included — always as a preview until you press Publish.",
    handoff: 'Hands off to Finn (live posts to watch) and Vera (live posts to measure).',
    order: 7,
    price: 145,
    hidden: true,
  },
  {
    id: 'addy',
    name: 'Max',
    role: 'Paid ads',
    does: "Runs your Google and Meta ads from Eve's targeting and Leo's creative, watching spend daily and never touching budget without your OK.",
    handoff: 'Hands off to Vera (spend & results to measure) and Manny AI (budget requests for your sign-off).',
    order: 8,
    price: 245,
    hidden: true,
  },
  {
    id: 'upie',
    name: 'Finn',
    role: 'Engagement & reputation',
    does: "Answers reviews, comments, and DMs in your voice, routes anything sensitive to a human first, and nudges happy customers to review.",
    handoff: 'Hands off to Eve (what customers are saying) and Manny AI (issues that need a human).',
    order: 9,
    price: 195,
  },
  {
    id: 'ana',
    name: 'Vera',
    role: 'Analytics & reporting',
    does: "Tracks what every piece produced (traffic, calls, bookings, sales) and turns it into a clear monthly report that feeds Eve's next plan.",
    handoff: 'Hands off to Eve (what performed) and Manny AI (your report).',
    order: 10,
    price: 145,
  },
];

// Manager is free; only paid agents count toward "from" pricing and bundles.
export const paidAgents = team.filter((a) => !a.included);

// One flat one-time setup builds the Brand Brain and trains the team, however
// many agents you hire (normal AI usage included; heavy usage metered at cost,
// quoted first). Waived on a prepaid year, matching the sitewide setup-fee
// canon (/pricing states the same rule).
export const aiTeamSetupFee = 195;

// À-la-carte total for a set of agent ids, from the roster (keeps bundles honest).
const sumFor = (ids: AgentId[]) =>
  team.filter((a) => ids.includes(a.id)).reduce((sum, a) => sum + a.price, 0);

export interface Bundle {
  id: string;
  name: string;
  diagnosis?: string; // bottleneck-first hook shown atop the card: "For when …"
  tagline: string;
  agentIds: AgentId[];
  monthly: number;
  addOn?: boolean;   // priced as an add-on ("add $445/mo")
  best?: boolean;    // best-value flag (the whole team)
  alaCarte: number;  // computed from the roster
  savings: number;   // computed
}

const BUNDLE_SPECS: Omit<Bundle, 'alaCarte' | 'savings'>[] = [
  {
    id: 'content',
    name: 'The Content Team',
    diagnosis: 'For when the bottleneck is the whole content operation. Nothing gets made, so nothing gets seen.',
    tagline: 'The full make-and-publish line: research → writing → graphics & video → voice → publishing → engagement. Everything a consistent presence takes, coordinated by Manny AI.',
    agentIds: ['eve', 'elly', 'eny', 'mimi', 'bap', 'upie'],
    monthly: 749,
  },
  {
    id: 'growth',
    name: 'The Growth Pack',
    diagnosis: "For when content exists but the leak is distribution. Nobody searches you up, ads run blind, and you can't prove what's working.",
    tagline: "The team that turns content into customers and proves it, with search visibility, paid amplification, and the monthly numbers that show what it's all producing.",
    agentIds: ['essie', 'addy', 'ana'],
    monthly: 445,
    addOn: true,
  },
  {
    id: 'whole',
    name: 'The Whole Team',
    diagnosis: 'For when you answered the two questions and named three departments.',
    tagline: 'The complete operation — chat agent, content, growth, and reporting — running as one coordinated team under Manny AI.',
    agentIds: ['desi', 'eve', 'elly', 'eny', 'mimi', 'essie', 'bap', 'addy', 'upie', 'ana'],
    monthly: 1195,
    best: true,
  },
];

export const aiTeamBundles: Bundle[] = BUNDLE_SPECS.map((b) => ({
  ...b,
  alaCarte: sumFor(b.agentIds),
  savings: sumFor(b.agentIds) - b.monthly,
}));

export const wholeTeamBundle = aiTeamBundles.find((b) => b.id === 'whole')!;

// ── Manny AI, priced per WORKFLOW (Manny, Aug 16 2026) ─────────────────────
// The public ladder for Manny AI on its own. The unit is a workflow — one
// defined business process (what comes in, what the agents do, who approves,
// what goes out), staffed by however many agents it needs. Never per agent,
// never per head count; the roster prices and bundles above stay internal
// math. Same billing canon as every other ladder: yearly = 10× monthly, and
// the one-time setup (aiTeamSetupFee) is waived on a prepaid year. Normal AI
// usage is included; a paid third-party seat a workflow needs (stock, ad
// spend, a phone number) passes through at cost. Rendered through
// PricingCards on /ai-team and /pricing (src/lib/pricingCards.ts →
// mannyAiCards()), and quoted in the /ai-team FAQ + JSON-LD.
export interface MannyAiTier {
  id: 'one' | 'growth' | 'agency';
  name: string;
  audience: string;
  scope: string;
  scopeLines: string[];
  price: number;
  featured?: boolean;
  builtOn?: string;
  tagline: string;
  features: string[];
}

export const mannyAiTiers: MannyAiTier[] = [
  {
    id: 'one',
    name: 'One Workflow',
    audience: 'For the one process eating the most hours',
    scope: 'One workflow, run for you',
    scopeLines: ['As many agents as it needs', 'Built and trained with you'],
    price: 245,
    tagline: 'One business process handed to Manny AI, staffed with the specialists it takes, and run the same way every time. Publish a week of content, answer and qualify every lead, turn every finished job into a case study and a review ask.',
    features: [
      'One workflow, defined with you on the free diagnostic — what comes in, what the agents do, who approves, what goes out',
      'Manny AI staffs it with as many AI specialists as the work needs (research, copy, graphics & video, voice, SEO, publishing, reporting)',
      'Your Brand Brain built at setup, so everything ships in your voice',
      'You approve the output; the agents do the volume',
      'Normal AI usage included; third-party seats pass through at cost, never marked up',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    audience: 'For three processes running side by side',
    scope: 'Up to three workflows',
    scopeLines: ['One manager over all of them', 'Add or swap a workflow any time'],
    price: 595,
    featured: true,
    builtOn: 'Everything in One Workflow, plus',
    tagline: 'Three workflows under one manager, so the research feeds the writing, the writing feeds the design, and it all lands in one dashboard for your approval.',
    features: [
      'Up to three workflows running side by side, coordinated by Manny AI',
      'Handoffs between workflows, so one process feeds the next instead of you playing middleman',
      'A monthly report tying the work to calls, bookings, and sales',
      'Swap a workflow when the business changes, at no charge',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    audience: 'For your own AI multimedia agency',
    scope: 'Unlimited workflows, normal use',
    scopeLines: ['Quarterly review of what to automate next', 'Custom agents scoped in'],
    price: 1195,
    builtOn: 'Everything in Growth, plus',
    tagline: 'Your own AI multimedia agency, with one manager and one boss: you. Every process you can define, staffed and run, and a standing look at what to hand over next.',
    features: [
      'Unlimited workflows within normal use, added as fast as we can define them with you',
      'A quarterly working session on which processes to automate next',
      'Custom-built agents for the workflows that are specific to your business, scoped in',
      'Priority turnaround on changes and new workflows',
    ],
  },
];

// "From" anchor for Manny AI on its own — the cheapest workflow tier.
export const mannyAiStartingPrice = Math.min(...mannyAiTiers.map((t) => t.price));

// "From" anchor used on the hero + the /plans flagship card (cheapest paid agent).
export const aiTeamStartingPrice = Math.min(...paidAgents.map((a) => a.price));

export const aiTeamFaq = [
  {
    // Real long-tail query — geo in the question on purpose (Aug 2026 SEO pass).
    q: 'Which AI agent should my Springfield business get first?',
    a: `Whichever one sits on your bottleneck. Ask yourself what you're bad at that keeps costing you money. If the answer is unanswered customers, that's Remi AI, the chat agent, a product on its own with plans from $${remiLiteMonthly}/mo. For everything else, Manny AI is added to your business and staffs the specialist that fixes it, stock or custom-built. Not sure? That's what the 15-minute diagnostic is for.`,
  },
  {
    q: "Isn't this just ChatGPT I could use myself?",
    a: "No. ChatGPT is a blank chat you have to prompt from scratch, every time, with no memory of your business. The AI Agents Team is agents we build around your business, trained on one shared Brand Brain, connected to your tools, and coordinated by Manny AI so the research feeds the writing, the writing feeds the design, it all gets published on schedule, and the results get measured and fed back into next month's plan, with a person reviewing what goes out. You get the results without doing the work.",
  },
  {
    q: 'How do the agents work together?',
    a: "Through Manny AI. You make one request; Manny AI turns it into briefs, routes the work agent to agent in the right order, and checks the quality of what comes back at every handoff. If a draft is thin, off-voice, or missing information, Manny AI sends it back to the specialist for another pass before it moves on. Agents never work from scratch. Each one starts from the last one's output and your shared Brand Brain, so what reaches you is the finished package, not a pile of drafts, and nothing goes out off-brand.",
  },
  {
    q: 'What is the Brand Brain?',
    a: "One knowledge base of your business (your services, prices, customers, past work, and voice) that every agent reads from and adds to. It's built during setup and grows with every job. Eve's research, Vera's results, and Remi AI's customer questions all get filed there, so the whole team learns from every piece of work any agent does.",
  },
  {
    q: 'Is there a human involved at all?',
    a: "Yes. The agents do the volume of drafting, designing, scheduling, monitoring, and measuring. A person reviews the output and steps in where judgment matters — the calls, the verifications, the appeals, the things AI shouldn't do alone.",
  },
  {
    q: 'What does it cost?',
    a: `Two ways in. Remi AI, the chat agent, is a product on its own with plans from $${aiTeamStartingPrice}/mo (and it comes with every website plan). Manny AI is priced per workflow, never per agent: One Workflow at $${mannyAiTiers[0].price}/mo, Growth (up to three workflows) at $${mannyAiTiers[1].price}/mo, and Agency (unlimited workflows within normal use) at $${mannyAiTiers[2].price}/mo. Every tier adds a one-time $${aiTeamSetupFee} setup that builds your Brand Brain and trains the first workflow, waived when you prepay a year (10× the monthly, two months free). Normal AI usage is included; a paid third-party seat a workflow needs passes through at cost. A workflow with real integrations is scoped on the 15-minute diagnostic before anything is billed.`,
  },
  {
    q: 'What does adding Manny AI to my business actually mean?',
    a: "We build your Brand Brain, then Manny AI goes to work. It looks at how your business runs, finds the processes AI can improve, and staffs the specialists that work calls for. Each one is trained on your rules, your voice, and your data, and fine-tuned with you until it's ready. From there the team lives in your admin and dashboard. You ask Manny AI for what you need, approve what goes out, and we handle the updates and support.",
  },
  {
    q: 'Do I have to bring on a whole team of agents?',
    a: "No. That's the point of Manny AI. One manager goes to work on your business, and it deploys only the specialists your bottleneck calls for — three, five, or seven of them as the work demands — coordinating every handoff so you never play middleman.",
  },
  {
    q: "How do I know it's working?",
    a: "That's the whole job of Vera, the analytics specialist on the team. Your dashboard shows the team's work as it lands, and a monthly report ties it to real outcomes like traffic, calls, bookings, and sales, with the next plan built on those numbers. No more posting into the void.",
  },
  {
    q: 'Can the agents change my website itself?',
    a: "Yes. This goes beyond generating content to actual site management. The agents can automatically update your live site for new services or seasonal promos on request. We've built in strict safety rails. You review a private copy of the updates first, and nothing pushes to the live site until you approve it.",
  },
  {
    q: "Can you build an agent that's not on the roster?",
    a: "Yes, and some of our best work is exactly that. We've built agents that check a contractor's project statuses against their backend and bilingual phone systems for a local daycare. If your bottleneck is specific to your business, the agent should be too. We scope custom agents on the diagnostic call.",
  },
  {
    q: 'Do you only work with businesses in Springfield?',
    a: "We're based in Springfield and work across Western Massachusetts: Hampden, Hampshire, and Franklin counties. Because the whole engagement runs through one admin and one point of contact, distance has never been the constraint; the working sessions happen wherever you are.",
  },
  {
    q: 'Is this an AI chatbot for my business?',
    a: 'The chat agent is, and the team goes further. Remi AI is the chatbot your customers see, answering on your website 24/7 in any language, qualifying leads, and capturing every one. Behind it, the rest is AI automation: review responses, social posts, reports, and follow-ups that run without you. If what you searched was "AI chatbot," "AI receptionist," or "AI automation," this is that, with a manager and a human check built in.',
  },
];
