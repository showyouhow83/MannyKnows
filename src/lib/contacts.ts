// Contact auto-population helpers
// Used by lead capture, quote promotion, and project creation

export function titleCase(str: string | null | undefined): string {
  if (!str) return '';
  return str.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

export function extractZipFromAddress(zip: string | null | undefined, address: string | null | undefined): string {
  if (zip) return zip.trim();
  if (!address) return '';
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : '';
}

export function parseName(fullName: string | null | undefined): { first: string; last: string } {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: titleCase(parts[0]), last: '' };
  return { first: titleCase(parts[0]), last: titleCase(parts.slice(1).join(' ')) };
}

/**
 * Find or create a contact, then link it to a pipeline record.
 * Returns the contact_id.
 */
export async function findOrCreateContact(
  db: any,
  data: {
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    zip?: string;
    address?: string;
    city?: string;
    state?: string;
    source?: string;
  },
  link?: { type: 'lead' | 'quote' | 'project'; id: number }
): Promise<number> {
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);

  // Parse name if only full name provided
  let firstName = data.first_name ? titleCase(data.first_name) : '';
  let lastName = data.last_name ? titleCase(data.last_name) : '';
  if (!firstName && data.name) {
    const parsed = parseName(data.name);
    firstName = parsed.first;
    lastName = parsed.last;
  }

  let contactId: number | null = null;

  // Match by email first
  if (email) {
    const existing = await db.prepare('SELECT id FROM contacts WHERE LOWER(email) = ?').bind(email).first();
    if (existing) contactId = existing.id;
  }

  // Match by phone if no email match
  if (!contactId && phone) {
    const existing = await db.prepare('SELECT id FROM contacts WHERE phone = ?').bind(phone).first();
    if (existing) contactId = existing.id;
  }

  // Create new contact if no match
  if (!contactId) {
    if (!firstName) firstName = 'Unknown';
    const result = await db.prepare(`
      INSERT INTO contacts (first_name, last_name, email, phone, address, city, state, zip, country, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'US', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      firstName, lastName || null, email || null, phone || null,
      data.address || null, data.city || null, data.state || null,
      extractZipFromAddress(data.zip, data.address) || null, data.source || 'lead'
    ).run();
    contactId = result.meta.last_row_id as number;
    console.log(`[Contacts] Created contact ${contactId}: ${firstName} ${lastName}`);
  } else {
    // Update existing contact with any new info
    const updates: string[] = [];
    const params: any[] = [];

    if (firstName && firstName !== 'Unknown') {
      // Only update name if current is 'Unknown' or empty
      const current = await db.prepare('SELECT first_name FROM contacts WHERE id = ?').bind(contactId).first();
      if (current && (!current.first_name || current.first_name === 'Unknown')) {
        updates.push('first_name = ?');
        params.push(firstName);
        if (lastName) {
          updates.push('last_name = ?');
          params.push(lastName);
        }
      }
    }
    if (phone) {
      const current = await db.prepare('SELECT phone FROM contacts WHERE id = ?').bind(contactId).first();
      if (current && !current.phone) {
        updates.push('phone = ?');
        params.push(phone);
      }
    }
    // Backfill address, city, state, zip — only fill empty fields
    // Treat "Not provided" as empty so real data can overwrite it
    const np = (v: any) => !v || (typeof v === 'string' && v.toLowerCase() === 'not provided');
    const current = await db.prepare('SELECT address, city, state, zip FROM contacts WHERE id = ?').bind(contactId).first() as any;
    if (current) {
      if (data.address && !np(data.address) && np(current.address)) {
        updates.push('address = ?');
        params.push(data.address);
      }
      if (data.city && !np(data.city) && np(current.city)) {
        updates.push('city = ?');
        params.push(data.city);
      }
      if (data.state && np(current.state)) {
        updates.push('state = ?');
        params.push(data.state);
      }
      const resolvedZip = extractZipFromAddress(data.zip, data.address);
      if (resolvedZip && np(current.zip)) {
        updates.push('zip = ?');
        params.push(resolvedZip);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(contactId);
      await db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    }
  }

  // Create link if requested (idempotent)
  if (link && contactId) {
    const existingLink = await db.prepare(
      'SELECT id FROM contact_links WHERE contact_id = ? AND link_type = ? AND link_id = ?'
    ).bind(contactId, link.type, link.id).first();

    if (!existingLink) {
      await db.prepare(
        'INSERT INTO contact_links (contact_id, link_type, link_id) VALUES (?, ?, ?)'
      ).bind(contactId, link.type, link.id).run();
      console.log(`[Contacts] Linked contact ${contactId} → ${link.type} ${link.id}`);
    }
  }

  return contactId;
}

/**
 * Remove a contact link (used when deleting pipeline records).
 * Does NOT delete the contact itself.
 */
export async function unlinkContact(
  db: any,
  linkType: 'lead' | 'quote' | 'project',
  linkId: number
): Promise<void> {
  await db.prepare(
    'DELETE FROM contact_links WHERE link_type = ? AND link_id = ?'
  ).bind(linkType, linkId).run();
}
