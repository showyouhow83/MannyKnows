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
    blurb: 'Painting contractor — website plus the lead-to-job platform that runs the whole operation.',
    tags: ['Contractor', 'Website', 'Lead platform'],
    image: 'slpainting-desktop',
    // caseStudy: 'sl-painting',  // ← uncomment once src/content/portfolio/sl-painting.md is finished (draft: false)
  },
  {
    name: 'JK Daycare',
    url: 'https://jkdaycare.com',
    blurb: 'Licensed childcare — website, plus Twilio phone & text setup.',
    tags: ['Childcare', 'Website', 'Twilio'],
    // image: '/work/jkdaycare.png',
  },
  {
    name: 'eCommerce Product Importer',
    blurb: 'A pipeline that pulls product catalogs from major ecommerce sites and turns them into Shopify-ready listings — images, variants, and pricing imported automatically. Adapts to any source store.',
    tags: ['eCommerce', 'Data pipeline', 'Shopify', 'Automation'],
    // No public URL (internal automation) — add a store URL here to make the card clickable.
  },
  // TODO (Manny): one factual line + tags for each of these — the sandbox can't
  // reach them to read them, and I won't make anything up.
  {
    name: 'Cherry Vibes',
    url: 'https://cherryvibes.com',
    image: 'cherry-vibes-d',
    // blurb: '',
    // tags: [],
  },
  {
    name: 'VL Home Services',
    url: 'https://vlhomeservices.com',
    image: 'vl-d',
    // blurb: '',
    // tags: [],
  },
  {
    name: 'Springfield en Victoria',
    url: 'https://springfieldenvictoria.com',
    image: 'enVictoria-d',
    // blurb: '',
    // tags: [],
  },
];
