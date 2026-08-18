// Business-apps tiers — the single source of truth for /apps and /pricing
// (moved out of apps.astro, Aug 2026). One-time builds at a flat $75/hr,
// quoted up front; "disconnected → connected → custom" is the organizing idea
// (Manny's frame). Never consumer/app-store apps.

export const APPS_HOURLY = 75;

export interface AppTier {
  name: string;
  audience: string;
  scope: string;
  scopeLines: string[];
  kind: 'Disconnected' | 'Connected' | 'Custom';
  price: number;
  service: string;
  featured?: boolean;
  description: string;
  features: string[];
}

export const TIERS: AppTier[] = [
  {
    name: 'Scripts & Tools',
    audience: 'For killing weekly busywork',
    scope: 'Standalone tools',
    scopeLines: ['Google Apps Script automations', 'Scheduled reports and reminders'],
    kind: 'Disconnected',
    price: 300,
    service: 'app-scripts',
    description: 'Standalone helpers that do one job well. The spreadsheet that becomes a tool, the script that runs on schedule, the utility that kills an hour of weekly busywork.',
    features: [
      'Google Apps Script, so your Sheets, Docs, and Gmail do the work themselves',
      'Scheduled scripts that run reports, reminders, and cleanups without you',
      'One-job tools built around how you already work',
    ],
  },
  {
    name: 'Connected Apps',
    audience: "For tools that don't talk",
    scope: 'Your stack, wired together',
    scopeLines: ['APIs, webhooks, Twilio, Zapier', 'MCP servers so AI can use them'],
    kind: 'Connected',
    price: 600,
    service: 'app-integration',
    featured: true,
    description: 'Your tools wired together so data stops being re-typed. Website, inbox, CRM, calendar, phone, and accounting move information on their own.',
    features: [
      'API & webhook integration — if a tool has an API, we can wire it in',
      'Twilio phone & SMS with call routing, business-hours logic, and A2P registration handled',
      'Make.com & Zapier flows, documented so they keep running without babysitting',
      'MCP servers that plug your business tools into AI, so your assistants can actually use them',
    ],
  },
  {
    name: 'Business Apps',
    audience: 'For running the whole operation',
    scope: 'A system built for you',
    scopeLines: ['Dashboards, booking, quoting', 'Yours outright, or co-owned'],
    kind: 'Custom',
    price: 2500,
    service: 'custom-app',
    description: 'Admin dashboards, booking and quoting engines, client portals — the systems your business runs on, designed, built, and published for you.',
    features: [
      'Dashboards and admin panels that put your whole operation on one screen',
      'Booking, quoting, and lead-to-job systems like the one VL Home Improvement Services runs on',
      'AI assistants grounded in your own content, with a human approving what matters',
      'Own it outright, or co-own it with nothing upfront',
    ],
  },
];
