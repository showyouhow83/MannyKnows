# OpsCloud AI Team — prompt review & patches

_Point-in-time record (Aug 2026) of an external system — the opscloud.us AI
team prompts. Not a description of this repo. Kept for history; nothing here
is maintained._


Review of the Prompt & Orchestration Atlas (Aug 4 deploy) against the failure
evidence in AGENT-REPORT-ERRATA.md. Verdict up front: **the architecture is
genuinely good** — deterministic DATA blocks, draft-is-read-only, the publish
gate, Brand-Brain-first grounding, the standing-guidance loop. The five flawed
reports didn't come from bad architecture; they came from **rules the prompts
don't state yet**. Every patch below is drop-in text, each tied to an observed
failure (errata item numbers in brackets).

The bar: an agent worth $100/mo produces reports the owner can act on
*without* fact-checking them. Today the errata shows the opposite ratio —
that's the gap these patches close.

---

## 1. Nova's autopilot persona — 7 patches (highest priority)

The current rules cover *inventing numbers*. None of the five reports invented
GSC numbers — they failed in ways the prompt never forbids. Append to the
autopilot rules block:

**PATCH N1 — fetch before prescribing** [errata 2.1, 2.3, 5.2]
> Before recommending anything about a specific page (create it, rewrite it,
> retitle it, add schema), you MUST fetch that page in this run (`page_audit`)
> — or confirm via the crawl data in the DATA block that it does or doesn't
> exist. State what you found. Never recommend creating something without
> checking whether it already exists; never recommend rewriting something
> without quoting what's there now.

**PATCH N2 — diff against your own last report** [errata 2.2, 5.4]
> Before writing, read your previous report for this check (`seo_reports`).
> Mark every finding NEW, STILL OPEN, or RESOLVED. Never re-assert a finding
> the owner's feedback or fresher data shows fixed, and never contradict your
> own prior data without calling out the change explicitly.

**PATCH N3 — statistical floors** [errata 4.1, 4.2]
> Report n (impressions/clicks) beside every average or aggregate. No headline
> metric from under 100 impressions — below that, describe direction only.
> Exclude queries containing search operators (`site:`, `-site:`, quoted
> strings) from all ranking analyses: they are one user's filtered search, not
> demand. Flag them separately if notable.

**PATCH N4 — position-aware CTR** [errata 5.1]
> Never diagnose a "CTR problem" for queries or pages averaging worse than
> position ~15 — at those positions zero clicks is the expected outcome and
> the diagnosis is rank, not titles. CTR analysis is only meaningful once
> position is roughly ≤ 10.

**PATCH N5 — bounded certainty** [errata 5.5]
> Your claims are bounded by instrumentation. If calls, forms, or bookings are
> not measured in the DATA block, write "no conversions *recorded*" — never
> "nobody booked/called." Name the missing instrumentation instead.

**PATCH N6 — enumerate or drop** [errata 5.3]
> Never reference a count of issues ("4 technical issues") without listing
> every one, with its URL and evidence, in the same report. A finding that
> can't be shown doesn't exist.

**PATCH N7 — feasibility check** [errata 1.3]
> Before recommending the owner connect or buy something, verify it's
> available on their actual plan/stack (the DATA block lists connections and
> platform). Prefer the free/built-in equivalent when one exists (e.g. GSC
> Crawl Stats before any paid log pipeline).

## 2. Nova's job persona (the 4-phase writer) — 2 patches

Phase 0/SCHEMA HONESTY are strong. Two gaps:

**PATCH N8 — price/name provenance** [errata 3.3–3.7: five fabricated prices,
invented plan names, padded service areas]
> PRICE & FACT PROVENANCE: every price, plan name, service-area town, and
> offer detail in any deliverable (including JSON-LD) must be verbatim from
> the Brand Brain or from a page you fetched this run — cite which, inline.
> If neither source has it, the field is OMITTED, never estimated. This is the
> same rule as SCHEMA HONESTY, widened from ratings to every business fact.

**PATCH N9 — audit claims need a fetch** [errata 3.1, 3.2]
> If the task is auditing existing markup/pages, your verdict per page must
> quote what the page actually serves (fetched this run). "Missing" means you
> fetched it and it isn't there — not that you didn't look. "Broken" requires
> pasting the broken fragment and naming the parse error.

## 3. Manny's Quality Gate — 2 patches

The gate judges against the brief and Brand Brain — but not against the live
site, which is why grounding failures sail through it.

**PATCH M1 — grounding spot-check**
> When a deliverable makes claims about the business's website or existing
> pages ("X is missing", "create page Y", "page Z is thin"), verify the agent
> showed its evidence (a fetch/audit performed this job, quoted in the
> deliverable). A site claim with no shown evidence is a rejection reason:
> "ungrounded claim — fetch the page and show what's there."

**PATCH M2 — fail closed, visibly**
> Current behavior on a review-call error is fail-open (work passes
> unreviewed). Recommend: deliver it, but flagged "⚠ not quality-checked —
> review call failed" so the owner knows which bar it skipped. Silent
> fail-open converts outages into trust erosion invisibly.

## 4. Manny's Wrap-up — 1 patch

**PATCH M3 — don't mandate overclaiming**
The current text orders: "every deliverable listed WAS delivered — never claim
something is missing… if an excerpt reads oddly, ignore the oddity." The
intent (don't speculate, don't scare the owner) is right; the wording orders
the model to assert quality it can't see. Reword:
> Describe what the titles and metadata show was produced; don't speculate
> beyond them in either direction — neither inventing problems nor asserting
> quality you can't see. If something genuinely failed upstream, the system
> (not you) surfaces it.

## 5. Eve (research) — 1 patch

**PATCH E1 — cite-or-drop** [pattern: Report 2's real-but-unpinned intel]
> Every Finding carries source name, URL, and publication date inline. A
> finding whose source you can't name and link gets dropped or explicitly
> marked "unverified — needs confirmation." Ranges over point estimates when
> sources disagree; vendor-published vs third-party labeled as such.

Worth considering product-side: a second "skeptic" pass on research
deliverables (attempt to refute each finding before it reaches the owner). In
our own pipeline that pass rejects or corrects ~5–10% of findings — the ones
that would have become the owner's next bad decision.

## 6. Vera (analytics) — 1 patch

Her honesty rules are already the best of the specialists. One addition:

**PATCH V1 — traffic sanity filters** [errata 5.6]
> Before naming a channel leader or trend: exclude known self-traffic (the
> business's own widget/tool domains, monitoring services, the owner's
> office IP when identifiable) and flag any source with a degenerate
> sessions-to-users ratio (e.g. 48 sessions / 2 users) as probable automation
> or self-referral rather than audience. Ratios belong next to totals.

## 7. Roster gap (product, not prompts)

The atlas specifies Manny, Remi, Eve, Elly, Nova, Vera, Leo, and the Piper
publish gate. **Aria (voice), Max (paid ads), and Finn (engagement) have no
persona in the atlas.** If they're rentable at $100/mo they need prompts at
Nova's level of rigor — especially Max, where ungrounded numbers spend real
ad budget. If they're not ready, don't let the planner route work to them.

## 8. What NOT to change

Keep, verbatim: the deterministic-DATA-block-plus-interpretation split (it's
the single best design decision in the system); draft-is-fetch-only with the
one publish door; the Brand Brain layering with human-verified-first; Remi's
two-tier guardrails; the standing-guidance injection; Nova's SCHEMA HONESTY
clause (extend it, per N8, don't dilute it); "never invent traffic/rankings/
search volume"; the output contract. The honest tool-scope disclaimers in the
reports came from these prompts — that instinct is the foundation the patches
build on.

---

*Cross-reference: AGENT-REPORT-ERRATA.md holds the five annotated reports
these patches are derived from. Every patch traces to at least one observed
production failure — none of this is theoretical.*
