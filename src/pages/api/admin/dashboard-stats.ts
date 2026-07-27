// Dashboard Stats API
// GET: Returns pipeline counts for leads, quotes, projects, crew
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available',
        debug: {
          hasEnv: !!env,
          hasDb: false,
          envKeys: env ? Object.keys(env) : []
        }
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize counts
    const leadCounts = { pending_confirmation: 0, confirmed: 0, promoted: 0, won: 0, failed: 0 };
    const quoteCounts = { draft: 0, sent: 0, accepted: 0, declined: 0, project: 0 };
    const projectCounts = { needs_crew: 0, ready_to_start: 0, in_progress: 0, completed: 0, portfolio: 0 };
    const crewCounts = { active: 0, inactive: 0 };

    // Track raw query results for debugging
    const debug: any = { queries: {} };

    // Get lead counts by status
    const leadResults = await db.prepare(`
      SELECT status, COUNT(*) as count FROM leads GROUP BY status
    `).all();
    debug.queries.leads = leadResults?.results || [];
    for (const row of (leadResults?.results || []) as Array<{ status: string; count: number }>) {
      if (row.status && row.status in leadCounts) {
        leadCounts[row.status as keyof typeof leadCounts] = row.count;
      }
    }

    // Get quote counts by status
    const quoteResults = await db.prepare(`
      SELECT status, COUNT(*) as count FROM quotes GROUP BY status
    `).all();
    debug.queries.quotes = quoteResults?.results || [];
    for (const row of (quoteResults?.results || []) as Array<{ status: string; count: number }>) {
      if (row.status && row.status in quoteCounts) {
        quoteCounts[row.status as keyof typeof quoteCounts] = row.count;
      }
    }

    // Get project counts by status, splitting needs_crew by crew assignment
    const projectResults = await db.prepare(`
      SELECT status,
             CASE WHEN status = 'needs_crew' AND crew_lead_id IS NOT NULL THEN 'ready_to_start'
                  ELSE status END as effective_status,
             COUNT(*) as count
      FROM projects
      GROUP BY effective_status
    `).all();
    debug.queries.projects = projectResults?.results || [];
    for (const row of (projectResults?.results || []) as Array<{ effective_status: string; count: number }>) {
      if (row.effective_status && row.effective_status in projectCounts) {
        projectCounts[row.effective_status as keyof typeof projectCounts] = row.count;
      }
    }

    // Get crew counts by active status
    const crewResults = await db.prepare(`
      SELECT active, COUNT(*) as count FROM crew_leads GROUP BY active
    `).all();
    debug.queries.crew = crewResults?.results || [];
    for (const row of (crewResults?.results || []) as Array<{ active: number; count: number }>) {
      if (row.active === 1) {
        crewCounts.active = row.count;
      } else {
        crewCounts.inactive = row.count;
      }
    }

    // Calculate totals
    const totals = {
      leads: leadCounts.pending_confirmation + leadCounts.confirmed,
      quotes: quoteCounts.draft + quoteCounts.sent + quoteCounts.accepted + quoteCounts.declined,
      projects: projectCounts.needs_crew + projectCounts.ready_to_start + projectCounts.in_progress + projectCounts.completed,
      crew: crewCounts.active
    };

    // Pipeline summary
    const pipeline = {
      readyForQuote: leadCounts.confirmed,
      awaitingResponse: quoteCounts.sent,
      readyForProject: quoteCounts.accepted,
      inProgress: projectCounts.in_progress
    };

    return new Response(JSON.stringify({
      success: true,
      leadCounts,
      quoteCounts,
      projectCounts,
      crewCounts,
      totals,
      pipeline,
      debug
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
