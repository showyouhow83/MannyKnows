// ─────────────────────────────────────────────────────────────────────────────
// Starter contract templates — one per MannyKnows product family. Seeded from
// /admin/contract-templates ("Add starter templates"); the admin edits every
// line before a contract ever goes out.
//
// Ground rules (same as quoteTemplateConstants):
//   • No dollar figures in section/clause text — the signed QUOTE carries the
//     numbers; a reprice in the data files must never strand a template.
//   • Clause language mirrors /terms/ (setup-fee rule, 5-business-day refund,
//     cancel anytime, switch formula, ownership, Remi AI non-transfer). If
//     /terms/ changes, update these to match.
//   • Payment-schedule fields describe the MannyKnows model: the setup fee is
//     the single "down payment" at kickoff (waived on a prepaid year), then
//     the monthly subscription. One-time builds use split payments instead.
// project_type values mirror src/data/serviceTypes.ts.
// ─────────────────────────────────────────────────────────────────────────────
import type { QuoteSection } from './quoteTemplateConstants';

export interface ContractTerms {
  marketing_release: { enabled: boolean; text: string };
  reference_request: { enabled: boolean; text: string };
  custom_terms: { title: string; text: string }[];
}

export interface StarterContractTemplate {
  name: string;
  project_type: string;
  is_default: boolean;
  sections: QuoteSection[];
  terms: ContractTerms;
  down_payment_percent: number;
  down_payment_count: number;
  monthly_payment_count: number;
  cancellation_window_days: number;
  cancellation_fee_amount: number;
  late_fee_amount: number;
  late_fee_grace_days: number;
  warranty_months: number;
}

// ── Shared clause bank ───────────────────────────────────────────────────────
const CLAUSE = {
  setupBilling: {
    title: 'Setup fee & billing',
    text: 'On month-to-month billing, a one-time setup fee (stated in the signed quote) pays for the initial build; the monthly rate then covers hosting, maintenance, and the services listed in this agreement. On a prepaid year (10× the monthly rate, two months free) the setup fee is waived in full; both the discount and the waiver are conditioned on prepayment of the full 12-month term.',
  },
  refundWindow: {
    title: '5-business-day refund window',
    text: 'For 5 business days after project kickoff (the date work starts on the build, confirmed in writing), the client may cancel for any reason and receive a full refund of everything paid, the setup fee included. After the window, setup fees and prepaid annual fees are non-refundable except where the law requires or MannyKnows materially fails to deliver and does not cure. A plan switch never restarts the window.',
  },
  cancelAnytime: {
    title: 'No minimum term',
    text: 'Because the build is paid for when it is built, there is no minimum term and no early-cancellation charge on a monthly plan. The client may cancel at any time; cancellation takes effect at the end of the then-current billing month and nothing further is owed.',
  },
  planSwitch: {
    title: 'Plan switches',
    text: 'Amount due on a switch = the new tier’s setup fee minus the setup fee already paid, never less than $0. Moving down or sideways is free; a setup fee waived on a prepaid year counts as $0 paid. Full formula and examples: mannyknows.com/terms/#setup-on-switch.',
  },
  ownership: {
    title: 'Ownership on exit',
    text: 'The domain, the content, and the site itself are the client’s and go with them on exit. Remi AI and the other AI agents are service software licensed for the duration of the plan and running on MannyKnows infrastructure; content produced and leads captured remain the client’s, but the agents themselves do not transfer.',
  },
  latePayment: {
    title: 'Late & failed payments',
    text: 'Overdue amounts accrue interest at 1.5% per month (18% per year) or the maximum rate permitted by law, whichever is lower, from the due date. Failed-payment and chargeback fees are passed through at cost. Service may be suspended after notice; suspension does not pause payment obligations.',
  },
  precedence: {
    title: 'Precedence',
    text: 'Published prices are starting-at figures. The final price and scope for this engagement are set out in the signed quote attached to this agreement, which controls if it differs from the published terms at mannyknows.com/terms/.',
  },
  oneTimeCharges: {
    title: 'Work outside the plan',
    text: 'If this engagement requires a further one-time charge (a migration, a catalog import, custom development, or other work outside the plan’s scope), it is quoted in writing and agreed before that work begins.',
  },
  shopify: {
    title: 'Shopify subscription',
    text: 'The Shopify subscription is not included in the plan. The store account is opened in the client’s name and billed to the client by Shopify directly; payment-processing fees are Shopify’s own and are never marked up.',
  },
  adSpend: {
    title: 'Ad spend',
    text: 'The client funds advertising spend directly with each platform. The MannyKnows fee covers strategy, creative, and management only; ad spend is never marked up.',
  },
  unlimited: {
    title: 'What "unlimited" means',
    text: 'Unlimited content updates carry no cap and no per-change fee, handled on business days in the order received, covering existing pages, copy, images, and products. Redesigns, pages beyond the tier’s page count, new features or integrations, and higher-tier work are quoted separately before starting. Full definition: mannyknows.com/terms/#unlimited.',
  },
};

const MARKETING_RELEASE = {
  enabled: true,
  text: 'MannyKnows may feature the finished work (screenshots, the live site, and campaign results) to promote our business on our website, Google, and social media. Client data and private business information are never shared.',
};
const REFERENCE_REQUEST = {
  enabled: true,
  text: 'Once the work is live, may we use you as a reference for prospective clients?',
};

// Subscription products: setup fee due at kickoff (the one "down payment"),
// then the monthly subscription. 5-day window, no cancellation fee, no
// contractor-style warranty (maintenance is part of the subscription).
const SUBSCRIPTION_SCHEDULE = {
  down_payment_percent: 100,
  down_payment_count: 1,
  monthly_payment_count: 12,
  cancellation_window_days: 5,
  cancellation_fee_amount: 0,
  late_fee_amount: 0,
  late_fee_grace_days: 5,
  warranty_months: 0,
};

// One-time builds (apps): half to start, the balance on delivery.
const BUILD_SCHEDULE = {
  ...SUBSCRIPTION_SCHEDULE,
  down_payment_percent: 50,
  down_payment_count: 2,
  monthly_payment_count: 0,
};

const sec = (id: string, title: string, bullets: string[]): QuoteSection => ({
  id: `sec-${id}`,
  title,
  items: bullets.map((text, i) => ({ id: `it-${id}-${i + 1}`, type: 'bullet', text })),
});

export const DEFAULT_CONTRACT_TEMPLATES: StarterContractTemplate[] = [
  {
    name: 'Website Plan: Standard Contract',
    project_type: 'website-basic',
    is_default: true,
    ...SUBSCRIPTION_SCHEDULE,
    sections: [
      sec('web-scope', 'Scope of Work', [
        'Design and build the website described in the signed quote — layout, copy, and photos included',
        'Train Remi AI, the site’s AI agent, on the business (services, prices, hours, tone) to answer visitors 24/7',
        'Set up the client admin: leads, contacts, and content the client manages directly',
        'English + Spanish as standard — written, not machine-translated',
        'Connect the client’s domain (or register one), SSL, hosting, and caching included',
      ]),
      sec('web-monthly', 'What the Monthly Covers', [
        'Hosting, SSL, CDN, security, backups, and uptime monitoring',
        'Remi AI running, retrained as the business changes',
        'Content updates per the plan tier stated in the signed quote',
        'Technical SEO, speed, and search checks',
      ]),
    ],
    terms: {
      marketing_release: MARKETING_RELEASE,
      reference_request: REFERENCE_REQUEST,
      custom_terms: [
        CLAUSE.precedence, CLAUSE.setupBilling, CLAUSE.refundWindow,
        CLAUSE.cancelAnytime, CLAUSE.planSwitch, CLAUSE.unlimited,
        CLAUSE.ownership, CLAUSE.oneTimeCharges, CLAUSE.latePayment,
      ],
    },
  },
  {
    name: 'Online Store: Standard Contract',
    project_type: 'ecommerce',
    is_default: true,
    ...SUBSCRIPTION_SCHEDULE,
    sections: [
      sec('store-scope', 'Scope of Work', [
        'Design and build the Shopify store described in the signed quote',
        'Open the Shopify account in the client’s name and configure payments, shipping, and taxes',
        'Load the initial catalog with SEO-written product descriptions',
        'Train Remi AI on the catalog and the business to answer shoppers 24/7',
      ]),
      sec('store-monthly', 'What the Monthly Covers', [
        'Store maintenance and the product adds/changes allowance per the plan tier in the signed quote',
        'Remi AI running and retrained as the catalog changes',
        'eCommerce SEO, speed, and search checks',
      ]),
    ],
    terms: {
      marketing_release: MARKETING_RELEASE,
      reference_request: REFERENCE_REQUEST,
      custom_terms: [
        CLAUSE.precedence, CLAUSE.setupBilling, CLAUSE.shopify,
        CLAUSE.refundWindow, CLAUSE.cancelAnytime, CLAUSE.planSwitch,
        CLAUSE.ownership, CLAUSE.oneTimeCharges, CLAUSE.latePayment,
      ],
    },
  },
  {
    name: 'One-Page Website: Standard Contract',
    project_type: 'ai-website',
    is_default: true,
    ...SUBSCRIPTION_SCHEDULE,
    sections: [
      sec('op-scope', 'Scope of Work', [
        'Design and build a one-page website — layout, copy, and photos included',
        'Train Remi AI Lite on the business to answer visitors 24/7 and capture every lead',
        'Connect the client’s domain (or register one), SSL and hosting included',
        'Most one-page builds are completed within a week of contract signature (a good-faith estimate, not a guarantee)',
      ]),
      sec('op-monthly', 'What the Monthly Covers', [
        'Hosting, SSL, CDN, security, backups, and uptime monitoring',
        'Remi AI Lite running, retrained as the business changes, leads delivered to the client',
        'Speed and search checks',
      ]),
    ],
    terms: {
      marketing_release: MARKETING_RELEASE,
      reference_request: REFERENCE_REQUEST,
      custom_terms: [
        CLAUSE.precedence, CLAUSE.setupBilling, CLAUSE.refundWindow,
        CLAUSE.cancelAnytime,
        {
          title: 'Site handoff',
          text: 'On completion the client receives access to the site’s GitHub repository. Remi AI is service software and is not part of the repository; it runs only while the subscription is active.',
        },
        CLAUSE.ownership, CLAUSE.latePayment,
      ],
    },
  },
  {
    name: 'Remi AI: Standard Contract',
    project_type: 'remi-ai',
    is_default: true,
    ...SUBSCRIPTION_SCHEDULE,
    sections: [
      sec('remi-scope', 'Setup', [
        'Configure Remi AI at the tier stated in the signed quote and train it on the business (services, prices, hours, tone)',
        'Install the embed on the client’s website and verify it end to end',
        'Walk the client through the admin panels their tier unlocks',
      ]),
      sec('remi-monthly', 'What the Monthly Covers', [
        'Remi AI running on MannyKnows infrastructure, retrained as the business changes',
        'Captured leads delivered to the client’s admin',
        'The admin panels of the subscribed tier, per the signed quote',
      ]),
    ],
    terms: {
      marketing_release: MARKETING_RELEASE,
      reference_request: REFERENCE_REQUEST,
      custom_terms: [
        CLAUSE.precedence, CLAUSE.setupBilling, CLAUSE.refundWindow,
        CLAUSE.cancelAnytime, CLAUSE.ownership, CLAUSE.latePayment,
      ],
    },
  },
  {
    name: 'AI Agents Team: Standard Contract',
    project_type: 'ai-team',
    is_default: true,
    ...SUBSCRIPTION_SCHEDULE,
    sections: [
      sec('team-scope', 'Setup', [
        'Diagnostic: map the workflow(s) named in the signed quote and the tools they touch',
        'Build and train the AI agents each workflow needs, managed by Manny AI',
        'Connect the integrations scoped on the diagnostic',
        'Hand off with a walkthrough of how to submit work and read results',
      ]),
      sec('team-monthly', 'What the Monthly Covers', [
        'The workflow allowance of the subscribed tier, per the signed quote',
        'Normal AI usage included; third-party seats and services pass through at cost, never marked up',
        'Agents retrained and tuned as the business changes',
      ]),
    ],
    terms: {
      marketing_release: MARKETING_RELEASE,
      reference_request: REFERENCE_REQUEST,
      custom_terms: [
        CLAUSE.precedence, CLAUSE.setupBilling, CLAUSE.refundWindow,
        CLAUSE.cancelAnytime, CLAUSE.ownership, CLAUSE.latePayment,
      ],
    },
  },
  {
    name: 'Business App: Standard Contract',
    project_type: 'custom-app',
    is_default: true,
    ...BUILD_SCHEDULE,
    sections: [
      sec('app-scope', 'Scope of Work', [
        'Build the application described in the signed quote, at the flat hourly rate quoted up front',
        'Half of the quoted total is due to start, the balance on delivery',
        'Deliverables, integrations, and acceptance criteria are those listed in the signed quote',
      ]),
      sec('app-handoff', 'Handoff', [
        'Source code and documentation delivered per the ownership option in the signed quote',
        'A walkthrough of the finished app for the client’s team',
      ]),
    ],
    terms: {
      marketing_release: MARKETING_RELEASE,
      reference_request: REFERENCE_REQUEST,
      custom_terms: [
        CLAUSE.precedence, CLAUSE.oneTimeCharges,
        {
          title: 'Changes in scope',
          text: 'Work beyond the signed quote’s scope is re-quoted in writing at the same flat hourly rate and agreed before it begins.',
        },
        CLAUSE.latePayment,
      ],
    },
  },
];
