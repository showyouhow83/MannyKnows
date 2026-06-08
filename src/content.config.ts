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

export const collections = { blog, products };
