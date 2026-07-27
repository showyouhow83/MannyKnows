// Canonical service-type list — shared by the admin Lead / Quote / Project
// forms so all three offer the SAME services. `other` lets an admin type a
// custom service; the custom text is stored as the service_type value itself
// (display code falls back to the raw value for anything not in this list).
export interface ServiceType {
  value: string;
  label: string;
}

export const SERVICE_TYPES: ServiceType[] = [
  { value: 'kitchen_remodel', label: 'Kitchen Remodeling' },
  { value: 'bathroom_remodel', label: 'Bathroom Remodeling' },
  { value: 'interior_painting', label: 'Interior Painting' },
  { value: 'flooring', label: 'Flooring (Hardwood / Tile / LVP)' },
  { value: 'general_repairs', label: 'General Repairs & Handyman' },
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
