// Customer-facing paint color submissions for a project.
//
// GET  /api/portal/colors?token=<client_token>           → saved colors
// POST /api/portal/colors   { token, colors: [...] }      → upsert colors
//
// Auth is the project's client_token (same model as the client portal page).
// No admin session required — the token IS the capability. Crew may also read
// via X-Crew-Token (the crew page shows the colors the customer picked).

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { emailHeader, emailFooter, emailButton } from '../../../lib/quote-emails';
import { parseScopes } from '../../../lib/quoteTemplateConstants';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const VALID_FINISHES = ['', 'Flat', 'Matte', 'Eggshell', 'Satin', 'Semi-gloss', 'Gloss'];
const VALID_PRODUCTS = ['', 'paint', 'stain'];

async function resolveProject(db: any, token: string, allowCrew = false) {
  if (!token) return null;
  const row = await db.prepare(
    'SELECT id, client_token, crew_token FROM projects WHERE client_token = ? OR crew_token = ?'
  ).bind(token, token).first() as { id: number; client_token: string | null; crew_token: string | null } | null;
  if (!row) return null;
  if (row.client_token === token) return row.id;
  if (allowCrew && row.crew_token === token) return row.id;
  return null;
}

// colors_locked may not exist on older DBs — read it defensively.
async function isLocked(db: any, projectId: number): Promise<boolean> {
  try {
    const r = await db.prepare('SELECT colors_locked FROM projects WHERE id = ?').bind(projectId).first() as any;
    return !!(r && r.colors_locked);
  } catch { return false; }
}

export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);

    const token = (url.searchParams.get('token') || request.headers.get('X-Client-Token') || request.headers.get('X-Crew-Token') || '').trim();
    const projectId = await resolveProject(db, token, true);
    if (!projectId) return json({ error: 'Not found' }, 404);

    let colors: any[] = [];
    try {
      const res = await db.prepare(
        'SELECT item_id, label, product_type, color_value, color_hex, finish, note, image_url, updated_at FROM project_colors WHERE project_id = ? ORDER BY created_at ASC'
      ).bind(projectId).all();
      colors = res.results || [];
    } catch (e) {
      console.error('[portal/colors GET] table missing?', e);
    }
    const locked = await isLocked(db, projectId);
    return json({ success: true, colors, locked });
  } catch (e) {
    console.error('[portal/colors GET] error:', e);
    return json({ error: 'Failed to load colors' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ error: 'DB not configured' }, 503);

    const body = await request.json() as { token?: string; colors?: any[]; finalize?: boolean };
    const token = (body.token || request.headers.get('X-Client-Token') || '').trim();
    // Color submission is a customer action — require the client_token (not crew).
    const projectId = await resolveProject(db, token, false);
    if (!projectId) return json({ error: 'Not authorized' }, 403);

    // Once finalized, colors are locked into the contract. The customer can't
    // change them — only an admin scope update reopens them.
    if (await isLocked(db, projectId)) {
      return json({ error: 'Your colors are finalized and locked. Contact us if you need a change.', locked: true }, 409);
    }

    const finalize = body.finalize === true;
    const colors = Array.isArray(body.colors) ? body.colors : [];
    if (!colors.length) return json({ error: 'No colors to save' }, 400);

    const stmts: any[] = [];
    for (const c of colors) {
      const itemId = String(c.item_id || '').trim();
      if (!itemId) continue;
      const label = (c.label != null ? String(c.label) : '').slice(0, 300);
      let product = String(c.product_type || '').toLowerCase().trim();
      if (!VALID_PRODUCTS.includes(product)) product = '';
      const colorValue = (c.color_value != null ? String(c.color_value) : '').slice(0, 300);
      const colorHex = /^#[0-9a-fA-F]{3,8}$/.test(String(c.color_hex || '').trim()) ? String(c.color_hex).trim() : null;
      let finish = String(c.finish || '').trim();
      if (!VALID_FINISHES.includes(finish)) finish = '';
      const note = (c.note != null ? String(c.note) : '').slice(0, 500);
      const imageUrl = (c.image_url != null && String(c.image_url).startsWith('http')) ? String(c.image_url).slice(0, 500) : null;

      stmts.push(db.prepare(`
        INSERT INTO project_colors (project_id, item_id, label, product_type, color_value, color_hex, finish, note, image_url, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (project_id, item_id) DO UPDATE SET
          label = excluded.label,
          product_type = excluded.product_type,
          color_value = excluded.color_value,
          color_hex = excluded.color_hex,
          finish = excluded.finish,
          note = excluded.note,
          image_url = COALESCE(excluded.image_url, project_colors.image_url),
          updated_at = CURRENT_TIMESTAMP
      `).bind(projectId, itemId, label, product || null, colorValue || null, colorHex, finish || null, note || null, imageUrl));
    }
    if (!stmts.length) return json({ error: 'No valid color rows' }, 400);
    await db.batch(stmts);

    let contractToken: string | null = null;

    // Finalize → lock colors and permanently write them into the contract scopes.
    if (finalize) {
      try {
        await db.prepare('UPDATE projects SET colors_locked = 1 WHERE id = ?').bind(projectId).run();
      } catch (e) {
        console.error('[portal/colors] lock failed:', e);
      }

      try {
        const contract = await db.prepare(
          "SELECT id, scopes, contract_token FROM project_contracts WHERE project_id = ? AND status != 'void' LIMIT 1"
        ).bind(projectId).first() as any;

        if (contract?.scopes) {
          const scopes = parseScopes(contract.scopes);
          const colorMap: Record<string, string> = {};
          for (const c of colors) {
            const id = String(c.item_id || '').trim();
            if (!id) continue;
            const parts = [c.product_type, c.color_value, c.finish].filter(Boolean).join(' · ');
            if (parts) colorMap[id] = parts;
          }
          let changed = false;
          for (const scope of scopes) {
            for (const section of scope.sections || []) {
              for (const item of section.items || []) {
                if (item.id && colorMap[item.id]) {
                  (item as any).value = colorMap[item.id];
                  changed = true;
                }
              }
            }
          }
          if (changed) {
            await db.prepare('UPDATE project_contracts SET scopes = ? WHERE id = ?')
              .bind(JSON.stringify(scopes), contract.id).run();
          }
        }

        if (contract?.contract_token) contractToken = contract.contract_token;
      } catch (e) {
        console.error('[portal/colors] contract write-back failed:', e);
      }
    }

    // Notify the customer (confirmation) + admin. Best-effort — never blocks
    // the save. The contract PDF/preview reflects the colors live.
    try {
      const proj = await db.prepare(
        'SELECT project_number, customer_name, customer_email, client_token FROM projects WHERE id = ?'
      ).bind(projectId).first() as any;
      const apiKey = env?.RESEND_API_KEY;
      if (proj && apiKey) {
        const resend = new Resend(apiKey);
        const origin = new URL(request.url).origin;
        const link = `${origin}/project/${encodeURIComponent(proj.client_token)}`;
        const rowsHtml = colors
          .filter((c: any) => (c.color_value && String(c.color_value).trim()) || (c.finish && String(c.finish).trim()))
          .map((c: any) => `<tr>
            <td style="padding:6px 0;border-bottom:1px solid #eef2f7;font-size:13px;color:#475569;">${escapeHtml(c.label || 'Color')}</td>
            <td style="padding:6px 0;border-bottom:1px solid #eef2f7;font-size:13px;color:#1e293b;font-weight:600;">${escapeHtml([c.product_type, c.color_value, c.finish].filter(Boolean).join(' · ') || '—')}</td>
          </tr>`).join('');
        const tableHtml = `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${rowsHtml}</table>`;

        if (proj.customer_email) {
          const firstName = (proj.customer_name || '').split(' ')[0] || 'there';
          const contractLink = contractToken
            ? `${origin}/project/contract/${encodeURIComponent(contractToken)}`
            : null;
          const emailBodyHtml = finalize
            ? `<h1 style="font-size:22px;color:#1e293b;margin:0 0 12px;">Your colors are set, ${escapeHtml(firstName)}!</h1>
               <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 8px;">Your selections for <strong>${escapeHtml(proj.project_number)}</strong> are now permanently part of your contract. Your original signature covers this update — no re-signing needed.</p>
               ${tableHtml}
               <p style="font-size:14px;color:#475569;">Need a change? Contact us and we'll work it out.</p>
               <div style="text-align:center;margin:24px 0;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                 ${contractLink ? emailButton(contractLink, 'View updated contract', 'blue') : ''}
                 ${emailButton(link, 'View my project', 'blue')}
               </div>`
            : `<h1 style="font-size:22px;color:#1e293b;margin:0 0 12px;">Thanks, ${escapeHtml(firstName)} — got your colors!</h1>
               <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 8px;">Here's what we have for <strong>${escapeHtml(proj.project_number)}</strong>.</p>
               ${tableHtml}
               <p style="font-size:14px;color:#475569;">You can update these any time before finalizing.</p>
               <div style="text-align:center;margin:24px 0;">${emailButton(link, 'View my project', 'blue')}</div>`;
          await resend.emails.send({
            from: 'MannyKnows <projects@send.mannyknows.com>',
            to: proj.customer_email,
            subject: finalize
              ? `Colors finalized — ${proj.project_number}`
              : `Color selections saved — ${proj.project_number}`,
            html: `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;"><div style="max-width:600px;margin:0 auto;background:#fff;">
              ${emailHeader('Color selections')}
              <div style="padding:32px 30px;">
                ${emailBodyHtml}
              </div>
              ${emailFooter()}
            </div></body></html>`,
          });
        }
        const adminTo = env?.NOTIFICATION_EMAIL;
        if (adminTo) {
          await resend.emails.send({
            from: 'MannyKnows <projects@send.mannyknows.com>',
            to: adminTo,
            subject: `Colors submitted — ${proj.project_number} (${proj.customer_name || ''})`,
            html: `<div style="font-family:sans-serif;"><h2>Customer submitted colors</h2>
              <p><strong>${escapeHtml(proj.project_number)}</strong> — ${escapeHtml(proj.customer_name || '')}</p>
              ${tableHtml}</div>`,
          });
        }
      }
    } catch (e) {
      console.error('[portal/colors] notification email failed:', e);
    }

    return json({ success: true, saved: stmts.length, locked: finalize });
  } catch (e) {
    console.error('[portal/colors POST] error:', e);
    return json({ error: 'Failed to save colors' }, 500);
  }
};
