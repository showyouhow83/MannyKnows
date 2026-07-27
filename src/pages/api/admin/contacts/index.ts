// Contacts API Endpoint
// GET: List/search contacts with linked records
// POST: Create contact manually
// PATCH: Update contact
// DELETE: Delete contact
import { env as cfEnv } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

function titleCase(str: string | null | undefined): string {
  if (!str) return '';
  return str.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

async function authAndDb(request: Request, locals: any) {
  const env = cfEnv;
  const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
  const session = await AdminAuth.validateSession(request, sessionSecret);
  if (!session.isAuthenticated) {
    return { error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
  }
  const db = env?.MK_APP_DB;
  if (!db) {
    return { error: new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } }) };
  }
  return { db, env };
}

// GET: List contacts with search and linked record counts
export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const auth = await authAndDb(request, locals);
    if ('error' in auth) return auth.error as Response;
    const { db } = auth;

    const search = url.searchParams.get('search')?.trim();
    const contactId = url.searchParams.get('id');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 500);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Single contact with full linked records
    if (contactId) {
      const contact = await db.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId).first();
      if (!contact) {
        return new Response(JSON.stringify({ error: 'Contact not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      // Fetch linked leads
      const leads = await db.prepare(`
        SELECT l.id, l.customer_name, l.status, l.source, l.created_at
        FROM contact_links cl
        JOIN leads l ON cl.link_id = l.id
        WHERE cl.contact_id = ? AND cl.link_type = 'lead'
        ORDER BY l.created_at DESC
      `).bind(contactId).all();

      // Fetch linked quotes (include lead_id for chaining + signed contract URL)
      const quotes = await db.prepare(`
        SELECT q.id, q.quote_number, q.lead_id, q.status, q.total, q.created_at,
               q.contract_url
        FROM contact_links cl
        JOIN quotes q ON cl.link_id = q.id
        WHERE cl.contact_id = ? AND cl.link_type = 'quote'
        ORDER BY q.created_at ASC
      `).bind(contactId).all();

      // Fetch linked projects (include quote_id for chaining + portfolio slug + project contract URL)
      const projects = await db.prepare(`
        SELECT p.id, p.project_number, p.quote_id, p.status, p.total, p.created_at,
               p.project_contract_url,
               po.slug as portfolio_slug
        FROM contact_links cl
        JOIN projects p ON cl.link_id = p.id
        LEFT JOIN portfolios po ON po.source_project_id = p.id AND po.is_published = 1
        WHERE cl.contact_id = ? AND cl.link_type = 'project'
        ORDER BY p.created_at ASC
      `).bind(contactId).all();

      return new Response(JSON.stringify({
        success: true,
        contact,
        linked: {
          leads: leads.results || [],
          quotes: quotes.results || [],
          projects: projects.results || [],
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // List all contacts with search
    let query: string;
    let countQuery: string;
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      const searchLike = `%${search}%`;
      query = `
        SELECT c.*,
          (SELECT COUNT(*) FROM contact_links WHERE contact_id = c.id AND link_type = 'lead') as lead_count,
          (SELECT COUNT(*) FROM contact_links WHERE contact_id = c.id AND link_type = 'quote') as quote_count,
          (SELECT COUNT(*) FROM contact_links WHERE contact_id = c.id AND link_type = 'project') as project_count
        FROM contacts c
        WHERE c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?
      `;
      params.push(searchLike, searchLike, searchLike, searchLike, limit, offset);

      countQuery = `
        SELECT COUNT(*) as count FROM contacts
        WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?
      `;
      countParams.push(searchLike, searchLike, searchLike, searchLike);
    } else {
      query = `
        SELECT c.*,
          (SELECT COUNT(*) FROM contact_links WHERE contact_id = c.id AND link_type = 'lead') as lead_count,
          (SELECT COUNT(*) FROM contact_links WHERE contact_id = c.id AND link_type = 'quote') as quote_count,
          (SELECT COUNT(*) FROM contact_links WHERE contact_id = c.id AND link_type = 'project') as project_count
        FROM contacts c
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?
      `;
      params.push(limit, offset);
      countQuery = 'SELECT COUNT(*) as count FROM contacts';
    }

    const result = await db.prepare(query).bind(...params).all();
    const total = countParams.length > 0
      ? await db.prepare(countQuery).bind(...countParams).first()
      : await db.prepare(countQuery).first();

    return new Response(JSON.stringify({
      success: true,
      contacts: result.results || [],
      total: (total as any)?.count || 0
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch contacts' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST: Create contact manually
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const auth = await authAndDb(request, locals);
    if ('error' in auth) return auth.error as Response;
    const { db } = auth;

    const body = await request.json() as {
      first_name?: string; last_name?: string;
      email?: string; phone?: string;
      address?: string; city?: string; state?: string; zip?: string; country?: string;
      notes?: string; source?: string;
    };
    const firstName = titleCase(body.first_name);
    const lastName = titleCase(body.last_name);
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);

    if (!firstName) {
      return new Response(JSON.stringify({ error: 'First name is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!email && !phone) {
      return new Response(JSON.stringify({ error: 'Email or phone is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check for duplicates
    if (email) {
      const existing = await db.prepare('SELECT id, first_name, last_name FROM contacts WHERE LOWER(email) = ?').bind(email).first();
      if (existing) {
        return new Response(JSON.stringify({
          error: `Contact with this email already exists: ${(existing as any).first_name} ${(existing as any).last_name || ''}`.trim(),
          existing_id: (existing as any).id
        }), { status: 409, headers: { 'Content-Type': 'application/json' } });
      }
    }
    if (phone) {
      const existing = await db.prepare('SELECT id, first_name, last_name FROM contacts WHERE phone = ?').bind(phone).first();
      if (existing) {
        return new Response(JSON.stringify({
          error: `Contact with this phone already exists: ${(existing as any).first_name} ${(existing as any).last_name || ''}`.trim(),
          existing_id: (existing as any).id
        }), { status: 409, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const result = await db.prepare(`
      INSERT INTO contacts (first_name, last_name, email, phone, zip, country, source, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      firstName, lastName || null, email || null, phone || null,
      body.zip?.trim() || null, body.country?.toUpperCase() || 'US',
      body.notes || null
    ).run();

    const contact = await db.prepare('SELECT * FROM contacts WHERE id = ?').bind(result.meta.last_row_id).first();
    console.log(`[Contacts] Created contact ${result.meta.last_row_id}: ${firstName} ${lastName}`);

    return new Response(JSON.stringify({ success: true, contact }), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error creating contact:', error);
    return new Response(JSON.stringify({ error: 'Failed to create contact' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// PATCH: Update contact
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const auth = await authAndDb(request, locals);
    if ('error' in auth) return auth.error as Response;
    const { db } = auth;

    const body = await request.json() as {
      id?: number;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      notes?: string;
      company_name?: string | null;
      force_sync?: boolean;
    };
    if (!body.id) {
      return new Response(JSON.stringify({ error: 'Contact ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const existing = await db.prepare('SELECT * FROM contacts WHERE id = ?').bind(body.id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (body.first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(titleCase(body.first_name));
    }
    if (body.last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(titleCase(body.last_name) || null);
    }
    if (body.email !== undefined) {
      const email = normalizeEmail(body.email);
      // Check for duplicate email (excluding current contact)
      if (email) {
        const dup = await db.prepare('SELECT id FROM contacts WHERE LOWER(email) = ? AND id != ?').bind(email, body.id).first();
        if (dup) {
          return new Response(JSON.stringify({ error: 'Another contact with this email already exists', existing_id: (dup as any).id }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }
      }
      updates.push('email = ?');
      params.push(email || null);
    }
    if (body.phone !== undefined) {
      const phone = normalizePhone(body.phone);
      if (phone) {
        const dup = await db.prepare('SELECT id FROM contacts WHERE phone = ? AND id != ?').bind(phone, body.id).first();
        if (dup) {
          return new Response(JSON.stringify({ error: 'Another contact with this phone already exists', existing_id: (dup as any).id }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }
      }
      updates.push('phone = ?');
      params.push(phone || null);
    }
    if (body.address !== undefined) {
      updates.push('address = ?');
      params.push(body.address?.trim() || null);
    }
    if (body.city !== undefined) {
      updates.push('city = ?');
      params.push(titleCase(body.city) || null);
    }
    if (body.state !== undefined) {
      updates.push('state = ?');
      params.push(body.state?.trim().toUpperCase() || null);
    }
    if (body.zip !== undefined) {
      updates.push('zip = ?');
      params.push(body.zip?.trim() || null);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      params.push(body.notes || null);
    }
    if (body.company_name !== undefined) {
      updates.push('company_name = ?');
      params.push(body.company_name ? String(body.company_name).trim().slice(0, 200) || null : null);
    }

    // force_sync lets the admin re-push current contact data to all linked
    // records without making any field change — useful for legacy mismatches
    // where the contact and project drifted at creation time.
    const forceSync = body.force_sync === true;

    if (updates.length === 0 && !forceSync) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(body.id);
      await db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    }
    const contact = await db.prepare('SELECT * FROM contacts WHERE id = ?').bind(body.id).first() as any;

    // Sync contact fields back to all linked leads, quotes, projects
    const anyFieldChanged = body.first_name !== undefined || body.last_name !== undefined ||
      body.email !== undefined || body.phone !== undefined || body.zip !== undefined ||
      body.address !== undefined || body.city !== undefined || body.state !== undefined ||
      body.company_name !== undefined;

    if (anyFieldChanged || forceSync) {
      const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
      // Build full address string for leads/quotes/projects
      const addrParts = [contact.address, contact.city, contact.state, contact.zip].filter(Boolean);
      const fullAddress = addrParts.join(', ');

      const links = await db.prepare('SELECT link_type, link_id FROM contact_links WHERE contact_id = ?').bind(body.id).all();
      for (const link of (links.results || []) as any[]) {
        if (link.link_type === 'lead') {
          await db.prepare(`UPDATE leads SET customer_name = ?, customer_email = ?, customer_phone = ?, address = ?, city = ?, state = ?, zip = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(fullName, contact.email || null, contact.phone || null, contact.address || null, contact.city || null, contact.state || null, contact.zip || null, link.link_id).run();
        } else if (link.link_type === 'quote') {
          await db.prepare(`UPDATE quotes SET customer_name = ?, customer_email = ?, customer_phone = ?, address = ?, city = ?, state = ?, zip = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(fullName, contact.email || null, contact.phone || null, contact.address || null, contact.city || null, contact.state || null, contact.zip || null, link.link_id).run();
        } else if (link.link_type === 'project') {
          await db.prepare(`UPDATE projects SET customer_name = ?, customer_email = ?, customer_phone = ?, customer_address = ?, customer_city = ?, customer_state = ?, customer_zip = ?, company_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(fullName, contact.email || null, contact.phone || null, contact.address || null, contact.city || null, contact.state || null, contact.zip || null, contact.company_name || null, link.link_id).run();
        }
      }
      console.log(`[Contacts] Synced contact ${body.id} → ${(links.results || []).length} linked records`);
    }

    return new Response(JSON.stringify({ success: true, contact }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error updating contact:', error);
    return new Response(JSON.stringify({ error: 'Failed to update contact' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// DELETE: Delete contact and its links
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const auth = await authAndDb(request, locals);
    if ('error' in auth) return auth.error as Response;
    const { db } = auth;

    const reqUrl = new URL(request.url);
    const contactId = reqUrl.searchParams.get('id');
    if (!contactId) {
      return new Response(JSON.stringify({ error: 'Contact ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const existing = await db.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Delete links first, then contact
    await db.prepare('DELETE FROM contact_links WHERE contact_id = ?').bind(contactId).run();
    await db.prepare('DELETE FROM contacts WHERE id = ?').bind(contactId).run();

    console.log(`[Contacts] Deleted contact ${contactId}: ${(existing as any).first_name} ${(existing as any).last_name || ''}`);

    return new Response(JSON.stringify({ success: true, message: 'Contact deleted' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error deleting contact:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete contact' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
