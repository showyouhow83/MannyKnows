# Agent report errata — fabrications, hallucinations & stale claims

Annotations for the analysis reports Manny received Aug 3–4, 2026: the
Googlebot crawl report (sent twice), the keyword-gaps report, the schema
report, the SERP snapshot, and the Monday SEO report. Each item: what the
report claimed → what's actually true → error class. For each report there's
also a "worth keeping" list — the genuinely good data — so the fixes don't
throw those out.

Error classes: **FABRICATED** (invented data), **FALSE** (checkable and wrong),
**STALE** (was true, wasn't re-checked), **MISSED** (big finding it should have
caught), **DEAD-END** (recommendation that can't be acted on), **UNGROUNDED**
(prescribed without checking what exists), **PHANTOM** (references findings it
never shows), **MISDIAGNOSIS** (right data, wrong conclusion).

---

## Report 1 — Googlebot crawl (Aug 3)

| # | Claim | Reality | Class |
|---|---|---|---|
| 1.1 | `/contact` split verdict "likely trailing slash, www vs non-www, or http vs https" | It guessed. The actual cause: slashless URLs get a **307 Temporary** redirect from Cloudflare's static-asset layer (`auto-trailing-slash` handling — status hardcoded by Cloudflare, not fixable in site code). http→https was already a clean 301; canonicals and sitemap were already correct. One `curl -I` would have named the defect. | UNGROUNDED |
| 1.2 | (not in report) | **`www.mannyknows.com` had no DNS record at all** — every www visit and backlink failed with a browser error. The report audited redirect hygiene and missed that an entire hostname was dead. Fixed by Manny Aug 3. | MISSED |
| 1.3 | "Connect Cloudflare's log/analytics feed" as the next step | Raw log export (Logpush) is **Enterprise-only** — unavailable on this plan. The free equivalent it didn't mention: GSC **Settings → Crawl stats**. | DEAD-END |
| 1.4 | Framing crawl-frequency mismatch as a thing to watch | Fair, and it self-dismissed correctly. Kept for balance: this part was fine. | — |

## Report 2 — Keyword gaps & competitors (Aug 4)

| # | Claim | Reality | Class |
|---|---|---|---|
| 2.1 | "Priority: build individual town pages (Northampton, Chicopee, Holyoke, Westfield, Agawam) instead of one generic service page" | **Four dedicated town pages already existed and were live** (Springfield, Chicopee, Holyoke, Northampton — shipped #372, Aug 2) with verified city data, per-town FAQs, and case-study links. Only Westfield/Agawam were genuinely missing. The #1 recommendation prescribed building what was already built. | UNGROUNDED |
| 2.2 | "We have zero Search Console presence for any town-specific query" | Contradicted by the agent's **own earlier report**: `/web-design-northampton-ma/` had impressions at position 8; "seo chicopee ma" sat at position 29. | FALSE |
| 2.3 | "/web-design-springfield-ma is a single thin page" | Was true a week ago; since #372 it carries cited SBA/Census data, an offers row, per-town FAQ, and case-study proof. Diagnosis not re-checked against the live page. | STALE |
| 2.4 | All cited positions (64 for the head term, etc.) treated as steady state | Every number was measured **before Google recrawled the Aug 3 keyword pass** — the report reasons from the "before" photo without flagging it. | STALE |
| 2.5 | "multimedia agents" advice: add Leo/Aria/Finn sections to /plans/multimedia-agency | That page sells a **human** retainer; stuffing AI-agent content in to chase a 5-impression ambiguous query would muddy a money page. Rejected. | UNGROUNDED |
| 2.6 | AI booking agent gap + JK Daycare proof; contractor-post data upgrade; design/development consolidation | All three correct and adopted. Credit where due. | — |

## Report 3 — Schema builder (Aug 4)

| # | Claim | Reality | Class |
|---|---|---|---|
| 3.1 | Homepage `/`: "❌ missing — biggest gap — has nothing" (its **Fix first**) | Homepage has a rich `@graph`: **ProfessionalService** (a LocalBusiness subtype — better for an agency than the generic `LocalBusiness` it proposed) + WebSite, with address, areaServed, offers, OfferCatalog. Its top priority was already done, better than its proposal. | FALSE |
| 3.2 | `/ai-team`: "⚠️ broken (invalid JSON-LD) — replace, don't append" | The page's single JSON-LD block **parses cleanly** — a valid FAQPage. Nothing was broken. Following the "replace" instruction would have deleted valid markup. | FALSE |
| 3.3 | AI-team offer: "$99/mo per agent, one-time $199 setup" | Real: **$95/mo, $195 setup** (aiTeam.ts). | FABRICATED |
| 3.4 | "Whole Team Bundle $1,199 … saving $491/mo" | Real: **$1,195/mo**; savings are computed from the à-la-carte total in aiTeam.ts, not $491. | FABRICATED |
| 3.5 | `/plans` offers: "AI Smart Website Plan I / II / III at $99 / $199 / $349" | **No plans by these names exist.** Real plans: Get Found $95, Get Booked $245, Get Growing $550, Get Ahead $895. Both the names and every price were invented. | FABRICATED |
| 3.6 | `/ecommerce` offer: "AI Smart eCommerce Plan, $399/mo or $333/mo yearly at $3,990/yr" | **No such plan.** Real tiers: Sell Online $150 / Sell More $325 / Sell Smarter $650 / Sell Everywhere $1,095. Every number invented. | FABRICATED |
| 3.7 | Homepage areaServed list includes "Monson, MA", "Deerfield, MA", "Greenfield, MA" | Not in the business's stated service area (servedTowns / homepage schema). Padding the list risks NAP/service-area inconsistency. | FABRICATED |
| 3.8 | "/contact partial (has FAQPage)" etc. | Correct — the FAQPage blocks exist (emitted by the site's Faq component). The *gap* halves of these rows were right. | — |
| 3.9 | /about, /blog, /services "missing" | Correct — genuinely had zero structured data. Now fixed (with values imported from the data files at build time, so prices can't drift). | — |

## Report 1b — Googlebot crawl, resent verbatim (Aug 4)

The identical report arrived again a day later, unchanged. If it was
regenerated (not just re-forwarded), that's its own finding: by Aug 4 the www
DNS record existed and the /contact cause had been identified, yet the report
repeated both stale findings and re-recommended the Enterprise-only log feed.
A regenerated report must re-inspect before repeating itself.

## Report 4 — SERP snapshot, "avg 41.4" (Aug 4)

| # | Claim | Reality | Class |
|---|---|---|---|
| 4.1 | Best row: `"ai content seo" -site:reddit.com -site:twitter.com …` at position 1.7 | That string is an **operator-laden query** — one user's (or one tool's) filtered search, not a market. Treating it as a rankable query (and letting it headline two separate reports as "best-positioned") is noise promoted to signal. It should be excluded or flagged, not celebrated. | MISDIAGNOSIS |
| 4.2 | "Weighted average position: 41.4" as the headline metric | Averaged across **6 queries totaling 12 impressions**. At this sample size the number is statistically meaningless and will swing wildly day to day; presenting it as the tracked headline invites reacting to noise. Report the n alongside any average, and don't headline averages under a sane impression floor (e.g. 100). | MISDIAGNOSIS |
| 4.3 | Positions presented as current standings | Measured before Google recrawled the Aug 3 site-wide title/meta/copy pass — the "before" photo again, unflagged. | STALE |
| 4.4 | Worth keeping | The table itself is real GSC data and internally consistent with prior reports; "data through Aug 1 — Google's freshest" honestly reflects GSC's ~2-day lag; "deltas start tomorrow" is the right instinct. **"website designer" impressing at all (pos 41) is a genuinely new signal** — the site never contained that term until Aug 3. | — |

## Report 5 — Monday SEO report, week of 2026-07-28 (Aug 4)

| # | Claim | Reality | Class |
|---|---|---|---|
| 5.1 | "117 impressions and 0 clicks is a CTR problem, not a visibility problem" → Priority 1: rewrite titles/meta | Backwards. At positions 41–90 (its own table), CTR is ~0 for **any** title — page-5 results don't get read, let alone clicked. 0 clicks at those positions is exactly what visibility-still-building looks like. The fix is rank movement (already in flight), not title surgery. | MISDIAGNOSIS |
| 5.2 | "Nova drafts new titles/meta this week" | A complete site-wide title/meta pass shipped **Aug 3** (#373), reviewed for stuffing, honesty, and length. Redrafting a day later — without knowing it exists — would overwrite fresh, deliberate work. Same root cause as 2.1: prescribing without fetching. | UNGROUNDED |
| 5.3 | "Fix the 4 nightly-crawl technical issues… 4 of 4 fixable in code" | **No list of these 4 issues appears in this or any prior report.** Findings referenced but never enumerated are unactionable and unverifiable — and in this series' track record, likely to dissolve on inspection (see 3.1/3.2). Show the list or drop the claim. | PHANTOM |
| 5.4 | "Add schema to the 4 pages missing it and fix the 1 broken block… blocks ready now, just say go" | Repeats the schema report's **debunked** findings (the "broken block" is valid FAQPage; the ready-made blocks contained five fabricated prices and invented plan names) and adds one-click approval pressure. Re-asserting corrected findings with "just say go" is the most dangerous pattern in the series: it converts hallucination into production changes via a single yes. Also stale: real-data schema shipped Aug 4 (#389). | FALSE |
| 5.5 | "Nobody booked, called, or filled a form this week" | The report has **no call tracking and no form-event tracking connected** (it says so itself two lines later). It can honestly say "no conversions were *recorded*"; it cannot say nobody called. Certainty must not exceed instrumentation. | MISDIAGNOSIS |
| 5.6 | "Referral led the week: 48 sessions, only 2 users — likely a few people bouncing back and forth" | 48 sessions from 2 users is the classic shape of **self-referral/tool noise** (own-widget domains, monitoring, the owner's own tools), not visitor behavior. Right instinct to flag it; should have named the likely cause and excluded it from the "led the week" framing. | MISDIAGNOSIS |
| 5.7 | Worth keeping | **Impressions 8 → 117 week-over-week is the single best datapoint in the whole series** — Google is entering the site into ~14× more auctions, consistent with the town pages + indexing requests landing. Also good: brand query "manny knows" at 6.5 (watch it consolidate to #1 — normal for a young domain, no action), homepage at 64 impressions, direct traffic showing 16 real users, and the honest "missing data" flags on conversions. | — |

---

## The pattern across all reports

1. **They never fetch the site before prescribing for it.** Every UNGROUNDED/FALSE
   item above dies on contact with one HTTP request or one view-source. Rule:
   *no recommendation about a page it hasn't fetched in the same session.*
2. **Prices/names get filled from a stale or imagined "Brand Brain."** Five
   separate fabricated price points across two reports. Rule: *numbers may only
   come from a quoted source (page fetch or data file) — never from memory.*
3. **No memory of its own prior reports — or of what's been fixed.** Report 2
   contradicted Report 1's data; Report 1 was resent unchanged after its
   findings were fixed; Report 5 re-asserted Report 3's debunked schema claims.
   Rule: *diff against the previous report AND the live site before repeating a
   finding; corrected findings must be marked resolved, not re-recommended.*
4. **Feasibility unchecked.** Enterprise-only Cloudflare logs recommended on a
   Free-plan zone. Rule: *verify a recommendation is actionable on the current
   plan/stack before making it.*
5. **Statistics without floors.** Headline averages over 12 impressions;
   operator-string queries promoted to "best-positioned"; deep-position zero
   CTR labeled a "CTR problem." Rule: *report n with every aggregate, exclude
   operator queries, and don't diagnose CTR above position ~20.*
6. **Certainty beyond instrumentation.** "Nobody booked, called, or filled a
   form" from a stack with no call or form tracking. Rule: *claims are bounded
   by what's measured — say "none recorded," never "none happened."*
7. **Phantom findings + approval pressure.** "4 technical issues" never
   enumerated anywhere; "blocks ready, just say go" on fabricated data. Rule:
   *every finding must be shown in full before any approval is requested; no
   pre-built artifact may be offered for one-click deployment unless its data
   sources are cited line by line.*

What the reports consistently do well — keep these: honest tool-scope
disclaimers, the "missing data" flags, week-over-week framing, sensible
prioritization structure, and (Reports 2 and 5) real signal worth acting on.
The fix is grounding and statistical hygiene, not intelligence.
