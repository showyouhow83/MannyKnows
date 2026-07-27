// Project Concierge — a dedicated, project-aware Remi for the CUSTOMER PORTAL.
//
// Separate from the marketing /api/chat (lead capture). This one is for an
// already-won client: it greets them by name, knows their project (scope,
// colors still needed, payment schedule, dates), answers questions, and can
// RECORD their color choices + preferred payment meeting times directly
// (tool calls write to project_colors / payment_availability).
//
// Auth: the client_token (the /project/<token> URL token). All writes are
// scoped to that one project.
import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function safeParse<T>(raw: unknown, fallback: T): T {
  try { return JSON.parse((raw as string) || ''); } catch { return fallback; }
}

function fmtMoney(n: unknown): string {
  return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(s: unknown): string {
  if (!s) return '';
  try { return new Date(String(s).split(/[\sT]/)[0] + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  catch { return String(s); }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const db = env?.MK_APP_DB;
    if (!db) return json({ success: false, error: 'Unavailable' }, 503);
    const apiKey = env?.GEMINI_API_KEY;
    if (!apiKey) return json({ success: false, error: 'AI not configured' }, 503);

    const body = await request.json().catch(() => ({})) as { token?: string; message?: string; history?: any[] };
    const token = (body.token || '').trim();
    const message = (body.message || '').trim();
    if (!token) return json({ success: false, error: 'Not authorized' }, 403);
    if (!message) return json({ success: false, error: 'Message required' }, 400);
    if (message.length > 1500) return json({ success: false, error: 'Message too long' }, 400);

    // Resolve the project from the client_token.
    const project = await db.prepare(
      `SELECT p.id, p.quote_id, p.project_number, p.customer_name, p.status,
              p.services, p.scope_description, p.scheduled_start, p.scheduled_end,
              p.total, p.started_at, p.completed_at, p.colors_locked,
              cl.name AS crew_lead_name
       FROM projects p
       LEFT JOIN crew_leads cl ON p.crew_lead_id = cl.id
       WHERE p.client_token = ?`
    ).bind(token).first() as any;
    if (!project) return json({ success: false, error: 'Not authorized' }, 403);

    const contract = await db.prepare(
      'SELECT id, scopes, payment_schedule, status, start_date, total, down_payment_percent, signed_at, warranty_months FROM project_contracts WHERE project_id = ? LIMIT 1'
    ).bind(project.id).first() as any;

    // Recent crew/admin progress notes (last 5 with non-empty notes).
    const updatesRes = await db.prepare(
      `SELECT note, posted_by_name, posted_by, created_at FROM project_updates
       WHERE project_id = ? AND note IS NOT NULL AND TRIM(note) != ''
       ORDER BY created_at DESC LIMIT 5`
    ).bind(project.id).all().catch(() => ({ results: [] })) as any;
    const recentUpdates: { note: string; by: string; at: string }[] = (updatesRes.results || []).map((r: any) => ({
      note: r.note, by: r.posted_by_name || r.posted_by || 'Team', at: r.created_at || '',
    }));

    // The originating quote — used as a fallback for scope + services when the
    // contract isn't built yet, so Remi always knows the project.
    const quote = project.quote_id ? await db.prepare(
      'SELECT services, template_sections, scope_description FROM quotes WHERE id = ?'
    ).bind(project.quote_id).first().catch(() => null) as any : null;

    // Scope source: prefer the contract's scopes, fall back to the quote's.
    let scopes = contract ? safeParse<any[]>(contract.scopes, []) : [];
    if (!scopes.length && quote) scopes = safeParse<any[]>(quote.template_sections, []);

    // Human-readable service type(s) from the project (or quote) services JSON.
    function servicesLabel(raw: unknown): string {
      const map: Record<string, string> = { interior: 'Interior Painting', exterior: 'Exterior Painting', both: 'Interior & Exterior Painting', cabinet: 'Cabinet Refinishing', deck: 'Deck Staining', roof: 'Roof Painting', powerwash: 'Power Washing', general: 'Painting' };
      let arr: any[] = safeParse<any[]>(raw, []);
      if (!Array.isArray(arr)) arr = [];
      const labels = arr.map((s: any) => map[String(s?.type || s || '').toLowerCase()] || (s?.type || s)).filter(Boolean);
      return labels.length ? Array.from(new Set(labels)).join(', ') : '';
    }
    const projServices = servicesLabel(project.services) || servicesLabel(quote?.services) || '';
    const projScopeDesc = project.scope_description || quote?.scope_description || '';

    // A readable scope-of-work summary (section titles + their bullets/notes).
    const scopeSummary = scopes.map((sc: any) => {
      const secs = (sc.sections || []).map((se: any) => {
        const lines = (se.items || [])
          .filter((it: any) => it.type === 'bullet' || it.type === 'note')
          .map((it: any) => `    • ${it.text}`).join('\n');
        return `  ${se.title || 'Section'}${lines ? '\n' + lines : ''}`;
      }).join('\n');
      return `${sc.title || 'Scope'}\n${secs}`;
    }).join('\n').slice(0, 3000);
    const savedColorsRes = await db.prepare(
      'SELECT item_id, color_value FROM project_colors WHERE project_id = ?'
    ).bind(project.id).all().catch(() => ({ results: [] }));
    const savedColors: Record<string, string> = {};
    for (const r of ((savedColorsRes as any).results || [])) savedColors[r.item_id] = r.color_value || '';

    const colorItems: { id: string; label: string; filled: boolean; value: string }[] = [];
    const choiceItems: { id: string; label: string; options: string[]; value: string }[] = [];
    for (const sc of scopes) {
      for (const sec of (sc.sections || [])) {
        for (const it of (sec.items || [])) {
          const cur = savedColors[it.id] || it.value || '';
          if (it.type === 'fillable' || it.type === 'paint_line') {
            colorItems.push({ id: it.id, label: it.label || 'Color', filled: !!String(cur).trim(), value: String(cur) });
          } else if (it.type === 'choice' && Array.isArray(it.options) && it.options.filter(Boolean).length) {
            choiceItems.push({ id: it.id, label: it.label || 'Choice', options: it.options.filter(Boolean), value: String(cur) });
          }
        }
      }
    }

    // Payment rows + paid/pending state.
    const sched = contract ? safeParse<any[]>(contract.payment_schedule, []) : [];
    const receiptsRes = await db.prepare(
      'SELECT row_id FROM payment_receipts WHERE project_contract_id = ?'
    ).bind(contract?.id || 0).all().catch(() => ({ results: [] }));
    const paidRows = new Set(((receiptsRes as any).results || []).map((r: any) => r.row_id));
    const payRows = sched.map((r: any) => ({
      id: r.id, label: r.label || r.kind || 'Payment', amount: Number(r.amount) || 0,
      due: r.due_date || '', paid: paidRows.has(r.id),
    }));

    const firstName = String(project.customer_name || '').trim().split(/\s+/)[0] || 'there';
    const startDate = contract?.start_date || project.scheduled_start || '';
    const endDate = project.scheduled_end || '';

    // Mirror the exact status labels shown on the client portal page so Remi
    // never contradicts what the customer sees on-screen.
    const hasCrewAssigned = !!(project as any).crew_lead_name;
    const statusDescriptions: Record<string, string> = {
      needs_crew: hasCrewAssigned
        ? 'Ready to Start — crew has been assigned and the project is confirmed. We will notify you when work begins.'
        : 'Scheduling — we are preparing your project and assigning a crew. Check back here for updates.',
      in_progress: 'In Progress — the crew is actively working on your project.',
      completed: 'Completed — all work is done. Thank you for choosing MannyKnows!',
    };
    const statusLabel = statusDescriptions[String(project.status)] || String(project.status);

    const contractStatusDescriptions: Record<string, string> = {
      pending_signature: 'Sent to customer — awaiting their signature.',
      signed: 'Signed by customer — awaiting contractor countersignature.',
      countersigned: 'Fully executed — signed by both parties.',
      voided: 'Voided.',
    };
    const contractStatusLabel = contract
      ? (contractStatusDescriptions[String(contract.status)] || String(contract.status))
      : null;

    // ── System prompt ────────────────────────────────────────────────────
    const ctx = [
      `Customer: ${project.customer_name} (greet them by first name: ${firstName})`,
      `Project: ${project.project_number} — status: ${statusLabel}`,
      projServices ? `Project type / services: ${projServices}` : '',
      projScopeDesc ? `Scope notes: ${projScopeDesc}` : '',
      scopeSummary ? `Scope of work:\n${scopeSummary}` : '',
      project.total ? `Project total: ${fmtMoney(project.total)}` : '',
      startDate ? `Scheduled start: ${fmtDate(startDate)}` : 'Start date: not yet scheduled',
      endDate ? `Scheduled end: ${fmtDate(endDate)}` : '',
      project.started_at ? `Work started: ${fmtDate(project.started_at)}` : '',
      project.completed_at ? `Work completed: ${fmtDate(project.completed_at)}` : '',
      project.crew_lead_name ? `Assigned crew lead: ${project.crew_lead_name}` : '',
      contractStatusLabel ? `Contract: ${contractStatusLabel}${contract.signed_at ? ` (signed ${fmtDate(contract.signed_at)})` : ''}` : 'Contract: not yet issued',
      contract?.warranty_months ? `Warranty: ${contract.warranty_months} months` : '',
      recentUpdates.length ? `Recent progress notes:\n${recentUpdates.map(u => `  [${u.at.slice(0, 10)}] ${u.by}: ${u.note}`).join('\n')}` : '',
      colorItems.length ? `Colors needed:\n${colorItems.map(c => `  - "${c.label}" [item_id=${c.id}] ${c.filled ? `(provided: ${c.value})` : '(NOT provided yet)'}`).join('\n')}` : 'No color choices on this project.',
      choiceItems.length ? `Choices:\n${choiceItems.map(c => `  - "${c.label}" [item_id=${c.id}] options: ${c.options.join(', ')} ${c.value ? `(chosen: ${c.value})` : '(not chosen)'}`).join('\n')}` : '',
      payRows.length ? `Payments:\n${payRows.map(p => `  - "${p.label}" [row_id=${p.id}] ${fmtMoney(p.amount)} due ${fmtDate(p.due)} — ${p.paid ? 'PAID' : 'pending'}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');

    const systemInstruction = `You are Remi, the friendly project concierge for MannyKnows — talking with an EXISTING customer about THEIR specific project. You are NOT a salesperson: never pitch "free estimates", discounts, or promotions, and never try to book a new appointment.

Greet ${firstName} warmly by first name on your first reply. Keep replies short (2-3 sentences), warm, and helpful. One question at a time.

You can help them:
- Answer questions about their scope of work, timeline/start date, and payments using ONLY the project facts below (don't invent details — if unknown, say you'll have the team follow up).
- Record the colors they choose: when they tell you a color for a specific surface, call record_color_choice with the matching item_id.
- Record a preferred meeting time for a payment (we collect first payments in person): call record_payment_time with the matching row_id. The payment DATE is already set in the contract — you only need a TIME, unless they want a different date (alt_date).
- Proactively (but gently) nudge for colors that are NOT provided yet and for a meeting time on the next pending payment.

PROJECT FACTS:
${ctx}
${(project as any).colors_locked ? '\nNOTE: This customer has FINALIZED and LOCKED their colors into the contract. Do NOT try to record or change colors. If they want a color change, tell them you\'ll have the team reopen their selections.' : ''}

When you record something with a tool, confirm it back in plain language (e.g. "Got it — trim in SW 7008, satin ✓").`;

    // ── Tools ────────────────────────────────────────────────────────────
    const tools = [{
      functionDeclarations: [
        {
          name: 'record_color_choice',
          description: "Save the customer's color choice for one surface/item.",
          parameters: {
            type: 'object',
            properties: {
              item_id: { type: 'string', description: 'The item_id of the color surface (from PROJECT FACTS).' },
              color_code: { type: 'string', description: 'Color code or name, e.g. "SW 7008" or "same as current".' },
              product_type: { type: 'string', description: 'paint or stain (optional).' },
              finish: { type: 'string', description: 'Finish, e.g. Flat, Satin, Semi-gloss (optional).' },
              note: { type: 'string', description: 'Any note, e.g. "accent wall only" (optional).' },
            },
            required: ['item_id', 'color_code'],
          },
        },
        {
          name: 'record_payment_time',
          description: "Save the customer's preferred meeting time (and optional alternate date) for a payment.",
          parameters: {
            type: 'object',
            properties: {
              row_id: { type: 'string', description: 'The row_id of the payment (from PROJECT FACTS).' },
              time: { type: 'string', description: 'Preferred meeting time in 24h HH:MM, e.g. "14:30".' },
              alt_date: { type: 'string', description: 'A different requested date in YYYY-MM-DD (optional).' },
              note: { type: 'string', description: 'Any note (optional).' },
            },
            required: ['row_id'],
          },
        },
      ],
    }];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction, tools: tools as any });
    const history = Array.isArray(body.history)
      ? body.history.filter((m: any) => m && (m.role === 'user' || m.role === 'model') && Array.isArray(m.parts)).slice(-20)
      : [];
    const chat = model.startChat({ history, generationConfig: { temperature: 0.5, maxOutputTokens: 600, thinkingConfig: { thinkingBudget: 0 } } as any });

    const actions: string[] = [];
    let result = await chat.sendMessage(message);
    let loop = 0;
    while (result.response.functionCalls() && result.response.functionCalls()!.length && loop < 5) {
      loop++;
      const calls = result.response.functionCalls() || [];
      const responses: any[] = [];
      for (const call of calls) {
        let output: any = { ok: false, error: 'Unknown tool' };
        const args = (call.args || {}) as any;
        try {
          if (call.name === 'record_color_choice') {
            const item = colorItems.find(c => c.id === args.item_id);
            if ((project as any).colors_locked) output = { ok: false, error: 'Colors are finalized and locked — the customer must contact us to change them.' };
            else if (!item) output = { ok: false, error: 'Unknown item_id' };
            else {
              const pt = args.product_type === 'paint' || args.product_type === 'stain' ? args.product_type : null;
              await db.prepare(`
                INSERT INTO project_colors (project_id, item_id, label, product_type, color_value, finish, note, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT (project_id, item_id) DO UPDATE SET
                  label = excluded.label, product_type = excluded.product_type,
                  color_value = excluded.color_value, finish = excluded.finish, note = excluded.note,
                  updated_at = CURRENT_TIMESTAMP
              `).bind(project.id, item.id, item.label, pt, String(args.color_code || '').slice(0, 300), (args.finish || null), (args.note || null)).run();
              actions.push(`color:${item.label}`);
              output = { ok: true, saved: item.label };
            }
          } else if (call.name === 'record_payment_time') {
            const row = payRows.find(p => String(p.id) === String(args.row_id));
            if (!row || !contract) output = { ok: false, error: 'Unknown row_id' };
            else {
              let time = String(args.time || '').trim(); if (time && !/^\d{1,2}:\d{2}$/.test(time)) time = '';
              if (time && /^\d:\d{2}$/.test(time)) time = '0' + time;
              let date = String(args.alt_date || '').trim(); if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) date = '';
              await db.prepare(`
                INSERT INTO payment_availability (project_contract_id, row_id, available_date, available_time, note, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT (project_contract_id, row_id) DO UPDATE SET
                  available_date = excluded.available_date, available_time = excluded.available_time,
                  note = excluded.note, updated_at = CURRENT_TIMESTAMP
              `).bind(contract.id, row.id, date || null, time || null, (args.note || null)).run();
              actions.push(`payment:${row.label}`);
              output = { ok: true, saved: row.label };
            }
          }
        } catch (e) {
          output = { ok: false, error: 'Save failed' };
        }
        responses.push({ functionResponse: { name: call.name, response: output } });
      }
      result = await chat.sendMessage(responses as any);
    }

    const reply = (result.response.text() || '').trim() || "I'm here to help with your project — what would you like to know?";
    return json({ success: true, reply, actions, savedSomething: actions.length > 0 });
  } catch (e) {
    console.error('[portal/chat] error:', e);
    return json({ success: false, error: 'Something went wrong. Please try again.' }, 500);
  }
};
