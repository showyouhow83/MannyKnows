import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';

// Twilio Regulatory Compliance — Bundle "Status Callback" webhook.
//
// Twilio POSTs here (application/x-www-form-urlencoded) whenever a compliance
// profile / regulatory bundle changes status: draft -> pending-review ->
// twilio-approved / twilio-rejected, etc. We log it, keep a permanent record in
// KV, and email the owner. This URL is what you paste into Twilio's
// "Status Callback URL" field:  https://mannyknows.com/api/twilio/compliance-status
//
// Security — both optional; the endpoint works without either:
//   • Set the TWILIO_AUTH_TOKEN secret -> we verify Twilio's X-Twilio-Signature
//     header (the recommended, cryptographic check).
//   • Or set TWILIO_CALLBACK_SECRET and configure the URL with ?key=<secret>
//     -> simple shared-secret check.
// With neither set it still works, but is unauthenticated: it only emails when
// the payload actually looks like a Twilio status callback (has Status/BundleSid),
// which keeps it from being an open email-spam relay.

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Health check — open in a browser to confirm the endpoint is live.
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  return new Response(
    JSON.stringify({
      ok: true,
      endpoint: 'twilio-compliance-status',
      hint: 'Twilio sends Bundle status callbacks here via POST.',
      url: `${url.origin}${url.pathname}`,
    }),
    { status: 200, headers: JSON_HEADERS },
  );
};

// Length-independent-ish constant-time string compare.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// Twilio's request-validation algorithm: HMAC-SHA1(authToken, url + sorted
// key+value pairs), base64-encoded, compared to the X-Twilio-Signature header.
async function verifyTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false;
  const data = Object.keys(params)
    .sort()
    .reduce((acc, k) => acc + k + params[k], url);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return timingSafeEqual(expected, signature);
}

function escapeHtml(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

export const POST: APIRoute = async ({ request }) => {
  // --- Parse the body (Twilio uses application/x-www-form-urlencoded) ---
  const params: Record<string, string> = {};
  try {
    const form = await request.clone().formData();
    for (const [k, v] of form.entries()) params[k] = typeof v === 'string' ? v : '';
  } catch {
    try {
      const body = (await request.clone().json()) as Record<string, unknown>;
      if (body && typeof body === 'object') {
        for (const [k, v] of Object.entries(body)) params[k] = String(v);
      }
    } catch {
      /* empty / unparseable body — we still return 200 below so Twilio stops retrying */
    }
  }

  const url = new URL(request.url);
  const authToken = env?.TWILIO_AUTH_TOKEN;
  const sharedSecret = env?.TWILIO_CALLBACK_SECRET;
  let authState: 'twilio-signature' | 'shared-secret' | 'unauthenticated' = 'unauthenticated';

  // --- Optional authentication ---
  if (authToken) {
    const ok = await verifyTwilioSignature(
      authToken,
      request.url,
      params,
      request.headers.get('X-Twilio-Signature'),
    );
    if (!ok) {
      console.warn('[twilio-compliance] Invalid X-Twilio-Signature — rejecting.');
      return new Response(JSON.stringify({ error: 'invalid signature' }), {
        status: 403,
        headers: JSON_HEADERS,
      });
    }
    authState = 'twilio-signature';
  } else if (sharedSecret) {
    if (!timingSafeEqual(url.searchParams.get('key') || '', sharedSecret)) {
      console.warn('[twilio-compliance] Missing/incorrect ?key shared secret — rejecting.');
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 403,
        headers: JSON_HEADERS,
      });
    }
    authState = 'shared-secret';
  }

  const status = params.Status || params.status || '';
  const bundleSid = params.BundleSid || params.Sid || params.bundleSid || '';
  const looksLikeTwilio = Boolean(status || bundleSid);
  const receivedAt = new Date().toISOString();

  console.log('[twilio-compliance] callback', {
    authState,
    status,
    bundleSid,
    receivedAt,
    fields: Object.keys(params),
  });

  // --- Persist (no TTL — compliance history must not expire) ---
  const kv = env?.MK_KV_CHATBOT;
  if (kv && looksLikeTwilio) {
    try {
      const record = { receivedAt, authState, status, bundleSid, params };
      await kv.put(`twilio:compliance:${bundleSid || 'unknown'}:${receivedAt}`, JSON.stringify(record));
      await kv.put('twilio:compliance:latest', JSON.stringify(record));
    } catch (e) {
      console.error('[twilio-compliance] KV write failed:', e);
    }
  }

  // --- Email the owner (only when authenticated or the payload looks real) ---
  const resendKey = env?.RESEND_API_KEY;
  if (resendKey && (authState !== 'unauthenticated' || looksLikeTwilio)) {
    const ownerEmail = env?.OWNER_EMAIL || 'mk@mannyknows.com';
    const resendFrom = env?.RESEND_FROM || 'MannyKnows <onboarding@resend.dev>';
    const rows = Object.entries(params)
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 10px;font-weight:600;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 10px">${escapeHtml(v)}</td></tr>`,
      )
      .join('');
    const subject = `Twilio compliance profile: ${status || 'update'}${bundleSid ? ` (${bundleSid})` : ''}`;
    const emailHtml = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px">
        <h2 style="margin:0 0 8px">Twilio compliance status update</h2>
        <p style="margin:0 0 4px">Status: <strong>${escapeHtml(status || 'unknown')}</strong></p>
        ${bundleSid ? `<p style="margin:0 0 4px">Bundle: <code>${escapeHtml(bundleSid)}</code></p>` : ''}
        <p style="margin:0 0 12px;color:#666;font-size:13px">Received ${escapeHtml(receivedAt)} · auth: ${escapeHtml(authState)}</p>
        <table style="border-collapse:collapse;font-size:14px;border:1px solid #eee">${rows || '<tr><td style="padding:8px">(no fields received)</td></tr>'}</table>
      </div>`;
    try {
      const send = (from: string) =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [ownerEmail], subject, html: emailHtml }),
        });
      let res = await send(resendFrom);
      // Fall back to Resend's shared sender if the custom domain isn't verified yet.
      if (!res.ok && resendFrom !== 'MannyKnows <onboarding@resend.dev>') {
        console.error('[twilio-compliance] Resend rejected, retrying with shared sender:', res.status, await res.text());
        res = await send('MannyKnows <onboarding@resend.dev>');
      }
      if (res.ok) console.log('[twilio-compliance] owner notified');
      else console.error('[twilio-compliance] email failed:', res.status, await res.text());
    } catch (e) {
      console.error('[twilio-compliance] email error:', e);
    }
  }

  // Always 200 so Twilio marks the callback as delivered (non-2xx triggers retries).
  return new Response(
    JSON.stringify({ ok: true, status: status || null, bundleSid: bundleSid || null, receivedAt }),
    { status: 200, headers: JSON_HEADERS },
  );
};
