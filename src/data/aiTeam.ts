// The AI Team — our flagship offering. It's a *productized service*: a named
// team of AI agents we build and run for your business (the "product"), billed
// as a monthly retainer (the "plan"). Single source of truth for /ai-team and
// the flagship card on /plans.
//
// Roster (locked with the owner): Eve=Research, Elly=Copy, Eny=Design & Video,
// Mimi=Voice, Upie=Reviews, Bap=Publisher & Social.

export type AgentId = 'eve' | 'elly' | 'eny' | 'mimi' | 'upie' | 'bap';

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
    does: 'The spoken layer — voiceovers for your videos and reels, and audio that sounds human, not robotic.',
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
    q: 'Is this software I have to run, or do you run it?',
    a: "We run it. We build the team around your business, train each agent on your brand, and keep it working every month. You approve the important things (like review replies and what goes out); we handle the rest.",
  },
  {
    q: 'Do the agents post without me seeing it first?',
    a: "You choose. Most owners start with everything queued for a quick approval, then hand off the routine stuff once they trust the output. Anything customer-facing — a review reply, a public post — can always require your sign-off.",
  },
  {
    q: "How is this different from the Business Ads or Multimedia Agency plan?",
    a: "Those plans are us doing the work as your agency. The AI Team is a team of agents we build for your business and run for you — research, copy, design, video, voice, publishing, and reviews, all coordinated. Many clients pair it with a plan; it also stands on its own.",
  },
  {
    q: 'Is there a human involved at all?',
    a: "Yes. The agents do the volume — drafting, designing, scheduling, monitoring. A person reviews the output and steps in where judgment matters: the calls, the verifications, the appeals, the things AI shouldn't do alone.",
  },
  {
    q: 'What does it cost?',
    a: "You hire agents like staff: a one-time $199 setup to build and train your team, then a flat monthly rate per agent — from $99/mo — with normal AI usage included. Hire the whole roster and the bundle rate saves you about $195/mo. Add or drop agents anytime; if your usage is unusually heavy we'll meter it at cost and tell you before it ever hits a bill.",
  },
];
