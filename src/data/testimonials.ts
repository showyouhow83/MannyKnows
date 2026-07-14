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

// REAL quotes only. Empty until Manny collects them — section stays hidden.
export const testimonials: Testimonial[] = [];

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
