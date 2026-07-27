// Proxy contract PDF through main domain to avoid cross-origin framing issues
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { token } = params;
  const env = cfEnv;
  const db = env?.MK_APP_DB;

  if (!token || !db) {
    return new Response('Not found', { status: 404 });
  }

  // Look up quote by token
  const quote = await db.prepare(
    'SELECT contract_url FROM quotes WHERE quote_token = ?'
  ).bind(token).first() as { contract_url?: string } | null;

  if (!quote?.contract_url) {
    return new Response('Contract not found', { status: 404 });
  }

  // Fetch the PDF from R2/images domain
  try {
    const pdfResponse = await fetch(quote.contract_url);
    if (!pdfResponse.ok) {
      return new Response('Failed to load contract', { status: 502 });
    }

    const pdfBody = pdfResponse.body;
    return new Response(pdfBody, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=3600',
      }
    });
  } catch {
    return new Response('Failed to load contract', { status: 502 });
  }
};
