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
}

// The team, in the order work actually flows through them.
export const team: Agent[] = [
  {
    id: 'eve',
    name: 'Eve',
    role: 'Research & strategy',
    does: 'Studies your market, your competitors, and what people are searching for, then tells the team what to make and why.',
    order: 1,
  },
  {
    id: 'elly',
    name: 'Elly',
    role: 'Copywriting',
    does: 'Writes it the way you would say it — pages, posts, emails, product descriptions, captions.',
    order: 2,
  },
  {
    id: 'eny',
    name: 'Eny',
    role: 'Design & video',
    does: 'Makes the visuals: graphics, banners, thumbnails, and short-form video, always on brand.',
    order: 3,
  },
  {
    id: 'mimi',
    name: 'Mimi',
    role: 'Voice & audio',
    does: 'The spoken layer — voiceovers for your videos and reels, and audio that sounds human, not robotic.',
    order: 4,
  },
  {
    id: 'bap',
    name: 'Bap',
    role: 'Publisher & social',
    does: 'Puts everything live at the right time, on every channel you use, so you post consistently without lifting a finger.',
    order: 5,
  },
  {
    id: 'upie',
    name: 'Upie',
    role: 'Reviews & reputation',
    does: 'Watches your reviews, drafts a reply to each one for you to approve, and nudges happy customers to leave more.',
    order: 6,
  },
];

// Pricing — a monthly retainer, offered in three tiers (scoped per business).
// AI does the labor, so these undercut a human agency while still reflecting a
// full content + reputation operation. Annual billing follows the same
// "pay 10, get 12" model as the other plans (see src/data/plans.ts).
export interface AiTeamTier {
  name: string;
  price: number; // monthly, month-to-month
  blurb: string;
  agents: AgentId[]; // agents active in this tier (drives the avatar row)
  features: string[]; // "what's included" bullets
  featured?: boolean; // most popular
}

export const aiTeamTiers: AiTeamTier[] = [
  {
    name: 'Starter',
    price: 900,
    blurb: 'Get found and stay consistent — research, writing, and publishing, handled.',
    agents: ['eve', 'elly', 'bap'],
    features: [
      'Eve, Elly & Bap on your account',
      'Market & keyword research',
      'Copywriting: posts, captions, and emails',
      'Scheduled publishing on 1–2 channels',
      'A plain-English monthly report',
    ],
  },
  {
    name: 'Growth',
    price: 1500,
    featured: true,
    blurb: 'Add design, video, and reputation — a full content engine across your channels.',
    agents: ['eve', 'elly', 'eny', 'bap', 'upie'],
    features: [
      'Everything in Starter, plus:',
      'Eny (design & video) & Upie (reviews)',
      'Branded graphics + short-form video',
      'Review monitoring & reply drafting',
      'Publishing across 3–4 channels',
    ],
  },
  {
    name: 'Full Team',
    price: 2500,
    blurb: 'The whole roster, every channel, with a human on priority call.',
    agents: ['eve', 'elly', 'eny', 'mimi', 'bap', 'upie'],
    features: [
      'Everything in Growth, plus:',
      'Mimi (voice) — voiceovers & audio',
      'All the channels you use',
      'Priority turnaround',
      'A quarterly strategy session',
    ],
  },
];

// One-time onboarding: brand training, connecting your tools, building each agent.
export const aiTeamSetupFee = { min: 500, max: 1500 };

// "From" anchor used on the hero + the /plans flagship card.
export const aiTeamStartingPrice = aiTeamTiers[0].price;

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
    a: "It's a monthly retainer, scoped to how much you want the team to handle. It starts around $900/mo and we quote the real number up front after a short call — no surprises.",
  },
];
