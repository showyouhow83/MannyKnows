import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const r2 = (locals as any).runtime?.env?.MANNYKNOWS_R2;
    
    if (!r2) {
      return new Response('R2 storage not available', { status: 503 });
    }

    // Get the file path from the URL params
    const filePath = params.path;
    
    if (!filePath) {
      return new Response('File path is required', { status: 400 });
    }

    // Fetch the file from R2
    const object = await r2.get(filePath);
    
    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    // Determine content type based on file extension
    const getContentType = (path: string): string => {
      if (path.endsWith('.html')) return 'text/html';
      if (path.endsWith('.json')) return 'application/json';
      if (path.endsWith('.png')) return 'image/png';
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
      if (path.endsWith('.gif')) return 'image/gif';
      if (path.endsWith('.pdf')) return 'application/pdf';
      if (path.endsWith('.csv')) return 'text/csv';
      if (path.endsWith('.txt')) return 'text/plain';
      if (path.endsWith('.mp4')) return 'video/mp4';
      if (path.endsWith('.webm')) return 'video/webm';
      return 'application/octet-stream';
    };

    const contentType = object.httpMetadata?.contentType || getContentType(filePath);

    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 1 year cache for static files
        'Access-Control-Allow-Origin': '*', // Allow CORS for file access
      },
    });

  } catch (error) {
    console.error('File serving error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
