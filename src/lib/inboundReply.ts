// Shared inbound-reply pipeline: parse a raw RFC-822 email, resolve the
// reply+<token> thread, store the customer message (+ attachments mirrored
// to R2), and alert the admin. Used by BOTH inbound paths:
//   - /api/inbound      (Resend email.received webhook, send.mannyknows.com)
//   - /api/inbound-raw  (Cloudflare Email Routing worker handler, reply.mannyknows.com)

export type ParsedInbound = {
	text: string | null;
	html: string | null;
	attachments: Array<{ filename: string; contentType: string; data: ArrayBuffer }>;
};

/** Parse raw RFC-822 bytes with postal-mime → text/html/attachment bytes. */
export async function parseRawInbound(rawBytes: ArrayBuffer): Promise<ParsedInbound> {
	const { default: PostalMime } = await import("postal-mime");
	const parsed = await PostalMime.parse(rawBytes);
	const attachments = (parsed.attachments || [])
		.filter((a: any) => a && a.content)
		.map((a: any) => ({
			filename: String(a.filename || "attachment"),
			contentType: String(a.mimeType || "application/octet-stream"),
			data: a.content as ArrayBuffer,
		}));
	console.log(
		`[inboundReply] MIME parsed: text=${parsed.text?.length ?? 0} html=${parsed.html?.length ?? 0} attachments=${attachments.length}`,
	);
	return { text: parsed.text ?? null, html: parsed.html ?? null, attachments };
}

/** Trim quoted history from a reply body (keep only the new text). */
export function stripQuotedReply(text: string): string {
	// Gmail often wraps "On <date> <sender> wrote:" across TWO lines — cut at
	// the first such block (multiline-tolerant) before the line-based pass.
	const wroteBlock = /(^|\n)On [\s\S]{0,400}?wrote:\s*\n?/.exec(text);
	if (wroteBlock && wroteBlock.index > 0) {
		text = text.slice(0, wroteBlock.index);
	}
	const lines = text.split("\n");
	const result: string[] = [];
	for (const line of lines) {
		if (/^On .+ wrote:\s*$/i.test(line)) break;
		if (/^-{5,}\s*(Forwarded|Original)\s+message/i.test(line)) break;
		if (line.startsWith(">") && result.some((l) => l.trim())) break;
		if (/^From:\s+/i.test(line) && result.some((l) => l.trim())) break;
		result.push(line);
	}
	const out = result.join("\n").trim();
	return out || text.trim();
}

/** HTML → readable reply text with the quoted thread removed. */
export function htmlToReplyText(h: string): string {
	return h
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<div[^>]*class="[^"]*gmail_quote[^"]*"[\s\S]*$/i, " ")
		.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, " ")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div)>/gi, "\n")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/[ \t]+/g, " ")
		.replace(/\n{3,}/g, "\n\n");
}

/**
 * Store a customer reply on its quote/project message thread.
 * handled=false → token matched nothing (caller decides fallback).
 * degraded=true → stored, but no body AND no attachments were extractable.
 */
export async function threadCustomerReply(
	env: Env,
	token: string,
	msg: {
		fromAddr: string;
		fromName?: string | null;
		subject: string;
		parsed: ParsedInbound | null;
	},
): Promise<{ handled: boolean; degraded: boolean; quoteId?: number }> {
	const db = env.MK_APP_DB;
	if (!db) return { handled: false, degraded: false };

	// Resolve the thread: quote_token first, then a project's client_token.
	let quoteId: number | null = null;
	let leadId: number | null = null;
	const quote = (await db
		.prepare("SELECT id, lead_id FROM quotes WHERE quote_token = ?")
		.bind(token)
		.first()) as { id: number; lead_id: number | null } | null;
	if (quote) {
		quoteId = quote.id;
		leadId = quote.lead_id ?? null;
	} else {
		const project = (await db
			.prepare("SELECT quote_id FROM projects WHERE client_token = ?")
			.bind(token)
			.first()) as { quote_id: number | null } | null;
		if (project?.quote_id) {
			quoteId = project.quote_id;
			const q = (await db
				.prepare("SELECT lead_id FROM quotes WHERE id = ?")
				.bind(project.quote_id)
				.first()) as { lead_id: number | null } | null;
			leadId = q?.lead_id ?? null;
		}
	}
	if (!quoteId) return { handled: false, degraded: false };

	const text = msg.parsed?.text ?? null;
	const html = msg.parsed?.html ?? null;
	const textSource = text && text.trim() ? text : "";
	const htmlSource = !textSource && html && html.trim() ? htmlToReplyText(html) : "";
	const rawText = textSource || htmlSource;
	console.log(
		`[inboundReply] body sources: text=${text?.length ?? "null"} html=${html?.length ?? "null"} used=${textSource ? "text" : htmlSource ? "html" : "none"}`,
	);
	const bodyText = stripQuotedReply(rawText || "").slice(0, 10000) || "(empty reply)";

	// Sender name: explicit > parsed from "Name <email>" > address.
	const fromParsed = /^(.*?)\s*<([^>]+)>\s*$/.exec(msg.fromAddr);
	const senderName =
		(msg.fromName || "").trim() ||
		(fromParsed?.[1] || "").replace(/^"|"$/g, "").trim() ||
		msg.fromAddr;
	const senderEmail = fromParsed?.[2] || msg.fromAddr;

	// Mirror attachment bytes into R2 (permanent, on our media host).
	const stored: Array<{ url: string; name: string; type: string; size?: number }> = [];
	try {
		const bucket = env.MK_MEDIA_BUCKET;
		const atts = msg.parsed?.attachments ?? [];
		if (bucket && atts.length > 0) {
			for (const a of atts.slice(0, 10)) {
				if (!a.data || a.data.byteLength === 0) continue;
				if (a.data.byteLength > 50 * 1024 * 1024) continue;
				const safeName = a.filename.replace(/[^\w.-]+/g, "_").slice(-120);
				const key = `message-attachments/${Date.now()}-${safeName}`;
				await bucket.put(key, a.data, { httpMetadata: { contentType: a.contentType } });
				stored.push({
					url: `https://images.mannyknows.com/${key}`,
					name: a.filename,
					type: a.contentType,
					size: a.data.byteLength,
				});
			}
		}
	} catch (e) {
		console.error("[inboundReply] attachment mirror failed:", e);
	}

	await db
		.prepare(
			`INSERT INTO messages (lead_id, quote_id, subject, body, sender_type, sender_name, sender_email, recipient_email, recipient_name, status, attachments)
			 VALUES (?, ?, ?, ?, 'customer', ?, ?, 'mm@mannyknows.com', 'MannyKnows', 'received', ?)`,
		)
		.bind(
			leadId,
			quoteId,
			msg.subject || "Customer Reply",
			bodyText,
			senderName,
			senderEmail,
			stored.length ? JSON.stringify(stored) : null,
		)
		.run();

	// No email on a successful thread — the admin IS the record (unread badge
	// + bell surface it). Only the degraded path produces email (the caller's
	// raw forward to hire-us@), so nothing is ever silently lost.
	const degraded = bodyText === "(empty reply)" && stored.length === 0;
	console.log(
		`[inboundReply] threaded onto quote ${quoteId} from ${senderEmail} (degraded=${degraded})`,
	);
	return { handled: true, degraded, quoteId };
}
