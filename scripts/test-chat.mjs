#!/usr/bin/env node
/**
 * Manny chat lead-flow tester.
 * ------------------------------------------------------------------
 * Runs a scripted "warm lead" conversation against the chat endpoint and checks
 * that Manny actually BOOKS a discovery call (the schedule_discovery_call tool
 * fires → a lead is captured in KV + an owner notification is attempted).
 *
 * Usage:
 *   1) Start the worker locally with your secrets in .dev.vars
 *      (GEMINI_API_KEY, RESEND_API_KEY, KV bindings):
 *        npx wrangler dev
 *   2) In another terminal:
 *        npm run test:chat            # defaults to http://localhost:8787
 *        npm run test:chat -- --url https://your-deployed-site.com
 *
 * It prints the full transcript and a PASS/FAIL on whether a booking happened.
 */
const argUrl = (() => {
  const i = process.argv.indexOf('--url');
  return i !== -1 ? process.argv[i + 1] : undefined;
})();
const BASE = (argUrl || process.env.CHAT_URL || 'http://localhost:8787').replace(/\/+$/, '');

// A realistic warm-lead script for MannyKnows (local contractor, wants leads).
const SCRIPT = [
  "Hey — my contractor website never gets me any calls. I'm based in Springfield MA.",
  "Yeah, getting leads is the main problem. What would you actually do about it?",
  "Sounds good, let's set up a call. I'm John Carpenter, john@example.com, flexible this week.",
];

async function main() {
  const sessionId = globalThis.crypto?.randomUUID?.() || `test-${Date.now()}`;
  console.log(`Testing Manny chat at ${BASE}\nsession: ${sessionId}\n${'-'.repeat(52)}`);

  // 1) Obtain a CSRF token (the widget does this before sending).
  let csrf = '';
  try {
    const r = await fetch(`${BASE}/api/chat?session_id=${sessionId}`, { headers: { Origin: BASE } });
    const j = await r.json().catch(() => ({}));
    csrf = j.csrf_token || '';
    console.log(csrf ? '✓ Got CSRF token' : `✗ No csrf_token in GET response (HTTP ${r.status})`);
  } catch (e) {
    console.error(`✗ Could not reach ${BASE}. Is the worker running?\n  ${e.message}`);
    process.exit(1);
  }

  const history = [];
  let lastReply = '';
  for (const message of SCRIPT) {
    console.log(`\n🧑  ${message}`);
    let reply, status;
    try {
      const r = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: BASE },
        body: JSON.stringify({ message, session_id: sessionId, csrf_token: csrf, conversation_history: history }),
      });
      status = r.status;
      const j = await r.json().catch(() => ({}));
      reply = j.finalResponse || j.reply;
    } catch (e) {
      console.error(`   ✗ request failed: ${e.message}`);
      process.exit(1);
    }
    lastReply = reply || `(no reply — HTTP ${status})`;
    console.log(`🤖  ${lastReply}`);
    history.push({ role: 'user', content: message }, { role: 'assistant', content: lastReply });
  }

  // A successful booking returns a tracking reference (UUID) in the reply.
  const booked = /reference/i.test(lastReply) || /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(lastReply);
  console.log('\n' + '='.repeat(52));
  if (booked) {
    console.log('✅ PASS — Manny booked a discovery call. A lead should now be in KV');
    console.log('   (check GET /api/meetings-admin) and an owner email attempted.');
  } else {
    console.log('⚠️  NO BOOKING DETECTED — Manny replied but did not call');
    console.log('   schedule_discovery_call. Review the transcript above; the model');
    console.log('   may need a nudge in the system prompt, or the provider/tool wiring.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
