// Hero slider data — shared between the admin manager (/admin/web/hero-slider)
// and the API (/api/admin/hero-slides). The public site does not render hero
// slides yet; the admin manages the data ahead of that.
//
// The admin-managed slides live in the D1 `hero_slides` table. DEFAULT_HERO_SLIDES
// is the seed set inserted on first admin load. For MannyKnows it is
// intentionally EMPTY: we have no real slide photos or offers yet, and seeding
// fabricated ones (photos, discounts, review counts) is worse than an empty
// slider. Manny/admin creates real slides in the manager; when the public hero
// is built it reads whatever is in the table.

// Cloudflare Images delivery — the imagedelivery.net account hash is
// account-specific, so it comes from the environment:
//   IMAGES_ACCOUNT_HASH  e.g. "AbC123..." (dashboard → Images → delivery URL)
// Falls back to process.env (populated on Workers via nodejs_compat, and from
// .env in `astro dev`) so template code without an env handle still works.
export function imagesDeliveryBase(env?: any): string {
  const hash =
    env?.IMAGES_ACCOUNT_HASH ||
    (globalThis as any)?.process?.env?.IMAGES_ACCOUNT_HASH ||
    '';
  return hash ? `https://imagedelivery.net/${hash}` : '';
}

// Derive desktop/mobile variant URLs from a Cloudflare Images id — used when an
// admin uploads a new slide image via /api/cloudflare-images-upload. Returns
// empty strings when IMAGES_ACCOUNT_HASH is not configured (callers should
// fall back or surface "not configured").
export function heroImageUrlsFromId(imageId: string, env?: any): { desktop: string; mobile: string } {
  const base = imagesDeliveryBase(env);
  if (!base || !imageId) return { desktop: '', mobile: '' };
  return {
    desktop: `${base}/${imageId}/w=1200,q=78,f=auto`,
    mobile: `${base}/${imageId}/w=640,q=65,f=auto`,
  };
}

// Copy limits — keep titles/descriptions short so they don't overflow the
// overlay and disrupt the slide design. Enforced in the admin UI (maxlength +
// counter) and clamped server-side in the API.
export const HERO_TITLE_MAX = 34;
export const HERO_DESC_MAX = 120;

export interface HeroSlide {
  id?: number;
  title: string;
  description: string;
  link_url: string;
  image_url: string;          // desktop
  image_mobile_url: string | null; // mobile (falls back to image_url when null)
  alt: string;
  sort_order?: number;
  enabled?: number;           // 1 = shown
}

// Seed set for the hero_slides table. Deliberately empty for MK — no real
// slide photography or offers exist yet (empty beats fake). The admin manager
// shows its "No slides yet" empty state and slides are added there.
export const DEFAULT_HERO_SLIDES: HeroSlide[] = [];
