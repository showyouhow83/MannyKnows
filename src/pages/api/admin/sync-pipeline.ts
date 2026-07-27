// Admin Pipeline Sync API
// Repairs data integrity issues where statuses are out of sync across leads/quotes/projects
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

interface SyncResult {
  quotesFixed: number;
  leadsPromotedFixed: number;
  leadsWonFixed: number;
  details: string[];
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
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
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result: SyncResult = {
      quotesFixed: 0,
      leadsPromotedFixed: 0,
      leadsWonFixed: 0,
      details: []
    };

    // 1. Fix quotes that have projects but aren't marked as 'project' status
    // Find quotes where a project exists but quote status isn't 'project'
    const quotesWithProjects = await db.prepare(`
      SELECT q.id, q.quote_number, q.status, p.id as project_id, p.status as project_status
      FROM quotes q
      INNER JOIN projects p ON p.quote_id = q.id
      WHERE q.status != 'project'
    `).all();

    for (const row of quotesWithProjects.results as any[]) {
      await db.prepare(
        "UPDATE quotes SET status = 'project', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(row.id).run();
      result.quotesFixed++;
      result.details.push(`Quote ${row.quote_number}: ${row.status} -> project (has project ${row.project_id})`);
    }

    // 2. Fix leads that have quotes but aren't marked as 'promoted'
    // Find leads where a quote exists but lead status isn't 'promoted', 'won', or 'failed'
    const leadsWithQuotes = await db.prepare(`
      SELECT l.id, l.confirmation_code, l.status, q.id as quote_id, q.quote_number
      FROM leads l
      INNER JOIN quotes q ON q.lead_id = l.id
      WHERE l.status NOT IN ('promoted', 'won', 'failed')
    `).all();

    for (const row of leadsWithQuotes.results as any[]) {
      await db.prepare(
        "UPDATE leads SET status = 'promoted', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(row.id).run();
      result.leadsPromotedFixed++;
      result.details.push(`Lead ${row.confirmation_code}: ${row.status} -> promoted (has quote ${row.quote_number})`);
    }

    // 3. Fix leads that have portfolio projects but aren't marked as 'won'
    const leadsWithPortfolio = await db.prepare(`
      SELECT l.id, l.confirmation_code, l.status, p.id as project_id, p.project_number
      FROM leads l
      INNER JOIN quotes q ON q.lead_id = l.id
      INNER JOIN projects p ON p.quote_id = q.id
      WHERE p.status = 'portfolio' AND l.status != 'won'
    `).all();

    for (const row of leadsWithPortfolio.results as any[]) {
      await db.prepare(
        "UPDATE leads SET status = 'won', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(row.id).run();
      result.leadsWonFixed++;
      result.details.push(`Lead ${row.confirmation_code}: ${row.status} -> won (has portfolio project ${row.project_number})`);
    }

    const totalFixed = result.quotesFixed + result.leadsPromotedFixed + result.leadsWonFixed;

    console.log(`[Sync] Pipeline sync completed: ${totalFixed} records fixed`);
    if (result.details.length > 0) {
      console.log(`[Sync] Details:\n${result.details.join('\n')}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: totalFixed > 0
        ? `Pipeline synced: ${totalFixed} records fixed`
        : 'Pipeline is already in sync',
      ...result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error syncing pipeline:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to sync pipeline'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET: Preview what would be fixed (dry run)
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
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
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const issues: any[] = [];

    // 1. Find quotes that have projects but aren't marked as 'project' status
    const quotesWithProjects = await db.prepare(`
      SELECT q.id, q.quote_number, q.customer_name, q.status as quote_status,
             p.id as project_id, p.status as project_status
      FROM quotes q
      INNER JOIN projects p ON p.quote_id = q.id
      WHERE q.status != 'project'
    `).all();

    for (const row of quotesWithProjects.results as any[]) {
      issues.push({
        type: 'quote_status_mismatch',
        entity: 'quote',
        id: row.id,
        identifier: row.quote_number,
        customer_name: row.customer_name,
        current_status: row.quote_status,
        should_be: 'project',
        reason: `Has project ${row.project_id} with status '${row.project_status}'`
      });
    }

    // 2. Find leads that have quotes but aren't marked appropriately
    const leadsWithQuotes = await db.prepare(`
      SELECT l.id, l.confirmation_code, l.customer_name, l.status as lead_status,
             q.id as quote_id, q.quote_number, q.status as quote_status
      FROM leads l
      INNER JOIN quotes q ON q.lead_id = l.id
      WHERE l.status NOT IN ('promoted', 'won', 'failed')
    `).all();

    for (const row of leadsWithQuotes.results as any[]) {
      issues.push({
        type: 'lead_status_mismatch',
        entity: 'lead',
        id: row.id,
        identifier: row.confirmation_code,
        customer_name: row.customer_name,
        current_status: row.lead_status,
        should_be: 'promoted',
        reason: `Has quote ${row.quote_number} with status '${row.quote_status}'`
      });
    }

    // 3. Find leads that have portfolio projects but aren't marked as 'won'
    const leadsWithPortfolio = await db.prepare(`
      SELECT l.id, l.confirmation_code, l.customer_name, l.status as lead_status,
             p.id as project_id, p.project_number
      FROM leads l
      INNER JOIN quotes q ON q.lead_id = l.id
      INNER JOIN projects p ON p.quote_id = q.id
      WHERE p.status = 'portfolio' AND l.status != 'won'
    `).all();

    for (const row of leadsWithPortfolio.results as any[]) {
      issues.push({
        type: 'lead_won_mismatch',
        entity: 'lead',
        id: row.id,
        identifier: row.confirmation_code,
        customer_name: row.customer_name,
        current_status: row.lead_status,
        should_be: 'won',
        reason: `Has portfolio project ${row.project_number}`
      });
    }

    return new Response(JSON.stringify({
      success: true,
      issues,
      total_issues: issues.length,
      message: issues.length > 0
        ? `Found ${issues.length} data integrity issues. POST to this endpoint to fix them.`
        : 'No data integrity issues found'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking pipeline sync:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to check pipeline sync'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
