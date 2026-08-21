# Admin → HeroUI v3 migration tracker

Living document. Every session working on this migration reads this file first
and updates it before ending. Branch: `admin-heroui`. **`main` is the cord** —
it stays untouched and deployed; if anything goes wrong, switch back to `main`
and production is exactly the pre-migration admin.

## Ground rules

- HeroUI v3 = `@heroui/react` (React 19 + Tailwind CSS v4 + React Aria).
  v3 patterns only: no `HeroUIProvider`, compound components
  (`<Card.Header>`), `@heroui/styles` — see `.agents/skills/heroui-react/`.
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

## Architecture decisions

- **Component strategy:** PENDING Manny's answer (React islands vs CSS reskin).
- **Scope:** PENDING (admin only vs also customer portal pages).
- **Theme:** PENDING (brand dark palette on HeroUI tokens vs HeroUI default).
- **Tailwind v4 coexistence:** to be spiked before any page migrates —
  TW4 (admin, `@tailwindcss/vite` or scoped import) must build alongside TW3
  (public, PostCSS) without touching public CSS output. Verify with a full
  `npm run build` + byte-compare of public page CSS.

## Shared admin chrome (migrate once, reuse everywhere)

| Piece | File | Status |
| --- | --- | --- |
| Nav sidebar | `src/components/AdminNav.astro` | not started |
| Mobile drawer | `src/components/AdminMobileDrawer.astro` | not started |
| Presence | `src/components/AdminPresence.astro` | not started |
| Stylesheet | `src/styles/admin.css` (2,257 lines) | not started |

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

### Customer portal pages (in scope ONLY if Manny says so)

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
