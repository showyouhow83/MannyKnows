// Shared address normalizer.
//
// Project/quote addresses are entered two ways in this codebase:
//   1. NEW (preferred): structured fields — address = street only, plus
//      separate city / state / zip.
//   2. LEGACY: everything crammed into the single `address` string
//      ("19 Chatham St Longmeadow"), with city/state/zip left blank.
//
// Every consumer (crew weather + map link, client portal, admin display,
// contract recap, source-project panel) must work with BOTH shapes. This
// module is the single source of truth: it recovers a geocodable
// city/state/zip from whatever was entered, and produces a clean one-line
// string for display + a map query.

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin',
  WY: 'Wyoming', DC: 'District of Columbia',
};

export interface RawAddress {
  /** Street line, or (legacy) a full one-liner with city/state crammed in. */
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export interface NormalizedAddress {
  /** Street portion as entered (the raw `address` field, unchanged). */
  street: string;
  /** Best resolved city (structured if present, else parsed from address). */
  city: string;
  /** 2-letter state code when resolvable, else the raw value. */
  state: string;
  /** Full state name (e.g. "Massachusetts"): used to disambiguate geocoding. */
  stateName: string;
  /** 5-digit zip (structured if present, else parsed from address). */
  zip: string;
  /** Clean one-line address for display, no duplicated city/state/zip. */
  oneLine: string;
  /** URL-ready query string for a Google/Apple Maps link. */
  mapQuery: string;
  /** Ordered place-name candidates to try against a geocoder (best first). */
  geoCandidates: string[];
  /** True when we have enough to geocode (a zip or at least one candidate). */
  hasLocation: boolean;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeAddress(raw: RawAddress): NormalizedAddress {
  const rawAddr = (raw.address || '').trim();
  let city = (raw.city || '').trim();
  let state = (raw.state || '').trim();
  let zip = (raw.zip || '').trim();

  // ── Recover zip + state from the freeform address when missing ──────────
  if (rawAddr) {
    if (!zip) {
      const m = rawAddr.match(/\b(\d{5})(?:-\d{4})?\b/);
      if (m) zip = m[1];
    }
    if (!state) {
      // Trailing 2-letter token, optionally before a zip ("... Springfield MA 01108").
      const m = rawAddr.match(/(?:^|[,\s])([A-Za-z]{2})(?:[,\s]+\d{5}(?:-\d{4})?)?\s*$/);
      if (m && US_STATES[m[1].toUpperCase()]) state = m[1];
    }
  }

  const stateUp = state.toUpperCase();
  const stateName = US_STATES[stateUp] || state;
  // Display the canonical 2-letter code when we recognize it.
  const stateDisp = US_STATES[stateUp] ? stateUp : state;

  // ── Build ordered geocode candidates ────────────────────────────────────
  // A structured city is authoritative — use it alone. Only fall back to
  // parsing the freeform address (legacy one-liners) when no city is set.
  const candidates: string[] = [];
  if (city) {
    candidates.push(city);
  } else if (rawAddr) {
    // Strip zip + a trailing state token to isolate the locality portion.
    let work = rawAddr.replace(/\b\d{5}(?:-\d{4})?\b/g, '').trim();
    work = work.replace(/[,\s]+[A-Za-z]{2}\s*$/, '').trim();
    work = work.replace(/,\s*$/, '').trim();
    if (work.includes(',')) {
      // Comma format ("72 Kipling St, Springfield") → last comma segment.
      const parts = work.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length) candidates.push(parts[parts.length - 1]);
    } else {
      // Space format ("19 Chatham St Longmeadow") → last two words (covers
      // "West Springfield") then the last word. The state filter at geocode
      // time rejects junk like "St Longmeadow".
      const words = work.split(/\s+/).filter(Boolean);
      if (words.length >= 2) candidates.push(words.slice(-2).join(' '));
      if (words.length >= 1) candidates.push(words[words.length - 1]);
    }
  }
  const geoCandidates = candidates.filter((v, i, a) => !!v && a.indexOf(v) === i);

  // ── One-line display string (no duplication) ────────────────────────────
  const lowerAddr = rawAddr.toLowerCase();
  let oneLine = rawAddr;
  if (city && !lowerAddr.includes(city.toLowerCase())) {
    oneLine = oneLine ? `${oneLine}, ${city}` : city;
  }
  if (stateDisp) {
    const inAddr = new RegExp(`\\b${escapeRe(stateDisp)}\\b`, 'i').test(rawAddr)
      || new RegExp(`\\b${escapeRe(stateName)}\\b`, 'i').test(rawAddr);
    if (!inAddr) oneLine = oneLine ? `${oneLine}, ${stateDisp}` : stateDisp;
  }
  if (zip && !rawAddr.includes(zip)) {
    oneLine = oneLine ? `${oneLine} ${zip}` : zip;
  }
  oneLine = oneLine.trim();

  const hasLocation = !!(zip || geoCandidates.length);

  return {
    street: rawAddr,
    city: city || (geoCandidates[geoCandidates.length - 1] || ''),
    state: stateDisp,
    stateName,
    zip,
    oneLine,
    mapQuery: oneLine,
    geoCandidates,
    hasLocation,
  };
}
