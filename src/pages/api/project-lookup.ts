// Project Lookup API
// Sends customer their project portal link(s) via email
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getBrand, emailFrom, type Brand } from '../../lib/brand';
import { kvRateLimit, clientIp } from '../../lib/rateLimit';
import { SERVICE_LABELS } from '../../data/serviceTypes';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const resendApiKey = env?.RESEND_API_KEY;

    if (!db || !resendApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable'
      }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json() as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Please enter your email address'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Always return success to prevent email enumeration
    const successResponse = new Response(JSON.stringify({
      success: true,
      message: 'If we have a project on file for this email, you will receive a link shortly.'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    // Throttle so this can't be used to email-bomb a known customer or burn the
    // Resend quota. On limit, return the same generic success without sending.
    // MK_ADMIN_KV is not bound on this worker; the limiter fails open without
    // KV, so fall back to the sessions KV (bound) to keep the throttle real.
    const rlKv = (env?.MK_ADMIN_KV || env?.MK_KV_SESSIONS) as any;
    const ipOk = await kvRateLimit(rlKv, `plookup:ip:${clientIp(request)}`, 8, 3600);
    const emailOk = await kvRateLimit(rlKv, `plookup:em:${email}`, 4, 3600);
    if (!ipOk || !emailOk) return successResponse;

    // Look up projects by customer email
    const result = await db.prepare(`
      SELECT p.project_number, p.client_token, p.services, p.status, p.customer_name, p.partner_id
      FROM projects p
      WHERE LOWER(p.customer_email) = ?
        AND p.status IN ('needs_crew', 'in_progress', 'completed')
        AND p.client_token IS NOT NULL
      ORDER BY p.created_at DESC
    `).bind(email).all();

    const projects = result.results || [];
    if (projects.length === 0) return successResponse;

    // Build email with project links
    const customerName = (projects[0].customer_name as string)?.split(' ')[0] || 'there';
    // White-label from the most-recent project's partner (SL otherwise).
    const brand: Brand = await getBrand(db, (projects[0] as any).partner_id);

    function formatServices(servicesJson: string | null): string {
      if (!servicesJson) return 'Home Services';
      try {
        const services = JSON.parse(servicesJson);
        return services.map((s: any) => {
          const key = typeof s === 'string' ? s : (s.type || 'service');
          return SERVICE_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
        }).join(', ');
      } catch { return servicesJson || 'Home Services'; }
    }

    const statusLabels: Record<string, string> = {
      'needs_crew': 'Scheduling',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };

    const projectRows = projects.map((p: any) => `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${p.project_number}</div>
          <div style="font-size: 13px; color: #64748b;">${formatServices(p.services as string)}</div>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${p.status === 'completed' ? '#dcfce7; color: #166534' : p.status === 'in_progress' ? '#dbeafe; color: #1e40af' : '#fef3c7; color: #92400e'};">
            ${statusLabels[p.status as string] || p.status}
          </span>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          <a href="https://mannyknows.com/project/${p.client_token}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #ff781d 0%, #e05f00 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px;">
            View Project
          </a>
        </td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0;">
<div style="max-width: 700px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
  ${brand.isPartner && brand.logoUrl
    ? `<div style="background:#ffffff; padding:32px 30px 26px; text-align:center; border-bottom:1px solid #e5e7eb;"><img src="${brand.logoUrl}" alt="${brand.name}" style="display:inline-block; max-width:260px; max-height:72px; height:auto;" /></div><div style="height:3px; background:#0f172a;"></div>`
    : `<div style="background: rgb(15, 18, 25); padding: 40px 30px 36px; text-align: center;">
    <div style="margin-bottom: 4px;">
      <img src="https://mannyknows.com/favicon.svg" alt="" width="48" height="48" style="display: inline-block; vertical-align: middle; margin-right: 12px;" />
      <span style="font-size: 34px; font-weight: 700; color: #ffffff; letter-spacing: -1px; vertical-align: middle;">MannyKnows</span>
    </div>
  </div>
  <div style="height: 4px; background: linear-gradient(90deg, #ff781d 0%, #ffa25c 50%, #ff781d 100%);"></div>`}

  <div style="padding: 40px 30px;">
    <h1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0;">
      Hi ${customerName}!
    </h1>
    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0;">
      Here ${projects.length === 1 ? 'is your project link' : 'are your project links'}. Click below to view progress, timeline, and download your receipt.
    </p>

    <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      ${projectRows}
    </table>
  </div>

  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    ${brand.phoneDisplay ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">Questions? Call us at <a href="tel:${brand.phoneTel}" style="color: #ff781d; text-decoration: none; font-weight: 600;">${brand.phoneDisplay}</a></p>` : ''}
    <p style="margin: 0; font-size: 12px; color: #94a3b8;">${brand.name}</p>
  </div>
</div>
</body>
</html>`;

    // Send via Resend
    const origin = request.headers.get('origin') || '';
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    if (!isLocalhost) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailFrom(brand, 'noreply'),
          to: [email],
          subject: `Your ${brand.name} Project Link`,
          html
        })
      });

      if (!res.ok) {
        console.error('[ProjectLookup] Failed to send email:', await res.text());
      }
    } else {
      console.log('[ProjectLookup] Skipping email send in localhost mode');
    }

    return successResponse;
  } catch (error) {
    console.error('Project lookup error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Something went wrong. Please try again.'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
