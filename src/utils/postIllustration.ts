import type { CollectionEntry } from 'astro:content';

export type IllKind = 'website' | 'seo' | 'agent' | 'audit' | 'automation' | 'store' | 'ads' | 'multimedia';

// Pick a brand illustration for a blog post from its tags + title, so posts
// without a hero image still get an on-brand visual instead of a blank box.
export function getPostIllustration(post: CollectionEntry<'blog'>): IllKind {
  const hay = `${post.data.tags.join(' ')} ${post.data.title}`.toLowerCase();
  if (/\bseo\b|search|google business|\bgbp\b|ranking|get found|found on/.test(hay)) return 'seo';
  if (/store|shopify|ecommerce|e-commerce|online shop|checkout/.test(hay)) return 'store';
  if (/automat|integrat|workflow|zapier|make\.com/.test(hay)) return 'automation';
  if (/\bai\b|agent|chatbot|assistant|booking|answers/.test(hay)) return 'agent';
  if (/\bads?\b|advertis|marketing|social|campaign|lead/.test(hay)) return 'ads';
  return 'website';
}
