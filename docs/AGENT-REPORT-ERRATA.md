# Agent report errata — fabrications, hallucinations & stale claims

Annotations for the three analysis reports Manny received (Aug 3–4, 2026):
the Googlebot crawl report, the keyword-gaps report, and the schema report.
Each item: what the report claimed → what's actually true → error class.

Error classes: **FABRICATED** (invented data), **FALSE** (checkable and wrong),
**STALE** (was true, wasn't re-checked), **MISSED** (big finding it should have
caught), **DEAD-END** (recommendation that can't be acted on), **UNGROUNDED**
(prescribed without checking what exists).

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

---

## The pattern across all three

1. **They never fetch the site before prescribing for it.** Every UNGROUNDED/FALSE
   item above dies on contact with one HTTP request or one view-source. Rule to
   give the reporting agent: *no recommendation about a page it hasn't fetched
   in the same session.*
2. **Prices/names get filled from a stale or imagined "Brand Brain."** Five
   separate fabricated price points across two reports. Rule: *numbers may only
   come from a quoted source (page fetch or data file) — never from memory.*
3. **No memory of its own prior reports.** Report 2 contradicted Report 1's data.
   Rule: *diff against the previous report before asserting "zero presence."*
4. **Feasibility unchecked.** Enterprise-only Cloudflare logs recommended on a
   Free-plan zone. Rule: *verify a recommendation is actionable on the current
   plan/stack before making it.*

What they consistently do well: honest scope disclaimers, sensible
prioritization frameworks, and (in Report 2) real competitive intel worth
acting on. The fix is grounding, not intelligence.
