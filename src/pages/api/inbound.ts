import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from "astro";
import { parseRawInbound, threadCustomerReply, type ParsedInbound } from "../../lib/inboundReply";

export const prerender = false;

const FORWARD_TO = "mm@mannyknows.com";
const FORWARD_FROM = "MannyKnows <hello@send.mannyknows.com>";
const RESEND_API = "https://api.resend.com";

const escapeHtml = (s: string) =>
	s.replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
	);

/**
 * Verify a Svix-signed webhook. Resend uses Svix for signing.
 * https://docs.svix.com/receiving/verifying-payloads/how-manual
 */
async function verifySvixSignature(
	secret: string | undefined,
	svixId: string | null,
	svixTimestamp: string | null,
	svixSignature: string | null,
	body: string,
): Promise<boolean> {
	if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

	const tsNum = parseInt(svixTimestamp, 10);
	if (!Number.isFinite(tsNum)) return false;
	const age = Math.abs(Math.floor(Date.now() / 1000) - tsNum);
	if (age > 300) return false; // 5-min replay window

	if (!secret.startsWith("whsec_")) return false;
	const secretB64 = secret.slice("whsec_".length);
	let secretBytes: Uint8Array;
	try {
		secretBytes = Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0));
	} catch {
		return false;
	}

	const key = await crypto.subtle.importKey(
		"raw",
		secretBytes as BufferSource,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signedPayload = `${svixId}.${svixTimestamp}.${body}`;
	const sigBuffer = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(signedPayload),
	);
	const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));

	return svixSignature.split(" ").some((entry) => {
		const [version, sig] = entry.split(",");
		return version === "v1" && sig === expected;
	});
}

type ReceivedEmailMeta = {
	id?: string;
	from?: string;
	to?: string[];
	subject?: string;
	html?: string | null;
	text?: string | null;
	// Received emails carry a link to the raw RFC-822 message; text/html/
	// attachments must be parsed out of it (this is what Resend's own SDK does).
	raw?: { download_url?: string } | null;
};

/** Unwrap `{ data: {...} }`-style envelopes some Resend endpoints use. */
function unwrap<T>(parsed: unknown): T {
	if (
		parsed &&
		typeof parsed === "object" &&
		"data" in (parsed as Record<string, unknown>) &&
		(parsed as Record<string, unknown>).data &&
		typeof (parsed as Record<string, unknown>).data === "object"
	) {
		return (parsed as Record<string, unknown>).data as T;
	}
	return parsed as T;
}

async function fetchReceivedMeta(emailId: string, apiKey: string): Promise<ReceivedEmailMeta | null> {
	for (const path of [`/emails/receiving/${emailId}`, `/emails/${emailId}`]) {
		try {
			const res = await fetch(`${RESEND_API}${path}`, {
				headers: { Authorization: `Bearer ${apiKey}` },
			});
			const bodyTxt = await res.text();
			if (!res.ok) {
				console.error(`[inbound] fetch ${path} -> ${res.status}: ${bodyTxt.slice(0, 200)}`);
				continue;
			}
			const obj = unwrap<ReceivedEmailMeta>(JSON.parse(bodyTxt));
			console.log(`[inbound] fetched ${path} keys=[${Object.keys(obj as object).join(",")}]`);
			return obj;
		} catch (e) {
			console.error(`[inbound] fetch ${path} threw:`, e);
		}
	}
	return null;
}

/**
 * Retrieve a received email's CONTENT. GET /emails/receiving/{id} returns
 * metadata + raw.download_url — download the raw message and parse the MIME
 * with postal-mime (text, html, and attachment bytes), exactly like Resend's
 * own SDK does.
 */
async function fetchParsedInbound(emailId: string, apiKey: string): Promise<ParsedInbound | null> {
	const meta = await fetchReceivedMeta(emailId, apiKey);

	// RAW FIRST: the raw message is the only source that carries attachment
	// bytes. (The receiving endpoint also returns text/html directly, but
	// using those alone would silently drop attachments.)
	const rawUrl = meta?.raw?.download_url;
	if (rawUrl) {
		const rawRes = await fetch(rawUrl);
		if (rawRes.ok) {
			const rawBytes = await rawRes.arrayBuffer();
			console.log(`[inbound] raw email downloaded: ${rawBytes.byteLength} bytes`);
			return parseRawInbound(rawBytes);
		}
		console.error("[inbound] raw download failed:", rawRes.status);
	}

	// Fallback: direct text/html fields (body only — no attachment bytes).
	if (meta && ((meta.text && meta.text.length) || (meta.html && meta.html.length))) {
		console.log("[inbound] using API text/html fields directly (no raw; attachments unavailable)");
		return { text: meta.text ?? null, html: meta.html ?? null, attachments: [] };
	}

	console.error(
		"[inbound] no usable content on received email; keys:",
		meta ? Object.keys(meta).join(",") : "null",
	);
	return null;
}

/** ArrayBuffer → base64 (chunked to stay under call-stack limits). */
function bufToBase64(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	let bin = "";
	const CHUNK = 0x8000;
	for (let i = 0; i < bytes.length; i += CHUNK) {
		bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
	}
	return btoa(bin);
}


export const POST: APIRoute = async ({ request, locals }) => {
	const env = cfEnv;
	const body = await request.text();

	const valid = await verifySvixSignature(
		env.RESEND_WEBHOOK_SECRET,
		request.headers.get("svix-id"),
		request.headers.get("svix-timestamp"),
		request.headers.get("svix-signature"),
		body,
	);
	if (!valid) {
		console.warn("[inbound] signature verification failed");
		return new Response("Invalid signature", { status: 401 });
	}

	let event: { type?: string; data?: Record<string, unknown> };
	try {
		event = JSON.parse(body);
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (event.type !== "email.received") {
		return Response.json({ ok: true, skipped: `event type: ${event.type}` });
	}

	const data = event.data ?? {};
	console.log(`[inbound] event.data keys=[${Object.keys(data).join(",")}]`);
	const emailId = String(data.email_id ?? "");
	const fromAddr = String(data.from ?? "");
	const toAddrs = Array.isArray(data.to) ? (data.to as unknown[]).map(String) : [];
	const subject = String(data.subject ?? "(no subject)");

	// Loop prevention: never re-forward our own outgoing mail
	if (
		/@send\.mannyknows\.com/i.test(fromAddr) ||
		/hire-us@mannyknows\.com/i.test(fromAddr)
	) {
		console.log("[inbound] skipping (loop prevention):", fromAddr);
		return Response.json({ ok: true, skipped: "loop prevention" });
	}

	const apiKey = env.RESEND_API_KEY;
	if (!apiKey || !emailId) {
		console.error("[inbound] missing RESEND_API_KEY or email_id");
		return new Response("Server misconfigured", { status: 500 });
	}

	// Fetch + MIME-parse the full email (body text/html + attachment bytes)
	const parsed = await fetchParsedInbound(emailId, apiKey);
	const html = parsed?.html ?? null;
	const text = parsed?.text ?? null;

	// ── Threaded customer reply? ─────────────────────────────────────────────
	// Messages sent from the admin carry Reply-To: reply+<quote_token>@send.…
	// When the customer replies, store it on the quote's message thread instead
	// of forwarding a loose email — the conversation stays in the admin.
	const replyMatch = toAddrs
		.map((a) => /reply\+([A-Za-z0-9-]+)@(?:send|reply)\.mannyknows\.com/i.exec(a))
		.find(Boolean);
	if (replyMatch) {
		const token = replyMatch[1];
		try {
			const result = await threadCustomerReply(env, token, { fromAddr, subject, parsed });
			if (result.handled && !result.degraded) {
				return Response.json({ ok: true, threaded: true });
			}
			if (result.handled && result.degraded) {
				// Thread row stored but we couldn't extract body/attachments —
				// ALSO forward the raw email so nothing is lost while degraded.
				console.warn("[inbound] threaded reply was empty — forwarding raw email as safety net");
			} else {
				console.warn("[inbound] reply token not matched, falling back to forward:", token);
			}
		} catch (e) {
			console.error("[inbound] reply threading failed, falling back to forward:", e);
		}
	}

	// ── Plain forward to the business inbox ──────────────────────────────────
	const safeFrom = escapeHtml(fromAddr);
	const safeSubject = escapeHtml(subject);
	const safeTo = escapeHtml(toAddrs.join(", "));

	const headerHtml = `
		<div style="font-size: 13px; color: #555; border-bottom: 1px solid #ddd; padding: 0 0 12px; margin: 0 0 16px;">
			<strong>Forwarded message</strong><br>
			From: ${safeFrom}<br>
			To: ${safeTo}<br>
			Subject: ${safeSubject}
		</div>
	`;
	const headerText = `Forwarded message\nFrom: ${fromAddr}\nTo: ${toAddrs.join(", ")}\nSubject: ${subject}\n\n---\n\n`;

	const bodyHtml = html
		? `${headerHtml}${html}`
		: text
			? `${headerHtml}<pre style="white-space:pre-wrap; font-family:inherit;">${escapeHtml(text)}</pre>`
			: `${headerHtml}<p><em>The full message body wasn't available.</em></p>`;
	const bodyText = text
		? `${headerText}${text}`
		: `${headerText}The full message body wasn't available.`;

	// Attach parsed attachment bytes as base64 (Resend send API format).
	// Cap total payload at ~15MB to stay within send limits.
	const sendAttachments: Array<{ filename: string; content: string }> = [];
	let attTotal = 0;
	for (const a of parsed?.attachments ?? []) {
		if (!a.data || a.data.byteLength === 0) continue;
		if (attTotal + a.data.byteLength > 15 * 1024 * 1024) {
			console.warn(`[inbound] forward attachment skipped (size cap): ${a.filename}`);
			continue;
		}
		attTotal += a.data.byteLength;
		sendAttachments.push({ filename: a.filename, content: bufToBase64(a.data) });
	}

	const sendBody: Record<string, unknown> = {
		from: FORWARD_FROM,
		to: FORWARD_TO,
		reply_to: fromAddr || undefined,
		subject: `[Fwd] ${subject}`,
		html: bodyHtml,
		text: bodyText,
	};
	if (sendAttachments.length > 0) {
		sendBody.attachments = sendAttachments;
	}

	const res = await fetch(`${RESEND_API}/emails`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(sendBody),
	});

	if (!res.ok) {
		const errText = await res.text();
		console.error("[inbound] forward failed:", res.status, errText);
		return Response.json({ ok: false, error: "Forward failed" }, { status: 502 });
	}

	return Response.json({
		ok: true,
		attachments_forwarded: sendAttachments.length,
	});
};
