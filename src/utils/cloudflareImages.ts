/**
 * Cloudflare Images URL Generation Utility
 *
 * Generates optimized image URLs from Cloudflare Image IDs.
 * Falls back to original R2 URLs for backwards compatibility.
 */

// Cloudflare Images delivery base. The imagedelivery.net account hash is
// account-specific, so it comes from IMAGES_ACCOUNT_HASH (Workers var /
// .env in dev; process.env is populated on Workers via nodejs_compat).
// When unset, delivery-URL helpers return the raw/original URL instead of
// pointing at another account's hash.
function cfDeliveryUrl(env?: any): string {
  const hash =
    env?.IMAGES_ACCOUNT_HASH ||
    (globalThis as any)?.process?.env?.IMAGES_ACCOUNT_HASH ||
    '';
  return hash ? `https://imagedelivery.net/${hash}` : '';
}

// Predefined size variants matching existing system
export const IMAGE_VARIANTS = {
  thumbnail: 'w=400,q=75,f=auto',   // Homepage grid, small previews
  medium: 'w=800,q=75,f=auto',      // Standard display, cards
  large: 'w=1200,q=78,f=auto',      // Homepage hero carousel
  portfolio: 'w=1600,q=85,f=auto',  // Portfolio detail pages — high quality showcase
  lightbox: 'w=2048,q=85,f=auto',   // Portfolio lightbox (opened image) — crisp on large/retina screens
  hero: 'w=1920,q=75,f=auto',       // Full-width hero images
  public: 'public'                   // Original size (fallback)
} as const;

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

// Cloudflare image-resizing (cdn-cgi/image) params per variant — used for raw
// media-CDN (images.mannyknows.com) URLs that have NO Cloudflare Image ID (e.g. crew/pool
// uploads, quote photos). Without this they were served full-size originals
// (slow + oversized). fit=scale-down never upscales, so quality is preserved.
const CDN_CGI_VARIANTS: Record<ImageVariant, string | null> = {
  thumbnail: 'width=400,quality=75,format=auto,fit=scale-down',
  medium: 'width=800,quality=75,format=auto,fit=scale-down',
  large: 'width=1200,quality=78,format=auto,fit=scale-down',
  portfolio: 'width=1600,quality=85,format=auto,fit=scale-down',
  lightbox: 'width=2048,quality=85,format=auto,fit=scale-down',
  hero: 'width=1920,quality=75,format=auto,fit=scale-down',
  public: null, // no transform — original
};

// Public host of the R2 media bucket's custom domain. Overridable via
// MEDIA_PUBLIC_HOST so a different domain doesn't require a code change.
const CF_IMAGE_HOST =
  ((globalThis as any)?.process?.env?.MEDIA_PUBLIC_HOST || 'images.mannyknows.com') + '/';

// Wrap a raw media-CDN (images.mannyknows.com) URL in a cdn-cgi/image resize transform.
// No-op for other hosts, already-transformed URLs, or the 'public' variant.
export function cdnCgiResize(url: string, variant: ImageVariant = 'medium'): string {
  if (!url || !url.includes(CF_IMAGE_HOST)) return url;
  if (url.includes('/cdn-cgi/image/')) return url;
  // NEVER wrap videos — cdn-cgi/image is image-only and corrupts .mov/.mp4 URLs.
  // (The gallery's getMediaUrl call doesn't pass media_type, so guard by extension.)
  if (/\.(mp4|mov|webm|m4v)(?:\?|$)/i.test(url)) return url;
  const params = CDN_CGI_VARIANTS[variant];
  if (!params) return url;
  const cut = url.indexOf(CF_IMAGE_HOST) + CF_IMAGE_HOST.length;
  return url.slice(0, cut) + 'cdn-cgi/image/' + params + '/' + url.slice(cut);
}

/**
 * Media item interface for type safety
 */
export interface MediaItem {
  media_url: string;
  cloudflare_image_id?: string | null;
  media_type?: string;
}

/**
 * Generate optimized URL from Cloudflare Image ID.
 * Returns '' when IMAGES_ACCOUNT_HASH is not configured.
 */
export function getCfImageUrl(imageId: string, variant: ImageVariant = 'medium', env?: any): string {
  const base = cfDeliveryUrl(env);
  return base ? `${base}/${imageId}/${IMAGE_VARIANTS[variant]}` : '';
}

/**
 * Get all variant URLs for a Cloudflare Image
 */
export function getCfImageUrls(imageId: string, env?: any) {
  return {
    thumbnail: getCfImageUrl(imageId, 'thumbnail', env),
    medium: getCfImageUrl(imageId, 'medium', env),
    large: getCfImageUrl(imageId, 'large', env),
    hero: getCfImageUrl(imageId, 'hero', env),
    public: getCfImageUrl(imageId, 'public', env)
  };
}

/**
 * Get the best URL for a media item
 * - If cloudflare_image_id exists → use optimized Cloudflare URL
 * - Otherwise → fall back to original R2 URL (backwards compatible)
 *
 * @param media - Media item with media_url and optional cloudflare_image_id
 * @param variant - Size variant (thumbnail, medium, large, hero)
 * @returns Optimized URL or original R2 URL
 */
export function getMediaUrl(
  media: MediaItem | { media_url: string; cloudflare_image_id?: string | null },
  variant: ImageVariant = 'medium'
): string {
  // Videos don't go through Cloudflare Images - always use original URL
  if (media && 'media_type' in media && media.media_type === 'video') {
    return media.media_url;
  }

  // If we have a Cloudflare Image ID, use optimized URL (unless the delivery
  // hash isn't configured, in which case fall through to the raw URL).
  if (media?.cloudflare_image_id) {
    const cfUrl = getCfImageUrl(media.cloudflare_image_id, variant);
    if (cfUrl) return cfUrl;
  }

  // No CF Image ID: if it's a raw media-CDN (images.mannyknows.com) URL, optimize it via
  // cdn-cgi/image resizing (was previously served full-size). Other hosts pass
  // through unchanged.
  return cdnCgiResize(media?.media_url || '', variant);
}

/**
 * Check if a URL is already a Cloudflare Images URL
 */
export function isCfImageUrl(url: string): boolean {
  return url.includes('imagedelivery.net');
}

/**
 * Extract Cloudflare Image ID from a delivery URL (if present)
 */
export function extractCfImageId(url: string): string | null {
  if (!isCfImageUrl(url)) return null;

  // URL format: https://imagedelivery.net/{zone}/{image_id}/{variant}
  const match = url.match(/imagedelivery\.net\/[^/]+\/([^/]+)/);
  return match ? match[1] : null;
}
