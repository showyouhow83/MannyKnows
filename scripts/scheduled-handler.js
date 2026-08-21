
// --- Cloudflare cron scheduled handler (injected by post-build) ---
// Direct D1 queries + Resend REST API. No imports, no internal HTTP routing.
// This runs as part of the Worker module — env has D1, KV, etc. bindings.
// Attached as a property of the default export to survive esbuild tree-shaking.

__astrojsSsrVirtualEntry.scheduled = async function(event, env, ctx) {
  console.log('[Cron] Trigger fired:', event.cron);

  const db = env.MK_APP_DB;
  const resendKey = env.RESEND_API_KEY;

  if (!db || !resendKey) {
    console.error('[Cron] Missing MK_APP_DB or RESEND_API_KEY');
    return;
  }

  // Run all scheduled tasks for any daily cron
  ctx.waitUntil(Promise.all([
    cronProcessQuoteFollowUps(db, resendKey),
    cronSendLeadReminders(db, resendKey)
  ]));
};

// ---- Quote Follow-Ups ----
async function cronProcessQuoteFollowUps(db, resendKey) {
  try {
    const now = new Date();
    const result = await db.prepare(`
      SELECT id, quote_number, quote_token, customer_name, customer_email,
             services, address, state, zip, total, full_address,
             is_renegotiation, sent_at, follow_up_count
      FROM quotes
      WHERE status = 'sent'
        AND customer_email IS NOT NULL
        AND customer_email != ''
        AND sent_at IS NOT NULL
    `).all();

    const quotes = result.results || [];
    console.log('[Cron:FollowUps] Processing', quotes.length, 'pending quotes');
    let expired = 0, followedUp = 0, skipped = 0, errors = 0;

    for (const q of quotes) {
      try {
        const sentAt = new Date(q.sent_at + 'Z');
        const daysSinceSent = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));
        const isRenego = q.is_renegotiation === 1;
        const expiryDays = isRenego ? 5 : 7;
        const fu1Day = isRenego ? 2 : 3;
        const fu2Day = isRenego ? 4 : 5;

        // Skip if customer already replied
        const reply = await db.prepare(
          "SELECT id FROM messages WHERE quote_id = ? AND sender_type = 'customer' AND created_at > ? LIMIT 1"
        ).bind(q.id, q.sent_at).first();
        if (reply) { skipped++; continue; }

        if (daysSinceSent >= expiryDays) {
          // Expire to cold
          await db.prepare("UPDATE quotes SET status = 'cold', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(q.id).run();
          console.log('[Cron:FollowUps] Quote', q.quote_number, '-> cold (day', daysSinceSent, ')');
          expired++;

        } else if (daysSinceSent >= fu2Day && q.follow_up_count < 2) {
          const sent = await cronSendFollowUp(q, 2, isRenego, sentAt, expiryDays, resendKey);
          if (sent) {
            await db.prepare('UPDATE quotes SET follow_up_count = 2, last_follow_up_at = CURRENT_TIMESTAMP WHERE id = ?').bind(q.id).run();
            followedUp++;
          } else { errors++; }

        } else if (daysSinceSent >= fu1Day && q.follow_up_count < 1) {
          const sent = await cronSendFollowUp(q, 1, isRenego, sentAt, expiryDays, resendKey);
          if (sent) {
            await db.prepare('UPDATE quotes SET follow_up_count = 1, last_follow_up_at = CURRENT_TIMESTAMP WHERE id = ?').bind(q.id).run();
            followedUp++;
          } else { errors++; }
        }
      } catch (err) {
        console.error('[Cron:FollowUps] Error on', q.quote_number, err);
        errors++;
      }
    }

    console.log('[Cron:FollowUps] Done, expired:', expired, 'followed-up:', followedUp, 'skipped:', skipped, 'errors:', errors);
  } catch (err) {
    console.error('[Cron:FollowUps] Fatal error:', err);
  }
}

// Send follow-up email via Resend REST API (no SDK needed)
async function cronSendFollowUp(q, fuNumber, isRenego, sentAt, expiryDays, resendKey) {
  const firstName = (q.customer_name || '').split(' ')[0] || 'there';
  const reviewUrl = 'https://mannyknows.com/quote/' + q.quote_token;
  const replyTo = 'reply+' + q.quote_token + '@reply.mannyknows.com';
  const addressLine = q.full_address || [q.address, q.state, q.zip].filter(Boolean).join(', ') || 'your business';

  const expiryDate = new Date(sentAt);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  const expiryStr = expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  let services = 'your project';
  try {
    const parsed = JSON.parse(q.services || '[]');
    const labels = { website: 'Website', ecommerce: 'Online Store', 'ai-agent': 'AI Agent', app: 'Business App', seo: 'Local SEO' };
    services = parsed.map(s => labels[typeof s === 'string' ? s : s.type] || s).join(' & ') || services;
  } catch {}

  let subject, body;
  if (!isRenego && fuNumber === 1) {
    subject = 'Just checking in on your quote: #' + q.quote_number;
    body = '<p>Hi ' + firstName + ',</p><p>Just wanted to make sure your quote made it to your inbox! We sent over an estimate for <strong>' + services + '</strong> at ' + addressLine + ' a few days ago and wanted to check in.</p><p>Your quote is valid until <strong>' + expiryStr + '</strong>. If you have any questions, just reply to this email.</p><p style="text-align:center;margin:24px 0"><a href="' + reviewUrl + '" style="background:#007bff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Review & Accept Your Quote</a></p>';
  } else if (!isRenego && fuNumber === 2) {
    subject = 'Your quote expires in 2 days: #' + q.quote_number;
    body = '<p>Hi ' + firstName + ',</p><p>Your quote for <strong>' + services + '</strong> at ' + addressLine + ' expires in <strong>2 days</strong> on <strong>' + expiryStr + '</strong>.</p><p>We\'d love the opportunity to work on your project. If the timing or pricing isn\'t quite right, just reply and let us know.</p><p style="text-align:center;margin:24px 0"><a href="' + reviewUrl + '" style="background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Review & Accept Your Quote</a></p>';
  } else if (isRenego && fuNumber === 1) {
    subject = 'Following up on your revised quote: #' + q.quote_number;
    body = '<p>Hi ' + firstName + ',</p><p>Just following up on the revised quote we sent for <strong>' + services + '</strong> at ' + addressLine + '.</p><p>We made updates based on your feedback. If you\'d like to talk through anything, we\'re just a reply away.</p><p style="text-align:center;margin:24px 0"><a href="' + reviewUrl + '" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Review Your Revised Quote</a></p>';
  } else {
    subject = 'Your revised quote expires tomorrow: #' + q.quote_number;
    body = '<p>Hi ' + firstName + ',</p><p>Your revised quote for <strong>' + services + '</strong> at ' + addressLine + ' expires <strong>tomorrow</strong> on <strong>' + expiryStr + '</strong>.</p><p>If you\'re still interested, this is a great time to lock in your price.</p><p style="text-align:center;margin:24px 0"><a href="' + reviewUrl + '" style="background:#007bff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Review & Accept</a></p>';
  }

  const html = '<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;background:#f5f5f5"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px"><div style="background:linear-gradient(135deg,#007bff 0%,#6366f1 100%);padding:30px;text-align:center"><span style="font-size:28px;font-weight:700;color:#fff">MannyKnows</span></div><div style="padding:30px">' + body + '</div><div style="padding:20px 30px;background:#f8fafc;text-align:center;font-size:13px;color:#64748b"><p style="margin:0 0 8px 0">Questions? Call <a href="tel:4133618451" style="color:#007bff">(413) 361-8451</a> or reply to this email</p><p style="margin:0">MannyKnows | mannyknows.com</p></div></div></body></html>';
  const text = 'Hi ' + firstName + ', this is a follow-up on your quote #' + q.quote_number + '. Review it here: ' + reviewUrl + '\n\nReply to this email or call (413) 361-8451.\n\nMannyKnows | mannyknows.com';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'MannyKnows <quotes@send.mannyknows.com>',
        reply_to: replyTo,
        to: [q.customer_email],
        subject: subject,
        html: html,
        text: text
      })
    });
    const data = await res.json();
    if (data.id) {
      console.log('[Cron:FollowUp] Sent #' + fuNumber + ' to', q.customer_email, 'for', q.quote_number);
      return true;
    } else {
      console.error('[Cron:FollowUp] Resend error for', q.quote_number, JSON.stringify(data));
      return false;
    }
  } catch (err) {
    console.error('[Cron:FollowUp] Failed for', q.quote_number, err);
    return false;
  }
}

// ---- Lead Reminders ----
async function cronSendLeadReminders(db, resendKey) {
  try {
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
    console.log('[Cron:Reminders] Found', leads.length, 'leads to remind');
    let sent = 0, errors = 0;

    for (const lead of leads) {
      try {
        const firstName = (lead.customer_name || 'there').split(' ')[0];
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'MannyKnows <bookings@send.mannyknows.com>',
            to: [lead.customer_email],
            subject: 'Reminder: Your Appointment Tomorrow - ' + lead.confirmation_code,
            html: '<p>Hi ' + firstName + ',</p><p>This is a friendly reminder that your appointment with MannyKnows is tomorrow, ' + lead.preferred_date + ' at ' + (lead.preferred_time || 'your scheduled time') + '.</p><p>If you need to reschedule, please call us at <a href="tel:4133618451">(413) 361-8451</a>.</p><p>We look forward to seeing you!</p><p>, The MannyKnows Team</p>',
            text: 'Hi ' + firstName + ', reminder: your appointment is tomorrow ' + lead.preferred_date + ' at ' + (lead.preferred_time || 'your scheduled time') + '. Call (413) 361-8451 to reschedule.'
          })
        });
        const data = await res.json();
        if (data.id) {
          await db.prepare('UPDATE leads SET reminder_sent = 1 WHERE id = ?').bind(lead.id).run();
          sent++;
        } else { errors++; }
      } catch (err) {
        console.error('[Cron:Reminders] Failed for', lead.confirmation_code, err);
        errors++;
      }
    }

    console.log('[Cron:Reminders] Done, sent:', sent, 'errors:', errors);
  } catch (err) {
    console.error('[Cron:Reminders] Fatal error:', err);
  }
}
