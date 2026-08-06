// Brand resolution for partner white-labeling.
//
// A Lead / Quote / Project carries an optional partner_id. Everything the
// CUSTOMER sees (emails, client portal, quote + contract PDFs) is rendered
// from a single Brand object. No partner_id => MK_BRAND. With a partner_id =>
// that partner's brand. The admin, crew portal, and email infrastructure
// (send domain, reply routing) stay ours regardless.
//
// This is the single source of truth — adding a new partner is then just a
// data row, no code change.

export interface Brand {
  /** Stable key: 'mk' or the partner code/id. */
  key: string;
  /** Company name shown to the customer. */
  name: string;
  /** Email sender display name (the part before <address>). */
  fromName: string;
  /** Logo for a DARK / gradient background (white logo). */
  logoWhiteUrl: string;
  /** Logo for a LIGHT background (PDF letterhead, white header). */
  logoUrl: string;
  /** Bare domain for display, e.g. "mannyknows.com". '' if none. */
  websiteLabel: string;
  /** Full URL for links, e.g. "https://mannyknows.com". '' if none. */
  websiteUrl: string;
  /** Display phone, e.g. "(413) 361-8451". '' if none. */
  phoneDisplay: string;
  /** tel: digits, e.g. "4133618451". '' if none. */
  phoneTel: string;
  /** Public contact email shown in footers. '' if none. */
  contactEmail: string;
  /** Mailing address split into display lines. [] if none. */
  addressLines: string[];
  /** Short tagline under the logo. '' to hide. */
  tagline: string;
  /** Certifications line (MK only, never claim these for a partner).
   *  Empty until Manny provides real, verifiable credentials — never fabricate. */
  certifications: string;
  /** Show the Manny assistant block (MK only). */
  showEli: boolean;
  /**
   * Header/footer treatment:
   *  - 'gradient' : MK dark/orange gradient header with the brand logo
   *  - 'light'    : clean white header for partners whose logo is full-colour
   */
  headerStyle: 'gradient' | 'light';
  /** True when this is a partner (not MK). */
  isPartner: boolean;
}

export const MK_BRAND: Brand = {
  key: 'mk',
  name: 'MannyKnows',
  fromName: 'MannyKnows',
  // Orange "V" + white "L" mark — designed for dark/gradient backgrounds.
  logoWhiteUrl: 'https://mannyknows.com/logo.svg',
  // No light-background variant exists yet (the white "L" vanishes on white);
  // templates fall back to rendering the brand name as text when this is ''.
  logoUrl: '',
  websiteLabel: 'mannyknows.com',
  websiteUrl: 'https://mannyknows.com',
  phoneDisplay: '(413) 361-8451',
  phoneTel: '4133618451',
  contactEmail: 'mm@mannyknows.com',
  addressLines: [],
  tagline: 'Home Remodeling & Repairs in Springfield, MA',
  certifications: '',
  showEli: true,
  headerStyle: 'gradient',
  isPartner: false,
};

// Compatibility alias — ported SLPainting modules import { SL_BRAND }.
// New code should import MK_BRAND.
export const SL_BRAND = MK_BRAND;

export interface PartnerRow {
  id: number;
  name: string;
  code?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logo_url?: string | null;
  website?: string | null;
}

/** Split a one-line address ("240 Greenfield Rd, Montague, MA 01351") into
 *  two display lines: street, then "City, ST ZIP". Falls back gracefully. */
function splitAddress(addr: string): string[] {
  const clean = addr.trim();
  if (!clean) return [];
  const firstComma = clean.indexOf(',');
  if (firstComma === -1) return [clean];
  return [clean.slice(0, firstComma).trim(), clean.slice(firstComma + 1).trim()];
}

export function brandFromPartner(p: PartnerRow): Brand {
  const website = (p.website || '').trim();
  const websiteLabel = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const websiteUrl = website ? (website.startsWith('http') ? website : `https://${website}`) : '';
  const phone = (p.phone || '').trim();
  const phoneTel = phone.replace(/[^0-9+]/g, '');
  const logo = (p.logo_url || '').trim();

  return {
    key: p.code || `partner-${p.id}`,
    name: p.name,
    fromName: p.name,
    // Partners typically supply one full-colour logo; use it for both. If they
    // have none, the templates fall back to the name as text.
    logoWhiteUrl: logo,
    logoUrl: logo,
    websiteLabel: websiteLabel,
    websiteUrl: websiteUrl,
    phoneDisplay: phone,
    phoneTel: phoneTel,
    contactEmail: (p.email || '').trim(),
    addressLines: splitAddress(p.address || ''),
    tagline: '',
    certifications: '',
    showEli: false,
    headerStyle: 'light',
    isPartner: true,
  };
}

/** Resolve the brand for a record's partner_id. Always safe: any failure or
 *  a missing/archived partner falls back to MK_BRAND. */
export async function getBrand(db: any, partnerId: number | null | undefined): Promise<Brand> {
  if (!db || !partnerId) return MK_BRAND;
  try {
    const p = await db.prepare(
      `SELECT id, name, code, contact_name, phone, email, address, logo_url, website
         FROM partners WHERE id = ? AND archived = 0`
    ).bind(partnerId).first() as PartnerRow | null;
    return p ? brandFromPartner(p) : MK_BRAND;
  } catch {
    return MK_BRAND;
  }
}

/** Build the email "From" header value, e.g. `MannyKnows <quotes@send.mannyknows.com>`.
 *  Only the display name changes per brand — the address stays on our verified
 *  send domain (no per-partner DNS setup required). */
export function emailFrom(brand: Brand, localPart: string): string {
  const safeName = (brand.fromName || 'MannyKnows').replace(/[<>]/g, '').trim();
  return `${safeName} <${localPart}@send.mannyknows.com>`;
}
