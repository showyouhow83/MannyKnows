// Contacts Export - Google Ads Customer Match CSV
// GET: Download CSV file
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../../lib/adminAuth';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const db = env?.MK_APP_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    // Fetch all contacts that have at least email or phone
    const result = await db.prepare(`
      SELECT first_name, last_name, email, phone, country, zip
      FROM contacts
      WHERE email IS NOT NULL OR phone IS NOT NULL
      ORDER BY created_at ASC
    `).all();

    const contacts = (result.results || []) as any[];

    // Build CSV - Google Ads Customer Match format
    const header = 'Email,First Name,Last Name,Country,Zip,Phone';
    const rows = contacts
      .filter(c => c.email || c.phone) // Skip contacts with neither
      .map(c => {
        const email = (c.email || '').toLowerCase();
        const firstName = (c.first_name || '').toLowerCase();
        const lastName = (c.last_name || '').toLowerCase();
        const country = (c.country || 'US').toUpperCase();
        const zip = (c.zip || '').trim();
        const phone = c.phone || '';
        return `${csvEscape(email)},${csvEscape(firstName)},${csvEscape(lastName)},${csvEscape(country)},${csvEscape(zip)},${csvEscape(phone)}`;
      });

    const csv = [header, ...rows].join('\n');
    const filename = `mannyknows-contacts-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });

  } catch (error) {
    console.error('Error exporting contacts:', error);
    return new Response(JSON.stringify({ error: 'Export failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

function csvEscape(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
