// Admin Migration Runner
// Executes bundled D1 migration files from inside the deployed worker, so
// migrations can be applied without wrangler or console-pasting SQL.
// - Admin session required (middleware also gates /api/admin/*)
// - GET  -> lists available migrations + parsed statement counts (dry info)
// - POST { file, from? } -> runs that migration; resumable via `from` index
//
// Files are bundled at build time via Vite ?raw imports — add new migrations
// to the MIGRATIONS map below when they land in database/migrations/.
import type { APIRoute } from 'astro';
import { AdminAuth, viewerGuard } from '../../../lib/adminAuth';
// @ts-ignore - Vite raw import
import sql002 from '../../../../database/migrations/002-full-admin.sql?raw';

const MIGRATIONS: Record<string, string> = {
  '002-full-admin': sql002 as unknown as string,
};

// Split a SQL file into executable statements: strips `--` line comments,
// then splits on `;` outside single-quoted strings. No trigger/BEGIN-END
// support needed (none in our migrations).
function splitSql(sql: string): string[] {
  const noComments = sql
    .split('\n')
    .map((line) => {
      // Preserve `--` inside string literals by only stripping when we're
      // not inside quotes up to that point on the line.
      let inStr = false;
      for (let i = 0; i < line.length - 1; i++) {
        if (line[i] === "'") inStr = !inStr;
        else if (!inStr && line[i] === '-' && line[i + 1] === '-') {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join('\n');

  const statements: string[] = [];
  let current = '';
  let inStr = false;
  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    if (ch === "'") inStr = !inStr;
    if (ch === ';' && !inStr) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function requireAdmin(request: Request, env: any): Promise<Response | null> {
  const session = await AdminAuth.validateSession(request, env?.SESSION_SECRET || env?.ADMIN_PASSWORD);
  if (!session.isAuthenticated) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const guard = viewerGuard(session);
  if (guard) return guard;
  return null;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const files = Object.entries(MIGRATIONS).map(([name, sql]) => ({
    name,
    statements: splitSql(sql).length,
    bytes: sql.length,
  }));
  return Response.json({ success: true, migrations: files });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const db = env?.MK_APP_DB;
  if (!db) return Response.json({ success: false, error: 'MK_APP_DB not bound' }, { status: 503 });

  let body: { file?: string; from?: number };
  try { body = await request.json() as any; } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const sql = MIGRATIONS[body.file || ''];
  if (!sql) {
    return Response.json({
      success: false,
      error: `Unknown migration. Available: ${Object.keys(MIGRATIONS).join(', ')}`,
    }, { status: 400 });
  }

  const statements = splitSql(sql);
  const from = Math.max(0, Number(body.from) || 0);
  const results: Array<{ i: number; ok: boolean; error?: string; head: string }> = [];
  let executed = 0;

  for (let i = from; i < statements.length; i++) {
    const stmt = statements[i];
    const head = stmt.replace(/\s+/g, ' ').slice(0, 80);
    try {
      await db.prepare(stmt).run();
      executed++;
      results.push({ i, ok: true, head });
    } catch (e: any) {
      results.push({ i, ok: false, error: e?.message || String(e), head });
      // Stop on first failure so the run is resumable from this index.
      return Response.json({
        success: false,
        file: body.file,
        total: statements.length,
        executed,
        failedAt: i,
        resumeWith: { file: body.file, from: i + 1 },
        results,
      }, { status: 500 });
    }
  }

  return Response.json({ success: true, file: body.file, total: statements.length, executed, from, results });
};
