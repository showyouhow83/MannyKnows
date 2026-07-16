// Client testimonials — single source of truth.
//
// HONESTY RULE: `testimonials` (the real list) starts EMPTY. Only add quotes a
// client actually gave us, with their permission. While it's empty, the
// homepage section renders nothing. Preview the layout with demo quotes at
// /preview/testimonials (noindex).
//
// To publish a real quote: copy an entry from DEMO_TESTIMONIALS into
// `testimonials`, replace every field with the client's real words and name,
// then delete this sentence from your memory of things left to do.

export interface Testimonial {
  quote: string;      // the client's words, verbatim (trim, don't rewrite)
  name: string;       // person's name, e.g. "Maria G."
  business: string;   // business name, e.g. "JK Daycare"
  role?: string;      // optional, e.g. "Owner"
  href?: string;      // optional link to their site or the case study
}

// REAL quotes only — given to Manny in person (in Spanish) and expanded/
// translated faithfully. The Spanish originals live in the session notes;
// confirm wording with the client before/after publishing edits.
export const testimonials: Testimonial[] = [
  {
    quote:
      "Thank you, Manny, for putting SL Painting on the map. A year ago we didn't exist online at all — no website, no admin to manage our projects and clients, no AI chat to answer questions, schedule calls, or show homeowners a preview of their house in new colors. Today we're #1 for “Exterior Painting” in Springfield, MA — organically, at the top of the first page — and the photography and video gave us a real presence on social media too.",
    name: 'Owner',
    business: 'SL Painting',
    href: '/work/sl-painting',
  },
  {
    quote:
      "We don't even show up on Google yet — and we're already seeing the benefits of working with Manny. Our website looks incredible, and the AI agent is incredible too: it speaks every language, and it's connected to our admin, so we can ask it about our own projects — where each one stands, what's included, whatever we need to know.",
    name: 'Owner',
    business: 'VL Home Services',
    href: '/work/vl-home-services',
  },
  {
    quote:
      "We had always wanted a portal for our community — a place to announce our free food and clothing events, and where our young people can find resources worth sharing and help add content themselves. Manny even trained us on our new cameras, for live events and for creating content with the church's youth — young content, made for young people.",
    name: 'Springfield en Victoria',
    business: 'Church community',
    href: '/work/springfield-en-victoria',
  },
];

// DEMO quotes — shown ONLY on /preview/testimonials so Manny can see the
// format: 1-3 sentences, concrete outcome, plain speech (not marketing-ese).
export const demoTestimonials: Testimonial[] = [
  {
    quote:
      'Before the new site we were invisible — now customers tell us they found us on Google. The AI answers questions at night and we wake up to booked appointments.',
    name: 'Sample Client',
    business: 'Example Painting Co.',
    role: 'Owner',
  },
  {
    quote:
      'They rebuilt our store and cleaned up every product page. Orders are up, and the monthly report is the first one I actually read.',
    name: 'Sample Client',
    business: 'Example Boutique',
    role: 'Founder',
  },
  {
    quote:
      'One team handles our website, our ads, and the little software tools we kept wishing existed. It feels like having our own tech department.',
    name: 'Sample Client',
    business: 'Example Home Services',
    role: 'Owner',
  },
];

// Look up a published testimonial by business name (exact match). Returns
// undefined if that client hasn't given a quote yet — callers should handle it.
export function getTestimonial(business: string): Testimonial | undefined {
  return testimonials.find((t) => t.business === business || t.name === business);
}
