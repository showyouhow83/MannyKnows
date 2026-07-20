// The AI Team — our flagship offering. It's a *productized service*: a named
// team of AI agents we build and run for your business (the "product"), billed
// as a monthly retainer (the "plan"). Single source of truth for /ai-team and
// the flagship card on /plans.
//
// Roster: Manny=Sales/Booking/Support (the front-desk agent, included with every
// Smart Website), Eve=Research, Elly=Copy, Eny=Design & Video, Mimi=Voice,
// Bap=Publisher & Social, Upie=Reviews. New agents are added over time as AI
// learns to do more — the roster is meant to grow.

export type AgentId = 'manny' | 'eve' | 'elly' | 'eny' | 'mimi' | 'upie' | 'bap';

export interface Agent {
  id: AgentId;
  name: string;
  role: string;      // short specialty label
  does: string;      // one plain-spoken line: what this agent does for you
  order: number;     // pipeline order (research → publish)
  price: number;     // flat monthly rate to "hire" this agent (USD)
}

// The team, in the order work actually flows through them. Each agent is hired
// like staff: a flat monthly rate, fair-use AI usage included.
export const team: Agent[] = [
  {
    id: 'manny',
    name: 'Manny™',
    role: 'Sales, booking & support',
    does: "Lives on your site and answers customers 24/7 — replies to questions, books appointments, and points shoppers to the right product in your catalog, in their language. Included with every Smart Website (rename it to fit your brand).",
    order: 0,
    price: 199,
  },
  {
    id: 'eve',
    name: 'Eve',
    role: 'Research & strategy',
    does: 'Studies your market, your competitors, and what people are searching for, then tells the team what to make and why.',
    order: 1,
    price: 99,
  },
  {
    id: 'elly',
    name: 'Elly',
    role: 'Copywriting',
    does: 'Writes it the way you would say it — pages, posts, emails, product descriptions, captions.',
    order: 2,
    price: 149,
  },
  {
    id: 'eny',
    name: 'Eny',
    role: 'Design & video',
    does: 'Makes the visuals: graphics, banners, thumbnails, and short-form video, always on brand.',
    order: 3,
    price: 249,
  },
  {
    id: 'mimi',
    name: 'Mimi',
    role: 'Voice & audio',
    does: 'Learns your voice from a short sample, then says whatever you write — voiceovers, reels, phone greetings — in your own voice, so you never have to hit record.',
    order: 4,
    price: 149,
  },
  {
    id: 'bap',
    name: 'Bap',
    role: 'Publisher & social',
    does: 'Puts everything live at the right time, on every channel you use, so you post consistently without lifting a finger.',
    order: 5,
    price: 149,
  },
  {
    id: 'upie',
    name: 'Upie',
    role: 'Reviews & reputation',
    does: 'Watches your reviews, drafts a reply to each one for you to approve, and nudges happy customers to leave more.',
    order: 6,
    price: 199,
  },
];

// Pricing — "hire AI agents like staff." One flat one-time setup builds and
// trains your team; then each agent is a flat monthly rate (fair-use AI usage
// included — unusually heavy usage is metered at cost, quoted first). Hiring
// the whole roster gets the bundle rate. Nobody sells agents this way yet;
// that's the point.
export const aiTeamSetupFee = 199; // one-time, flat — however many agents you hire

// Whole-roster bundle (vs ~$994/mo à la carte).
export const aiTeamBundle = {
  monthly: 799,
  get alaCarteTotal() {
    return team.reduce((sum, a) => sum + a.price, 0);
  },
  get savings() {
    return this.alaCarteTotal - this.monthly;
  },
};

// "From" anchor used on the hero + the /plans flagship card (cheapest agent).
export const aiTeamStartingPrice = Math.min(...team.map((a) => a.price));

export const aiTeamFaq = [
  {
    q: "Isn't this just ChatGPT I could use myself?",
    a: "No. ChatGPT is a blank chat you have to prompt from scratch, every time. The AI Team is agents we build around your business — trained on your brand, connected to your tools, and coordinated so the research feeds the writing, the writing feeds the design, and it all gets published on schedule, with a person reviewing what goes out. You get the results without doing the work.",
  },
  {
    q: 'Is there a human involved at all?',
    a: "Yes. The agents do the volume — drafting, designing, scheduling, monitoring. A person reviews the output and steps in where judgment matters: the calls, the verifications, the appeals, the things AI shouldn't do alone.",
  },
  {
    q: 'What does it cost?',
    a: `You hire agents like staff: a one-time $${aiTeamSetupFee} setup to build and train your team, then a flat monthly rate per agent — from $${aiTeamStartingPrice}/mo — with normal AI usage included. Hire the whole roster and the bundle rate saves you about $${aiTeamBundle.savings}/mo. Add or drop agents anytime; if your usage is unusually heavy we'll meter it at cost and tell you before it ever hits a bill.`,
  },
  {
    q: 'What does "hiring" an agent actually mean?',
    a: "It isn't software you have to run. We set up and customize the agent for you — trained on your business's rules, your voice, and your data — so it does that one job the way you would. You approve what matters; we keep it running every month.",
  },
  {
    q: 'How do the agents learn my business?',
    a: `We train each agent on your own data — your services, prices, past work, and brand voice. Part of the one-time $${aiTeamSetupFee} setup is working with you to clean up and format that data, so the agent answers accurately from day one instead of guessing.`,
  },
  {
    q: 'Can I hire just one agent?',
    a: "Yes — every agent works on its own. Rent only Eve and she delivers her research straight to you, the way you like to read it: an email summary, a PDF, a shared doc. Rent more agents and they hand work off to each other automatically — Eve's research feeds Elly's writing, Elly's copy feeds Eny's design — so the team compounds without you playing middleman.",
  },
  {
    q: 'Do the agents post without me seeing it first?',
    a: "You choose. Most owners start with everything queued for a quick approval, then hand off the routine stuff once they trust the output. Anything customer-facing — a review reply, a public post — can always require your sign-off.",
  },
];
