// Pure HTML analyzer behind /api/analyze-site — no network, no bindings, so it
// can be unit-tested with fixture HTML in plain node. The route does the
// fetching; this file does the judging.
//
// Every check maps to something MannyKnows actually sells (the "ideal site
// profile"): found on Google, fast on a phone, answering 24/7, bookable, and
// multilingual. Findings are heuristics from one page of HTML — the UI labels
// them as a first pass, with Manny's human review as the real offer.

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  fix?: { text: string; href: string };
}

export interface Pillar {
  id: string;
  name: string;
  score: number; // 0-100
  checks: Check[];
}

export interface Analysis {
  overall: number;
  grade: string;
  pillars: Pillar[];
  hasAgent: boolean;
}

const strip = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
}

// Chat/agent detection. A vendor allowlist alone is wrong: it misses every
// custom-built agent, including the ones we build — slpainting.co's "Matti"
// (class="matti-chat", aria-label="Chat with Matti") scored a false negative
// on exactly that. Four independent signals now, structural first, and the
// analyzer reports WHICH one fired so a finding can always be defended.
const AGENT_VENDORS: Array<[RegExp, string]> = [
  [/intercom/i, 'Intercom'],
  [/crisp\.chat/i, 'Crisp'],
  [/drift\.com|driftt\.com/i, 'Drift'],
  [/tawk\.to/i, 'Tawk.to'],
  [/tidio/i, 'Tidio'],
  [/chatbase/i, 'Chatbase'],
  [/livechat(inc)?\.com/i, 'LiveChat'],
  [/hs-script|hubspot[^"']*conversations/i, 'HubSpot'],
  [/botpress/i, 'Botpress'],
  [/voiceflow/i, 'Voiceflow'],
  [/zendesk[^"']*(?:widget|chat)|zopim/i, 'Zendesk'],
  [/(?:facebook|fb)[^"']*customerchat/i, 'Messenger'],
  [/smartsupp|olark|freshchat|gorgias|manychat|podium|birdeye|salesiq/i, 'a hosted chat service'],
];

// Markup whose class/id/aria-label names a chat or assistant element.
const AGENT_ATTR =
  /(?:id|class|aria-label|title|data-[\w-]+)\s*=\s*["'][^"']*(?:chat(?!eau)|chatbot|assistant|asistente|messenger|ai-?agent|live-?agent)[^"']*["']/i;
// A script or stylesheet whose filename ships a chat widget.
const AGENT_SRC = /(?:src|href)\s*=\s*["'][^"']*(?:chat|chatbot|assistant|messenger)[^"']*\.(?:js|mjs|css)/i;
// A visible invitation to chat. Deliberately narrow — phrased as an offer to
// the reader, so ordinary prose ("we chat with customers daily") can't trip it.
const AGENT_TEXT =
  /\b(?:chat (?:with (?:us|our|me)\b|now\b)|live chat|ask (?:our|the) (?:ai|assistant|bot)|start a chat|talk to (?:our )?(?:ai|assistant))/i;

// `weak` = the only evidence is page copy, which can't prove a live agent
// (a "chat with us" line may just be marketing). Structural evidence passes
// outright; weak evidence warns instead, so the scan never overclaims in
// either direction.
function detectAgent(html: string, text: string): { found: boolean; how: string; weak: boolean } {
  for (const [re, label] of AGENT_VENDORS) {
    if (re.test(html)) return { found: true, how: label, weak: false };
  }
  if (AGENT_ATTR.test(html)) return { found: true, how: 'a chat widget built into the page', weak: false };
  if (AGENT_SRC.test(html)) return { found: true, how: 'a chat script the page loads', weak: false };
  // Text signal reads the stripped copy, never script/style bodies.
  if (AGENT_TEXT.test(text)) return { found: true, how: 'an invitation to chat in the page copy', weak: true };
  return { found: false, how: '', weak: false };
}

const BOOKING_SIGNS = /calendly|acuity|squareup\.com\/appointments|booksy|setmore|appointlet|schedulicity|book(ing)?-?(now|online)|appointment/i;

export function analyzeHtml(html: string, opts: { llmsTxt?: boolean; truncated?: boolean } = {}): Analysis {
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const clean = strip(html);
  const kb = Math.round(html.length / 1024);

  const title = (head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() ?? '';
  const metaTags = head.match(/<meta[^>]*>/gi) || [];
  const findMeta = (nameVal: string) => {
    for (const t of metaTags) {
      const n = (attr(t, 'name') || attr(t, 'property') || '').toLowerCase();
      if (n === nameVal) return attr(t, 'content') ?? '';
    }
    return null;
  };
  const desc = findMeta('description');
  const viewport = findMeta('viewport');
  const robotsMeta = (findMeta('robots') || '').toLowerCase();
  const ogTitle = findMeta('og:title');
  const canonical = /<link[^>]+rel\s*=\s*["']?canonical/i.test(head);

  const h1s = html.match(/<h1[\s>]/gi)?.length ?? 0;
  const jsonLdBlocks = html.match(/<script[^>]+application\/ld\+json[\s\S]*?<\/script>/gi) || [];
  const jsonLdAll = jsonLdBlocks.join(' ');
  const hasLocalSchema = /LocalBusiness|ProfessionalService|Restaurant|Store|MedicalBusiness|HomeAndConstructionBusiness/i.test(jsonLdAll);
  const hasFaqSchema = /FAQPage/i.test(jsonLdAll);

  const headScripts = (head.match(/<script[^>]*src=[^>]*>/gi) || []).filter((s) => !/defer|async|type\s*=\s*["']?module/i.test(s));
  const imgs = html.match(/<img[^>]*>/gi) || [];
  const imgsNoAlt = imgs.filter((t) => {
    const a = attr(t, 'alt');
    return a === null;
  }).length;
  const imgsNoLazy = imgs.filter((t) => !/loading\s*=\s*["']?lazy/i.test(t) && !/fetchpriority\s*=\s*["']?high/i.test(t)).length;

  const langAttr = (html.match(/<html[^>]*\slang\s*=\s*["']?([a-zA-Z-]+)/i) || [])[1] ?? '';
  const hreflang = /hreflang\s*=/i.test(head);
  const spanishHint = /espa[nñ]ol|\/es\/|lang\s*=\s*["']?es/i.test(html);

  const hasTel = /href\s*=\s*["']tel:/i.test(html);
  const hasForm = /<form[\s>]/i.test(html);
  const hasBooking = BOOKING_SIGNS.test(html);
  const hasContactPath = /href\s*=\s*["'][^"']*contact/i.test(html) || /href\s*=\s*["']mailto:/i.test(html);
  const agent = detectAgent(html, clean);
  const hasAgent = agent.found;

  const PLANS = '/plans/';
  const GET_FOUND = '/plans/get-found/';
  const GET_BOOKED = '/plans/get-booked/';

  const c = (id: string, label: string, status: CheckStatus, detail: string, fix?: Check['fix']): Check =>
    ({ id, label, status, detail, ...(status === 'pass' ? {} : { fix }) });

  // ── Found ──────────────────────────────────────────────────────────────
  const found: Check[] = [
    c('title', 'Page title', !title ? 'fail' : title.length > 65 || title.length < 10 ? 'warn' : 'pass',
      !title ? 'No <title> — Google has nothing to show for you.'
        : title.length > 65 ? `Title is ${title.length} characters; Google cuts it off around 60.`
        : title.length < 10 ? 'Title is too short to say what you do or where.'
        : 'Title present and a sensible length.',
      { text: 'Technical SEO is built into every Smart Website plan.', href: GET_FOUND }),
    c('description', 'Meta description', desc === null ? 'fail' : (desc.length < 50 || desc.length > 165) ? 'warn' : 'pass',
      desc === null ? "No meta description — Google writes its own, and it won't sell you."
        : desc.length < 50 ? 'Description is thin; this is your free ad in the results.'
        : desc.length > 165 ? `Description is ${desc.length} characters; it gets truncated.`
        : 'Description present and a sensible length.',
      { text: 'We write and tune these on every page, every month.', href: GET_FOUND }),
    c('h1', 'Main heading (H1)', h1s === 1 ? 'pass' : h1s === 0 ? 'fail' : 'warn',
      h1s === 1 ? 'Exactly one H1 — what Google expects.'
        : h1s === 0 ? 'No H1 heading — the page never says plainly what it is.'
        : `${h1s} H1 headings compete with each other.`,
      { text: 'Page structure is part of the technical SEO in every plan.', href: GET_FOUND }),
    c('schema', 'Structured data (how AI reads you)', jsonLdBlocks.length === 0 ? 'fail' : hasLocalSchema ? 'pass' : 'warn',
      jsonLdBlocks.length === 0 ? 'No structured data — Google and AI assistants are guessing who you are.'
        : hasLocalSchema ? 'Local-business structured data found — Google and AI assistants can read you.'
        : 'Some structured data, but nothing marking you as a local business.',
      { text: 'Every site we build ships with local-business schema AI can quote.', href: GET_FOUND }),
    c('noindex', 'Visible to Google', robotsMeta.includes('noindex') ? 'fail' : 'pass',
      robotsMeta.includes('noindex') ? 'This page tells Google NOT to index it. Customers cannot find it.' : 'Not blocking Google.',
      { text: 'This is a five-minute fix with big consequences — ask us.', href: '/contact/' }),
    c('og', 'Social/share preview', ogTitle ? 'pass' : 'warn',
      ogTitle ? 'Open Graph tags found — links to you look right when shared.' : 'No Open Graph tags — shared links show up bare.',
      { text: 'Share previews come standard on our builds.', href: GET_FOUND }),
    c('canonical', 'Canonical URL', canonical ? 'pass' : 'warn',
      canonical ? 'Canonical tag present.' : 'No canonical tag — duplicate URLs can split your ranking.',
      { text: 'Part of the technical SEO baseline.', href: GET_FOUND }),
  ];

  // ── Fast ───────────────────────────────────────────────────────────────
  const fast: Check[] = [
    c('weight', 'Page weight', kb <= 150 ? 'pass' : kb <= 400 ? 'warn' : 'fail',
      `Homepage HTML is ${opts.truncated ? 'over ' : ''}${kb} KB${kb > 400 ? ' — heavy pages lose phone visitors before they load.' : kb > 150 ? ' — on the heavy side for mobile.' : ' — lean.'}`,
      { text: 'Our builds target 90+ Lighthouse speed scores.', href: PLANS }),
    c('blocking', 'Render-blocking scripts', headScripts.length === 0 ? 'pass' : headScripts.length <= 2 ? 'warn' : 'fail',
      headScripts.length === 0 ? 'No blocking scripts in the head.'
        : `${headScripts.length} script${headScripts.length > 1 ? 's' : ''} block the page from painting until they load.`,
      { text: 'Speed engineering is the first thing we fix on rebuilds.', href: PLANS }),
    c('viewport', 'Mobile-ready viewport', viewport ? 'pass' : 'fail',
      viewport ? 'Mobile viewport is set.' : 'No viewport meta — the site renders as a shrunken desktop page on phones.',
      { text: 'Every plan is mobile-first; most of your visitors are.', href: PLANS }),
    c('lazy', 'Image loading', imgs.length === 0 ? 'pass' : imgsNoLazy / imgs.length <= 0.4 ? 'pass' : imgsNoLazy / imgs.length <= 0.8 ? 'warn' : 'fail',
      imgs.length === 0 ? 'No images to defer.' : `${imgsNoLazy} of ${imgs.length} images load eagerly — below-the-fold images should lazy-load.`,
      { text: 'Image pipelines (AVIF/WebP, lazy loading) are standard on our builds.', href: PLANS }),
  ];

  // ── Answers (AI-readiness) ─────────────────────────────────────────────
  const answers: Check[] = [
    c('agent', 'Something answers your visitors', hasAgent ? (agent.weak ? 'warn' : 'pass') : 'fail',
      hasAgent
        ? (agent.weak
            ? `Found ${agent.how}, but nothing we can confirm is a live agent — worth checking that it answers after hours, not just during business hours.`
            : `Detected ${agent.how} — visitors can get answers without waiting for a callback.`)
        : "We couldn't find anything answering questions on this page. After hours, customers leave and call the next result. (Scanners only see the homepage's code — if you have an agent we missed, the free human review will catch it.)",
      { text: 'Remi answers and books 24/7 — built into every Smart Website plan.', href: GET_BOOKED }),
    c('faq', 'FAQ content AI can quote', hasFaqSchema ? 'pass' : 'warn',
      hasFaqSchema ? 'FAQ structured data found — AI assistants can quote your answers.'
        : 'No FAQ schema — when customers ask ChatGPT or Google AI, competitors with answers get cited.',
      { text: 'We ship FAQ schema on every money page.', href: GET_FOUND }),
    c('llms', 'AI crawler guidance (llms.txt)', opts.llmsTxt ? 'pass' : 'warn',
      opts.llmsTxt ? 'llms.txt found — you are telling AI crawlers what matters.'
        : 'No llms.txt — a new, easy win for showing up in AI answers.',
      { text: 'AI-answer readiness is part of our SEO work.', href: GET_FOUND }),
  ];

  // ── Books (conversion) ─────────────────────────────────────────────────
  const books: Check[] = [
    c('tel', 'Tap-to-call', hasTel ? 'pass' : 'fail',
      hasTel ? 'Phone number is tappable.' : 'No tap-to-call link — on a phone, calling you should be one touch.',
      { text: 'Conversion basics are step one of any rebuild.', href: GET_BOOKED }),
    c('capture', 'A way to capture the lead', hasForm || hasBooking ? 'pass' : 'fail',
      hasForm || hasBooking ? (hasBooking ? 'Booking flow detected.' : 'Contact form present.')
        : 'No form and no booking link — interested visitors have no next step.',
      { text: 'Remi captures and books the lead even after hours.', href: GET_BOOKED }),
    c('contact', 'Easy contact path', hasContactPath ? 'pass' : 'warn',
      hasContactPath ? 'Contact page or email link found.' : 'No obvious contact page or email link.',
      { text: 'We make the next step impossible to miss.', href: PLANS }),
  ];

  // ── Everyone (multilingual + basics) ───────────────────────────────────
  const everyone: Check[] = [
    c('lang', 'Language declared', langAttr ? 'pass' : 'warn',
      langAttr ? `Page declares its language (${langAttr}).` : 'No lang attribute — screen readers and search engines have to guess.',
      { text: 'Accessibility basics are baked into our builds.', href: PLANS }),
    c('spanish', 'Reaches Spanish speakers', hreflang || spanishHint ? 'pass' : 'warn',
      hreflang || spanishHint ? 'Multilingual signals found.'
        : 'English-only. In Western Mass, that can mean missing half your market.',
      { text: 'English and Spanish come standard on everything we build.', href: PLANS }),
    c('alt', 'Image descriptions (alt text)', imgs.length === 0 ? 'pass' : imgsNoAlt === 0 ? 'pass' : imgsNoAlt / imgs.length <= 0.3 ? 'warn' : 'fail',
      imgs.length === 0 ? 'No images to describe.' : imgsNoAlt === 0 ? 'All images have alt text.'
        : `${imgsNoAlt} of ${imgs.length} images have no alt text — invisible to screen readers and image search.`,
      { text: 'Accessibility is a ranking factor; we treat it as a feature.', href: PLANS }),
  ];

  const score = (checks: Check[]) => {
    const v = checks.reduce((a, ch) => a + (ch.status === 'pass' ? 1 : ch.status === 'warn' ? 0.5 : 0), 0);
    return Math.round((v / checks.length) * 100);
  };

  const pillars: Pillar[] = [
    { id: 'found', name: 'Found on Google', score: score(found), checks: found },
    { id: 'fast', name: 'Fast on a phone', score: score(fast), checks: fast },
    { id: 'answers', name: 'Answers 24/7', score: score(answers), checks: answers },
    { id: 'books', name: 'Turns visits into calls', score: score(books), checks: books },
    { id: 'everyone', name: 'Works for everyone', score: score(everyone), checks: everyone },
  ];

  // Weighted overall — being findable and answering are the money-makers.
  const weights: Record<string, number> = { found: 0.3, fast: 0.2, answers: 0.2, books: 0.2, everyone: 0.1 };
  const overall = Math.round(pillars.reduce((a, p) => a + p.score * weights[p.id], 0));
  const grade =
    overall >= 90 ? 'Strong — the gaps left are polish'
    : overall >= 70 ? 'Solid, but leaving customers on the table'
    : overall >= 50 ? 'Leaking customers'
    : 'Working against you';

  return { overall, grade, pillars, hasAgent };
}
