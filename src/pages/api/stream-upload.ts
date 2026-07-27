// Cloudflare Stream Video Upload API
// POST: Import video from R2 URL to Stream for transcoding
// This uploads to R2 first (which works), then tells Stream to fetch from R2
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../lib/adminAuth';
import { streamHls, streamThumb, streamIframe } from '../../lib/stream';

interface StreamUploadResponse {
  success: boolean;
  uid?: string;
  error?: string;
}

// POST: Import video from URL (R2) to Stream
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
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

    // Get Cloudflare API credentials — all env-driven, no hardcoded account id.
    const accountId = env?.CF_ACCOUNT_ID || env?.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env?.CLOUDFLARE_STREAM_TOKEN || env?.CLOUDFLARE_API_TOKEN;

    if (!apiToken || !accountId) {
      console.error('[Stream Upload] Missing CLOUDFLARE_STREAM_TOKEN / CF_ACCOUNT_ID');
      return new Response(JSON.stringify({
        success: false,
        error: 'Stream API not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { video_url, portfolio_id, file_name } = body as {
      video_url?: string;
      portfolio_id?: number;
      file_name?: string;
    };

    if (!video_url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'video_url is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Stream Upload] Importing video from URL: ${video_url}`);

    // Use Stream's "copy" API to import from URL
    // This tells Cloudflare Stream to fetch the video from our R2 bucket
    const streamResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/copy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: video_url,
          requireSignedURLs: false,
          // creator tags the video as MK's in the shared account-wide Stream
          // library (filterable in API + dashboard), and the name prefix makes
          // it obvious at a glance next to other clients' videos.
          creator: 'mannyknows',
          meta: {
            name: `mk — ${file_name || 'video'}`,
            site: 'mannyknows',
            portfolio_id: portfolio_id?.toString() || '',
            file_name: file_name || 'video',
            uploaded_by: 'admin',
            source: 'r2-import'
          }
        })
      }
    );

    const responseText = await streamResponse.text();
    console.log(`[Stream Upload] Copy API response: ${streamResponse.status}`, responseText);

    if (!streamResponse.ok) {
      console.error('[Stream Upload] Cloudflare API error:', streamResponse.status, responseText);
      return new Response(JSON.stringify({
        success: false,
        error: `Stream import failed: ${streamResponse.status}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let streamData;
    try {
      streamData = JSON.parse(responseText);
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response from Stream API'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!streamData.success || !streamData.result) {
      console.error('[Stream Upload] Stream API returned error:', streamData.errors);
      return new Response(JSON.stringify({
        success: false,
        error: streamData.errors?.[0]?.message || 'Failed to import video to Stream'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uid = streamData.result.uid;
    console.log(`[Stream Upload] Video imported successfully, uid: ${uid}`);

    // Return Stream data for saving to database. URLs are built from the
    // env-configured customer subdomain and are '' until
    // STREAM_CUSTOMER_SUBDOMAIN is set (uid is what gets persisted).
    return new Response(JSON.stringify({
      success: true,
      uid: uid,
      playback_url: streamHls(uid, env),
      thumbnail_url: streamThumb(uid, '1s', env),
      embed_url: streamIframe(uid, env)
    } as StreamUploadResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Stream Upload] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to import video'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET: Check video status by stream UID
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = cfEnv;
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

    const url = new URL(request.url);
    const uid = url.searchParams.get('uid');

    if (!uid) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing uid parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accountId = env?.CF_ACCOUNT_ID || env?.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env?.CLOUDFLARE_STREAM_TOKEN || env?.CLOUDFLARE_API_TOKEN;

    if (!apiToken || !accountId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Stream API not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get video details from Stream
    const streamResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      }
    );

    if (!streamResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Video not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const streamData = await streamResponse.json() as {
      success: boolean;
      result?: {
        uid: string;
        status: { state: string };
        duration: number;
        thumbnail: string;
        playback: { hls: string; dash: string };
        readyToStream: boolean;
      };
    };

    if (!streamData.success || !streamData.result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get video status'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const video = streamData.result;

    return new Response(JSON.stringify({
      success: true,
      video: {
        uid: video.uid,
        status: video.status?.state || 'unknown',
        ready: video.readyToStream,
        duration: video.duration,
        thumbnail: video.thumbnail,
        playback_hls: video.playback?.hls,
        playback_dash: video.playback?.dash,
        embed_url: streamIframe(video.uid, env)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Stream Upload] GET error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get video status'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
