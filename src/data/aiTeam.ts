// The AI Team — our flagship offering. A named team of AI agents we build and
// fine-tune around your business (the "product"), billed as a monthly retainer
// per agent (the "plan"). Single source of truth for /ai-team, the flagship card
// on /plans, and the homepage teaser.
//
// Ten specialists + one manager, all reading from and writing to one shared
// "Brand Brain," coordinated by Manny AI:
//   Manny AI=Manager (free), Remi AI=Front desk, Eve=Research, Elly=Copy,
//   Leo=Graphics & Video, Aria=Voice, Nova=SEO, Piper=Publishing,
//   Max=Paid ads, Finn=Engagement, Vera=Analytics.
// The roster is meant to grow as AI learns to do more.

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
  order: number;      // pipeline order (manager → front desk → research → … → analytics)
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
    role: 'Front desk: sales, booking & support',
    does: "Answers customer emails, texts, and messages on your site 24/7: replies, books appointments, and guides shoppers to the right product, in their own language.",
    handoff: 'Feeds the team: every question customers ask becomes intel, Remi AI logs the patterns, and Eve uses them to decide what content to make next.',
    order: 1,
    price: 95,
    note: 'included with every Smart Website · books from Get Booked, sells from Get Growing',
  },
  {
    id: 'eve',
    name: 'Eve',
    role: 'Research & strategy',
    does: "A daily brief on your market: competitor moves, local trends, and the news that affects your business, tuned to what you want watched. It lands in your dashboard beside the team's SEO, engagement, and analytics work.",
    handoff: 'Hands off to: Elly (content briefs), Max (audience & offer targeting), Manny AI (the plan for your approval).',
    order: 2,
    price: 95,
  },
  {
    id: 'elly',
    name: 'Elly',
    role: 'Copywriting',
    does: "Writes pages, posts, emails, and full sequences in your voice, from Eve's brief and your Brand Brain, never a blank page.",
    handoff: 'Hands off to: Leo (copy for design), Aria (scripts for voice), Nova (pages for search tuning), Piper (finished posts to schedule).',
    order: 3,
    price: 145,
  },
  {
    id: 'eny',
    name: 'Leo',
    role: 'Graphics & video',
    does: "Turns Elly's copy into graphics and short-form video built for each network, always in your brand's look.",
    handoff: 'Hands off to: Piper (finished assets to publish), Max (creative for ads).',
    order: 4,
    price: 245,
    hidden: true,
  },
  {
    id: 'mimi',
    name: 'Aria',
    role: 'Voice & audio',
    does: "Learns your voice from a short sample, then speaks whatever Elly writes (voiceovers, reels, phone greetings) so you never hit record.",
    handoff: 'Hands off to: Leo (audio for video), Piper (finished audio to publish).',
    order: 5,
    price: 145,
    hidden: true,
  },
  {
    id: 'essie',
    name: 'Nova',
    role: 'SEO & local search',
    does: "Maps what your customers search, tunes every page before it ships, and keeps your Google Business Profile active and accurate.",
    handoff: "Hands off to: Elly (keyword targets for new content), Vera (rankings to track), Manny AI (what's climbing, what needs work).",
    order: 6,
    price: 195,
  },
  {
    id: 'bap',
    name: 'Piper',
    role: 'Publisher & scheduling',
    does: "Publishes everything at the right time on every channel: your site included, always as a preview until you press Publish.",
    handoff: 'Hands off to: Finn (live posts to watch), Vera (live posts to measure).',
    order: 7,
    price: 145,
    hidden: true,
  },
  {
    id: 'addy',
    name: 'Max',
    role: 'Paid ads',
    does: "Runs your Google and Meta ads from Eve's targeting and Leo's creative: watching spend daily, never touching budget without your OK.",
    handoff: 'Hands off to: Vera (spend & results to measure), Manny AI (budget requests for your sign-off).',
    order: 8,
    price: 245,
    hidden: true,
  },
  {
    id: 'upie',
    name: 'Finn',
    role: 'Engagement & reputation',
    does: "Answers reviews, comments, and DMs in your voice, routes anything sensitive to a human first, and nudges happy customers to review.",
    handoff: 'Hands off to: Eve (what customers are saying), Manny AI (issues that need a human).',
    order: 9,
    price: 195,
  },
  {
    id: 'ana',
    name: 'Vera',
    role: 'Analytics & reporting',
    does: "Tracks what every piece produced (traffic, calls, bookings, sales) and turns it into a clear monthly report that feeds Eve's next plan.",
    handoff: 'Hands off to: Eve (what performed), Manny AI (your report).',
    order: 10,
    price: 145,
  },
];

// Manager is free; only paid agents count toward "from" pricing and bundles.
export const paidAgents = team.filter((a) => !a.included);

// One flat one-time setup builds the Brand Brain and trains the team, however
// many agents you hire (normal AI usage included; heavy usage metered at cost,
// quoted first).
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
    tagline: "The team that turns content into customers and proves it: search visibility, paid amplification, and the monthly numbers that show what it's all producing.",
    agentIds: ['essie', 'addy', 'ana'],
    monthly: 445,
    addOn: true,
  },
  {
    id: 'whole',
    name: 'The Whole Team',
    diagnosis: 'For when you answered the two questions and named three departments.',
    tagline: 'The complete operation: front desk, content, growth, and reporting, running as one coordinated team under Manny AI.',
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

// "From" anchor used on the hero + the /plans flagship card (cheapest paid agent).
export const aiTeamStartingPrice = Math.min(...paidAgents.map((a) => a.price));

export const aiTeamFaq = [
  {
    // Real long-tail query — geo in the question on purpose (Aug 2026 SEO pass).
    q: 'Which AI agent should my Springfield business get first?',
    a: "Whichever one sits on your bottleneck. Ask yourself: what are you bad at that keeps costing you money? If the answer is unanswered customers, that's Remi AI, the front desk agent, a product on its own at $95/mo. For everything else you hire Manny AI, and it staffs the specialist that fixes it: stock or custom-built. Not sure? That's what the 15-minute diagnostic is for.",
  },
  {
    q: "Isn't this just ChatGPT I could use myself?",
    a: "No. ChatGPT is a blank chat you have to prompt from scratch, every time, with no memory of your business. The AI Team is agents we build around your business, trained on one shared Brand Brain, connected to your tools, and coordinated by Manny AI so the research feeds the writing, the writing feeds the design, it all gets published on schedule, and the results get measured and fed back into next month's plan, with a person reviewing what goes out. You get the results without doing the work.",
  },
  {
    q: 'How do the agents work together?',
    a: "Through Manny AI. You make one request; Manny AI turns it into briefs, routes the work agent to agent in the right order, and checks the quality of what comes back at every handoff. If a draft is thin, off-voice, or missing information, Manny AI sends it back to the specialist for another pass before it moves on. Agents never work from scratch: each one starts from the last one's output and your shared Brand Brain, so what reaches you is the finished package, not a pile of drafts, and nothing goes out off-brand.",
  },
  {
    q: 'What is the Brand Brain?',
    a: "One knowledge base of your business (your services, prices, customers, past work, and voice) that every agent reads from and adds to. It's built during setup and grows with every job: Eve's research, Vera's results, and Remi AI's customer questions all get filed there, so the whole team learns from every piece of work any agent does.",
  },
  {
    q: 'Is there a human involved at all?',
    a: "Yes. The agents do the volume: drafting, designing, scheduling, monitoring, measuring. A person reviews the output and steps in where judgment matters: the calls, the verifications, the appeals, the things AI shouldn't do alone.",
  },
  {
    q: 'What does it cost?',
    a: `An agent starts at $${aiTeamStartingPrice}/mo: that's Remi AI, the front desk, which is also included with every Smart Website plan. For anything bigger you hire Manny AI, and the monthly is priced by what it runs for you, quoted on the 15-minute diagnostic before anything is billed. Normal AI usage is included (unusually heavy use is quoted first). The only other number: a one-time $${aiTeamSetupFee} setup, which builds your Brand Brain and trains your team.`,
  },
  {
    q: 'What does "hiring" Manny AI actually mean?',
    a: "We build your Brand Brain, then Manny AI staffs the specialists your work calls for: each one trained on your rules, your voice, and your data, and fine-tuned with you until it's ready. From there the team lives in your admin and dashboard: you ask Manny AI for what you need, approve what goes out, and we handle the updates and support.",
  },
  {
    q: 'Do I have to hire a whole team of agents?',
    a: "No. That's the point of Manny AI. You hire one manager, and it deploys only the specialists your bottleneck calls for: three, five, seven of them as the work demands, coordinating every handoff so you never play middleman.",
  },
  {
    q: "How do I know it's working?",
    a: "That's Vera's whole job: the analytics specialist on the team. Your dashboard shows the team's work as it lands, and a monthly report ties it to real outcomes: traffic, calls, bookings, sales, with the next plan built on those numbers. No more posting into the void.",
  },
  {
    q: 'Can the agents change my website itself?',
    a: "Yes. This is where the team stops being a content tool. The publishing side of the team works on your site directly: scans what's there, ships a landing page for a new promo or service, refreshes your hero, or swaps content over for a holiday. Changes arrive as a private preview copy of your site: your live site doesn't change until you press Publish, and if you Discard, nothing ever shipped. This is on-request work, the counterpart to a Smart Website plan where the site tunes itself in the background, and it's already running on a client's live site (VL Home Services).",
  },
  {
    q: "Can you build an agent that's not on the roster?",
    a: "Yes, and some of our best work is exactly that. We've built agents that check a contractor's project statuses against their backend and bilingual phone systems for a local daycare. If your bottleneck is specific to your business, the agent should be too. We scope custom agents on the diagnostic call.",
  },
  {
    q: 'Do you only work with businesses in Springfield?',
    a: "We're based in Springfield and work across Western Massachusetts: Hampden, Hampshire, and Franklin counties. Because the whole engagement runs through one admin and one point of contact, distance has never been the constraint; the working sessions happen wherever you are.",
  },
];
