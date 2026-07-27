// GET /api/admin/search?q=<query>&type=all|leads|quotes|projects
// Admin-only, CONTACT-CENTRIC search.
//
// A person moves Lead -> Quote -> Project -> Portfolio. We collapse all of
// that into ONE row per contact and surface only the *furthest* stage they've
// reached (the others are superseded and clicking them is a dead end). Each
// result links to (a) the Contact hub and (b) the single live record.
//
// Raw leads that have no contact yet still show as standalone Lead rows so
// nothing gets hidden.

import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Pipeline ranking — higher = further along = the "current state".
const STAGE_RANK: Record<string, number> = { lead: 1, quote: 2, project: 3, portfolio: 4 };

export const GET: APIRoute = async ({ request, locals, url }) => {
  const env = (locals as any).runtime?.env;
  const db = env?.MK_APP_DB;
  if (!db) return json({ error: 'DB not configured' }, 503);

  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);
  if (!session.isAuthenticated) return json({ error: 'Unauthorized' }, 401);

  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return json({ results: [] });

  const type = (url.searchParams.get('type') || 'all').toLowerCase();
  const like = `%${q}%`;       // substring — matches anywhere
  const prefix = `${q}%`;      // starts-with — the strongest signal
  const wordPrefix = `% ${q}%`; // a word inside the value starts with the query

  try {
    // ── 1. Matching contacts (the hub) ──────────────────────────────────────
    // Rank by match quality, not just recency: a field that STARTS with the
    // query (rank 0) beats a word-start match (rank 1), which beats a bare
    // substring match (rank 2) — so typing "So" surfaces "Sophia" before
    // "Allison"/"Anderson". Recency only breaks ties within a rank.
    const contactsRes = await db.prepare(`
      SELECT id, first_name, last_name, email, phone, city, address, company_name
      FROM contacts
      WHERE first_name LIKE ?1
         OR last_name LIKE ?1
         OR (first_name || ' ' || COALESCE(last_name, '')) LIKE ?1
         OR email LIKE ?1
         OR phone LIKE ?1
         OR city LIKE ?1
         OR address LIKE ?1
         OR company_name LIKE ?1
      ORDER BY
        CASE
          WHEN first_name LIKE ?2 OR last_name LIKE ?2 OR company_name LIKE ?2 OR email LIKE ?2 OR phone LIKE ?2 THEN 0
          WHEN (' ' || COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(city,'')) LIKE ?3 THEN 1
          ELSE 2
        END ASC,
        updated_at DESC
      LIMIT 30
    `).bind(like, prefix, wordPrefix).all();
    const contacts = (contactsRes.results || []) as any[];

    // ── 2. Their pipeline links ──────────────────────────────────────────────
    const contactIds = contacts.map((c) => c.id);
    const linksByContact = new Map<number, { lead: number[]; quote: number[]; project: number[] }>();
    const allLeadIds = new Set<number>();
    const allQuoteIds = new Set<number>();
    const allProjectIds = new Set<number>();

    if (contactIds.length) {
      const ph = contactIds.map(() => '?').join(',');
      const linksRes = await db.prepare(
        `SELECT contact_id, link_type, link_id FROM contact_links WHERE contact_id IN (${ph})`
      ).bind(...contactIds).all();
      for (const l of (linksRes.results || []) as any[]) {
        let entry = linksByContact.get(l.contact_id);
        if (!entry) { entry = { lead: [], quote: [], project: [] }; linksByContact.set(l.contact_id, entry); }
        if (l.link_type === 'lead') { entry.lead.push(l.link_id); allLeadIds.add(l.link_id); }
        else if (l.link_type === 'quote') { entry.quote.push(l.link_id); allQuoteIds.add(l.link_id); }
        else if (l.link_type === 'project') { entry.project.push(l.link_id); allProjectIds.add(l.link_id); }
      }
    }

    // ── 3. Status/number lookups for the linked records ──────────────────────
    const leadStatus = new Map<number, any>();
    const quoteInfo = new Map<number, any>();
    const projectInfo = new Map<number, any>();
    const portfolioByProject = new Map<number, any>();

    const fetchIn = async (sql: string, ids: Set<number>) => {
      if (!ids.size) return [] as any[];
      const arr = [...ids];
      const ph = arr.map(() => '?').join(',');
      const r = await db.prepare(sql.replace('{IN}', ph)).bind(...arr).all();
      return (r.results || []) as any[];
    };

    for (const r of await fetchIn(`SELECT id, status FROM leads WHERE id IN ({IN})`, allLeadIds)) leadStatus.set(r.id, r);
    for (const r of await fetchIn(`SELECT id, quote_number, status FROM quotes WHERE id IN ({IN})`, allQuoteIds)) quoteInfo.set(r.id, r);
    for (const r of await fetchIn(`SELECT id, project_number, status FROM projects WHERE id IN ({IN})`, allProjectIds)) projectInfo.set(r.id, r);
    for (const r of await fetchIn(`SELECT id, source_project_id, is_published FROM portfolios WHERE source_project_id IN ({IN})`, allProjectIds)) {
      if (r.source_project_id != null) portfolioByProject.set(r.source_project_id, r);
    }

    // ── 4. Build one row per contact at its furthest stage ───────────────────
    const results: any[] = [];
    const pickMax = (ids: number[]) => (ids.length ? Math.max(...ids) : null);

    for (const c of contacts) {
      const links = linksByContact.get(c.id) || { lead: [], quote: [], project: [] };
      const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Unknown';
      const sub = [c.company_name, c.city, c.email].filter(Boolean).join(' · ');
      const contactUrl = `/admin/contacts?open=${c.id}`;

      // Determine the furthest stage this contact has reached.
      let stage: string | null = null;
      let recordId: number | null = null;
      let recordNumber: string | null = null;
      let status = '';
      let recordUrl = contactUrl;

      const projId = pickMax(links.project);
      const quoteId = pickMax(links.quote);
      const leadId = pickMax(links.lead);

      if (projId && portfolioByProject.has(projId)) {
        const pf = portfolioByProject.get(projId);
        stage = 'portfolio';
        recordId = pf.id;
        status = pf.is_published ? 'published' : 'draft';
        recordUrl = `/admin/portfolios?open=${pf.id}`;
      } else if (projId && projectInfo.has(projId)) {
        const p = projectInfo.get(projId);
        stage = 'project'; recordId = projId; recordNumber = p.project_number; status = p.status;
        recordUrl = `/admin/projects/?open=${projId}`;
      } else if (quoteId && quoteInfo.has(quoteId)) {
        const qd = quoteInfo.get(quoteId);
        stage = 'quote'; recordId = quoteId; recordNumber = qd.quote_number; status = qd.status;
        recordUrl = `/admin/quotes?open=${quoteId}`;
      } else if (leadId && leadStatus.has(leadId)) {
        const ld = leadStatus.get(leadId);
        stage = 'lead'; recordId = leadId; status = ld.status;
        recordUrl = `/admin/leads?open=${leadId}`;
      }

      // Honour the section filter: skip contacts whose current stage isn't the
      // requested type. 'all' keeps everything.
      if (type !== 'all') {
        const want = type.replace(/s$/, ''); // leads -> lead
        if (stage !== want) continue;
      }

      results.push({
        kind: 'contact',
        contactId: c.id,
        name,
        sub,
        contactUrl,
        stage,            // lead | quote | project | portfolio | null
        recordId,
        recordNumber,
        status,
        recordUrl,
      });
    }

    // ── 4b. Direct project / quote NUMBER match ──────────────────────────────
    // Lets the admin paste a project or quote number (e.g. "G7ZW" or the full
    // "MK-…-G7ZW") and jump straight to it — the contact search above never
    // matches these IDs. Dedupe against rows already added via their contact.
    const seenProjectIds = new Set(results.filter((r) => r.stage === 'project').map((r) => r.recordId));
    const seenQuoteIds = new Set(results.filter((r) => r.stage === 'quote').map((r) => r.recordId));

    if (type === 'all' || type === 'projects') {
      const pr = await db.prepare(`
        SELECT id, project_number, customer_name, customer_city, status
        FROM projects WHERE project_number LIKE ?1
        ORDER BY created_at DESC LIMIT 15
      `).bind(like).all();
      for (const p of (pr.results || []) as any[]) {
        if (seenProjectIds.has(p.id)) continue;
        seenProjectIds.add(p.id);
        results.push({
          kind: 'project', contactId: null,
          name: p.customer_name || p.project_number || 'Project',
          sub: [p.project_number, p.customer_city].filter(Boolean).join(' · '),
          contactUrl: null, stage: 'project', recordId: p.id,
          recordNumber: p.project_number, status: p.status,
          recordUrl: `/admin/projects/?open=${p.id}`,
        });
      }
    }

    if (type === 'all' || type === 'quotes') {
      const qr = await db.prepare(`
        SELECT id, quote_number, customer_name, city, status
        FROM quotes WHERE quote_number LIKE ?1
        ORDER BY created_at DESC LIMIT 15
      `).bind(like).all();
      for (const qq of (qr.results || []) as any[]) {
        if (seenQuoteIds.has(qq.id)) continue;
        seenQuoteIds.add(qq.id);
        results.push({
          kind: 'quote', contactId: null,
          name: qq.customer_name || qq.quote_number || 'Quote',
          sub: [qq.quote_number, qq.city].filter(Boolean).join(' · '),
          contactUrl: null, stage: 'quote', recordId: qq.id,
          recordNumber: qq.quote_number, status: qq.status,
          recordUrl: `/admin/quotes?open=${qq.id}`,
        });
      }
    }

    // ── 5. Raw leads with no contact yet (so nothing is hidden) ──────────────
    // A lead only shows here if it represents the person's CURRENT state — i.e.
    // it hasn't been promoted AND the person isn't already shown above as a
    // contact (matched by email or name). Some leads aren't back-linked to
    // their contact even after promotion, so the contact-link check alone
    // isn't enough — dedupe by email/name too.
    if (type === 'all' || type === 'leads') {
      const norm = (s: any) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const seenEmails = new Set(
        contacts.map((c) => norm(c.email)).filter(Boolean)
      );
      const seenNames = new Set(
        contacts.map((c) => norm(`${c.first_name || ''} ${c.last_name || ''}`)).filter(Boolean)
      );

      const orphanRes = await db.prepare(`
        SELECT id, customer_name, customer_email, status, city
        FROM leads
        WHERE (customer_name LIKE ?1 OR customer_email LIKE ?1 OR customer_phone LIKE ?1
               OR address LIKE ?1 OR city LIKE ?1)
          AND id NOT IN (SELECT link_id FROM contact_links WHERE link_type = 'lead')
          AND COALESCE(status, '') NOT IN ('promoted', 'converted', 'quoted')
        ORDER BY created_at DESC
        LIMIT 15
      `).bind(like).all();

      for (const r of (orphanRes.results || []) as any[]) {
        const email = norm(r.customer_email);
        const name = norm(r.customer_name);
        // Skip if this person already appears above as a contact.
        if ((email && seenEmails.has(email)) || (name && seenNames.has(name))) continue;
        results.push({
          kind: 'lead',
          contactId: null,
          name: r.customer_name || r.customer_email || 'Unknown',
          sub: [r.city, r.customer_email].filter(Boolean).join(' · '),
          contactUrl: null,
          stage: 'lead',
          recordId: r.id,
          recordNumber: null,
          status: r.status,
          recordUrl: `/admin/leads?open=${r.id}`,
        });
      }
    }

    // Sort: furthest-along first, then by name.
    results.sort((a, b) => {
      const ra = STAGE_RANK[a.stage] || 0;
      const rb = STAGE_RANK[b.stage] || 0;
      if (rb !== ra) return rb - ra;
      return String(a.name).localeCompare(String(b.name));
    });

    return json({ results: results.slice(0, 25) });
  } catch (e) {
    console.error('[admin/search] error:', e);
    return json({ error: 'Search failed' }, 500);
  }
};
