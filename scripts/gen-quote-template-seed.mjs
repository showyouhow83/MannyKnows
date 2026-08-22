#!/usr/bin/env node
// Rewrites database/seeds/quote-templates.sql in place:
//   • tags every `subtotal` item with a billing cadence (once/monthly/yearly),
//   • splits any Investment section that mixes a setup fee with a monthly
//     plan into two priced options — month to month, and prepay the year.
//
// Idempotent: a template that already carries a yearly option is left alone,
// so you can re-run this after editing copy in the SQL.
//
// Apply the result:
//   npx wrangler d1 execute MK_APP_DB --local  --file database/seeds/quote-templates.sql
//   npx wrangler d1 execute MK_APP_DB --remote --file database/seeds/quote-templates.sql
// (the seed deletes by name before inserting, so re-running replaces cleanly —
//  it also discards template edits made in the admin, by design.)

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'database/seeds/quote-templates.sql';

// Copy for the two billing options. Kept here so a wording change is one edit.
const NOTE_MONTHLY_WITH_SETUP =
  'Billed monthly, starting at kickoff. No minimum term and no exit charge, cancel anytime. Full refund within 5 business days of kickoff; after that the setup fee is non-refundable.';
const NOTE_MONTHLY_NO_SETUP =
  'Billed monthly, starting at kickoff. No minimum term and no exit charge, cancel anytime. Full refund within 5 business days of kickoff.';
const NOTE_YEARLY_WITH_SETUP =
  'Two ways to pay for the same service, pick one. Prepaying covers 12 months for the price of 10 and waives the one-time setup fee in full. Full refund within 5 business days of kickoff; after that, prepaid years are non-refundable.';
const NOTE_YEARLY_NO_SETUP =
  'Two ways to pay for the same service, pick one. Prepaying covers 12 months for the price of 10, two months free. Full refund within 5 business days of kickoff; after that, prepaid years are non-refundable.';

const isSetup = (label) => /setup|build \(starting/i.test(label || '');
const isMonthly = (label) => /monthly|per month|\/mo\b/i.test(label || '');

let uid = 0;
const nid = (prefix) => `${prefix}-y${++uid}`;

// Two templates price their plan through a `choice` (the tier ladder) and
// carried no monthly line at all, so a quote built from them showed a setup
// fee and nothing else. Seed the ladder's common tier as the monthly line —
// the admin retypes the number when the customer picks another tier.
const MONTHLY_SEED = {
  'Remi AI — chat agent for your website': { label: 'Monthly plan — Remi AI', amount: 75 },
  'AI Agents Team — Manny AI, priced per workflow': { label: 'Monthly plan — One Workflow', amount: 245 },
};

function transform(name, sections) {
  // 0. Give the ladder templates a monthly price line to split on.
  const seed = MONTHLY_SEED[name];
  if (seed) {
    const inv = sections.find((s) => /investment/i.test(s.title));
    const hasMonthly = inv && (inv.items || []).some((i) => i.type === 'subtotal' && isMonthly(i.label));
    if (inv && !hasMonthly) {
      const setupIdx = (inv.items || []).findIndex((i) => i.type === 'subtotal');
      inv.items.splice(setupIdx + 1, 0, {
        id: nid('i'),
        type: 'subtotal',
        label: seed.label,
        amount: seed.amount,
        billing: 'monthly',
      });
    }
  }

  // 1. Cadence on every price line.
  for (const sec of sections) {
    for (const item of sec.items || []) {
      if (item.type !== 'subtotal') continue;
      if (item.billing) continue; // already tagged
      item.billing = isMonthly(item.label) ? 'monthly' : 'once';
    }
  }

  // 2. Split the section that carries a monthly plan into two options.
  const out = [];
  for (const sec of sections) {
    out.push(sec);
    const subs = (sec.items || []).filter((i) => i.type === 'subtotal');
    const monthly = subs.find((i) => i.billing === 'monthly');
    const alreadySplit = subs.some((i) => i.billing === 'yearly');
    if (!monthly || alreadySplit) continue;
    const setup = subs.find((i) => i.billing === 'once' && isSetup(i.label));

    // Option A keeps the original items; its trailing prepay note becomes a
    // monthly-only note (the prepay story now has its own section).
    sec.title = /investment/i.test(sec.title) ? 'Investment — month to month' : `${sec.title} — month to month`;
    const notes = (sec.items || []).filter((i) => i.type === 'note');
    const termsNote = notes.find((n) => /prepay the year|cancel anytime/i.test(n.text || ''));
    const monthlyNote = setup ? NOTE_MONTHLY_WITH_SETUP : NOTE_MONTHLY_NO_SETUP;
    if (termsNote) termsNote.text = monthlyNote;
    else sec.items.push({ id: nid('i'), type: 'note', text: monthlyNote });

    // Option B — one yearly price line, plus the terms that differ.
    out.push({
      id: nid('s'),
      title: 'Investment — prepay the year (two months free)',
      items: [
        {
          id: nid('i'),
          type: 'subtotal',
          label: 'Year prepaid (12 months for the price of 10)',
          amount: Math.round(Number(monthly.amount || 0) * 10 * 100) / 100,
          billing: 'yearly',
        },
        { id: nid('i'), type: 'note', text: setup ? NOTE_YEARLY_WITH_SETUP : NOTE_YEARLY_NO_SETUP },
      ],
    });
  }
  return out;
}

const src = readFileSync(FILE, 'utf8');
const re = /VALUES \('((?:[^']|'')*)', '((?:[^']|'')*)', '((?:[^']|'')*)', (\d+), (\d+)\);/g;

let changed = 0;
const next = src.replace(re, (whole, name, projectType, sectionsSql, isDefault, sortOrder) => {
  const unq = (s) => s.replace(/''/g, "'");
  const q = (s) => s.replace(/'/g, "''");
  let sections;
  try {
    sections = JSON.parse(unq(sectionsSql));
  } catch (err) {
    console.error(`! ${unq(name)}: sections JSON did not parse, left untouched`);
    return whole;
  }
  const before = JSON.stringify(sections);
  const after = transform(unq(name), sections);
  const afterStr = JSON.stringify(after);
  if (afterStr !== before) {
    changed++;
    console.log(`✓ ${unq(name)}`);
  }
  return `VALUES ('${q(unq(name))}', '${q(unq(projectType))}', '${q(afterStr)}', ${isDefault}, ${sortOrder});`;
});

writeFileSync(FILE, next);
console.log(`\n${changed} template(s) rewritten in ${FILE}`);
