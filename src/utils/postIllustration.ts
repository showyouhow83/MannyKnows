import type { CollectionEntry } from 'astro:content';

export type IllKind = 'website' | 'seo' | 'agent' | 'audit' | 'automation' | 'store' | 'ads' | 'multimedia';

// Pick a brand illustration for a blog post from its tags + title, so posts
// without a hero image still get an on-brand visual instead of a blank box.
// Ordered by intent (most specific first) so posts get varied, fitting art
// rather than everything collapsing onto "seo".
export function getPostIllustration(post: CollectionEntry<'blog'>): IllKind {
  const hay = `${post.data.tags.join(' ')} ${post.data.title}`.toLowerCase();
  if (/ai agent|chatbot|missed call|receptionist|booking agent|answers customers|24\/7/.test(hay)) return 'agent';
  if (/lead gen|get leads|more leads|without paying|angi|thumbtack|advertis|\bads?\b|marketing|campaign/.test(hay)) return 'ads';
  if (/store|shopify|ecommerce|e-commerce|online shop|checkout/.test(hay)) return 'store';
  if (/automat|integrat|workflow|zapier|make\.com/.test(hay)) return 'automation';
  if (/web design|website|redesign|conversion|page speed|slow site/.test(hay)) return 'website';
  if (/\bseo\b|map pack|google business|\bgbp\b|ranking|reviews?|local search|get found/.test(hay)) return 'seo';
  return 'website';
}
