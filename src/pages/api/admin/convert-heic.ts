// One-time HEIC to JPEG conversion for existing uploaded images
// GET: List all HEIC images found in the database
// POST: Convert all HEIC images to JPEG (re-upload to R2, update DB)
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);
  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = env?.MK_APP_DB;
  if (!db) return new Response(JSON.stringify({ error: 'No DB' }), { status: 503 });

  // Find HEIC references in quotes.project_images, leads.project_images, and portfolio_media
  const heicFiles: { source: string; id: number; url: string }[] = [];

  // Check quotes
  const quotes = await db.prepare('SELECT id, quote_number, project_images FROM quotes WHERE project_images IS NOT NULL').all();
  for (const q of (quotes.results || [])) {
    try {
      const images = JSON.parse(q.project_images as string) as string[];
      for (const url of images) {
        if (/\.heic/i.test(url) || /\.heif/i.test(url)) {
          heicFiles.push({ source: 'quotes', id: q.id as number, url });
        }
      }
    } catch {}
  }

  // Check leads
  const leads = await db.prepare('SELECT id, project_images FROM leads WHERE project_images IS NOT NULL').all();
  for (const l of (leads.results || [])) {
    try {
      const images = JSON.parse(l.project_images as string) as string[];
      for (const url of images) {
        if (/\.heic/i.test(url) || /\.heif/i.test(url)) {
          heicFiles.push({ source: 'leads', id: l.id as number, url });
        }
      }
    } catch {}
  }

  // Check portfolio_media
  const media = await db.prepare("SELECT id, media_url FROM portfolio_media WHERE media_url LIKE '%.heic%' OR media_url LIKE '%.heif%'").all();
  for (const m of (media.results || [])) {
    heicFiles.push({ source: 'portfolio_media', id: m.id as number, url: m.media_url as string });
  }

  // Check project_updates
  const updates = await db.prepare("SELECT id, image_url FROM project_updates WHERE image_url LIKE '%.heic%' OR image_url LIKE '%.heif%'").all();
  for (const u of (updates.results || [])) {
    heicFiles.push({ source: 'project_updates', id: u.id as number, url: u.image_url as string });
  }

  return new Response(JSON.stringify({
    success: true,
    count: heicFiles.length,
    files: heicFiles
  }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);
  if (!session.isAuthenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = env?.MK_APP_DB;
  const bucket = env?.MK_MEDIA_BUCKET;
  if (!db || !bucket) return new Response(JSON.stringify({ error: 'Not configured' }), { status: 503 });

  const converted: string[] = [];
  const failed: string[] = [];

  // Helper: convert a single HEIC URL
  async function convertOne(heicUrl: string): Promise<string | null> {
    try {
      // Extract R2 key from URL
      const urlObj = new URL(heicUrl);
      const r2Key = urlObj.pathname.replace(/^\//, '');

      // Download from R2
      const obj = await bucket.get(r2Key);
      if (!obj) {
        console.log(`[HEIC] Not found in R2: ${r2Key}`);
        failed.push(heicUrl + ' (not found in R2)');
        return null;
      }

      // Use Cloudflare Image Resizing to convert. Route the transform through
      // the zone this Worker is serving (request origin) — no hardcoded domain,
      // and it degrades gracefully in dev (fetch fails → file recorded as failed).
      const cdnUrl = `${new URL(request.url).origin}/cdn-cgi/image/format=jpeg,quality=92/${heicUrl}`;
      const convertedRes = await fetch(cdnUrl);

      if (!convertedRes.ok) {
        console.log(`[HEIC] CDN conversion failed for ${heicUrl}: ${convertedRes.status}`);
        failed.push(heicUrl + ' (CDN conversion failed)');
        return null;
      }

      const jpegData = await convertedRes.arrayBuffer();

      // Upload JPEG to R2
      const jpegKey = r2Key.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
      await bucket.put(jpegKey, jpegData, {
        httpMetadata: { contentType: 'image/jpeg' },
        customMetadata: { convertedFrom: r2Key, convertedAt: new Date().toISOString() }
      });

      const newUrl = heicUrl.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
      converted.push(`${heicUrl} → ${newUrl}`);

      // Delete old HEIC from R2
      await bucket.delete(r2Key);

      return newUrl;
    } catch (err) {
      console.error(`[HEIC] Error converting ${heicUrl}:`, err);
      failed.push(heicUrl + ' (' + String(err) + ')');
      return null;
    }
  }

  // Process quotes
  const quotes = await db.prepare('SELECT id, project_images FROM quotes WHERE project_images IS NOT NULL').all();
  for (const q of (quotes.results || [])) {
    try {
      const images = JSON.parse(q.project_images as string) as string[];
      let changed = false;
      const newImages = [];
      for (const url of images) {
        if (/\.heic/i.test(url) || /\.heif/i.test(url)) {
          const newUrl = await convertOne(url);
          newImages.push(newUrl || url);
          if (newUrl) changed = true;
        } else {
          newImages.push(url);
        }
      }
      if (changed) {
        await db.prepare('UPDATE quotes SET project_images = ? WHERE id = ?')
          .bind(JSON.stringify(newImages), q.id).run();
      }
    } catch {}
  }

  // Process leads
  const leads = await db.prepare('SELECT id, project_images FROM leads WHERE project_images IS NOT NULL').all();
  for (const l of (leads.results || [])) {
    try {
      const images = JSON.parse(l.project_images as string) as string[];
      let changed = false;
      const newImages = [];
      for (const url of images) {
        if (/\.heic/i.test(url) || /\.heif/i.test(url)) {
          const newUrl = await convertOne(url);
          newImages.push(newUrl || url);
          if (newUrl) changed = true;
        } else {
          newImages.push(url);
        }
      }
      if (changed) {
        await db.prepare('UPDATE leads SET project_images = ? WHERE id = ?')
          .bind(JSON.stringify(newImages), l.id).run();
      }
    } catch {}
  }

  // Process portfolio_media
  const media = await db.prepare("SELECT id, media_url FROM portfolio_media WHERE media_url LIKE '%.heic%' OR media_url LIKE '%.heif%'").all();
  for (const m of (media.results || [])) {
    const newUrl = await convertOne(m.media_url as string);
    if (newUrl) {
      await db.prepare('UPDATE portfolio_media SET media_url = ? WHERE id = ?')
        .bind(newUrl, m.id).run();
    }
  }

  // Process project_updates
  const updates = await db.prepare("SELECT id, image_url FROM project_updates WHERE image_url LIKE '%.heic%' OR image_url LIKE '%.heif%'").all();
  for (const u of (updates.results || [])) {
    const newUrl = await convertOne(u.image_url as string);
    if (newUrl) {
      await db.prepare('UPDATE project_updates SET image_url = ? WHERE id = ?')
        .bind(newUrl, u.id).run();
    }
  }

  return new Response(JSON.stringify({
    success: true,
    converted: converted.length,
    failed: failed.length,
    details: { converted, failed }
  }), { headers: { 'Content-Type': 'application/json' } });
};
