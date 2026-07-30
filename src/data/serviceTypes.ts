// Canonical service-type list — shared by the admin Lead / Quote / Project
// forms so all three offer the SAME services. `other` lets an admin type a
// custom service; the custom text is stored as the service_type value itself
// (display code falls back to the raw value for anything not in this list).
//
// This is the MannyKnows catalog: the six monthly plans (src/data/plans.ts is
// the pricing source of truth — labels here show the starting price for quick
// reference in dropdowns), the AI Team, custom builds, and the two free lead
// magnets people actually write in about. Keep values stable once quotes
// reference them — labels can change freely. Manny is still finalizing the
// offer list; add/trim entries here and every admin form follows.
export interface ServiceType {
  value: string;
  label: string;
}

export const SERVICE_TYPES: ServiceType[] = [
  { value: 'website-basic', label: 'Get Found ($99/mo)' },
  { value: 'website-plus', label: 'Get Booked ($249/mo)' },
  { value: 'website-smart', label: 'Get Growing ($550/mo)' },
  { value: 'get-ahead', label: 'Get Ahead ($899/mo)' },
  { value: 'ecommerce', label: 'Online Store (from $150/mo)' },
  { value: 'business-ads', label: 'Business Ads (from $350/mo)' },
  { value: 'multimedia-agency', label: 'Multimedia Agency (from $1,800/mo)' },
  { value: 'ai-team', label: 'AI Team — hire agents (from $99/mo each)' },
  { value: 'custom-app', label: 'Custom Web App (scoped)' },
  { value: '360-photo', label: 'Free 360° Photo' },
  { value: 'website-analysis', label: 'Free AI Website Analysis' },
  { value: 'other', label: 'Other (enter custom)' },
];

// value -> label lookup for known services.
export const SERVICE_LABELS: Record<string, string> =
  Object.fromEntries(SERVICE_TYPES.map((s) => [s.value, s.label]));

// Human label for a stored service_type; custom values return themselves.
export function serviceLabel(value: string | null | undefined): string {
  if (!value) return '';
  return SERVICE_LABELS[value] || value;
}

// Is this a known (non-custom) service value?
export function isKnownService(value: string | null | undefined): boolean {
  return !!value && value !== 'other' && value in SERVICE_LABELS;
}
