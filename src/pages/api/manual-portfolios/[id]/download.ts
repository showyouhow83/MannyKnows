// Download endpoint for manual portfolio media
// GET: Returns JSON with file list, or ?zip=true to download as zip
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';
import { zipSync } from 'fflate';

export const GET: APIRoute = async ({ request, locals, params }) => {
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

    const portfolioId = params.id;
    if (!portfolioId || isNaN(Number(portfolioId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid portfolio ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get portfolio info
    const portfolio = await db.prepare(
      'SELECT id, project_name, project_type FROM portfolios WHERE id = ?'
    ).bind(portfolioId).first() as { id: number; project_name: string; project_type: string } | null;

    if (!portfolio) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Portfolio not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all media with original URLs
    const result = await db.prepare(`
      SELECT media_url, media_type, file_name, file_size
      FROM portfolio_media
      WHERE portfolio_id = ?
      ORDER BY sort_order ASC, created_at ASC
    `).bind(portfolioId).all();

    const media = (result.results || []) as Array<{
      media_url: string;
      media_type: string;
      file_name: string | null;
      file_size: number | null;
    }>;

    // Check if zip download requested
    const url = new URL(request.url);
    const wantZip = url.searchParams.get('zip') === 'true';

    if (wantZip) {
      // Server-side zip creation
      if (media.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No files to download'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check total size (limit to ~100MB for safety)
      const totalSize = media.reduce((sum, item) => sum + (item.file_size || 0), 0);
      const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB

      if (totalSize > MAX_ZIP_SIZE) {
        return new Response(JSON.stringify({
          success: false,
          error: `Total size (${Math.round(totalSize / 1024 / 1024)}MB) exceeds limit. Please download files individually.`,
          total_size: totalSize
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log(`[Download Zip] Starting zip for portfolio ${portfolioId}: ${media.length} files, ${Math.round(totalSize / 1024 / 1024)}MB`);

      // Fetch all files and create zip
      const zipFiles: Record<string, Uint8Array> = {};
      const usedNames = new Set<string>();

      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        try {
          // Generate unique filename
          let fileName = item.file_name ||
            `${portfolio.project_name?.replace(/[^a-zA-Z0-9]/g, '_')}_${i + 1}.${item.media_type === 'video' ? 'mp4' : 'jpg'}`;

          // Handle duplicates
          if (usedNames.has(fileName)) {
            const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
            const base = fileName.replace(`.${ext}`, '');
            let counter = 2;
            while (usedNames.has(`${base}_${counter}.${ext}`)) counter++;
            fileName = `${base}_${counter}.${ext}`;
          }
          usedNames.add(fileName);

          // Fetch file
          const response = await fetch(item.media_url);
          if (!response.ok) {
            console.warn(`[Download Zip] Failed to fetch: ${item.media_url}`);
            continue;
          }

          const arrayBuffer = await response.arrayBuffer();
          zipFiles[fileName] = new Uint8Array(arrayBuffer);

          console.log(`[Download Zip] Added: ${fileName} (${Math.round(arrayBuffer.byteLength / 1024)}KB)`);
        } catch (err) {
          console.warn(`[Download Zip] Error fetching ${item.media_url}:`, err);
        }
      }

      if (Object.keys(zipFiles).length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No files could be fetched'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create zip (level 0 = store only, no compression - faster, files already compressed)
      const zipped = zipSync(zipFiles, { level: 0 });

      // Generate filename for zip
      const zipFileName = `${portfolio.project_name?.replace(/[^a-zA-Z0-9-_ ]/g, '') || 'portfolio'}.zip`;

      console.log(`[Download Zip] Created zip: ${zipFileName} (${Math.round(zipped.byteLength / 1024)}KB)`);

      return new Response(zipped, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${zipFileName}"`,
          'Content-Length': zipped.byteLength.toString()
        }
      });
    }

    // Default: Return JSON with file list
    const totalSize = media.reduce((sum, item) => sum + (item.file_size || 0), 0);

    const files = media.map((item, index) => {
      const fileName = item.file_name ||
        `${portfolio.project_name?.replace(/[^a-zA-Z0-9]/g, '_')}_${index + 1}.${item.media_type === 'video' ? 'mp4' : 'jpg'}`;

      return {
        url: item.media_url,
        name: fileName,
        type: item.media_type,
        size: item.file_size || 0
      };
    });

    console.log(`[Manual Portfolio Download] Portfolio ${portfolioId}: ${files.length} files`);

    return new Response(JSON.stringify({
      success: true,
      portfolio: portfolio.project_name,
      files,
      total_files: files.length,
      total_size: totalSize
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Manual Portfolio Download] GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get download info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
