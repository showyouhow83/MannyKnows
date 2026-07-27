// Admin alerts (email + SMS) for customer-facing events.
//
// SELF-CONTAINED + NON-DESTRUCTIVE BY DESIGN. This module only ADDS alerts; it
// never changes any existing flow. Every send is best-effort and wrapped so a
// failure can never break the caller. The SMS side stays dormant until a
// `NOTIFICATION_PHONE` secret is set, so nothing changes behavior until you opt
// in. To fully revert: delete this file and remove the `notifyAdmin(...)` calls
// (each is a single try/catch line at an event hook).
//
// Config (Cloudflare secrets):
//   NOTIFICATION_PHONE   — comma-separated US cell number(s) for SMS alerts.
//                          REQUIRED for SMS: there is no hardcoded fallback.
//   NOTIFICATION_EMAIL   — recipient override for email alerts (defaults to
//                          mm@mannyknows.com; ALERT_EMAIL also honored)
//   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER — Twilio
//                          credentials + sender (TWILIO_FROM_NUMBER also
//                          honored). If any is missing, SMS is skipped with a
//                          console log (never throws).
//   RESEND_API_KEY       — for email

type NotifyOpts = {
  subject: string;          // email subject + SMS lead line
  body: string;             // plain-text body (used for SMS + email fallback)
  link?: string;            // deep link to the source (admin page)
  html?: string;            // optional rich email; falls back to body
  channels?: ('email' | 'sms')[]; // default: both
};

const SITE = 'https://mannyknows.com';

// ── Easy-to-update alert recipients ───────────────────────────────────────
// To change where alerts go: edit these two lines, OR (no redeploy needed) set
// the `NOTIFICATION_PHONE` / `NOTIFICATION_EMAIL` Cloudflare secrets to
// override them.
// Phone accepts a comma-separated list for multiple recipients.
//
// NOTE: the SL Painting port shipped a hardcoded SLP alert phone here; it was
// removed so MK alerts can never text a stranger. SMS stays dormant until
// Manny's number is set (edit below or set the NOTIFICATION_PHONE secret).
const DEFAULT_ALERT_PHONE = '';
const DEFAULT_ALERT_EMAIL = 'mm@mannyknows.com';

function toE164(raw: string): string | null {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d.startsWith('1')) return '+' + d;
  return null;
}

async function sendSMS(env: any, text: string): Promise<void> {
  const sid = env?.TWILIO_ACCOUNT_SID;
  const token = env?.TWILIO_AUTH_TOKEN;
  const from = env?.TWILIO_PHONE_NUMBER || env?.TWILIO_FROM_NUMBER;
  const dest = env?.NOTIFICATION_PHONE || DEFAULT_ALERT_PHONE;
  if (!sid || !token || !from) {
    // Feature-flag guard: Twilio not configured → skip quietly but visibly.
    console.log('[notifyAdmin] SMS skipped — Twilio not configured (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
    return;
  }
  if (!dest) {
    console.log('[notifyAdmin] SMS skipped — no recipient (set the NOTIFICATION_PHONE secret)');
    return;
  }

  const numbers = String(dest).split(',').map(s => toE164(s.trim())).filter(Boolean) as string[];
  if (!numbers.length) return;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = btoa(`${sid}:${token}`);
  for (const to of numbers) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: from, To: to, Body: text.slice(0, 1500) }).toString(),
      });
      if (!res.ok) console.error('[notifyAdmin] SMS failed:', await res.text().catch(() => res.status));
    } catch (e) {
      console.error('[notifyAdmin] SMS error:', e);
    }
  }
}

async function sendEmail(env: any, subject: string, html: string): Promise<void> {
  const apiKey = env?.RESEND_API_KEY;
  const to = env?.NOTIFICATION_EMAIL || env?.ALERT_EMAIL || DEFAULT_ALERT_EMAIL;
  if (!apiKey || !to) return;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: 'MK Alerts <admin@send.mannyknows.com>', to, subject, html });
  } catch (e) {
    console.error('[notifyAdmin] email error:', e);
  }
}

/**
 * Fire an admin alert. Never throws. Default sends both channels; pass
 * `channels: ['sms']` for events that already send their own admin email
 * (so we add SMS without duplicating the email).
 */
export async function notifyAdmin(env: any, opts: NotifyOpts): Promise<void> {
  try {
    // SMS-only by default. The admin already gets richer per-event emails from
    // the existing flows (new lead, quote accepted/declined, contract signed),
    // so this helper does NOT duplicate them. (Email path kept for callers that
    // explicitly opt in via channels: ['email'].)
    const channels = opts.channels || ['sms'];
    const link = opts.link ? (opts.link.startsWith('http') ? opts.link : SITE + opts.link) : '';

    if (channels.includes('sms')) {
      const smsText = `MannyKnows — ${opts.subject}\n${opts.body}${link ? `\n${link}` : ''}`;
      await sendSMS(env, smsText);
    }
    if (channels.includes('email')) {
      const html = opts.html || `<div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#1e293b;">
        <h2 style="margin:0 0 10px;font-size:18px;">${escapeHtml(opts.subject)}</h2>
        <p style="font-size:15px;color:#475569;line-height:1.6;white-space:pre-wrap;">${escapeHtml(opts.body)}</p>
        ${link ? `<p style="margin-top:16px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:linear-gradient(135deg,#ff781d,#f59e0b);color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Open in admin</a></p>` : ''}
      </div>`;
      await sendEmail(env, opts.subject, html);
    }
  } catch (e) {
    console.error('[notifyAdmin] error:', e);
  }
}

function escapeHtml(s: unknown): string {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
