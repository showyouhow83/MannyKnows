// Standalone Portfolio API
// For adding portfolio entries directly (not from the quote pipeline)
// POST: Create standalone portfolio with images
// GET: List standalone portfolios

import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth, viewerGuard } from '../../../lib/adminAuth';

interface StandalonePortfolioRequest {
  title: string;
  // Aligned with PORTFOLIO_TYPES in src/lib/portfolio-copy.ts / src/data/serviceTypes.ts
  service_type: string;
  description?: string;
  location?: string;
  images: Array<{
    url: string;
    note?: string;
    type?: 'before' | 'after' | 'progress';
  }>;
}

// POST: Create standalone portfolio
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
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const vg = viewerGuard(session); if (vg) return vg;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: StandalonePortfolioRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.service_type || !body.images || body.images.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Title, service_type, and at least one image are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique project number for standalone portfolio
    const portfolioNumber = `PF-${Date.now().toString(36).toUpperCase()}`;

    // Generate tokens
    const clientToken = crypto.randomUUID();
    const crewToken = crypto.randomUUID().substring(0, 8);

    // Create a minimal dummy quote entry
    const quoteResult = await db.prepare(`
      INSERT INTO quotes (
        quote_number, customer_name, customer_email,
        services, scope_description, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'project', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      portfolioNumber,
      body.title,
      'portfolio@mannyknows.com', // placeholder email
      JSON.stringify([{ type: body.service_type }]),
      body.description || `${body.title} - Standalone Portfolio`
    ).run();

    const quoteId = quoteResult.meta.last_row_id;

    // Create the project in portfolio status
    const projectResult = await db.prepare(`
      INSERT INTO projects (
        quote_id, project_number,
        customer_name, customer_email,
        customer_city,
        services, scope_description,
        client_token, crew_token,
        status, portfolio_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'portfolio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      quoteId,
      portfolioNumber,
      body.title,
      'portfolio@mannyknows.com',
      body.location || null,
      JSON.stringify([{ type: body.service_type }]),
      body.description || null,
      clientToken,
      crewToken
    ).run();

    const projectId = projectResult.meta.last_row_id;

    // Create project_updates for each image
    for (const image of body.images) {
      await db.prepare(`
        INSERT INTO project_updates (
          project_id, image_url, note, posted_by, posted_by_name, created_at
        ) VALUES (?, ?, ?, 'admin', 'Portfolio Import', CURRENT_TIMESTAMP)
      `).bind(
        projectId,
        image.url,
        image.note || (image.type ? `${image.type.charAt(0).toUpperCase() + image.type.slice(1)} photo` : null)
      ).run();
    }

    console.log(`[Standalone Portfolio] Created: ${portfolioNumber} with ${body.images.length} images`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Standalone portfolio created successfully',
      portfolio: {
        id: projectId,
        project_number: portfolioNumber,
        title: body.title,
        service_type: body.service_type,
        images_count: body.images.length
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating standalone portfolio:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create standalone portfolio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET: List all standalone portfolios
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
        error: 'Database not available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch all standalone portfolios (those with PF- prefix)
    const result = await db.prepare(`
      SELECT p.id, p.project_number, p.customer_name as title,
             p.services, p.scope_description, p.customer_city as location,
             p.portfolio_at, p.created_at,
             (SELECT COUNT(*) FROM project_updates WHERE project_id = p.id AND image_url IS NOT NULL) as image_count
      FROM projects p
      WHERE p.status = 'portfolio' AND p.project_number LIKE 'PF-%'
      ORDER BY p.portfolio_at DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      portfolios: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching standalone portfolios:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch standalone portfolios'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
