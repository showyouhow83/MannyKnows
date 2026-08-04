# OpsCloud AI Team — rev 3 review (round 2)

Review of the updated Prompt & Orchestration Atlas ("rev 3 — team wiring",
Aug 4 deploy), verified against the actual prompt text, not the changelog.
Round 1 (the five annotated reports and the original 14 patches) lives in git
history of this file and in OPSCLOUD-PROMPT-REVIEW.md.

**Verdict: this is a serious, fast, high-quality response.** Nearly every
patch landed — several in a stronger form than proposed — and the dev's own
rev-3 additions show they understood the *principles* behind the patches, not
just the list. One changelog overclaim and one unapplied patch noted below.
With this in place, the $100/mo bar is defensible — pending the next cycle of
reports proving compliance in practice.

---

## Verified implemented (checked in the prompt text)

| Patch | Status | Notes |
|---|---|---|
| N1 fetch-before-prescribing | ✅ | Autopilot guardrail 2, near-verbatim, plus "state what you found" |
| N2 diff-vs-previous-report | ✅ | Guardrail 3; previous report + owner feedback now ride in every prompt; feedback = ground truth; NEW / STILL OPEN / RESOLVED labels |
| N3 statistical floors | ✅✅ | Guardrail 5 **and enforced in code**: operator queries filtered everywhere, SERP average withheld under 100 impressions |
| N4 position-aware CTR | ✅✅ | Guardrail 5 + the title rewriter is **hard-gated in code** to position ≤ 15 |
| N5 bounded certainty | ✅ | Guardrail 6, verbatim |
| N6 enumerate-or-drop | ✅ | Guardrail 7, merged with no-approval-pressure |
| N7 feasibility | ✅ | Guardrail 4 + a STACK line grounds it |
| N8 price/fact provenance | ✅ (better) | Delivered as a **global output-contract rule for every job agent** ("sourced specifics", JSON-LD included, [verify:] fallback) instead of Nova-only — covers Elly and future agents too |
| N9 audits-require-fetch | ✅ (better) | Also global: "missing = fetched-and-absent; broken = quoted fragment + named error" |
| M1 QC grounding spot-check | ✅ | Two new QC clauses: invented-specifics check + site-claims-need-shown-evidence, with the exact rejection feedback |
| M2 visible fail-open | ✅ | "⚠ Not quality-checked — Manny's review call failed" badge |
| M3 wrap-up overclaim fix | ❌ **not applied** | See discrepancy below |
| E1 Eve cite-or-drop | ✅ | Verbatim block in her prompt |
| V1 Vera traffic sanity | ✅ | Verbatim block, with the ratio-beside-total requirement |

## Beyond the patches — the dev's own additions (all good)

- **Code-level enforcement where prompts used to plead**: JSON-LD past the
  extraction cap reports "not validated" (never "broken" — the exact rev-1
  failure), a **nightly dead-hostname check for www/apex** (born directly
  from the missed-www incident), no-change receipts for identical crawls,
  scheduled-run retry ~6h later, max 3 checks per hourly tick.
- **Grounded DATA blocks at the source**: the schema builder now receives
  live page text; keyword-gap receives the sitemap page list. This kills the
  root cause of reports 2 and 3 at the data layer, not the prompt layer.
- **Autopilot → team wiring**: "Send to the team" (full report rides into
  every step as sourceReport), the planner receives each check's latest
  finding with owner feedback outranking it, and Eve/Nova/Vera can read
  reports mid-job. The agents stop rediscovering what the system already
  knows — this was the gap between "ten reports" and "a team."
- **Vera's conversion instrumentation** (Remi's captured leads → Monday
  report): "0 conversions" claims can now be *bounded by real recording*
  instead of forbidden outright.
- Share links (noindex, 30-day, rotating), JSON reports feed with token.

## Discrepancies

1. **The changelog claims "M1–M3" but M3 is not in the text.** The wrap-up
   prompt (3.3) is byte-identical to rev 1 — still *"every deliverable listed
   WAS delivered… if an excerpt reads oddly, ignore the oddity."* That's the
   overclaiming mandate the patch removes. Small irony: a changelog asserting
   an unapplied fix is itself an enumerate-or-drop violation. The reword:
   > Describe what the titles and metadata show was produced; don't speculate
   > beyond them in either direction — neither inventing problems nor
   > asserting quality you can't see. If something genuinely failed upstream,
   > the system (not you) surfaces it.
2. Cosmetic: the QC card's chip still reads "fails open" — the note beside it
   documents the new visible behavior, so just a stale label.

## Resolved by design (no action)

- **Aria / Max / Finn** (unprogrammed, unconnected — per Manny): the planner
  builds from the inserted roster of *hired* agents, so unbuilt agents can't
  receive steps. Fine as-is; revisit personas when they're built.
- Remi voice paused product-wide (owner decision) — plumbing retained.

## What to watch in the next report cycle (the real acceptance test)

The prompts now promise; the next reports have to deliver. Check the first
Monday report and the next keyword-gap/schema runs for:

1. Findings labeled **NEW / STILL OPEN / RESOLVED** — and nothing previously
   corrected re-recommended.
2. **n printed beside every average**; no operator-string queries in any
   ranking table.
3. Site recommendations that **quote what the fetch found** ("fetched
   /web-design-westfield-ma/ — exists, covers X, lacks Y").
4. Any schema block's prices matching the live site / Brand Brain **exactly**
   (the site's own JSON-LD is generated from its data files — diffing against
   it is a free correctness check).
5. No "just say go" artifacts without line-by-line source citations.

If those five hold for two consecutive weeks, this system is producing the
pristine-data reports the $100/mo positioning needs.
