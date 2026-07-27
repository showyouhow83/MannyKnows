// Receives RAW RFC-822 email bytes from the worker's Email Routing handler
// (injected by scripts/post-build.js). This is the SLPainting-proven reply
// pipeline: Cloudflare Email Routing → email() handler → this endpoint →
// postal-mime parse → thread onto the quote's Messages.
//
// Auth: X-Inbound-Secret must match env.INBOUND_EMAIL_SECRET.
// Headers: X-Mail-From / X-Mail-To carry the SMTP envelope addresses.
import type { APIRoute } from "astro";
import { parseRawInbound, threadCustomerReply } from "../../lib/inboundReply";
import { timingSafeEqual } from "../../lib/adminAuth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const env = locals.runtime.env;

	const expected = env.INBOUND_EMAIL_SECRET;
	const provided = request.headers.get("x-inbound-secret") || "";
	if (!expected || !(await timingSafeEqual(provided, expected))) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const mailFrom = request.headers.get("x-mail-from") || "";
	const mailTo = request.headers.get("x-mail-to") || "";
	console.log(`[inbound-raw] from=${mailFrom} to=${mailTo}`);

	const rawBytes = await request.arrayBuffer();
	if (rawBytes.byteLength === 0 || rawBytes.byteLength > 40 * 1024 * 1024) {
		return Response.json({ error: "Invalid raw size" }, { status: 400 });
	}

	const parsed = await parseRawInbound(rawBytes);

	// Reply token from the envelope recipient: reply+<token>@…
	const tokenMatch = /reply\+([A-Za-z0-9_-]+)@/i.exec(mailTo);
	if (!tokenMatch) {
		console.warn("[inbound-raw] no reply token in recipient:", mailTo);
		return Response.json({ ok: true, skipped: "no token" });
	}

	// Sender display name from the parsed From header when available.
	const { default: PostalMime } = await import("postal-mime");
	let fromName: string | null = null;
	try {
		const meta = await PostalMime.parse(rawBytes.slice(0, 64 * 1024));
		fromName = (meta.from?.name || "").trim() || null;
	} catch {}

	const subjectMatch = /^Subject:\s*(.+)$/im.exec(
		new TextDecoder().decode(rawBytes.slice(0, 8 * 1024)),
	);
	const subject = subjectMatch ? subjectMatch[1].trim() : "Customer Reply";

	const result = await threadCustomerReply(env, tokenMatch[1], {
		fromAddr: mailFrom,
		fromName,
		subject,
		parsed,
	});

	if (!result.handled) {
		console.warn("[inbound-raw] token matched no quote/project:", tokenMatch[1]);
		return Response.json({ ok: true, skipped: "unknown token" });
	}
	return Response.json({ ok: true, threaded: true, degraded: result.degraded });
};
