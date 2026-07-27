// Cron trigger endpoint — called by the injected scheduled handler
// Secured by ADMIN_PASSWORD as a shared secret
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

// Import the scheduled task functions directly
import { Resend } from 'resend';
import { sendQuoteFollowUp, type FollowUpData } from '../../../lib/quote-emails';

export const GET: APIRoute = async ({ request, locals }) => {
  const env = cfEnv;
  const url = new URL(request.url);
  const cron = url.searchParams.get('cron');

  // Validate: a dedicated CRON_SECRET in a header (constant-time), OR a valid
  // admin session. The secret is NOT read from the query string (which leaks
  // into logs/Referer) and is NOT the admin password.
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const { AdminAuth, timingSafeEqual } = await import('../../../lib/adminAuth');
  const headerSecret = request.headers.get('x-cron-secret') || '';
  let authorized = !!env?.CRON_SECRET && (await timingSafeEqual(headerSecret, env.CRON_SECRET));
  if (!authorized && sessionSecret) {
    try {
      const session = await AdminAuth.validateSession(request, sessionSecret);
      authorized = session.isAuthenticated;
    } catch {}
  }
  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = env?.MK_APP_DB;
  const resendApiKey = env?.RESEND_API_KEY;

  if (!db || !resendApiKey) {
    return new Response(JSON.stringify({ error: 'Missing DB or Resend config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const results: any = { cron, tasks: [] };

  try {
    if (cron === '30 14 * * *' || cron === '0 14 * * *' || !cron) {
      // Daily 2 PM UTC — send lead reminders + process quote follow-ups
      const reminderResult = await sendLeadReminders(db, resendApiKey, env?.NOTIFICATION_EMAIL);
      results.tasks.push({ name: 'leadReminders', ...reminderResult });

      const followUpResult = await processQuoteFollowUps(db, resendApiKey);
      results.tasks.push({ name: 'quoteFollowUps', ...followUpResult });
    }

    if (cron === '0 3 * * SUN') {
      results.tasks.push({ name: 'reviewRefresh', status: 'skipped (handled separately)' });
    }
  } catch (err: any) {
    results.error = err?.message || 'Unknown error';
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' }
  });
};

// ---- Quote Follow-Ups ----
async function processQuoteFollowUps(db: any, resendApiKey: string) {
  const now = new Date();
  const result = await db.prepare(`
    SELECT id, quote_number, quote_token, customer_name, customer_email,
           services, address, state, zip, total,
           is_renegotiation, sent_at, follow_up_count
    FROM quotes
    WHERE status = 'sent'
      AND customer_email IS NOT NULL
      AND customer_email != ''
      AND sent_at IS NOT NULL
  `).all();

  const quotes = result.results || [];
  let expired = 0, followedUp = 0, errors = 0, skipped = 0;

  for (const q of quotes as any[]) {
    try {
      const sentAt = new Date(q.sent_at + 'Z');
      const daysSinceSent = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));
      const isRenego = q.is_renegotiation === 1;
      const expiryDays = isRenego ? 5 : 7;
      const fu1Day = isRenego ? 2 : 3;
      const fu2Day = isRenego ? 4 : 5;

      // Skip if customer already replied
      const customerReply = await db.prepare(`
        SELECT id FROM messages
        WHERE quote_id = ? AND sender_type = 'customer' AND created_at > ?
        LIMIT 1
      `).bind(q.id, q.sent_at).first();

      if (customerReply) { skipped++; continue; }

      if (daysSinceSent >= expiryDays) {
        await db.prepare(
          "UPDATE quotes SET status = 'cold', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(q.id).run();
        console.log(`[FollowUps] Quote ${q.quote_number} expired → cold (day ${daysSinceSent})`);
        expired++;

      } else if (daysSinceSent >= fu2Day && q.follow_up_count < 2) {
        const expiryDate = new Date(sentAt);
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        const data: FollowUpData = {
          quote_number: q.quote_number,
          quote_token: q.quote_token,
          customer_name: q.customer_name,
          customer_email: q.customer_email,
          services: q.services,
          address: q.address,
          state: q.state,
          zip: q.zip,
          total: q.total,
          expiry_date: expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          is_renegotiation: isRenego,
          follow_up_number: 2,
        };

        const { success } = await sendQuoteFollowUp(data, { RESEND_API_KEY: resendApiKey, NOTIFICATION_EMAIL: '' });
        if (success) {
          await db.prepare('UPDATE quotes SET follow_up_count = 2, last_follow_up_at = CURRENT_TIMESTAMP WHERE id = ?').bind(q.id).run();
          followedUp++;
        } else { errors++; }

      } else if (daysSinceSent >= fu1Day && q.follow_up_count < 1) {
        const expiryDate = new Date(sentAt);
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        const data: FollowUpData = {
          quote_number: q.quote_number,
          quote_token: q.quote_token,
          customer_name: q.customer_name,
          customer_email: q.customer_email,
          services: q.services,
          address: q.address,
          state: q.state,
          zip: q.zip,
          total: q.total,
          expiry_date: expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          is_renegotiation: isRenego,
          follow_up_number: 1,
        };

        const { success } = await sendQuoteFollowUp(data, { RESEND_API_KEY: resendApiKey, NOTIFICATION_EMAIL: '' });
        if (success) {
          await db.prepare('UPDATE quotes SET follow_up_count = 1, last_follow_up_at = CURRENT_TIMESTAMP WHERE id = ?').bind(q.id).run();
          followedUp++;
        } else { errors++; }
      }
    } catch (err) {
      console.error(`[FollowUps] Error processing quote ${q.quote_number}:`, err);
      errors++;
    }
  }

  console.log(`[FollowUps] Done — expired: ${expired}, followed-up: ${followedUp}, skipped: ${skipped}, errors: ${errors}`);
  return { total: quotes.length, expired, followedUp, skipped, errors };
}

// ---- Lead Reminders ----
async function sendLeadReminders(db: any, resendApiKey: string, notificationEmail?: string) {
  const result = await db.prepare(`
    SELECT id, customer_name, customer_email, preferred_date, preferred_time, confirmation_code
    FROM leads
    WHERE status = 'confirmed'
      AND reminder_sent = 0
      AND customer_email IS NOT NULL
      AND preferred_date IS NOT NULL
      AND preferred_date != 'TBD'
      AND preferred_date != 'ASAP'
      AND date(preferred_date) = date('now', '+1 day')
  `).all();

  const leads = result.results || [];
  let sent = 0, errors = 0;

  const resend = new Resend(resendApiKey);

  for (const lead of leads as any[]) {
    try {
      await resend.emails.send({
        from: 'MannyKnows <bookings@send.mannyknows.com>',
        to: lead.customer_email,
        subject: `Reminder: Your Appointment Tomorrow - ${lead.confirmation_code}`,
        html: `<p>Hi ${(lead.customer_name || 'there').split(' ')[0]},</p>
<p>This is a friendly reminder that your appointment with MannyKnows is tomorrow, ${lead.preferred_date} at ${lead.preferred_time || 'your scheduled time'}.</p>
<p>If you need to reschedule, please call us at <a href="tel:4133618451">(413) 361-8451</a>.</p>
<p>We look forward to seeing you!</p>
<p>— The MannyKnows Team</p>`,
      });

      await db.prepare('UPDATE leads SET reminder_sent = 1 WHERE id = ?').bind(lead.id).run();
      sent++;
    } catch (err) {
      console.error(`[Reminders] Failed for lead ${lead.confirmation_code}:`, err);
      errors++;
    }
  }

  console.log(`[Reminders] Done — sent: ${sent}, errors: ${errors}`);
  return { total: leads.length, sent, errors };
}
