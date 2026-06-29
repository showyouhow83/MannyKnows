// Selected Work — real client sites Manny has built. Portfolio proof for the
// homepage "Selected Work" section (src/components/sections/SelectedWork.astro).
//
// Honesty rule: only describe what's true. `blurb` and `tags` are optional —
// a card renders fine with just name + URL. Drop a screenshot into
// public/work/<slug>.png and set `image` to show a real thumbnail.
export interface WorkItem {
  name: string;
  url?: string;       // live site — omit for internal/automation projects (card won't link out)
  blurb?: string;     // one factual line: industry + what was built
  tags?: string[];    // short chips (industry / what was built)
  image?: string;     // optional screenshot, e.g. "/work/slpainting.png"
}

export const selectedWork: WorkItem[] = [
  {
    name: 'SL Painting',
    url: 'https://slpainting.co',
    blurb: 'Painting contractor — website plus the lead-to-job platform that runs the whole operation.',
    tags: ['Contractor', 'Website', 'Lead platform'],
    // image: '/work/slpainting.png',
  },
  {
    name: 'JK Daycare',
    url: 'https://jkdaycare.com',
    blurb: 'Licensed childcare — website, plus Twilio phone & text setup.',
    tags: ['Childcare', 'Website', 'Twilio'],
    // image: '/work/jkdaycare.png',
  },
  {
    name: 'Shein → Shopify Importer',
    blurb: 'Data-scraping pipeline that pulls Shein product catalogs and transforms them into Shopify-ready listings — images, variants, and pricing imported automatically.',
    tags: ['eCommerce', 'Data scraping', 'Shopify', 'Automation'],
    // No public URL (internal automation) — add a store URL here to make the card clickable.
  },
  // TODO (Manny): one factual line + tags for each of these — the sandbox can't
  // reach them to read them, and I won't make anything up.
  {
    name: 'Cherry Vibes',
    url: 'https://cherryvibes.com',
    // blurb: '',
    // tags: [],
  },
  {
    name: 'VL Home Services',
    url: 'https://vlhomeservices.com',
    // blurb: '',
    // tags: [],
  },
  {
    name: 'Springfield en Victoria',
    url: 'https://springfieldenvictoria.com',
    // blurb: '',
    // tags: [],
  },
];
