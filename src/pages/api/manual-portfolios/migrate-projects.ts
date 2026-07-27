// Migrate existing promoted projects to the unified portfolio system
// POST /api/manual-portfolios/migrate-projects
// This is a one-time migration endpoint for projects that were promoted
// before the unified portfolio system was implemented
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

interface MigratedProject {
  project_id: number;
  portfolio_id: number;
  images_copied: number;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;

    // Verify admin authentication
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
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

    // Find promoted projects that don't have a portfolios entry
    const projectsResult = await db.prepare(`
      SELECT p.id, p.project_number, p.services, p.scope_description, p.portfolio_at,
             l.customer_name as client_name, l.customer_email as client_email, l.customer_phone as client_phone, l.city as client_city
      FROM projects p
      LEFT JOIN quotes q ON p.quote_id = q.id
      LEFT JOIN leads l ON q.lead_id = l.id
      WHERE p.status = 'portfolio'
      AND NOT EXISTS (
        SELECT 1 FROM portfolios mp WHERE mp.source_project_id = p.id
      )
    `).all();

    const projectsToMigrate = projectsResult.results || [];

    if (projectsToMigrate.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No projects need migration',
        migrated: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // MK services (values match src/data/serviceTypes.ts / portfolio categories)
    const serviceLabels: Record<string, string> = {
      'kitchen_remodel': 'Kitchen Remodeling',
      'bathroom_remodel': 'Bathroom Remodeling',
      'interior_painting': 'Interior Painting',
      'flooring': 'Flooring',
      'general_repairs': 'General Repairs',
      'other': 'Custom Service'
    };

    const migratedProjects: MigratedProject[] = [];

    for (const project of projectsToMigrate) {
      const p = project as any;

      // Generate project name from services
      let projectName = p.project_number;
      let projectType = 'other';

      if (p.services) {
        try {
          const services = JSON.parse(p.services);
          const names = services.map((s: any) => {
            const key = typeof s === 'string' ? s : (s.type || s.service || 'service');
            // Service values map 1:1 onto portfolio categories; first known wins.
            if (projectType === 'other' && key in serviceLabels && key !== 'other') projectType = key;
            return serviceLabels[key] || key;
          });
          if (names.length > 0) {
            projectName = names.join(' & ');
            if (p.client_city) {
              projectName += ` - ${p.client_city}`;
            }
          }
        } catch {}
      }

      // Generate slug
      const baseSlug = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Ensure unique slug
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existingSlug = await db.prepare(
          'SELECT id FROM portfolios WHERE slug = ?'
        ).bind(slug).first();
        if (!existingSlug) break;
        counter++;
        slug = `${baseSlug}-${counter}`;
      }

      // Create portfolios entry
      const portfolioResult = await db.prepare(`
        INSERT INTO portfolios (
          project_name, project_type, description, slug,
          client_name, client_email, client_phone, client_city,
          source_project_id, display_mode, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pairs', ?)
      `).bind(
        projectName,
        projectType,
        p.scope_description || null,
        slug,
        p.client_name || null,
        p.client_email || null,
        p.client_phone || null,
        p.client_city || null,
        p.id,
        p.portfolio_at || new Date().toISOString()
      ).run();

      const portfolioId = portfolioResult.meta?.last_row_id;

      if (!portfolioId) {
        console.error(`[Migration] Failed to create portfolio for project ${p.id}`);
        continue;
      }

      // Copy images from project_updates to portfolio_media (exclude
      // internal annotated markup copies — notes, not portfolio photos).
      const imagesResult = await db.prepare(`
        SELECT image_url, caption, created_at, stream_uid, poster_url
        FROM project_updates
        WHERE project_id = ? AND image_url IS NOT NULL
          AND COALESCE(posted_by, '') != 'annotation'
          AND image_url NOT LIKE '%/annotations/%'
        ORDER BY created_at ASC
      `).bind(p.id).all();

      const images = imagesResult.results || [];
      let copiedCount = 0;
      const isVid = (u: string) => /\.(mp4|mov|webm|m4v)(?:\?|$)/i.test(u || '');

      for (let i = 0; i < images.length; i++) {
        const img = images[i] as { image_url: string; caption?: string; created_at?: string; stream_uid?: string | null; poster_url?: string | null };
        try {
          await db.prepare(`
            INSERT INTO portfolio_media (
              portfolio_id, media_url, media_type, sort_order, created_at, stream_uid, poster_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            portfolioId,
            img.image_url,
            isVid(img.image_url) ? 'video' : 'image',
            i,
            img.created_at || new Date().toISOString(),
            img.stream_uid || null,
            img.poster_url || null
          ).run();
          copiedCount++;
        } catch (err) {
          console.error(`[Migration] Failed to copy image ${i} for project ${p.id}:`, err);
        }
      }

      migratedProjects.push({
        project_id: p.id,
        portfolio_id: portfolioId,
        images_copied: copiedCount
      });

      console.log(`[Migration] Migrated project ${p.id} to portfolio ${portfolioId} (${copiedCount} images)`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Migrated ${migratedProjects.length} project(s)`,
      migrated: migratedProjects
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Migration] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Migration failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET: Check migration status
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
        error: 'Unauthorized'
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

    // Check for unmigrated projects
    const unmigratedResult = await db.prepare(`
      SELECT p.id, p.project_number, p.status, p.portfolio_at
      FROM projects p
      WHERE p.status = 'portfolio'
      AND NOT EXISTS (
        SELECT 1 FROM portfolios mp WHERE mp.source_project_id = p.id
      )
    `).all();

    // Check migrated projects
    const migratedResult = await db.prepare(`
      SELECT mp.id, mp.project_name, mp.source_project_id, p.project_number
      FROM portfolios mp
      JOIN projects p ON mp.source_project_id = p.id
    `).all();

    return new Response(JSON.stringify({
      success: true,
      unmigrated: unmigratedResult.results || [],
      migrated: migratedResult.results || [],
      needs_migration: (unmigratedResult.results || []).length > 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Migration] Check error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to check migration status'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
