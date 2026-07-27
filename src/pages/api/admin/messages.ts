import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { Resend } from 'resend';
import { emailHeader, emailFooter, emailOpen, emailClose } from '../../../lib/quote-emails';
import { getBrand, emailFrom, type Brand } from '../../../lib/brand';

// GET: Fetch messages for a quote or lead
export const GET: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);

  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const quoteId = url.searchParams.get('quote_id');
  const leadId = url.searchParams.get('lead_id');

  if (!quoteId && !leadId) {
    return new Response(JSON.stringify({ error: 'quote_id or lead_id required' }), { status: 400 });
  }

  const db = env?.MK_APP_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
  }

  let query = 'SELECT * FROM messages WHERE ';
  let param: string;

  if (quoteId) {
    query += 'quote_id = ?';
    param = quoteId;
  } else {
    query += 'lead_id = ?';
    param = leadId!;
  }

  query += ' ORDER BY created_at ASC';

  const result = await db.prepare(query).bind(param).all();

  return new Response(JSON.stringify({
    success: true,
    messages: result.results || []
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

// POST: Send a message to a customer
export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);

  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json() as {
    quote_id?: number;
    lead_id?: number;
    subject?: string;
    body: string;
    recipient_email: string;
    recipient_name?: string;
    attachments?: Array<{ url: string; name: string; type: string; size?: number }>;
  };

  if (!body.body?.trim()) {
    return new Response(JSON.stringify({ error: 'Message body is required' }), { status: 400 });
  }

  if (!body.recipient_email?.trim()) {
    return new Response(JSON.stringify({ error: 'Recipient email is required' }), { status: 400 });
  }

  if (!body.quote_id && !body.lead_id) {
    return new Response(JSON.stringify({ error: 'quote_id or lead_id required' }), { status: 400 });
  }

  const db = env?.MK_APP_DB;
  const resendApiKey = env?.RESEND_API_KEY;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
  }

  let subject = body.subject?.trim() || '';
  const messageBody = body.body.trim();
  const recipientName = body.recipient_name?.trim() || 'Valued Customer';
  const attachments = Array.isArray(body.attachments)
    ? body.attachments.filter(a => a?.url?.startsWith('http') && a?.name).slice(0, 20)
    : [];

  function buildAttachmentHtml(atts: typeof attachments): string {
    if (!atts.length) return '';
    const items = atts.map(a => {
      const isImage = a.type?.startsWith('image/');
      const isVideo = a.type?.startsWith('video/');
      const isPdf   = a.type === 'application/pdf';
      const iconSvg = isPdf
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:6px;flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
        : isVideo
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:6px;flex-shrink:0;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:6px;flex-shrink:0;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
      const safeName = a.name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeUrl = encodeURI(a.url);
      if (isImage) {
        return `<div style="margin-bottom:12px;">
          <a href="${safeUrl}" target="_blank" rel="noopener" style="display:block;">
            <img src="${safeUrl}" alt="${safeName}" style="max-width:100%;max-height:320px;border-radius:8px;display:block;border:1px solid #e2e8f0;" />
          </a>
          <div style="font-size:11px;color:#64748b;margin-top:4px;">${safeName}</div>
        </div>`;
      }
      return `<div style="margin-bottom:8px;">
        <a href="${safeUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;padding:10px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-decoration:none;color:#1e293b;font-size:13px;font-weight:500;">
          ${iconSvg}${safeName}
        </a>
      </div>`;
    }).join('');
    return `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
      <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">Attachments</div>
      ${items}
    </div>`;
  }

  try {
  // Ensure messages table exists
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      quote_id INTEGER,
      subject TEXT,
      body TEXT NOT NULL,
      sender_type TEXT NOT NULL DEFAULT 'admin',
      sender_name TEXT DEFAULT 'MannyKnows',
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      status TEXT DEFAULT 'sent',
      resend_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
    )
  `).run();

  // Try to get quote reference number and token for badge/reply-to,
  // plus the partner_id so we can white-label the email if it's a partner job.
  let quoteRef = '';
  let replyToken = '';
  let partnerId: number | null = null;
  if (body.quote_id && db) {
    const quoteRow = await db.prepare('SELECT quote_number, quote_token, partner_id FROM quotes WHERE id = ?').bind(body.quote_id).first() as any;
    quoteRef = quoteRow?.quote_number || `Q-${body.quote_id}`;
    replyToken = quoteRow?.quote_token || '';
    partnerId = quoteRow?.partner_id ?? null;

    // Auto-generate token if missing so Reply-To always works
    if (!replyToken) {
      replyToken = crypto.randomUUID();
      await db.prepare('UPDATE quotes SET quote_token = ? WHERE id = ?').bind(replyToken, body.quote_id).run();
    }
  } else if (body.lead_id && db) {
    const leadRow = await db.prepare('SELECT confirmation_code, partner_id FROM leads WHERE id = ?').bind(body.lead_id).first() as any;
    quoteRef = leadRow?.confirmation_code || `L-${body.lead_id}`;
    partnerId = leadRow?.partner_id ?? null;
  }

  // Resolve the brand once (SL by default; partner when partner_id is set).
  const brand: Brand = await getBrand(db, partnerId);
  if (!subject) subject = `Message from ${brand.name}`;

  // Send email via Resend
  let resendId = null;
  let emailStatus = 'sent';

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);

      const isLocalhost = (request.headers.get('origin') || '').includes('localhost');

      const emailHtml = `
${emailOpen()}
  ${emailHeader(undefined, brand)}
  <div style="padding: 40px 30px;">
    ${quoteRef ? `<div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: ${brand.isPartner ? '#0f172a' : 'linear-gradient(135deg, #ff781d 0%, #f59e0b 100%)'}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">PROJECT #${quoteRef}</div>
    </div>` : ''}
    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 24px 0;">
      Hi <strong style="color: #1e293b;">${recipientName}</strong>,
    </p>
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 0 0 30px 0; border: 1px solid #e2e8f0;">
      <div style="font-size: 15px; color: #1e293b; line-height: 1.7; white-space: pre-wrap;">${messageBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      ${buildAttachmentHtml(attachments)}
    </div>
    <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f0f7ff; border-radius: 12px; border: 1px solid #dbeafe;">
      <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 15px; font-weight: 600;">Simply reply to this email to respond</p>
      <p style="margin: 0; color: #64748b; font-size: 13px;">Your reply will go directly to our team</p>
    </div>
    ${brand.phoneDisplay ? `<div style="text-align: center; border-top: 1px solid #e2e8f0; margin-top: 20px; padding: 20px 0 0 0;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Or call us anytime</p>
      <a href="tel:${brand.phoneTel}" style="color: #ff781d; font-size: 16px; font-weight: 700; text-decoration: none;">${brand.phoneDisplay}</a>
    </div>` : ''}
  </div>
  ${emailFooter({ showEli: true }, brand)}
${emailClose()}`;

      const emailResult = await resend.emails.send({
        from: isLocalhost ? `${brand.fromName} <onboarding@resend.dev>` : emailFrom(brand, 'quotes'),
        // send.mannyknows.com is the Resend-receiving domain (root MX is
        // Google Workspace, so Cloudflare Email Routing is unavailable on this
        // zone). Replies hit the Resend webhook → /api/inbound → the quote's
        // Messages thread.
        ...(replyToken ? { replyTo: `reply+${replyToken}@send.mannyknows.com` } : {}),
        to: isLocalhost ? 'delivered@resend.dev' : body.recipient_email,
        subject: subject,
        html: emailHtml,
      });

      resendId = (emailResult as any)?.data?.id || null;
    } catch (err) {
      console.error('Failed to send email:', err);
      emailStatus = 'failed';
    }
  } else {
    emailStatus = 'failed';
  }

  // Store message in D1
  const attachmentsJson = attachments.length ? JSON.stringify(attachments) : null;
  const insertResult = await db.prepare(`
    INSERT INTO messages (lead_id, quote_id, subject, body, sender_type, sender_name, recipient_email, recipient_name, status, resend_id, attachments)
    VALUES (?, ?, ?, ?, 'admin', ?, ?, ?, ?, ?, ?)
  `).bind(
    body.lead_id || null,
    body.quote_id || null,
    subject,
    messageBody,
    brand.name,
    body.recipient_email,
    recipientName,
    emailStatus,
    resendId,
    attachmentsJson
  ).run();

  return new Response(JSON.stringify({
    success: true,
    message_id: insertResult.meta?.last_row_id,
    email_status: emailStatus,
    resend_id: resendId
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  } catch (err: any) {
    console.error('Messages API error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
