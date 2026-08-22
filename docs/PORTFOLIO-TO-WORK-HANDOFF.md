# Handoff: connect admin Portfolios to the public /work/ case studies

**Status:** not started. Written Aug 22 2026 for a separate session (Fable).
Nobody should start this without reading the whole file — the two halves were
built independently and neither knows the other exists.

## What Manny wants

A finished project becomes a published case study without retyping anything:

```
Project (in progress) → Mark Complete → Make Portfolio → published at
https://mannyknows.com/work/<slug>/
```

Today the last arrow does not exist. `Make Portfolio` only flips the
project's status to `portfolio`, which hides it from the Projects list.
Nothing is created, nothing is published.

Manny's notes on what to keep from the current admin portfolio model:
before/after pairs, the gallery, and the combined display mode all work for
MannyKnows — this is an adaptation, not a rebuild.

## The two halves that don't touch

### Half 1 — admin Portfolios (D1)

- Page: `src/pages/admin/portfolios.astro` + `src/pages/admin/portfolios/[id].astro`
- Client logic: `public/assets/admin-portfolios.js` (plain JS, cache-busted by
  `buildInfo.commit`)
- Tables: `portfolios`, `portfolio_media`, `portfolio_pairs`, `portfolio_gallery`
- `portfolios` columns: `id, project_name, project_type, description, slug,
  is_published, published_at, client_name, client_email, client_phone,
  client_city, source_project_id, display_mode, created_at, updated_at`
- `source_project_id` is the hook back to the project. It is populated when a
  portfolio is created from a project.
- **`is_published` publishes to nowhere.** No public route reads any of these
  tables.

### Half 2 — public /work/ (content collection)

- Route: `src/pages/work/[...slug].astro`, index at `src/pages/work/index.astro`
- Source: markdown files in `src/content/portfolio/*.md` (5 today:
  `sl-painting`, `cherry-vibes`, `jk-daycare`, `vl-home-services`,
  `springfield-en-victoria`)
- Schema: `src/content.config.ts`
- Page anatomy (read `work/sl-painting` to see it): hero image → "at a glance"
  panel (tech stack, role, timeline) → goals → result stat tiles → narrative →
  gallery.
- Images use the responsive pipeline: `public/works/<base>-<width>.<ext>`
  (AVIF/WebP). `heroImage`/`gallery` accept a base name OR a literal path/URL.
- Homepage cards come from `src/data/selectedWork.ts` and link to
  `/work/<slug>` only when the item carries a `caseStudy` slug.

## The decision to make first

Two viable directions. Pick one before writing code.

**A. Public route reads D1.** `/work/[slug]` queries `portfolios` where
`is_published = 1`, falling back to the markdown collection for the five
existing entries. Publishing becomes instant (no deploy). Costs: the page
becomes SSR-per-request (it is a Worker already, so this is fine), images move
to R2 + the media host instead of the build-time responsive pipeline, and the
markdown entries need a migration path or a permanent dual-source page.

**B. Admin writes markdown.** The admin generates a `.md` file into
`src/content/portfolio/` and commits it (GitHub API), which triggers the
existing deploy. Keeps the image pipeline and the current page code
unchanged. Costs: publishing needs a deploy (~10 min via Actions), and the
admin needs a GitHub token with write access.

Manny has not chosen. Ask him. A is the better product; B is less work and
keeps Lighthouse where it is.

## Field gap to close either way

The admin's portfolio form has: project name, type, description, client
fields, media, before/after pairs, gallery. The case-study page needs all of
that PLUS:

| /work needs | admin has? |
| --- | --- |
| hero image | via `portfolio_media` — needs a "hero" flag |
| tech stack (list) | no |
| role | no |
| timeline | no |
| goals (list) | no |
| result stat tiles (label + value) | no |
| narrative (long-form body) | `description` is too short — needs a rich body |
| gallery + per-image alt | gallery yes, alt no |
| meta title / description | no |
| draft flag | `is_published` covers it |

Check `src/content.config.ts` for the authoritative shape before adding
columns — that schema is the contract.

## Rules that apply (from CLAUDE.md)

- **Honesty rule:** never publish invented details. New case studies start as
  drafts and only go live once every field is real.
- **Never show or link MedNet work** as portfolio. That was employer work; it
  is stated as experience only.
- Image SEO keywords belong on real images (`imageAlt`), never on decorative
  ones.
- Cherry Vibes keeps its Costa Rica origin story. No other public page
  mentions Costa Rica.
- Prices appear only in pricing sections — not in case-study narrative.

## Suggested sequence

1. Manny picks A or B.
2. Migration to add the missing columns (register it in
   `src/pages/api/admin/run-migration.ts`, apply via `/admin/migrate/`).
3. Extend the admin portfolio editor with the new fields, grouped to mirror
   the public page's sections so the mapping is obvious.
4. Wire `Make Portfolio` to actually create a `portfolios` row from the
   project (customer, scope, dates, documents/images already on the project),
   pre-filled and unpublished.
5. Implement publishing per the chosen direction.
6. Backfill: make one existing markdown case study round-trip through the
   admin to prove the mapping.
7. Sitemap + IndexNow: `/work/<slug>` must appear in the sitemap; run
   `node scripts/indexnow.mjs` after a real publish.
