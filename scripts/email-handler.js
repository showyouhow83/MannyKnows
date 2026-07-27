// --- Cloudflare Email Routing handler (injected by post-build) ---
// Route (dashboard): Email Routing → reply.mannyknows.com catch-all →
// Send to Worker → mannyknows. Receives the RAW email and hands it to
// /api/inbound-raw, which parses the MIME and threads the reply onto the
// quote's Messages. Dep-free on purpose — the heavy lifting lives in the app.
// Attached as a property of the default export to survive esbuild tree-shaking.

__astrojsSsrVirtualEntry.email = async function (message, env, ctx) {
  try {
    console.log('[EmailHandler] inbound:', message.from, '->', message.to, 'size=', message.rawSize);
    const raw = await new Response(message.raw).arrayBuffer();
    const res = await fetch('https://mannyknows.com/api/inbound-raw', {
      method: 'POST',
      headers: {
        'x-inbound-secret': env.INBOUND_EMAIL_SECRET || '',
        'x-mail-from': message.from || '',
        'x-mail-to': message.to || '',
        'content-type': 'message/rfc822',
      },
      body: raw,
    });
    if (!res.ok) {
      console.error('[EmailHandler] inbound-raw returned', res.status, await res.text());
      // Best-effort fallback so the email is never lost entirely.
      try { await message.forward('mm@mannyknows.com'); } catch (e) {
        console.error('[EmailHandler] fallback forward failed:', e);
      }
    } else {
      console.log('[EmailHandler] threaded OK');
    }
  } catch (err) {
    console.error('[EmailHandler] error:', err);
    try { await message.forward('mm@mannyknows.com'); } catch {}
  }
};
