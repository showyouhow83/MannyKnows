// Admin endpoint to add images to a lead
// POST: Add image URL to lead's project_images array
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

export const POST: APIRoute = async ({ request, locals, params }) => {
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

    const leadId = params.id;
    if (!leadId || isNaN(Number(leadId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid lead ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { image_url } = body;

    if (!image_url || typeof image_url !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Image URL is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the lead exists
    const lead = await db.prepare(
      'SELECT id, project_images FROM leads WHERE id = ?'
    ).bind(leadId).first();

    if (!lead) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Lead not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse existing images
    let existingImages: string[] = [];
    if (lead.project_images) {
      try {
        existingImages = JSON.parse(lead.project_images as string);
        if (!Array.isArray(existingImages)) existingImages = [];
      } catch {
        existingImages = [];
      }
    }

    // Add new image (no limit for admin)
    const updatedImages = [...existingImages, image_url];

    // Update lead with new image
    await db.prepare(`
      UPDATE leads
      SET project_images = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(updatedImages), leadId).run();

    console.log(`[Admin] Added image to lead ${leadId} (total: ${updatedImages.length})`);

    return new Response(JSON.stringify({
      success: true,
      imageUrl: image_url,
      imageCount: updatedImages.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Lead Image] Add error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to add image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Remove image from lead's project_images array
export const DELETE: APIRoute = async ({ request, locals, params }) => {
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

    const leadId = params.id;
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('image_url');

    if (!leadId || isNaN(Number(leadId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid lead ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Image URL is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get lead
    const lead = await db.prepare(
      'SELECT id, project_images FROM leads WHERE id = ?'
    ).bind(leadId).first();

    if (!lead) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Lead not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and filter existing images
    let existingImages: string[] = [];
    if (lead.project_images) {
      try {
        existingImages = JSON.parse(lead.project_images as string);
        if (!Array.isArray(existingImages)) existingImages = [];
      } catch {
        existingImages = [];
      }
    }

    const updatedImages = existingImages.filter(img => img !== imageUrl);

    // Update lead
    await db.prepare(`
      UPDATE leads
      SET project_images = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(updatedImages), leadId).run();

    console.log(`[Admin] Removed image from lead ${leadId} (remaining: ${updatedImages.length})`);

    return new Response(JSON.stringify({
      success: true,
      imageCount: updatedImages.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Lead Image] Remove error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to remove image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
