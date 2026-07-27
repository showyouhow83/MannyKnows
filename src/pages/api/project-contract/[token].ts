// Proxy project contract PDF through main domain (avoid cross-origin iframe block)
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

  const project = await db.prepare(
    'SELECT project_contract_url FROM projects WHERE client_token = ?'
  ).bind(token).first() as { project_contract_url?: string } | null;

  if (!project?.project_contract_url) {
    return new Response('Contract not found', { status: 404 });
  }

  try {
    const pdfResponse = await fetch(project.project_contract_url);
    if (!pdfResponse.ok) {
      return new Response('Failed to load contract', { status: 502 });
    }
    return new Response(pdfResponse.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=3600',
      }
    });
  } catch {
    return new Response('Failed to load contract', { status: 502 });
  }
};
