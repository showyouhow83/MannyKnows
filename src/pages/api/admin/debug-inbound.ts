// Admin diagnostic: exercises the Resend received-email retrieval pipeline
// live and reports every step. Open in a browser while logged into the admin:
//   https://mannyknows.com/api/admin/debug-inbound/
// Optional: ?email_id=<id> to inspect a specific received email.
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from "astro";
import { AdminAuth } from "../../../lib/adminAuth";
import { parseRawInbound } from "../../../lib/inboundReply";

export const prerender = false;

const RESEND_API = "https://api.resend.com";

export const GET: APIRoute = async ({ request, locals }) => {
	const env = cfEnv;
	const session = await AdminAuth.validateSession(request, env.SESSION_SECRET || env.ADMIN_PASSWORD);
	if (!session.isAuthenticated) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const apiKey = env.RESEND_API_KEY;
	if (!apiKey) return Response.json({ error: "RESEND_API_KEY missing" }, { status: 500 });

	const report: Record<string, unknown> = {};
	const headers = { Authorization: `Bearer ${apiKey}` };

	// 1. List received emails (both candidate endpoints)
	let emailId = new URL(request.url).searchParams.get("email_id") || "";
	for (const path of ["/emails/receiving?limit=5", "/emails/receiving"]) {
		try {
			const res = await fetch(`${RESEND_API}${path}`, { headers });
			const txt = await res.text();
			report[`list ${path}`] = {
				status: res.status,
				body_first_800: txt.slice(0, 800),
			};
			if (res.ok && !emailId) {
				try {
					const parsed = JSON.parse(txt);
					const arr = Array.isArray(parsed) ? parsed : (parsed.data ?? []);
					if (Array.isArray(arr) && arr.length > 0 && arr[0]?.id) {
						emailId = String(arr[0].id);
					}
				} catch {}
			}
			if (res.ok) break;
		} catch (e: any) {
			report[`list ${path}`] = { threw: String(e?.message || e) };
		}
	}
	report.chosen_email_id = emailId || "(none found)";

	// 2. Retrieve that email — show the raw response of each candidate endpoint
	if (emailId) {
		for (const path of [`/emails/receiving/${emailId}`, `/emails/${emailId}`]) {
			try {
				const res = await fetch(`${RESEND_API}${path}`, { headers });
				const txt = await res.text();
				let keys: string[] = [];
				let rawUrl = "";
				try {
					const obj = JSON.parse(txt);
					const inner = obj?.data && typeof obj.data === "object" ? obj.data : obj;
					keys = Object.keys(inner);
					rawUrl = inner?.raw?.download_url || "";
				} catch {}
				report[`get ${path}`] = {
					status: res.status,
					keys,
					has_raw_download_url: Boolean(rawUrl),
					body_first_1200: txt.slice(0, 1200),
				};

				// 3. If a raw URL exists, download + MIME-parse it
				if (rawUrl) {
					try {
						const rawRes = await fetch(rawUrl);
						const rawBytes = rawRes.ok ? await rawRes.arrayBuffer() : null;
						let parsedInfo: Record<string, unknown> = { raw_status: rawRes.status };
						if (rawBytes) {
							const parsed = await parseRawInbound(rawBytes);
							parsedInfo = {
								raw_status: rawRes.status,
								raw_bytes: rawBytes.byteLength,
								text_length: parsed.text?.length ?? 0,
								html_length: parsed.html?.length ?? 0,
								text_first_200: (parsed.text || "").slice(0, 200),
								attachments: parsed.attachments.map((a) => ({
									filename: a.filename,
									type: a.contentType,
									bytes: a.data.byteLength,
								})),
							};
						}
						report.raw_parse = parsedInfo;
					} catch (e: any) {
						report.raw_parse = { threw: String(e?.message || e) };
					}
				}
			} catch (e: any) {
				report[`get ${path}`] = { threw: String(e?.message || e) };
			}
		}
	}

	return new Response(JSON.stringify(report, null, 2), {
		headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
	});
};
