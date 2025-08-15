import type { APIRoute } from 'astro';

export const prerender = false;

// This endpoint has been disabled. Google Calendar integration was removed.
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: false, error: 'calendar-health removed: Google Calendar integration has been decommissioned.' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST = GET;
