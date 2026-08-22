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

## Manny's design directives (Aug 21 2026 — apply during page passes)

1. **Sidebar nav** — DONE at foundation level: collapsible left rail
   (desktop ≥1025px), chevron toggle persists in localStorage, wordmark in
   the rail, slim top bar keeps bell/theme/logout. Mobile keeps the drawer.
2. **Leads/Quotes/Projects list columns**: the status groups ("Pending
   confirmation", "Confirmed"…) become hard to follow past ~5 cards. During
   those page passes: collapsible status sections with counts, denser list
   cards, and the group headers sticky within the column.
3. **Portfolios page**: not full width like other pages — make it match;
   its "All / Manual / …" filter buttons don't match the admin style — use
   the chip-filter pattern (see dashboard search filters); missing the
   bottom copyright footer — add `.admin-footer`.
4. **Contacts page**: same — full width + missing footer.

## Page inventory & status

Statuses: `not started` → `in progress` → `migrated` → `verified` (checked
against main's behavior). Line counts = migration effort signal.

### Admin pages

| Page | File | Lines | Status |
| --- | --- | --- | --- |
| Login | `admin/index.astro` | 229 | not started |
| ~~Dashboard~~ | `admin/dashboard.astro` | 2,391 | ✅ **DONE** — verified by Manny Aug 21 (pilot; sets the pattern) |
| Leads | `admin/leads.astro` | 2,748 | ✅ **DONE** — mini-dashboard layout approved by Manny Aug 21 ("I'm loving it!"); sets the pattern for Quotes + Projects |
| Quotes | `admin/quotes.astro` | 6,436 | **migrated** — mini-dashboard pattern applied Aug 21; awaiting Manny's visual verify |
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
  dev server. Manny verified the foundation locally (prod D1 snapshot
  imported into local dev for realistic testing; local login = env bootstrap
  creds in .dev.vars).
- **2026-08-21 (evening)** — Dashboard pilot done and APPROVED by Manny
  ("things look a bit tighter, which is great"). PATTERN LOCKED: page-local
  styles onto tokens; one loud primary action per page, secondary actions as
  soft accent pills; pill fields + chip filters; overlay surface for
  dropdowns; 16px spacing rhythm; element IDs and JS-injected class names
  never change. Rollout order for next session (fresh Fable window): leads →
  contacts → crew → quotes → projects → remaining admin pages → portals.
- **2026-08-21 (night)** — Sidebar shipped and revised per Manny (`a429d20`):
  full-width top bar (logo left, bell/theme/logout right, no blur — blur made
  the header the containing block and clipped the fixed rail); rail hangs
  below it (`--header-h: 65px`), chevron collapse persists in localStorage;
  sub-menus ALWAYS visible (Manny: no hover reveal) — the duplicate
  "View All …" first link and dividers hidden in the rail. Dashboard's five
  view-link buttons all removed (nav covers them). Mobile (<1025px) untouched:
  hamburger + drawer as on main; restyle during a later pass.
- **2026-08-21 (late)** — Layout locked per Manny ("loving this new layout"):
  footer removed on desktop, credit + build stamp in the rail bottom (mobile
  keeps the page footer); width policy centralized in admin.css with
  `!important` (Astro-scoped page styles outrank plain selectors) — all
  management pages full width, document editors (te/ce 980, pce 1080, cs 720)
  stay narrow. LEADS pass (Manny: "changes are minimal"): sources swapped to
  MK's (phone/email/scanner/google/social/cold-outreach/referral/other; Angi
  + Thumbtack removed from page, labels, and api validSources), status badge
  restyled to HeroUI Chip soft anatomy (no border, 12px pill) — **apply the
  same chip format to Quote statuses (Draft…) in the Quotes pass**. Seeded 14
  starter quote templates from the catalog: `database/seeds/quote-templates.sql`
  (generator kept in session scratchpad) — loaded into LOCAL D1 only; run
  `npx wrangler d1 execute MK_APP_DB --remote --file database/seeds/quote-templates.sql`
  to seed production when Manny approves.
- **2026-08-21 (night 2) — MINI-DASHBOARD PATTERN LOCKED (Leads approved).**
  Every list-detail page (Quotes, Projects next) gets: (1) page-topbar —
  gradient page title + one-line subtitle left, search field middle
  (max-w 400), ONE primary `new-record-btn` right; nothing redundant inside
  the list column; (2) a stat-card row (glass, radius-md, 22px number /
  11px uppercase label; status colors via *-soft-foreground tokens);
  (3) `.leads-columns`-style flex wrapper for list + detail. HeroUI metrics
  pass also approved: panels radius-lg 16, inner cards radius-md 12 +
  10-12px padding, detail name 20px, section titles 12px uppercase accent,
  rows 13px, all buttons pills, code badge = chip. Status chips = HeroUI
  soft chip (no border). JS contracts untouched (search/#noResults ids,
  list-collapsed on .admin-main, section toggles).
- **2026-08-21 (night 2, cont.) — QUOTES migrated** (same pattern): topbar
  (title "Quotes" + search + New Quote), 5 stat cards (Total · Pending
  Approval · Needs Review · Ready to Promote · **Open Pipeline $** = sum of
  draft+sent totals; on mobile the pipeline card spans 2 cols),
  `.quotes-columns` wrapper (list-collapsed selector switched to descendant).
  All status surfaces now HeroUI soft chips, no border: `.status-pill`
  (Draft/Pending/Declined/Accepted/Cold/Revised), detail-header
  `.quote-status-badge` + `.pending-badge`, RENEGO badge (violet soft pill).
  Metrics: panels radius-lg/16, form-sections + management-sections
  radius-md/16, section titles 12px uppercase accent, customer name 20px,
  quote-number chip = detail-code metrics, all `.btn`/`.btn-sm` pills
  (mobile !important overrides updated too), modal titles 16px. JS contracts
  untouched. Awaiting Manny verify.
  Refinement (same night): quote list cards are now SINGLE-LINE (code ·
  chip · name ellipsis · time right; extras stack below only when a status
  has them — follow-up meta, decline reason + actions, approval badge +
  Promote). Shared `.btn-close-detail` (admin.css, + `.detail-close-float`
  for JS-rendered panes) closes the open record back to the placeholder on
  Leads, Quotes, AND Projects — carry it into every list-detail page pass.
- **2026-08-21 (night 2, cont.) — SETTINGS nav group** (Manny's ask): Quote
  Templates, Contract Templates, My Signature moved out of the
  Quotes/Projects dropdowns into a new Settings group (gear icon, non-link
  `.nav-label` parent) at the rail bottom; the rail's hide-first-link rule
  became a `.view-all` marker class (a `:first-child` rule would have eaten
  the Settings group's first real link). Mobile drawer: same three links now
  live under its existing Settings section. All five settings pages pass
  `active="settings"`.
