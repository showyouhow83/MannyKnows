// The AI Team — our flagship offering. A named team of AI agents we build and
// fine-tune around your business (the "product"), billed as a monthly retainer
// per agent (the "plan"). Single source of truth for /ai-team, the flagship card
// on /plans, and the homepage teaser.
//
// Ten specialists + one manager, all reading from and writing to one shared
// "Brand Brain," coordinated by Manny:
//   Manny=Manager (free), Remi=Front desk, Eve=Research, Elly=Copy,
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
  included?: boolean; // true for Manny, who comes free with any hire
  note?: string;      // small qualifier shown next to the price
}

// The team, in the order work flows through them. Each paid agent is hired like
// staff: a flat monthly rate, normal AI usage included.
export const team: Agent[] = [
  {
    id: 'manny',
    name: 'Manny',
    role: 'Team manager & your point of contact',
    does: "He's who you talk to: turns plain-English requests into briefs, runs the agents, manages your approvals, and files everything the team learns into your Brand Brain. Free with any hire — a team without a manager is just software.",
    order: 0,
    price: 0,
    included: true,
    note: 'Included with any hire',
  },
  {
    id: 'desi',
    name: 'Remi',
    role: 'Front desk: sales, booking & support',
    does: "Answers customers on your site 24/7 — replies, books appointments, and guides shoppers to the right product, in their language.",
    handoff: 'Feeds the team: every question customers ask becomes intel — Remi logs the patterns, and Eve uses them to decide what content to make next.',
    order: 1,
    price: 95,
    note: 'included with every Smart Website',
  },
  {
    id: 'eve',
    name: 'Eve',
    role: 'Research & strategy',
    does: "Studies your market, competitors, and real customer questions, then tells the team what to make and why.",
    handoff: 'Hands off to: Elly (content briefs), Max (audience & offer targeting), Manny (the plan for your approval).',
    order: 2,
    price: 95,
  },
  {
    id: 'elly',
    name: 'Elly',
    role: 'Copywriting',
    does: "Writes pages, posts, emails, and full sequences in your voice — from Eve's brief and your Brand Brain, never a blank page.",
    handoff: 'Hands off to: Leo (copy for design), Aria (scripts for voice), Nova (pages for search tuning), Piper (finished posts to schedule).',
    order: 3,
    price: 145,
  },
  {
    id: 'eny',
    name: 'Leo',
    role: 'Graphics & video',
    does: "Turns Elly's copy into graphics and short-form video built for each network — always in your brand's look.",
    handoff: 'Hands off to: Piper (finished assets to publish), Max (creative for ads).',
    order: 4,
    price: 245,
  },
  {
    id: 'mimi',
    name: 'Aria',
    role: 'Voice & audio',
    does: "Learns your voice from a short sample, then speaks whatever Elly writes — voiceovers, reels, phone greetings — so you never hit record.",
    handoff: 'Hands off to: Leo (audio for video), Piper (finished audio to publish).',
    order: 5,
    price: 145,
  },
  {
    id: 'essie',
    name: 'Nova',
    role: 'SEO & local search',
    does: "Maps what your customers search, tunes every page before it ships, and keeps your Google Business Profile active and accurate.",
    handoff: "Hands off to: Elly (keyword targets for new content), Vera (rankings to track), Manny (what's climbing, what needs work).",
    order: 6,
    price: 195,
  },
  {
    id: 'bap',
    name: 'Piper',
    role: 'Publisher & scheduling',
    does: "Publishes everything at the right time on every channel — your site included, always as a preview until you press Publish.",
    handoff: 'Hands off to: Finn (live posts to watch), Vera (live posts to measure).',
    order: 7,
    price: 145,
  },
  {
    id: 'addy',
    name: 'Max',
    role: 'Paid ads',
    does: "Runs your Google and Meta ads from Eve's targeting and Leo's creative — watching spend daily, never touching budget without your OK.",
    handoff: 'Hands off to: Vera (spend & results to measure), Manny (budget requests for your sign-off).',
    order: 8,
    price: 245,
  },
  {
    id: 'upie',
    name: 'Finn',
    role: 'Engagement & reputation',
    does: "Answers reviews, comments, and DMs in your voice, routes anything sensitive to a human first, and nudges happy customers to review.",
    handoff: 'Hands off to: Eve (what customers are saying), Manny (issues that need a human).',
    order: 9,
    price: 195,
  },
  {
    id: 'ana',
    name: 'Vera',
    role: 'Analytics & reporting',
    does: "Tracks what every piece produced — traffic, calls, bookings, sales — and turns it into a plain-English monthly report that feeds Eve's next plan.",
    handoff: 'Hands off to: Eve (what performed), Manny (your report).',
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
    tagline: 'The full make-and-publish line: research → writing → graphics & video → voice → publishing → engagement. Everything a consistent presence takes, coordinated by Manny.',
    agentIds: ['eve', 'elly', 'eny', 'mimi', 'bap', 'upie'],
    monthly: 749,
  },
  {
    id: 'growth',
    name: 'The Growth Pack',
    tagline: "The team that turns content into customers and proves it: search visibility, paid amplification, and the monthly numbers that show what it's all producing.",
    agentIds: ['essie', 'addy', 'ana'],
    monthly: 445,
    addOn: true,
  },
  {
    id: 'whole',
    name: 'The Whole Team',
    tagline: 'The complete operation: front desk, content, growth, and reporting, running as one coordinated team under Manny.',
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
    q: "Isn't this just ChatGPT I could use myself?",
    a: "No. ChatGPT is a blank chat you have to prompt from scratch, every time, with no memory of your business. The AI Team is agents we build around your business — trained on one shared Brand Brain, connected to your tools, and coordinated by Manny so the research feeds the writing, the writing feeds the design, it all gets published on schedule, and the results get measured and fed back into next month's plan — with a person reviewing what goes out. You get the results without doing the work.",
  },
  {
    q: 'How do the agents work together?',
    a: "Through Manny. You make one request; Manny turns it into briefs, routes the work agent to agent in the right order, and brings the finished package back for your approval. Agents never work from scratch — each one starts from the last one's output and your shared Brand Brain, so nothing gets lost in handoff and nothing goes out off-brand.",
  },
  {
    q: 'What is the Brand Brain?',
    a: "One knowledge base of your business — your services, prices, customers, past work, and voice — that every agent reads from and adds to. It's built during setup and grows with every job: Eve's research, Vera's results, and Remi's customer questions all get filed there, so the whole team learns from every piece of work any agent does.",
  },
  {
    q: 'Is there a human involved at all?',
    a: "Yes. The agents do the volume — drafting, designing, scheduling, monitoring, measuring. A person reviews the output and steps in where judgment matters: the calls, the verifications, the appeals, the things AI shouldn't do alone.",
  },
  {
    q: 'What does it cost?',
    a: `You hire agents like staff: a one-time $${aiTeamSetupFee} setup to build your Brand Brain and train your team, then a flat monthly rate per agent — from $${aiTeamStartingPrice}/mo — with normal AI usage included. Manny, your team manager, is included free with any hire. Bundles save you up to $${wholeTeamBundle.savings.toLocaleString('en-US')}/mo. Add or drop agents anytime; if your usage is unusually heavy we'll meter it at cost and tell you before it ever hits a bill.`,
  },
  {
    q: 'What does "hiring" an agent actually mean?',
    a: "We build and customize the agent around your business — trained on your rules, your voice, and your data — and fine-tune it with you until it's ready. From there it lives in your admin: you ask Manny for what you need, approve what goes out, and we handle the updates and support.",
  },
  {
    q: 'Can I hire just one agent?',
    a: "Yes — every agent works on its own, and Manny comes along free to manage it and deliver its work the way you like: an email summary, a PDF, a shared doc. Hire more agents and Manny coordinates the handoffs automatically, so the team compounds without you playing middleman.",
  },
  {
    q: "How do I know it's working?",
    a: "That's Vera's whole job. If you hire her, you get a plain-English monthly report tying the team's work to real outcomes — traffic, calls, bookings, sales — and the team's next plan is built on those numbers. No more posting into the void.",
  },
  {
    q: 'Do the agents post without me seeing it first?',
    a: "You choose. Most owners start with everything queued for a quick approval, then hand off the routine stuff once they trust the output. Anything customer-facing — a post, a review reply, an ad — can always require your sign-off, and budget changes always do.",
  },
  {
    q: 'Can the agents change my website itself?',
    a: "Yes — this is where the team stops being a content tool. Piper works on your site directly: scans what's there, ships a landing page for a new promo or service, refreshes your hero, or swaps content over for a holiday. Changes arrive as a private preview copy of your site — your live site doesn't change until you press Publish, and if you Discard, nothing ever shipped. This is on-request work, the counterpart to an Smart Website plan where the site tunes itself in the background — and it's already running on a client's live site (VL Home Services), not a roadmap item.",
  },
];
