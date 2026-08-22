# Service Component Registry — RETIRED

This file documented a "service components" system (`fetch_website`,
`seo_analysis`, `ai_readiness_analysis`, …) that was assembled dynamically
from a Google Sheet through `src/lib/services/`.

**That code was deleted in the Aug 2026 unused-code audit** — it had zero
references anywhere in the repo. `src/lib/chatbot/`, `src/config/chatbot/`,
`src/lib/user/`, and the chatbot-era debug endpoints went with it (see the
"Legacy / debug" section of [API.md](API.md)).

Where the equivalents live now:

| You're looking for | Real location |
| --- | --- |
| Website analysis | `src/lib/site-analyzer.ts` + `src/pages/api/analyze-site.ts` — one server-side fetch, regex heuristics, report emailed via Resend |
| UI components | `src/components/ui/` — `Button`, `Breadcrumb`, `SectionHeader`, `Faq`, `PricingCards`. The rules for using them are in `CLAUDE.md` under "UI primitives" |
| Pricing data | `src/data/*.ts` (`plans.ts`, `remi.ts`, `aiTeam.ts`, `aiWebsite.ts`, `localSeo.ts`, `apps.ts`) with card builders in `src/lib/pricingCards.ts` |

Kept as a tombstone so nobody rebuilds against a registry that no longer
exists.
