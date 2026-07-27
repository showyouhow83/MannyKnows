// Lead Capture API Endpoint - Unified D1 Storage
// Captures leads from Quote Modal, Remi chat, and other sources
// POST: Public (form submissions)
// GET/PATCH/DELETE: Admin auth required
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { Resend } from 'resend';
import { findOrCreateContact, unlinkContact } from '../../../lib/contacts';
import { normName, lowercaseEmail } from '../../../lib/textNorm';
import { notifyAdmin } from '../../../lib/notify-admin';
import { secureToken, secureCode } from '../../../utils/token';
import { kvRateLimit, clientIp } from '../../../lib/rateLimit';
import { SERVICE_LABELS } from '../../../data/serviceTypes';

interface LeadCaptureRequest {
  // Customer info
  name: string;
  email?: string;
  phone?: string;

  // Location
  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  // Service request
  service_type?: string;
  project_description?: string;
  project_images?: string[];

  // Scheduling
  preferred_date?: string;
  preferred_time?: string;
  preferred_contact_time?: string;

  // Property info (Quote Modal)
  year_built?: string;

  // Project specs (Quote Modal)
  surface_types?: string;
  repairs_needed?: string;
  timeline?: string;

  // Financial
  financing_interest?: boolean;

  // Remi context
  conversation_summary?: string;

  // Source
  source: string; // validated at runtime against validSources

  // Legacy field mapping (from old Quote Modal)
  service?: string;      // maps to service_type
  details?: string;      // maps to project_description
  repairs?: string;      // maps to repairs_needed
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;

    if (!db) {
      console.error('D1 database binding not available');
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Throttle public lead submissions (per IP) to prevent CRM flooding / spam.
    if (!(await kvRateLimit(env?.MK_ADMIN_KV as any, `lead:${clientIp(request)}`, 10, 3600))) {
      return new Response(JSON.stringify({ success: false, error: 'Too many submissions. Please try again later.' }), {
        status: 429, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: LeadCaptureRequest = await request.json() as any;

    // Validate required fields
    if (!body.name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!body.email && !body.phone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'At least one contact method (email or phone) is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate source. CTA buttons send granular attribution slugs
    // ('home-hero', 'location-springfield-cta', …) via data-quote-source, so
    // an enum here would 400 legitimate submissions (it did — every modal
    // submit from a CTA failed). Validate shape only and store the slug
    // verbatim; the admin UI and emails already fall back to the raw string
    // for sources outside their label maps.
    let source = body.source === 'quote-form-modal' ? 'quote-form' : body.source;
    if (!source || typeof source !== 'string' || !/^[a-z0-9][a-z0-9 _-]{0,63}$/i.test(source)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'source must be a short identifier (letters, digits, dashes)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Detect localhost/test environment and label source accordingly
    const host = request.headers.get('host') || '';
    const isLocalTest = host.includes('localhost') || host.includes('127.0.0.1');
    if (isLocalTest) {
      source = `${source} (test)`;
    }

    // Normalize field names (handle legacy Quote Modal fields)
    const serviceType = body.service_type || body.service || 'general';
    const projectDescription = body.project_description || body.details;

    // Generate confirmation code and token (same format as Remi; CSPRNG)
    const timestamp = Date.now().toString(36).toUpperCase();
    const confirmationCode = `MK-${timestamp}-${secureCode(4)}`;

    // Generate secure token for confirmation link (128-bit CSPRNG hex)
    const confirmationToken = secureToken(16);

    // Parse address to extract city, state, and zip if not provided
    let city = body.city;
    let state = body.state;
    let zip = body.zip;
    let address = body.address?.trim() || '';

    if (address) {
      // Extract zipcode (5 digits, optionally followed by -4 more)
      const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
      if (zipMatch && !zip) {
        zip = zipMatch[1];
      }

      // Extract state (2-letter abbreviation or full name)
      const stateAbbreviations: Record<string, string> = {
        'massachusetts': 'MA', 'ma': 'MA',
        'connecticut': 'CT', 'ct': 'CT',
        'new hampshire': 'NH', 'nh': 'NH',
        'vermont': 'VT', 'vt': 'VT',
        'rhode island': 'RI', 'ri': 'RI',
        'maine': 'ME', 'me': 'ME',
        'new york': 'NY', 'ny': 'NY',
      };

      if (!state) {
        // Try to find state abbreviation (2 uppercase letters before zip or at end)
        const stateAbbrMatch = address.match(/\b([A-Z]{2})\s*(?:\d{5}|$)/i);
        if (stateAbbrMatch) {
          const abbr = stateAbbrMatch[1].toUpperCase();
          state = stateAbbreviations[abbr.toLowerCase()] || abbr;
        } else {
          // Try to find full state name
          const lowerAddress = address.toLowerCase();
          for (const [name, abbr] of Object.entries(stateAbbreviations)) {
            if (name.length > 2 && lowerAddress.includes(name)) {
              state = abbr;
              break;
            }
          }
        }
      }

      // If still no state but we have a zipcode, derive state from zip prefix
      if (!state && zip) {
        const zipPrefix = parseInt(zip.substring(0, 3), 10);
        if (zipPrefix >= 10 && zipPrefix <= 27) state = 'MA';
        else if (zipPrefix >= 28 && zipPrefix <= 29) state = 'RI';
        else if (zipPrefix >= 30 && zipPrefix <= 38) state = 'NH';
        else if (zipPrefix >= 39 && zipPrefix <= 49) state = 'ME';
        else if (zipPrefix >= 50 && zipPrefix <= 59) state = 'VT';
        else if (zipPrefix >= 60 && zipPrefix <= 69) state = 'CT';
        // NY zipcodes are 100xx-149xx, but too broad - leave as null for manual review
      }

      // Extract city from address like "72 Kipling st, Springfield MA 01118"
      if (!city) {
        const parts = address.split(',');
        if (parts.length >= 2) {
          // Get the part after the first comma, before state/zip
          const cityPart = parts[1].trim();
          // Remove state and zip to get just the city
          city = cityPart.replace(/\s*[A-Z]{2}\s*\d{5}(-\d{4})?$/i, '').trim();
          // If city still has state name, remove it
          for (const stateName of Object.keys(stateAbbreviations)) {
            if (stateName.length > 2) {
              const regex = new RegExp(`\\s*${stateName}\\s*$`, 'i');
              city = city.replace(regex, '').trim();
            }
          }
        }
      }
    }

    // Insert into D1 (v36 schema)
    const result = await db.prepare(`
      INSERT INTO leads (
        confirmation_code, confirmation_token,
        customer_name, customer_email, customer_phone,
        address, city, state, zip,
        service_type, preferred_date, preferred_time,
        project_description, conversation_summary, project_images,
        financing_interest, status, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      confirmationCode,
      confirmationToken,
      normName(body.name),
      lowercaseEmail(body.email) || 'noemail@placeholder.com',
      body.phone?.trim() || null,
      address || '',
      city || '',
      state || null,
      zip || null,
      serviceType,
      body.preferred_date?.trim() || 'TBD',
      body.preferred_time?.trim() || 'TBD',
      projectDescription?.trim() || null,
      body.conversation_summary?.trim() || null,
      body.project_images ? JSON.stringify(body.project_images) : null,
      body.financing_interest ? 1 : 0,
      'pending_confirmation', // All leads require email confirmation
      source
    ).run();

    const leadId = result.meta.last_row_id;

    console.log(`[Lead] New lead captured: ID ${leadId} - ${body.name} (${source})`);

    // Auto-create/link contact
    try {
      await findOrCreateContact(db, {
        name: body.name,
        email: body.email,
        phone: body.phone,
        zip: zip || undefined,
        address: address || undefined,
        source: source,
      }, { type: 'lead', id: leadId as number });
    } catch (contactErr) {
      console.error('[Lead] Failed to create/link contact:', contactErr);
    }

    // Alert admin (email + SMS). Additive + best-effort.
    try {
      await notifyAdmin(env, {
        subject: 'New lead',
        body: `${body.name}${city ? ` — ${city}` : ''}${body.phone ? ` — ${body.phone}` : ''}\nService: ${serviceType}`,
        link: `/admin/leads?open=${leadId}`,
      });
    } catch (e) { console.error('[Lead] admin notify failed:', e); }

    // Send email notification
    const resendApiKey = env?.RESEND_API_KEY;
    const notificationEmail = env?.NOTIFICATION_EMAIL || 'mm@mannyknows.com';

    if (resendApiKey && notificationEmail) {
      const resend = new Resend(resendApiKey);

      try {

        const sourceLabels: Record<string, string> = {
          'quote-form': 'Quote Form',
          'footer-form': 'Footer Quote Form',
          'remi-chat': 'Remi chat',
          'phone': 'Phone Call',
          'referral': 'Referral',
          'other': 'Other'
        };
        const sourceLabel = sourceLabels[source] || source;

        // Normalize repairs_needed (handle legacy field name)
        const repairsNeeded = body.repairs_needed || body.repairs;

        const tableRows = [
          { label: 'Name', value: body.name, bold: true },
          { label: 'Email', value: body.email || 'Not provided' },
          { label: 'Phone', value: body.phone || 'Not provided' },
          body.address ? { label: 'Address', value: body.address } : null,
          body.city ? { label: 'City', value: body.city } : null,
          body.year_built ? { label: 'Year Built', value: body.year_built } : null,
          body.surface_types ? { label: 'Surfaces', value: body.surface_types } : null,
          repairsNeeded ? { label: 'Repairs Needed', value: repairsNeeded } : null,
          serviceType ? { label: 'Service', value: SERVICE_LABELS[serviceType] || serviceType } : null,
          body.preferred_date ? { label: 'Preferred Date', value: body.preferred_date } : null,
          body.preferred_time ? { label: 'Preferred Time', value: body.preferred_time } : null,
          projectDescription ? { label: 'Details', value: projectDescription } : null,
          body.project_images?.length ? { label: 'Photos', value: `${body.project_images.length} photo(s) attached` } : null,
          body.financing_interest ? { label: 'Financing', value: 'Interested in financing' } : null,
          { label: 'Source', value: sourceLabel },
          { label: 'Received', value: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) }
        ].filter(Boolean);

        const tableHtml = tableRows.map((row, i) => {
          const isLast = i === tableRows.length - 1;
          const borderStyle = isLast ? '' : 'border-bottom: 1px solid #e2e8f0;';
          const fontWeight = row!.bold ? 'font-weight: 600;' : '';
          return `<tr>
            <td style="padding: 12px 0; ${borderStyle} color: #64748b; font-size: 14px; width: 100px;">${row!.label}</td>
            <td style="padding: 12px 0; ${borderStyle} color: #1e293b; font-size: 14px; ${fontWeight}">${row!.value}</td>
          </tr>`;
        }).join('');

        await resend.emails.send({
          from: 'MK Lead Alerts <leads@send.mannyknows.com>',
          to: notificationEmail,
          subject: `New Lead: ${body.name} - ${sourceLabel}`,
          html: `
<div style="max-width: 700px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #ff781d 0%, #ff781d 40%, #6366f1 70%, #f263be 100%); padding: 40px 30px 36px; text-align: center;">
    <div style="margin-bottom: 4px;">
      <img src="https://mannyknows.com/favicon.svg" alt="MannyKnows" width="44" height="44" style="display: inline-block; vertical-align: middle; margin-right: 10px;" />
      <span style="font-size: 30px; font-weight: 700; color: #ffffff; letter-spacing: -1px; vertical-align: middle;">MannyKnows</span>
    </div>
  </div>
  <div style="height: 4px; background: linear-gradient(90deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);"></div>
  <div style="padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">NEW LEAD</div>
    </div>
    <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">${body.name}</h1>
    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
      A new lead has come in from <strong style="color: #1e293b;">${sourceLabel}</strong>. Contact them soon!
    </p>
    <div style="text-align: center; margin: 30px 0;">
      ${body.phone ? `<a href="tel:${body.phone.replace(/[^0-9]/g, '')}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 0 8px 8px 0;">📞 Call Now</a>` : ''}
      ${body.email ? `<a href="mailto:${body.email}" style="display: inline-block; background: linear-gradient(135deg, #ff781d 0%, #6366f1 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">✉️ Send Email</a>` : ''}
    </div>
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 20px 0;">Lead Details</h2>
      <table style="width: 100%; border-collapse: collapse;">${tableHtml}</table>
    </div>
    <div style="text-align: center; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #ffd700;">
      <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Lead ID:</strong> ${leadId}</p>
    </div>
  </div>
  <div style="background: linear-gradient(135deg, #ff781d 0%, #ff781d 40%, #6366f1 70%, #f263be 100%); padding: 30px; text-align: center;">
    <div style="margin-bottom: 16px;"><span style="font-size: 20px; font-weight: 700; color: #ffffff;">MannyKnows</span></div>
    <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.9); font-size: 13px;">Websites, SEO, AI Agents &amp; Apps — Springfield, MA</p>
    <div style="margin: 16px 0;">
      <a href="https://mannyknows.com" style="color: #ffd700; font-size: 14px; text-decoration: none; font-weight: 600;">mannyknows.com</a>
      <span style="color: rgba(255,255,255,0.5); margin: 0 8px;">|</span>
      <a href="tel:4133618451" style="color: rgba(255,255,255,0.9); font-size: 14px; text-decoration: none;">(413) 361-8451</a>
    </div>
  </div>
</div>
          `,
          text: `NEW LEAD: ${body.name}\n\nEmail: ${body.email || 'Not provided'}\nPhone: ${body.phone || 'Not provided'}\nAddress: ${body.address || 'Not provided'}\nService: ${SERVICE_LABELS[serviceType] || serviceType || 'Not specified'}\nPreferred Date: ${body.preferred_date || 'Not specified'}\nPreferred Time: ${body.preferred_time || 'Not specified'}\nDetails: ${projectDescription || 'None'}\nSource: ${source}\n\nLead ID: ${leadId}\n\n---\nMannyKnows | mannyknows.com | (413) 361-8451`
        });

        console.log(`[Lead] Email notification sent for lead ${leadId}`);
      } catch (emailError) {
        console.error('[Lead] Failed to send email notification:', emailError);
      }

      // Send confirmation email to customer (same as Manny)
      if (body.email && body.email !== 'noemail@placeholder.com') {
        try {
          // Shared canonical service list; a custom/legacy value falls back to
          // its own text, and the generic default reads as "Home Services".
          const serviceName = SERVICE_LABELS[serviceType]
            || (serviceType && serviceType !== 'general' ? serviceType : 'Home Services');
          const firstName = body.name.trim().split(' ')[0];
          // Dynamic URL: localhost gets http://localhost, production gets https://mannyknows.com
          const protocol = isLocalTest ? 'http' : 'https';
          const confirmUrl = `${protocol}://${host}/confirm/${confirmationToken}`;
          const fullAddress = [body.address, body.city, body.state || 'MA', body.zip].filter(Boolean).join(', ');

          await resend.emails.send({
            from: 'MannyKnows <bookings@send.mannyknows.com>',
            to: body.email.trim(),
            subject: `Confirm Your Appointment - ${confirmationCode}`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5;">
  <div style="max-width: 700px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #ff781d 0%, #ff781d 40%, #6366f1 70%, #f263be 100%); padding: 40px 30px 36px; text-align: center;">
      <div style="margin-bottom: 4px;">
        <img src="https://mannyknows.com/favicon.svg" alt="" width="48" height="48" style="display: inline-block; vertical-align: middle; margin-right: 12px;" />
        <span style="font-size: 34px; font-weight: 700; color: #ffffff; letter-spacing: -1px; vertical-align: middle;">MannyKnows</span>
      </div>
    </div>
    <div style="height: 4px; background: linear-gradient(90deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);"></div>
    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #ff781d 0%, #6366f1 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">
          CONFIRMATION #${confirmationCode}
        </div>
      </div>
      <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">You're Almost Set!</h1>
      <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
        Hi <strong style="color: #1e293b;">${firstName}</strong>, thank you for choosing MannyKnows! Please confirm your appointment by clicking the button below.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: #ffffff; padding: 18px 48px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; letter-spacing: 0.5px;">
          Confirm My Appointment
        </a>
      </div>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-left: 4px solid #ffd700; padding: 16px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>Please confirm within 24 hours</strong> to secure your time slot.
        </p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 20px 0;">Appointment Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; width: 120px;">Service</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${serviceName}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Date</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${body.preferred_date || 'TBD'}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Time</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${body.preferred_time || 'TBD'}</td></tr>
          <tr><td style="padding: 12px 0; color: #64748b; font-size: 14px; vertical-align: top;">Location</td><td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${fullAddress || 'Not provided'}</td></tr>
          ${projectDescription ? `<tr><td style="padding: 12px 0; color: #64748b; font-size: 14px; vertical-align: top;">Notes</td><td style="padding: 12px 0; color: #1e293b; font-size: 14px;">${projectDescription}</td></tr>` : ''}
        </table>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0;">What happens next?</h3>
        <table style="margin: 0 auto; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; vertical-align: top; width: 40px;"><div style="width: 28px; height: 28px; background: linear-gradient(135deg, #ff781d 0%, #6366f1 100%); border-radius: 50%; color: white; font-size: 14px; font-weight: 700; text-align: center; line-height: 28px;">1</div></td><td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">Click the confirm button above</td></tr>
          <tr><td style="padding: 8px 0; vertical-align: top;"><div style="width: 28px; height: 28px; background: linear-gradient(135deg, #ff781d 0%, #6366f1 100%); border-radius: 50%; color: white; font-size: 14px; font-weight: 700; text-align: center; line-height: 28px;">2</div></td><td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">We'll call to finalize the exact time</td></tr>
          <tr><td style="padding: 8px 0; vertical-align: top;"><div style="width: 28px; height: 28px; background: linear-gradient(135deg, #ff781d 0%, #6366f1 100%); border-radius: 50%; color: white; font-size: 14px; font-weight: 700; text-align: center; line-height: 28px;">3</div></td><td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">You'll receive a reminder 24 hours before</td></tr>
        </table>
      </div>
      <div style="text-align: center; border-top: 1px solid #e2e8f0; margin-top: 30px; padding: 24px 0 0 0;">
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Need to reschedule?</p>
        <a href="tel:4133618451" style="color: #ff781d; font-size: 20px; font-weight: 700; text-decoration: none;">(413) 361-8451</a>
      </div>
    </div>
    <div style="background: linear-gradient(135deg, #ff781d 0%, #ff781d 40%, #6366f1 70%, #f263be 100%); padding: 30px; text-align: center;">
      <div style="margin-bottom: 16px;"><span style="font-size: 20px; font-weight: 700; color: #ffffff;">MannyKnows</span></div>
      <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.9); font-size: 13px;">Websites, SEO, AI Agents &amp; Apps — Springfield, MA</p>
      <div style="margin: 16px 0;">
        <a href="https://mannyknows.com" style="color: #ffd700; font-size: 14px; text-decoration: none; font-weight: 600;">mannyknows.com</a>
        <span style="color: rgba(255,255,255,0.5); margin: 0 8px;">|</span>
        <a href="tel:4133618451" style="color: rgba(255,255,255,0.9); font-size: 14px; text-decoration: none;">(413) 361-8451</a>
      </div>
    </div>
  </div>
</body>
</html>`,
            text: `Confirm Your Appointment - ${confirmationCode}

Hi ${firstName},

Thank you for scheduling a free estimate with MannyKnows! Please click the link below to confirm your appointment:

${confirmUrl}

IMPORTANT: Your appointment is not confirmed until you click this link.

APPOINTMENT DETAILS:
- Service: ${serviceName}
- Date: ${body.preferred_date || 'TBD'}
- Time: ${body.preferred_time || 'TBD'}
- Location: ${fullAddress || 'Not provided'}
${projectDescription ? `- Project Notes: ${projectDescription}` : ''}

What happens next?
1. Click the confirm link above
2. We'll call you to finalize the exact time
3. You'll receive a reminder 24 hours before

Need to reschedule? Call (413) 361-8451

---
MannyKnows | Springfield, MA
(413) 361-8451 | https://mannyknows.com`
          });

          console.log(`[Lead] Confirmation email sent to ${body.email}`);
        } catch (confirmEmailError) {
          console.error('[Lead] Failed to send confirmation email:', confirmEmailError);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Lead captured successfully. Check your email to confirm.',
      lead_id: leadId,
      confirmation_code: confirmationCode
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error capturing lead:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to capture lead'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET endpoint to retrieve leads (admin only)
export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - admin authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = env?.MK_APP_DB;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const status = url.searchParams.get('status');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM leads';
    const params: string[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const result = await db.prepare(query).bind(...params, limit, offset).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM leads';
    if (status) {
      countQuery += ' WHERE status = ?';
    }
    const countResult = await db.prepare(countQuery).bind(...(status ? [status] : [])).first<{ total: number }>();

    return new Response(JSON.stringify({
      success: true,
      leads: result.results,
      total: countResult?.total || 0,
      showing: result.results.length,
      offset
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch leads'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH endpoint to update lead (admin only)
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - admin authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = env?.MK_APP_DB;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as { lead_id?: number; id?: number; status?: string; notes?: string };
    // The admin leads UI sends `id`; older callers send `lead_id`. Accept both.
    const lead_id = body.lead_id ?? body.id;
    const { status, notes } = body;

    if (!lead_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'lead_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Full lead lifecycle (schema statuses) + legacy CRM labels.
    const validStatuses = [
      'pending_confirmation', 'confirmed', 'promoted', 'scheduled', 'completed', 'cancelled',
      'new', 'contacted', 'qualified', 'converted', 'lost',
    ];
    if (status && !validStatuses.includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update query
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      // Confirming a lead stamps confirmed_at (mirrors the public confirm flow).
      if (status === 'confirmed') {
        updates.push('confirmed_at = CURRENT_TIMESTAMP');
      }
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');

    params.push(lead_id);

    await db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

    // Fetch updated lead
    const updated = await db.prepare('SELECT * FROM leads WHERE id = ?').bind(lead_id).first();

    console.log(`[Lead] Lead ${lead_id} updated: status → ${status || 'unchanged'}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Lead updated successfully',
      lead: updated
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update lead'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE endpoint to remove a lead (admin only)
export const DELETE: APIRoute = async ({ request, locals, url }) => {
  try {
    const env = locals.runtime?.env;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);
    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - admin authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = env?.MK_APP_DB;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Support both query param and body for lead_id
    const lead_id = url.searchParams.get('id') || ((await request.json().catch(() => ({}))) as any).lead_id;

    if (!lead_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'lead_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove contact link (keep contact for remarketing)
    try { await unlinkContact(db, 'lead', parseInt(lead_id as string)); } catch {}

    const result = await db.prepare('DELETE FROM leads WHERE id = ?').bind(lead_id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Lead not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Lead] Lead ${lead_id} deleted`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Lead deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting lead:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete lead'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
