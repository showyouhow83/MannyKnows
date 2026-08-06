// POST /api/portal/auth/request   { token, email }
//
// Customer requests access to their project portal. We look the project up by
// client_token, compare the submitted email to the project's customer_email,
// and — only on a match — email a short-lived magic link that sets the portal
// cookie. The response is ALWAYS generic ("if that email is on file…") so the
// endpoint can't be used to enumerate which emails belong to which project.

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { makeMagicToken } from '../../../../lib/portalAuth';
import { emailHeader, emailFooter, emailButton } from '../../../../lib/quote-emails';
import { kvRateLimit, clientIp } from '../../../../lib/rateLimit';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const GENERIC = { success: true, message: "If that email is on your project, we just sent you a secure link to open it." };

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'Unavailable' }, 503);

    const body = await request.json().catch(() => ({})) as { token?: string; email?: string };
    const token = (body.token || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    if (!token || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      // Don't leak which part was wrong.
      return json(GENERIC);
    }

    // Throttle to prevent magic-link email-bombing / Resend-quota abuse.
    // On limit, return the same generic response (no send).
    const rlKv = env?.MK_ADMIN_KV as any;
    if (!(await kvRateLimit(rlKv, `portalauth:ip:${clientIp(request)}`, 10, 3600)) ||
        !(await kvRateLimit(rlKv, `portalauth:em:${email}`, 5, 3600))) {
      return json(GENERIC);
    }

    const project = await db.prepare(
      'SELECT id, project_number, customer_name, customer_email, client_token FROM projects WHERE client_token = ?'
    ).bind(token).first() as any;

    // Generic response whether or not the project / email matches.
    if (!project || !project.customer_email || String(project.customer_email).trim().toLowerCase() !== email) {
      return json(GENERIC);
    }

    const secret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    if (!secret) return json({ success: false, error: 'Server not configured' }, 503);

    const magic = await makeMagicToken(project.id, secret);
    const origin = new URL(request.url).origin;
    const link = `${origin}/project/${encodeURIComponent(token)}?verify=${encodeURIComponent(magic)}`;

    const apiKey = env?.RESEND_API_KEY;
    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        const firstName = (project.customer_name || '').split(' ')[0] || 'there';
        const html = `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;">
          <div style="max-width:600px;margin:0 auto;background:#fff;">
            ${emailHeader('Project access')}
            <div style="padding:36px 30px;">
              <h1 style="font-size:24px;color:#1e293b;margin:0 0 14px;text-align:center;">Open your project</h1>
              <p style="font-size:16px;color:#475569;line-height:1.7;margin:0 0 24px;text-align:center;">
                Hi <strong>${firstName}</strong>, tap the button below to securely open your project portal for
                <strong>${project.project_number}</strong>. This link works for 30 minutes.
              </p>
              <div style="text-align:center;margin:28px 0;">
                ${emailButton(link, 'Open my project', 'blue')}
              </div>
              <p style="font-size:13px;color:#94a3b8;line-height:1.6;text-align:center;">
                Didn't request this? You can ignore this email, no one can open your project without this link.
              </p>
            </div>
            ${emailFooter()}
          </div></body></html>`;
        await resend.emails.send({
          from: 'MannyKnows <projects@send.mannyknows.com>',
          to: email,
          subject: `Open your project: ${project.project_number}`,
          html,
        });
      } catch (e) {
        console.error('[portal/auth/request] email send failed:', e);
        // Still return generic success — don't reveal send failures.
      }
    }

    return json(GENERIC);
  } catch (e) {
    console.error('[portal/auth/request] error:', e);
    return json(GENERIC);
  }
};
