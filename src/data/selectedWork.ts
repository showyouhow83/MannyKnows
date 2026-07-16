// Selected Work — real client sites Manny has built. Portfolio proof for the
// homepage "Selected Work" section (src/components/sections/SelectedWork.astro).
//
// Honesty rule: only describe what's true. `blurb` and `tags` are optional —
// a card renders fine with just name + URL. Drop a high-res screenshot into
// src/assets/works/<file> and set `image` to that filename — SelectedWork.astro
// runs it through astro:assets <Picture>, which emits responsive AVIF/WebP.
export interface WorkItem {
  name: string;
  url?: string;       // live site — omit for internal/automation projects (card won't link out)
  blurb?: string;     // one factual line: industry + what was built
  tags?: string[];    // short chips (industry / what was built)
  image?: string;     // screenshot base name — responsive AVIF/WebP variants live at
                      // public/works/<base>-<width>.<ext> (run scripts/optimize-work-images.mjs
                      // after dropping a high-res source into src/assets/works). e.g. "slpainting-desktop"
  caseStudy?: string; // slug of a published case study in src/content/portfolio/*.md
                      // (the filename without .md). When set, the card links to
                      // /work/<slug> instead of the live site. Only set it once
                      // that case study is finished and `draft: false`.
}

export const selectedWork: WorkItem[] = [
  {
    name: 'SL Painting',
    url: 'https://slpainting.co',
    blurb: 'Painting contractor — from invisible on Google to ranking for “exterior painting” across Western Mass: website, admin CRM, a 24/7 AI agent, and AI Painter Lab.',
    tags: ['Website AI', 'AI Sales & Booking Agent', 'Local SEO'],
    image: 'slpainting-desktop',
    caseStudy: 'sl-painting',
  },
  {
    name: 'JK Daycare',
    url: 'https://jkdaycare.com',
    blurb: "Licensed childcare — a website with an AI agent for parents' questions, plus a Twilio IVR that answers and routes every call. Built in two weeks.",
    tags: ['Website AI', 'AI Sales & Booking Agent', 'Twilio IVR'],
    caseStudy: 'jk-daycare',
    image: 'jkdaycare-desktop',
  },
  {
    name: 'eCommerce Product Importer',
    blurb: 'A pipeline that pulls product catalogs from major eCommerce sites and turns them into Shopify-ready listings — images, variants, and pricing imported automatically. Adapts to any source store.',
    tags: ['Automation', 'Custom Software', 'Online Store (AI)'],
    // No public URL (internal automation) — add a store URL here to make the card clickable.
  },
  {
    name: 'Cherry Vibes',
    url: 'https://cherryvibes.com',
    blurb: 'An online store obsessed with all things cherry — migrated from Costa Rica to the U.S. market on a custom Shopify Hydrogen storefront.',
    tags: ['Online Store (AI)', 'Shopify Hydrogen', 'Migration'],
    image: 'cherry-vibes-d',
    caseStudy: 'cherry-vibes',
  },
  {
    name: 'VL Home Services',
    url: 'https://vlhomeservices.com',
    blurb: 'Home improvement company — a complete digital operation: website, admin dashboard, AI agent, and local SEO.',
    tags: ['Website AI', 'AI Sales & Booking Agent', 'Local SEO'],
    image: 'vl-d',
    caseStudy: 'vl-home-services',
  },
  {
    name: 'Springfield en Victoria',
    url: 'https://springfieldenvictoria.com',
    blurb: "A church community's online home — programs, sermons, podcasts & live streaming, with AI translation into several languages.",
    tags: ['Website AI', 'Multimedia', 'AI Translations'],
    image: 'enVictoria-d',
    caseStudy: 'springfield-en-victoria',
  },
];
