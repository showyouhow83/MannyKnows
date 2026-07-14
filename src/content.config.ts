import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts live as Markdown in src/content/blog/*.md
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Manny'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Optional 16:9 banner image, e.g. "/blog/my-post.jpg" (file lives in public/blog/).
    // When omitted, cards fall back to a colored gradient placeholder.
    image: z.string().optional(),
  }),
});

// Products = the apps & services we offer. Markdown in src/content/products/*.md
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),         // short hook shown on cards
    description: z.string(),     // 1–2 sentence summary for listing + detail intro
    type: z.enum(['App', 'Service', 'Platform']).default('Service'),
    // Optional 16:9 banner image, e.g. "/products/foo.jpg" (file lives in public/products/).
    // When omitted, cards fall back to a type-colored gradient placeholder.
    image: z.string().optional(),
    services: z.array(z.string()).default([]),  // what's included / key capabilities
    liveUrl: z.string().optional(),             // live site or demo link
    flagship: z.boolean().default(false),       // shown via the custom showcase on the homepage
    order: z.number().default(99),              // ascending sort order
    draft: z.boolean().default(false),
  }),
});

// Portfolio = case studies for client & capability projects. Markdown in
// src/content/portfolio/*.md — the frontmatter drives the structured "at a
// glance" panel (tech stack, role, timeline, results) and the Markdown body is
// the narrative (Challenge → Approach → Outcome).
//
// Honesty rule (same as selectedWork.ts): only publish what's true. Keep a case
// study `draft: true` until every field is real — draft entries never build a
// page. Duplicate an existing file to start a new one.
const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(),
    client: z.string().optional(),          // client/business name if different from title
    tagline: z.string(),                    // one-line hook shown under the title
    summary: z.string(),                    // 1–2 sentence intro + listing/SEO description
    industry: z.string().optional(),        // e.g. "Painting contractor"
    // "At a glance" panel:
    role: z.string().optional(),            // what MannyKnows did, e.g. "Design, build & deploy"
    timeline: z.string().optional(),        // e.g. "3 weeks"
    year: z.number().optional(),
    services: z.array(z.string()).default([]),   // what was delivered (Website, Lead platform…)
    techStack: z.array(z.string()).default([]),  // tools used (Astro, Cloudflare, Twilio…)
    goals: z.array(z.string()).default([]),      // what the client set out to achieve
    // Outcome metrics — each renders as a stat tile. Keep them true & specific.
    results: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    liveUrl: z.string().optional(),         // live site / demo
    // Hero + gallery images. Use a `public/works/<base>-<width>.<ext>` responsive
    // base name (like selectedWork) OR a literal path/URL (contains "/" or ".").
    heroImage: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    featured: z.boolean().default(false),   // pin to the top of the index
    order: z.number().default(99),          // ascending sort within (featured, order)
    draft: z.boolean().default(false),
    // demo: the page builds (for preview by direct URL, noindex + sample banner)
    // but is EXCLUDED from the /work index. For showing Manny the expected
    // shape before real client details exist. Flip off once content is real.
    demo: z.boolean().default(false),
  }),
});

export const collections = { blog, products, portfolio };
