// Client testimonials — single source of truth.
//
// HONESTY RULE: only add quotes a client actually gave us, with their
// permission, in their words (trim, don't rewrite). If the list were ever
// emptied, the homepage section renders nothing rather than showing filler.
//
// To publish a new quote: copy an existing entry's shape and fill every field
// with the client's real words and name. (The old demo array and its
// /preview/testimonials page were deleted once real quotes existed.)

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
      'Even before launching fully on Google, working with Manny delivered immediate value. Our new website looks exceptional, and the custom AI agent is a game-changer. It handles multiple languages effortlessly and integrates directly with our backend, allowing us to instantly check project statuses, scope details, and operations on the fly.',
    name: 'Owner',
    business: 'VL Home Services',
    href: '/work/vl-home-services/',
  },
  {
    quote:
      "We had always wanted a portal for our community: a place to announce our free food and clothing events, and where our young people can find resources worth sharing and help add content themselves. Manny even trained us on our new cameras, for live events and for creating content with the church's youth: young content, made for young people.",
    name: 'Springfield en Victoria',
    business: 'Church community',
    href: '/work/springfield-en-victoria/',
  },
  {
    quote:
      "We're fascinated with our new website and admin. We can manage our children and communicate with their parents effectively, and the system is so easy to use, and fast. We've only been live a week, and we can already see our traffic growing day by day.",
    name: 'Owner',
    business: 'JK Daycare',
    href: '/work/jk-daycare/',
  },
  {
    quote:
      "Manny built us a Python scraper that took us from curating 100–300 products a week to more than 20,000 a month: cleaning and enriching each one, with pricing tables and dynamic prices. He put us at the top in Costa Rica for “lencería de mujer” and “ropa de mujer,” above stores like Llobet and Leonisa that have been in the market for years. In short, he had us competing with the big leagues.",
    name: 'Owner',
    business: 'Cherry Vibes',
    href: '/work/cherry-vibes/',
  },
  {
    quote:
      "Today we're #1 for “Exterior Painting” in Springfield, MA, organically, at the top of the first page, and the photography and video gave us a real presence on social media too.",
    name: 'Owner',
    business: 'SL Painting',
    href: '/work/sl-painting/',
  },
];


// Look up a published testimonial by business name (exact match). Returns
// undefined if that client hasn't given a quote yet — callers should handle it.
export function getTestimonial(business: string): Testimonial | undefined {
  return testimonials.find((t) => t.business === business || t.name === business);
}
