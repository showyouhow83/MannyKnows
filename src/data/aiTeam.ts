// The AI Team — our flagship offering. A named team of AI agents we build and
// fine-tune around your business (the "product"), billed as a monthly retainer
// per agent (the "plan"). Single source of truth for /ai-team, the flagship card
// on /plans, and the homepage teaser.
//
// Ten specialists + one manager, all reading from and writing to one shared
// "Brand Brain," coordinated by Manny:
//   Manny=Manager (free), Desi=Front desk, Eve=Research, Elly=Copy,
//   Terr=Graphics & Video, Mimi=Voice, Essie=SEO, Bap=Publishing,
//   Addy=Paid ads, Upie=Engagement, Ana=Analytics.
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
    does: "Manny is the admin — he's who you talk to. He takes your requests in plain English, turns them into briefs, assigns work to the right agents in the right order, tracks every job, manages your approval queue, and compiles your weekly and monthly reports. He's also the team's memory-keeper: everything the agents produce and learn gets filed in your Brand Brain through him. You never chase status, and you never copy-paste between tools. Manny comes free with any agent you hire — because a team without a manager is just software.",
    order: 0,
    price: 0,
    included: true,
    note: 'Included with any hire',
  },
  {
    id: 'desi',
    name: 'Desi',
    role: 'Front desk: sales, booking & support',
    does: "Lives on your site and answers customers 24/7 — replies to questions, books appointments, and points shoppers to the right product in your catalog, in their language. Because Desi reads from the same Brand Brain as the rest of the team, the answers customers get match the promises your marketing makes.",
    handoff: 'Feeds the team: every question customers ask becomes intel — Desi logs the patterns, and Eve uses them to decide what content to make next.',
    order: 1,
    price: 99,
    note: 'included with every Smart Website',
  },
  {
    id: 'eve',
    name: 'Eve',
    role: 'Research & strategy',
    does: "Studies your market, your competitors, and what people are searching for, then tells the team what to make and why. Eve also reads Ana's performance reports and Desi's customer-question log, so her plans are built on your real results and your real customers — not generic best practices.",
    handoff: 'Hands off to: Elly (content briefs), Addy (audience & offer targeting), Manny (the plan for your approval).',
    order: 2,
    price: 99,
  },
  {
    id: 'elly',
    name: 'Elly',
    role: 'Copywriting',
    does: "Writes it the way you would say it — pages, posts, emails, product descriptions, captions, and full email sequences like welcome series and win-backs. Elly never starts from a blank page: she works from Eve's brief and your Brand Brain, so the facts are right and the voice is yours.",
    handoff: 'Hands off to: Terr (copy for design), Mimi (scripts for voice), Essie (pages for search tuning), Bap (finished posts to schedule).',
    order: 3,
    price: 149,
  },
  {
    id: 'eny',
    name: 'Terr',
    role: 'Graphics & video',
    does: "Turns Elly's copy into platform-ready graphics and short-form video — sized, tagged, and captioned for each network, so a post is built for Instagram, TikTok, or Facebook, not copy-pasted across all three. Always in your brand's look, pulled from the Brand Brain.",
    handoff: 'Hands off to: Bap (finished assets to publish), Addy (creative for ads).',
    order: 4,
    price: 249,
  },
  {
    id: 'mimi',
    name: 'Mimi',
    role: 'Voice & audio',
    does: "Learns your voice from a short sample, then says whatever Elly writes — voiceovers, reels, phone greetings — in your own voice, so you never have to hit record.",
    handoff: 'Hands off to: Terr (audio for video), Bap (finished audio to publish).',
    order: 5,
    price: 149,
  },
  {
    id: 'essie',
    name: 'Essie',
    role: 'SEO & local search',
    does: "Makes sure the work gets found. Essie maps the searches your customers actually type, tunes every page and post Elly writes before it goes live, and keeps your Google Business Profile and local listings accurate and active — often the highest-return channel a local business has.",
    handoff: "Hands off to: Elly (keyword targets for new content), Ana (rankings to track), Manny (what's climbing, what needs work).",
    order: 6,
    price: 199,
  },
  {
    id: 'bap',
    name: 'Bap',
    role: 'Publisher & scheduling',
    does: "Puts everything live at the right time, on every channel you use, so you post consistently without lifting a finger — and confirms every publish back to Manny, so your status board is always true.",
    handoff: 'Hands off to: Upie (live posts to watch), Ana (live posts to measure).',
    order: 7,
    price: 149,
  },
  {
    id: 'addy',
    name: 'Addy',
    role: 'Paid ads',
    does: "Puts budget behind what's working. Addy builds campaigns on Google and Meta from Eve's targeting and Terr's creative, drafts the ad variants, watches spend and pacing daily, pauses the losers, and flags the winners — and never changes your budget without your approval.",
    handoff: 'Hands off to: Ana (spend & results to measure), Manny (budget requests for your sign-off).',
    order: 8,
    price: 249,
  },
  {
    id: 'upie',
    name: 'Upie',
    role: 'Engagement & reputation',
    does: "Watches everything that comes back — reviews, comments, DMs — and drafts a reply to each one for you to approve, in your voice, so you're responsive everywhere without living in five inboxes. Upie also nudges happy customers to leave more reviews, and flags recurring complaints to Manny so the team can fix the cause, not just the comment.",
    handoff: 'Hands off to: Eve (what customers are saying), Manny (issues that need a human).',
    order: 9,
    price: 199,
  },
  {
    id: 'ana',
    name: 'Ana',
    role: 'Analytics & reporting',
    does: "Proves it's working. Ana tracks what every piece the team makes actually produced — traffic, calls, bookings, sales — across every channel, and turns it into a plain-English monthly report: what ran, what it cost, what it made, and what to do more of. Her numbers feed Eve's next plan, so the team gets measurably better every month.",
    handoff: 'Hands off to: Eve (what performed), Manny (your report).',
    order: 10,
    price: 149,
  },
];

// Manager is free; only paid agents count toward "from" pricing and bundles.
export const paidAgents = team.filter((a) => !a.included);

// One flat one-time setup builds the Brand Brain and trains the team, however
// many agents you hire (normal AI usage included; heavy usage metered at cost,
// quoted first).
export const aiTeamSetupFee = 199;

// À-la-carte total for a set of agent ids, from the roster (keeps bundles honest).
const sumFor = (ids: AgentId[]) =>
  team.filter((a) => ids.includes(a.id)).reduce((sum, a) => sum + a.price, 0);

export interface Bundle {
  id: string;
  name: string;
  tagline: string;
  agentIds: AgentId[];
  monthly: number;
  addOn?: boolean;   // priced as an add-on ("add $449/mo")
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
    monthly: 449,
    addOn: true,
  },
  {
    id: 'whole',
    name: 'The Whole Team',
    tagline: 'The complete operation: front desk, content, growth, and reporting, running as one coordinated team under Manny.',
    agentIds: ['desi', 'eve', 'elly', 'eny', 'mimi', 'essie', 'bap', 'addy', 'upie', 'ana'],
    monthly: 1199,
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
    a: "One knowledge base of your business — your services, prices, customers, past work, and voice — that every agent reads from and adds to. It's built during setup and grows with every job: Eve's research, Ana's results, and Desi's customer questions all get filed there, so the whole team learns from every piece of work any agent does.",
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
    a: "That's Ana's whole job. If you hire her, you get a plain-English monthly report tying the team's work to real outcomes — traffic, calls, bookings, sales — and the team's next plan is built on those numbers. No more posting into the void.",
  },
  {
    q: 'Do the agents post without me seeing it first?',
    a: "You choose. Most owners start with everything queued for a quick approval, then hand off the routine stuff once they trust the output. Anything customer-facing — a post, a review reply, an ad — can always require your sign-off, and budget changes always do.",
  },
];
