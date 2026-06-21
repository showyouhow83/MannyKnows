import type { CollectionEntry } from 'astro:content';
import generatedThumbnails from '../data/generated-thumbnails.json';

// First Markdown image in a body: ![alt](url "optional title")
const FIRST_MD_IMAGE = /!\[[^\]]*\]\(\s*([^)\s]+)/;
const generated = new Set(generatedThumbnails as string[]);

/**
 * Resolve the best illustration for a blog post, in order of preference:
 *   1) an explicit frontmatter `image`
 *   2) the first image embedded in the article body
 *   3) an AI-generated thumbnail at /blog/<slug>.png (see scripts/generate-blog-thumbnails.mjs)
 *
 * Returns undefined when none exist, so callers can render a gradient fallback.
 */
export function getPostImage(post: CollectionEntry<'blog'>): string | undefined {
  if (post.data.image) return post.data.image;

  const body = (post as unknown as { body?: string }).body ?? '';
  const match = body.match(FIRST_MD_IMAGE);
  if (match?.[1]) return match[1];

  if (generated.has(post.id)) return `/blog/${post.id}.png`;
  return undefined;
}
