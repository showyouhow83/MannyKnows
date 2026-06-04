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

export const collections = { blog };
