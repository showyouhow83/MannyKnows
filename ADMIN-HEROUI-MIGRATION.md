# Admin → HeroUI v3 migration tracker

Living document. Every session working on this migration reads this file first
and updates it before ending. Branch: `admin-heroui`. **`main` is the cord** —
it stays untouched and deployed; if anything goes wrong, switch back to `main`
and production is exactly the pre-migration admin.

## Ground rules

- **Approach (Manny, Aug 21 2026): "HeroUI look, keep engine."** No React, no
  Tailwind v4, no `@heroui/react` runtime. The pages keep Astro + vanilla JS.
  We rebuild `admin.css` (and `portal.css`) as a HeroUI-v3-styled design
  system — HeroUI's real tokens, radii, shadows, focus rings, spacing scale,
  and component anatomy (Button, Card, Table, Modal, Input, Tabs, Chip…),
  translated to plain CSS classes, themed to the MK brand dark palette.
  Fetch real HeroUI CSS/theme via `.agents/skills/heroui-react/scripts/`
  (`get_theme.mjs`, `get_styles.mjs`, `get_component_docs.mjs`) — never
  invent what HeroUI looks like.
- The public site (Tailwind 3 via PostCSS) must not change visually or break.
  Admin styling stays self-contained, as admin.css is today.
- Behavior parity is the acceptance bar: every page must do what it does on
  `main` today. Known-working reference: Eli's project (Manny's live test).
- Adapter-v14 rule still applies: `cloudflare:workers` `env`, never
  `locals.runtime.env`.
- Never rename behavioral classes/ids the page JS depends on until that JS is
  itself migrated.
- Auth/session/middleware, API routes, and D1 queries are OUT of scope —
  frontend only. Frontmatter data fetching stays in Astro.

## Architecture decisions (settled by Manny, Aug 21 2026)

- **Component strategy:** HeroUI look, keep engine (CSS design system, no
  React). See Ground rules.
- **Scope:** Admin pages AND customer portal pages (portals after admin).
- **Theme:** Brand dark theme — `#0a0a14` canvas, violet/blue washes,
  `#2563eb→#d946ef` button gradient, glass cards — expressed through HeroUI's
  token structure and component anatomy.
- **Redesign license:** the goal is organization, not a 1:1 repaint — layout
  and grouping may improve within each page, but behavioral classes/ids and
  the page JS contracts stay intact until deliberately refactored.
- Tailwind v4 coexistence spike: NOT NEEDED (no Tailwind in this approach).

## Shared admin chrome (migrate once, reuse everywhere)

| Piece | File | Status |
| --- | --- | --- |
| Nav sidebar | `src/components/AdminNav.astro` | restyled via admin.css (markup untouched) |
| Mobile drawer | `src/components/AdminMobileDrawer.astro` | restyled via admin.css (markup untouched) |
| Presence | `src/components/AdminPresence.astro` | restyled via admin.css (markup untouched) |
| Stylesheet | `src/styles/admin.css` | **migrated** — awaiting Manny's visual verify |

admin.css compatibility contract (verified by selector + variable diff against
`main`): every selector and every CSS variable from the old file still exists.
New HeroUI semantic tokens added on top. What changed visually: buttons are
height-based pills with press-scale and focus rings (gradient primary kept);
fields are HeroUI-compact (10px/14px padding, accent focus ring); tables get a
filled header row; badges are HeroUI soft chips; modals/menus/toasts sit on the
opaque `--overlay` surface with HeroUI's dark inset-ring shadow; nav links are
36px pills. Glass card language, brand gradient, wordmark, washes: kept.

## Page inventory & status

Statuses: `not started` → `in progress` → `migrated` → `verified` (checked
against main's behavior). Line counts = migration effort signal.

### Admin pages

| Page | File | Lines | Status |
| --- | --- | --- | --- |
| Login | `admin/index.astro` | 229 | not started |
| Dashboard | `admin/dashboard.astro` | 2,391 | not started |
| Leads | `admin/leads.astro` | 2,748 | not started |
| Quotes | `admin/quotes.astro` | 6,436 | not started |
| Quote preview | `admin/quotes/[id]/preview.astro` | 798 | not started |
| Quote templates | `admin/quote-templates.astro` | 587 | not started |
| Quote template editor | `admin/quote-templates/[id].astro` | 792 | not started |
| Projects | `admin/projects.astro` | 6,240 | not started |
| Project contract | `admin/projects/[id]/contract.astro` | 1,816 | not started |
| Contract preview | `admin/projects/[id]/contract/preview.astro` | 855 | not started |
| Sign in person | `admin/projects/[id]/sign-in-person.astro` | 768 | not started |
| Collect payment | `admin/projects/[id]/collect/[rowId].astro` | 400 | not started |
| Contract templates | `admin/contract-templates.astro` | 531 | not started |
| Contract template editor | `admin/contract-templates/[id].astro` | 888 | not started |
| Contractor signature | `admin/contractor-signature.astro` | 387 | not started |
| Contacts | `admin/contacts.astro` | 1,592 | not started |
| Crew | `admin/crew.astro` | 2,998 | not started |
| Timeclock kiosk | `admin/timeclock.astro` | 1,164 | not started |
| Calendar | `admin/calendar.astro` | 617 | not started |
| Partners | `admin/partners.astro` | 373 | not started |
| Portfolios | `admin/portfolios.astro` | 466 | not started |
| Portfolio editor | `admin/portfolios/[id].astro` | 236 | not started |
| Media pool | `admin/media-pool.astro` | 993 | not started |
| Annotate | `admin/annotate.astro` | 459 | not started |
| Web hub | `admin/web.astro` | 164 | not started |
| Hero slider | `admin/web/hero-slider.astro` | 685 | not started |
| Wiki | `admin/web/wiki.astro` | 425 | not started |
| Migrate runner | `admin/migrate.astro` | 96 | not started |

### Customer portal pages (IN SCOPE — phase 2, after admin is proven)

| Page | File | Lines |
| --- | --- | --- |
| Quote view | `quote/[token].astro` | 633 |
| Quote accept | `quote/accept/[token].astro` | 1,014 |
| Quote decline | `quote/decline/[token].astro` | 604 |
| Project portal | `project/[token].astro` | 2,535 |
| Crew portal | `project/crew/[token].astro` | 1,515 |
| Contract sign | `project/contract/[token].astro` | 990 |
| Contract preview | `project/contract-preview/[token].astro` | 582 |
| Confirm | `confirm/[token].astro` | 882 |
| My project lookup | `my-project` + portal components | — |

Total admin-page surface ≈ 36k lines (+2.3k admin.css). Quotes + Projects are
half the risk on their own: their detail panes build DOM from JS template
strings.

## Quota strategy (Fable)

- Aug 21: Fable weekly at 92% used; weekly window resets in ~15h.
- Fable does: architecture, the TW4 spike, shared chrome, the pilot page, and
  review of everything. Heavy page-by-page conversion happens after the weekly
  reset, biggest pages first thing in a fresh window.
- Near quota: STOP mid-page cleanly (commit or revert to page boundary),
  update this tracker, never leave a page half-migrated on the branch.

## Session log

- **2026-08-21** — Branch `admin-heroui` cut from `3e461f4` (main, deployed,
  verified green). HeroUI skills installed (`.agents/skills/`), MCP registered
  (`.mcp.json` — needs an agent restart to load). Inventory built. Awaiting
  Manny's architecture/scope/theme decisions.
- **2026-08-21 (later)** — FOUNDATION SHIPPED: admin.css rebuilt on HeroUI
  v3.0.5 tokens/anatomy (fetched live via the skill scripts; component CSS
  cached in the session scratchpad). Selector/variable parity with `main`
  verified by diff; `npm run build` green; login page smoke-tested 200 on the
  dev server. NEXT SESSION: Manny visually verifies all pages on `npm run
  dev`; then per-page passes begin (each page's local `<style>` block moved
  onto the tokens, layout tidy-ups) — suggested order: dashboard → leads →
  contacts → crew → quotes → projects → the rest, portals last.
