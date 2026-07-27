// Quote Email Templates
// Sends branded emails for quote workflow using Resend API

import { Resend } from 'resend';
import { quoteToScopes, renderScopesHtml } from './quoteTemplateConstants';
import { type Brand, SL_BRAND, emailFrom } from './brand';

export interface Quote {
  id: number;
  quote_number: string;
  quote_token: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  services?: string;
  scope_description?: string;
  // Legacy pricing fields — kept only so the synthesis fallback in
  // quoteToScopes() can render pre-Phase-5 quotes that still hold their work
  // here. New quotes write template_sections; these stay null going forward.
  materials?: string;
  labor?: string;
  labor_total?: number;
  subtotal?: number;
  discount?: number;
  total?: number;
  estimated_start?: string;
  estimated_end?: string;
  estimated_duration?: string;
  contract_url?: string;            // legacy single-PDF field
  attachments?: QuoteAttachmentInfo[]; // multi-PDF list (preferred)
  template_sections?: string;       // v64 — JSON array of QuoteScope
}

// Customer-facing scope block. quoteToScopes() returns either the real scoped
// data or a synthesized scope built from legacy materials/labor (so quotes
// that pre-date Phase 5 still render content in the email).
function buildTemplateSectionsHtml(quote: Quote): string {
  const scopes = quoteToScopes(quote);
  if (!scopes.length) return '';
  const heading = scopes.length > 1 ? 'Scopes of Work' : 'Scope of Work';

  // Grand total. This used to live in the (now-removed) Quote Summary card —
  // render it at the foot of the Scope card so the customer still sees the
  // labor + materials total. Shows a discount line when one applies.
  const sub = Number(quote.subtotal) || 0;
  const disc = Number(quote.discount) || 0;
  const total = Number(quote.total) || 0;
  let totalBlock = '';
  if (total > 0) {
    const rows = disc > 0
      ? `<tr>
           <td style="padding:8px 0; text-align:left; color:#475569;">Total cost — labor and materials</td>
           <td style="padding:8px 0; text-align:right; font-weight:600; color:#1e293b; white-space:nowrap;">${formatCurrency(sub || total)}</td>
         </tr>
         <tr>
           <td style="padding:8px 0; text-align:left; color:#10b981;">Discount</td>
           <td style="padding:8px 0; text-align:right; color:#10b981; white-space:nowrap;">-${formatCurrency(disc)}</td>
         </tr>
         <tr>
           <td style="padding:12px 0 0; text-align:left; font-size:18px; font-weight:700; color:#1e293b; border-top:1px solid #cbd5e1;">Total</td>
           <td style="padding:12px 0 0; text-align:right; font-size:20px; font-weight:700; color:#ff781d; white-space:nowrap; border-top:1px solid #cbd5e1;">${formatCurrency(total)}</td>
         </tr>`
      : `<tr>
           <td style="padding:8px 0; text-align:left; font-size:17px; font-weight:700; color:#1e293b;">Total cost — labor and materials</td>
           <td style="padding:8px 0; text-align:right; font-size:20px; font-weight:700; color:#ff781d; white-space:nowrap;">${formatCurrency(total)}</td>
         </tr>`;
    totalBlock = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:18px; padding-top:8px; border-top:2px solid #cbd5e1;">
        ${rows}
      </table>`;
  }

  return `
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 16px 0;">${heading}</h2>
      ${renderScopesHtml(scopes)}
      ${totalBlock}
    </div>
  `;
}

export interface QuoteAttachmentInfo {
  id: number;
  label: string;
  file_url: string;
  file_name?: string | null;
}

export interface RenegotiationData {
  previousTotal: number;
  newTotal: number;
  customerFeedback?: string;
  declineReason?: string;
  revisionNumber: number;
  changesDescription?: string;
}

export interface QuoteEmailEnv {
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL: string;
}

// Service type labels — mirrors src/data/serviceTypes.ts (custom "other"
// services store their typed text as the value and fall through as-is).
const SERVICE_LABELS: Record<string, string> = {
  'kitchen_remodel': 'Kitchen Remodeling',
  'bathroom_remodel': 'Bathroom Remodeling',
  'interior_painting': 'Interior Painting',
  'flooring': 'Flooring',
  'general_repairs': 'General Repairs & Handyman',
  'other': 'Other Services'
};

// Format services array to readable string
function formatServices(servicesJson?: string): string {
  if (!servicesJson) return 'Home Services';
  try {
    const services = JSON.parse(servicesJson);
    // Handle both array of strings and array of objects with {type, scope}
    return services.map((s: string | { type?: string; service?: string; name?: string }) => {
      // If it's an object, extract the type/service/name field
      const serviceKey = typeof s === 'string' ? s : (s.type || s.service || s.name || String(s));
      return SERVICE_LABELS[serviceKey] || serviceKey;
    }).join(', ');
  } catch {
    return servicesJson;
  }
}

// Format currency. Quotes round cleanly to dollars — drop cents.
function formatCurrency(amount?: number): string {
  const n = Math.round(Number(amount) || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// Format date
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Get base URL for links
function getBaseUrl(isLocalhost = false): string {
  return isLocalhost ? 'http://localhost:4321' : 'https://mannyknows.com';
}

// Pull the attachment list off a Quote — prefer the new multi-attachment field,
// fall back to the legacy single contract_url so old quotes still render.
function getAttachmentList(quote: Quote): { label: string; file_url: string }[] {
  if (quote.attachments && quote.attachments.length > 0) {
    return quote.attachments.map(a => ({ label: a.label || 'Estimate', file_url: a.file_url }));
  }
  if (quote.contract_url) return [{ label: 'Quote PDF', file_url: quote.contract_url }];
  return [];
}

function renderAttachmentsHtml(quote: Quote): string {
  const list = getAttachmentList(quote);
  if (list.length === 0) return '';
  const buttons = list.map(a => `
    <a href="${a.file_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #ff781d 0%, #e05e00 100%); color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 6px 4px;">
      ${escapeHtml(a.label)} (PDF)
    </a>
  `).join('');
  const heading = list.length === 1 ? 'Quote Document' : 'Quote Documents';
  const blurb = list.length === 1
    ? 'A detailed quote document has been attached. Please review it before accepting.'
    : `${list.length} quote documents have been attached. Please review them before accepting.`;
  return `
    <!-- Quote PDFs -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0; text-align: center;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 12px 0;">${heading}</h2>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">${blurb}</p>
      <div>${buttons}</div>
    </div>
  `;
}

function renderAttachmentsText(quote: Quote): string {
  const list = getAttachmentList(quote);
  if (list.length === 0) return '';
  return '\n' + list.map(a => `${a.label.toUpperCase()}: ${a.file_url}`).join('\n');
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// MannyKnows logo (orange V + white L) — lives at public/logo.svg and
// needs a dark background to read, which is why our header/footer are dark.
const MK_LOGO_URL = 'https://mannyknows.com/logo.svg';

// Shared email header. Brand-aware:
//  - MK (headerStyle 'gradient'): dark header + MK logo + orange accent bar
//    (mirrors the site's dark header treatment)
//  - Partner (headerStyle 'light'): clean white header + their (white-bg) logo,
//    a single reusable white-label look shared across all partners.
export function emailHeader(subtitle?: string, brand: Brand = SL_BRAND): string {
  if (brand.headerStyle === 'light') {
    const logo = brand.logoUrl
      ? `<img src="${brand.logoUrl}" alt="${escapeHtml(brand.name)}" style="display:inline-block; max-width:260px; max-height:74px; height:auto;" />`
      : `<span style="font-size:26px; font-weight:700; color:#0f172a;">${escapeHtml(brand.name)}</span>`;
    return `
  <!-- Header (partner white-label) -->
  <div style="background:#ffffff; padding:32px 30px 26px; text-align:center; border-bottom:1px solid #e5e7eb;">
    ${brand.websiteUrl ? `<a href="${brand.websiteUrl}" style="display:inline-block; text-decoration:none;">${logo}</a>` : logo}
    ${subtitle ? `<div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-top: 12px;">${subtitle}</div>` : ''}
  </div>
  <div style="height: 3px; background: #0f172a;"></div>`;
  }
  // MK default. Dark header so the logo's white "L" reads; clients that
  // strip SVG (Outlook desktop) fall back to the alt text.
  return `
  <!-- Header -->
  <div style="background: #0f172a; padding: 40px 30px 36px; text-align: center;">
    <a href="${brand.websiteUrl}" style="display: inline-block; text-decoration: none;">
      <img src="${MK_LOGO_URL}" alt="${escapeHtml(brand.name)}" width="155" height="60" style="display: inline-block; max-width: 155px; height: auto;" />
    </a>
    ${subtitle ? `<div style="font-size: 13px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 2px; margin-top: 14px;">${subtitle}</div>` : ''}
  </div>
  <!-- Orange Accent Bar -->
  <div style="height: 4px; background: #ff781d;"></div>`;
}

// Shared email footer. Brand-aware (see emailHeader). The "need help" contact
// strip is MK-only; partners get a clean neutral footer with their own
// contact details. (`showEli` kept as the option name for caller compat —
// it now toggles the plain contact strip, not an AI-assistant blurb.)
export function emailFooter(options?: { showEli?: boolean }, brand: Brand = SL_BRAND): string {
  if (brand.headerStyle === 'light') {
    const addr = brand.addressLines.length
      ? `<p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 12px;">${brand.addressLines.map(escapeHtml).join('<br>')}</p>` : '';
    const contactBits: string[] = [];
    if (brand.websiteLabel) contactBits.push(`<a href="${brand.websiteUrl}" style="color:#cbd5e1; font-size:13px; text-decoration:none;">${escapeHtml(brand.websiteLabel)}</a>`);
    if (brand.phoneDisplay) contactBits.push(`<a href="tel:${brand.phoneTel}" style="color:#cbd5e1; font-size:13px; text-decoration:none;">${escapeHtml(brand.phoneDisplay)}</a>`);
    if (brand.contactEmail) contactBits.push(`<a href="mailto:${brand.contactEmail}" style="color:#cbd5e1; font-size:13px; text-decoration:none;">${escapeHtml(brand.contactEmail)}</a>`);
    return `
  <!-- Footer (partner white-label) -->
  <div style="background: #0f172a; padding: 28px 30px; text-align: center;">
    <div style="color: #ffffff; font-size: 16px; font-weight: 700; margin-bottom: 8px;">${escapeHtml(brand.name)}</div>
    ${contactBits.length ? `<div style="margin: 6px 0;">${contactBits.join('<span style="color:#475569; margin:0 8px;">|</span>')}</div>` : ''}
    ${addr}
  </div>`;
  }

  const helpSection = options?.showEli ? `
  <!-- Contact strip -->
  <div style="padding: 24px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
    <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">Need help? We're a call away</div>
    <div style="font-size: 13px; color: #64748b; line-height: 1.5;">Call <a href="tel:4133618451" style="color: #ff781d; text-decoration: none; font-weight: 600;">(413) 361-8451</a> or email <a href="mailto:mm@mannyknows.com" style="color: #ff781d; text-decoration: none; font-weight: 600;">mm@mannyknows.com</a></div>
  </div>` : '';

  return `${helpSection}
  <!-- Footer -->
  <div style="background: #0f172a; padding: 32px 30px; text-align: center;">
    <a href="https://mannyknows.com" style="display: inline-block; text-decoration: none; margin-bottom: 14px;">
      <img src="${MK_LOGO_URL}" alt="MannyKnows" width="129" height="50" style="display: inline-block; max-width: 129px; height: auto;" />
    </a>
    <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.9); font-size: 13px;">
      Remodeling, Painting &amp; Home Repairs &mdash; Springfield, MA
    </p>
    <div style="margin: 12px 0;">
      <a href="https://mannyknows.com" style="color: #ff781d; font-size: 14px; text-decoration: none; font-weight: 600;">mannyknows.com</a>
      <span style="color: rgba(255,255,255,0.5); margin: 0 8px;">|</span>
      <a href="tel:4133618451" style="color: rgba(255,255,255,0.9); font-size: 14px; text-decoration: none;">(413) 361-8451</a>
    </div>
  </div>`;
}

// Shared email wrapper (opening tags)
export function emailOpen(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0;">
<div style="max-width: 700px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff;">`;
}

// Shared email wrapper (closing tags)
export function emailClose(): string {
  return `</div>
</body>
</html>`;
}

// Standard CTA button. ('blue' key kept for caller compat — renders the
// MK orange brand gradient.)
export function emailButton(href: string, text: string, color: 'blue' | 'green' | 'purple' | 'gray' = 'blue'): string {
  const gradients: Record<string, string> = {
    blue: 'linear-gradient(135deg, #ff781d 0%, #e05e00 100%)',
    green: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    gray: '#f1f5f9'
  };
  const textColor = color === 'gray' ? '#64748b' : '#ffffff';
  return `<a href="${href}" style="display: inline-block; background: ${gradients[color]}; color: ${textColor}; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">${text}</a>`;
}

// Legacy materials/labor render helpers retired in Phase 5 — every quote now
// flows through buildTemplateSectionsHtml() which renders scopes.

/**
 * Send quote to customer with accept/decline buttons
 */
export async function sendQuoteToCustomer(
  quote: Quote,
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);

  const firstName = quote.customer_name.split(' ')[0];
  const servicesText = formatServices(quote.services);
  // Quote-template scopes are the customer's view of the work.
  const sectionsHtml = buildTemplateSectionsHtml(quote);

  // Build address string - use only address + state + zip (city is typically in address already)
  const addressParts = [quote.address, quote.state, quote.zip].filter(Boolean);
  const fullAddress = addressParts.join(', ') || 'Address on file';

  // Accept and decline URLs
  const acceptUrl = `${baseUrl}/quote/accept/${quote.quote_token}`;
  const declineUrl = `${baseUrl}/quote/decline/${quote.quote_token}`;

  const html = `
${emailOpen()}

  ${emailHeader(undefined, brand)}

  <!-- Main Content -->
  <div style="padding: 40px 30px;">

    <!-- Quote Badge -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #ff781d 0%, #e05e00 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">
        QUOTE #${quote.quote_number}
      </div>
    </div>

    <!-- Greeting -->
    <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
      Your Free Quote is Ready!
    </h1>

    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
      Hi <strong style="color: #1e293b;">${firstName}</strong>, thank you for speaking with us! We've prepared your personalized quote for review.
    </p>

    <!-- Scope of Work -->
    ${sectionsHtml}

    <!-- CTA Buttons (placed below the scope of work) -->
    <div style="text-align: center; margin: 30px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
        You can open the PDF document to view the details of your project
      </p>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8;">
        Puede abrir el documento PDF para ver los detalles de su proyecto
      </p>
      <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; letter-spacing: 0.5px; margin: 0 8px 12px 8px;">
        <span style="display:inline-block;background:#dc2626;color:#fff;font-size:10px;font-weight:800;padding:2px 5px;border-radius:3px;margin-right:6px;vertical-align:middle;letter-spacing:0.5px;">PDF</span> Review & Accept
      </a>
      <a href="${declineUrl}" style="display: inline-block; background: #f1f5f9; color: #64748b; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; letter-spacing: 0.5px; margin: 0 8px 12px 8px; border: 1px solid #e2e8f0;">
        Review & Decline
      </a>
    </div>

    <!-- Validity Note -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-left: 4px solid #ff781d; padding: 16px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>This quote is valid for 7 days.</strong> Review and respond at your convenience.
      </p>
    </div>

    <!-- Quote Document -->
    ${renderAttachmentsHtml(quote)}

    <!-- What's Next Section -->
    <div style="margin: 30px 0;">
      <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0;">What happens next?</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 40px;">
            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #ff781d 0%, #e05e00 100%); border-radius: 50%; color: white; font-size: 14px; font-weight: 700; text-align: center; line-height: 28px;">1</div>
          </td>
          <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">Click "Accept Quote" above to confirm</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #ff781d 0%, #e05e00 100%); border-radius: 50%; color: white; font-size: 14px; font-weight: 700; text-align: center; line-height: 28px;">2</div>
          </td>
          <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">Track your project progress online</td>
        </tr>
      </table>
    </div>

    <!-- Contact Section -->
    <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e2e8f0; margin-top: 30px;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Questions about this quote?</p>
      <a href="tel:${brand.phoneTel}" style="color: #ff781d; font-size: 20px; font-weight: 700; text-decoration: none;">${brand.phoneDisplay}</a>
    </div>
  </div>

  ${emailFooter({ showEli: true }, brand)}
${emailClose()}
  `;

  const text = `
YOUR QUOTE FROM ${brand.name.toUpperCase()}
Quote #${quote.quote_number}

Hi ${firstName},

Thank you for speaking with us! Here's your personalized quote:

SERVICES: ${servicesText}
LOCATION: ${fullAddress}
${quote.estimated_duration ? `TIMELINE: ${quote.estimated_duration}` : ''}
${quote.estimated_start ? `START DATE: ${formatDate(quote.estimated_start)}` : ''}

TOTAL: ${formatCurrency(quote.total)}
${renderAttachmentsText(quote)}
Review and respond on our website:
To accept: ${acceptUrl}
To decline: ${declineUrl}

This quote is valid for 7 days.

Questions? Call us at ${brand.phoneDisplay}

---
${brand.name} | ${brand.websiteLabel} | ${brand.phoneDisplay}
  `.trim();

  try {
    await resend.emails.send({
      from: emailFrom(brand, 'quotes'),
      replyTo: 'mm@mannyknows.com',
      to: quote.customer_email,
      subject: `Your Quote from ${brand.name} - #${quote.quote_number}`,
      html,
      text
    });

    return { success: true };
  } catch (error) {
    console.error('[QuoteEmail] Failed to send quote email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send RENEGOTIATED quote to customer - distinct template to avoid Gmail collapsing
 */
export async function sendRenegotiatedQuoteToCustomer(
  quote: Quote,
  renegotiation: RenegotiationData,
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);

  const firstName = quote.customer_name.split(' ')[0];
  const servicesText = formatServices(quote.services);
  // Quote-template scopes are the customer's view of the work.
  const sectionsHtml = buildTemplateSectionsHtml(quote);

  // Build address string
  const addressParts = [quote.address, quote.state, quote.zip].filter(Boolean);
  const fullAddress = addressParts.join(', ') || 'Address on file';

  // Accept and decline URLs
  const acceptUrl = `${baseUrl}/quote/accept/${quote.quote_token}`;
  const declineUrl = `${baseUrl}/quote/decline/${quote.quote_token}`;

  // Calculate savings
  const savings = renegotiation.previousTotal - renegotiation.newTotal;
  const savingsText = savings > 0 ? `Save ${formatCurrency(savings)}!` : '';

  const html = `
${emailOpen()}

  ${emailHeader(undefined, brand)}

  <!-- Main Content -->
  <div style="padding: 40px 30px;">

    <!-- REVISED Quote Badge - GOLD/AMBER to distinguish from original -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 24px; border-radius: 24px; font-size: 14px; font-weight: 700; letter-spacing: 1px;">
        🔄 REVISED QUOTE • #${quote.quote_number}
      </div>
      <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
        Revision ${renegotiation.revisionNumber}
      </div>
    </div>

    <!-- Greeting - DIFFERENT from original -->
    <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
      We Heard You, ${firstName}!
    </h1>

    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
      Based on your feedback, we've revised your quote. Here's what's changed:
    </p>

    <!-- CHANGES BOX - This is the key differentiator for Gmail -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border: 2px solid #fcd34d; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <h2 style="font-size: 16px; font-weight: 700; color: #92400e; margin: 0 0 16px 0; display: flex; align-items: center;">
        📋 CHANGES IN THIS REVISION
      </h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #78350f; font-size: 14px; border-bottom: 1px solid #fcd34d;">💰 Price adjusted:</td>
          <td style="padding: 10px 0; color: #1e293b; font-size: 14px; border-bottom: 1px solid #fcd34d; text-align: right;">
            <span style="text-decoration: line-through; color: #94a3b8;">${formatCurrency(renegotiation.previousTotal)}</span>
            <span style="color: #16a34a; font-weight: 700; margin-left: 8px;">${formatCurrency(renegotiation.newTotal)}</span>
            ${savings > 0 ? `<span style="background: #22c55e; color: white; font-size: 11px; padding: 2px 8px; border-radius: 12px; margin-left: 8px;">${savingsText}</span>` : ''}
          </td>
        </tr>
        ${renegotiation.changesDescription ? `
        <tr>
          <td colspan="2" style="padding: 10px 0; color: #78350f; font-size: 14px;">
            📝 Changes: <span style="color: #1e293b;">${renegotiation.changesDescription}</span>
          </td>
        </tr>
        ` : ''}
        ${renegotiation.declineReason ? `
        <tr>
          <td colspan="2" style="padding: 10px 0; color: #78350f; font-size: 14px;">
            💬 Your feedback: <em style="color: #64748b;">"${renegotiation.declineReason}"</em>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
      We value your business and hope this revised quote works better for you!
    </p>

    <!-- Talk it through -->
    <div style="background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%); border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 0 0 30px 0; text-align: center;">
      <div style="font-size: 15px; font-weight: 700; color: #9a3412; margin-bottom: 6px;">Want to talk through the numbers?</div>
      <div style="font-size: 14px; color: #9a3412; line-height: 1.6;">Give us a call at <a href="tel:4133618451" style="color: #9a3412; font-weight: 700; text-decoration: none;">(413) 361-8451</a> — we're happy to walk through the quote together.</div>
    </div>

    <!-- CTA Buttons -->
    <div style="text-align: center; margin: 30px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
        You can open the PDF document to view the details of your project
      </p>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8;">
        Puede abrir el documento PDF para ver los detalles de su proyecto
      </p>
      <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; letter-spacing: 0.5px; margin: 0 8px 12px 8px;">
        <span style="display:inline-block;background:#dc2626;color:#fff;font-size:10px;font-weight:800;padding:2px 5px;border-radius:3px;margin-right:6px;vertical-align:middle;letter-spacing:0.5px;">PDF</span> Accept Revised Quote
      </a>
      <a href="${declineUrl}" style="display: inline-block; background: #f1f5f9; color: #64748b; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; letter-spacing: 0.5px; margin: 0 8px 12px 8px; border: 1px solid #e2e8f0;">
        Still Not Right?
      </a>
    </div>

    <!-- Validity Note -->
    <div style="background: linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%); border-left: 4px solid #ff781d; padding: 16px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #9a3412;">
        <strong>This revised quote is valid for 7 days.</strong> Let us know if you have any questions!
      </p>
    </div>

    <!-- Quote Summary Card -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 20px 0;">
        Full Quote Details
      </h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; width: 120px;">Services</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${servicesText}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Location</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${fullAddress}</td>
        </tr>
        ${quote.estimated_duration ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Timeline</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">Estimated ${quote.estimated_duration}</td>
        </tr>
        ` : ''}
        ${quote.estimated_start ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Start Date</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${formatDate(quote.estimated_start)}</td>
        </tr>
        ` : ''}
      </table>

      <!-- Pricing Summary. Single discount row when present; revised total always. -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 24px; padding-top: 16px; border-top: 2px solid #e2e8f0;">
        ${quote.discount && quote.discount > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #10b981; font-size: 14px; text-align: left;">Discount</td>
          <td style="padding: 8px 0; color: #10b981; font-size: 14px; text-align: right;">-${formatCurrency(quote.discount)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 16px 0 0 0; border-top: 1px solid #e2e8f0; color: #1e293b; font-size: 20px; font-weight: 700; text-align: left;">Revised Total</td>
          <td style="padding: 16px 0 0 0; border-top: 1px solid #e2e8f0; color: #16a34a; font-size: 24px; font-weight: 700; text-align: right;">${formatCurrency(quote.total)}</td>
        </tr>
      </table>
    </div>

    ${sectionsHtml}

    ${renderAttachmentsHtml(quote)}

    <!-- Contact Section -->
    <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e2e8f0; margin-top: 30px;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Questions about this revised quote?</p>
      <a href="tel:${brand.phoneTel}" style="color: #ff781d; font-size: 20px; font-weight: 700; text-decoration: none;">${brand.phoneDisplay}</a>
    </div>
  </div>

  ${emailFooter({ showEli: true }, brand)}
${emailClose()}
  `;

  const text = `
REVISED QUOTE FROM ${brand.name.toUpperCase()}
Quote #${quote.quote_number} - Revision ${renegotiation.revisionNumber}

Hi ${firstName},

We heard you! Based on your feedback, we've revised your quote.

WHAT'S CHANGED:
Price: ${formatCurrency(renegotiation.previousTotal)} → ${formatCurrency(renegotiation.newTotal)} ${savings > 0 ? `(Save ${formatCurrency(savings)}!)` : ''}
${renegotiation.changesDescription ? `Changes: ${renegotiation.changesDescription}` : ''}
${renegotiation.declineReason ? `Your feedback: "${renegotiation.declineReason}"` : ''}

FULL QUOTE DETAILS:
Services: ${servicesText}
Location: ${fullAddress}
${quote.estimated_duration ? `Timeline: ${quote.estimated_duration}` : ''}
${quote.estimated_start ? `Start Date: ${formatDate(quote.estimated_start)}` : ''}

REVISED TOTAL: ${formatCurrency(quote.total)}

Review and respond on our website:
To accept: ${acceptUrl}
Still not right?: ${declineUrl}

This revised quote is valid for 7 days.

Questions? Call us at ${brand.phoneDisplay}

---
${brand.name} | ${brand.websiteLabel} | ${brand.phoneDisplay}
  `.trim();

  try {
    await resend.emails.send({
      from: emailFrom(brand, 'quotes'),
      replyTo: 'mm@mannyknows.com',
      to: quote.customer_email,
      subject: `REVISED: Updated Quote from ${brand.name} - #${quote.quote_number}`,
      html,
      text
    });

    return { success: true };
  } catch (error) {
    console.error('[QuoteEmail] Failed to send renegotiated quote email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a confirmation to the CUSTOMER when they accept their quote — a friendly
 * "we got it" with a link to a copy of their quote. Mirrors the on-page
 * confirmation so they always have an email record too.
 */
export async function sendQuoteAcceptanceToCustomer(
  quote: Quote,
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND,
  pdfUrl?: string | null,
  portalUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!quote.customer_email) return { success: false, error: 'No customer email' };
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);
  const firstName = (quote.customer_name || '').split(' ')[0] || 'there';
  const totalNum = Number((quote as any).total);
  const totalStr = Number.isFinite(totalNum) && totalNum > 0
    ? `$${totalNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '';
  // After acceptance the quote becomes a project, so the quote review URL no
  // longer applies — link to the customer's project portal when we have it.
  const hasPortal = !!portalUrl;
  const viewUrl = portalUrl || pdfUrl || `${baseUrl}/quote/${quote.quote_token}`;
  const ctaLabel = hasPortal ? 'View your project' : 'View your quote';
  const html = `
${emailOpen()}
  ${emailHeader('Quote accepted', brand)}
  <div style="padding: 40px 30px;">
    <p style="font-size:16px; color:#1e293b; margin:0 0 16px;">Hi ${firstName},</p>
    <p style="font-size:15px; color:#475569; line-height:1.6; margin:0 0 16px;">
      Thanks for accepting your quote <strong>#${quote.quote_number}</strong>${totalStr ? ` (${totalStr})` : ''}. We've got it on file, and ${brand.name} will reach out shortly to schedule your project.
    </p>
    <p style="font-size:15px; color:#475569; line-height:1.6; margin:0 0 24px; text-align:center;">${hasPortal ? 'Track your project, see progress photos, and review everything anytime in your project portal:' : "Here's a copy for your records:"}</p>
    <div style="text-align:center; margin: 4px 0;">${emailButton(viewUrl, ctaLabel, 'green')}</div>
    <p style="font-size:13px; color:#94a3b8; margin:24px 0 0; text-align:center;">Questions? Just reply to this email or call ${brand.phoneDisplay}.</p>
  </div>
  ${emailFooter({ showEli: true }, brand)}
${emailClose()}
  `.trim();
  const text = `Hi ${firstName},\n\nThanks for accepting your quote #${quote.quote_number}${totalStr ? ` (${totalStr})` : ''}. ${brand.name} will reach out shortly to schedule your project.\n\n${hasPortal ? 'Your project portal' : 'A copy of your quote'}: ${viewUrl}\n\nQuestions? Reply to this email or call ${brand.phoneDisplay}.\n\n${brand.name} | ${brand.websiteLabel} | ${brand.phoneDisplay}`;
  try {
    await resend.emails.send({
      from: emailFrom(brand, 'quotes'),
      replyTo: 'mm@mannyknows.com',
      to: quote.customer_email,
      subject: `We received your acceptance — Quote #${quote.quote_number}`,
      html,
      text,
    });
    return { success: true };
  } catch (error) {
    console.error('[QuoteEmail] acceptance-to-customer failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send notification to admin when quote is accepted
 */
export async function sendQuoteAcceptedNotification(
  quote: Quote,
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);
  const adminUrl = `${baseUrl}/admin/quotes`;

  const servicesText = formatServices(quote.services);
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0;">
<div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff;">

  <!-- Header -->
  <div style="background: #0f172a; padding: 40px 30px; text-align: center;">
    <span style="font-size: 28px; font-weight: 700; color: #ffffff;">MannyKnows</span>
    <div style="font-size: 14px; color: rgba(255,255,255,0.9); margin-top: 8px;">Admin Notification</div>
  </div>
  <div style="height: 4px; background: #ff781d;"></div>

  <!-- Content -->
  <div style="padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 600;">
        ✓ QUOTE ACCEPTED
      </div>
    </div>

    <h1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
      Great News!
    </h1>

    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
      <strong style="color: #1e293b;">${quote.customer_name}</strong> has accepted Quote #${quote.quote_number}.<br>
      This quote is now ready to be promoted to a Project.
    </p>

    <!-- Details Card -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 16px; font-weight: 700; color: #ff781d; margin: 0 0 16px 0;">Quote Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Customer</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${quote.customer_name}</td>
        </tr>
        ${quote.customer_email ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${quote.customer_email}</td>
        </tr>
        ` : ''}
        ${quote.customer_phone ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${quote.customer_phone}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Services</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${servicesText}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Total</td>
          <td style="padding: 8px 0; color: #10b981; font-size: 16px; font-weight: 700;">${formatCurrency(quote.total)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Accepted</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${timestamp}</td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${adminUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff781d 0%, #e05e00 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
        View in Admin
      </a>
    </div>
  </div>

  ${emailFooter(undefined, brand)}
${emailClose()}
  `;

  try {
    await resend.emails.send({
      from: 'MannyKnows <admin@send.mannyknows.com>',
      to: env.NOTIFICATION_EMAIL,
      subject: `Quote Accepted - #${quote.quote_number} - ${quote.customer_name}`,
      html
    });

    return { success: true };
  } catch (error) {
    console.error('[QuoteEmail] Failed to send accepted notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send notification to admin when quote is declined
 */
export async function sendQuoteDeclinedNotification(
  quote: Quote,
  declineReason: string,
  declineFeedback: string | undefined,
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);
  const adminUrl = `${baseUrl}/admin/quotes`;

  const servicesText = formatServices(quote.services);
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0;">
<div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff;">

  <!-- Header -->
  <div style="background: #0f172a; padding: 40px 30px; text-align: center;">
    <span style="font-size: 28px; font-weight: 700; color: #ffffff;">MannyKnows</span>
    <div style="font-size: 14px; color: rgba(255,255,255,0.9); margin-top: 8px;">Admin Notification</div>
  </div>
  <div style="height: 4px; background: #ff781d;"></div>

  <!-- Content -->
  <div style="padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 600;">
        ✗ QUOTE DECLINED
      </div>
    </div>

    <h1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
      Quote Needs Review
    </h1>

    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
      <strong style="color: #1e293b;">${quote.customer_name}</strong> has declined Quote #${quote.quote_number}.
    </p>

    <!-- Feedback Card -->
    <div style="background: #fef2f2; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #fecaca;">
      <h2 style="font-size: 16px; font-weight: 700; color: #dc2626; margin: 0 0 16px 0;">Customer Feedback</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 80px;">Reason</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${declineReason}</td>
        </tr>
        ${declineFeedback ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: top;">Comments</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">"${declineFeedback}"</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Declined</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${timestamp}</td>
        </tr>
      </table>
    </div>

    <!-- Quote Details Card -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 16px; font-weight: 700; color: #ff781d; margin: 0 0 16px 0;">Quote Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Customer</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${quote.customer_name}</td>
        </tr>
        ${quote.customer_phone ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${quote.customer_phone}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Services</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${servicesText}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Total</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 16px; font-weight: 700;">${formatCurrency(quote.total)}</td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${adminUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff781d 0%, #e05e00 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
        Review in Admin
      </a>
    </div>

    <p style="font-size: 14px; color: #64748b; text-align: center; margin: 20px 0 0 0;">
      You can choose to <strong>Accept Decline</strong> or <strong>Renegotiate</strong> from the admin panel.
    </p>
  </div>

  ${emailFooter(undefined, brand)}
${emailClose()}
  `;

  try {
    await resend.emails.send({
      from: 'MannyKnows <admin@send.mannyknows.com>',
      to: env.NOTIFICATION_EMAIL,
      subject: `Quote Declined - #${quote.quote_number} - ${quote.customer_name} - "${declineReason}"`,
      html
    });

    return { success: true };
  } catch (error) {
    console.error('[QuoteEmail] Failed to send declined notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Project notification interface
 */
export interface Project {
  project_number: string;
  client_token: string;
  reply_token?: string; // quote_token for Reply-To (stable across lifecycle)
  customer_name: string;
  customer_email: string;
  services?: string;
  scope_description?: string;
  total?: number;
  estimated_start?: string;
  estimated_end?: string;
  estimated_duration?: string;
}

/**
 * Send project update notification to customer
 * Used when re-promoting a customer-approved quote (change orders)
 */
export async function sendProjectUpdateNotification(
  project: Project,
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);

  const firstName = project.customer_name.split(' ')[0];
  const servicesText = formatServices(project.services);
  const projectUrl = `${baseUrl}/project/${project.client_token}`;

  const html = `
${emailOpen()}

  ${emailHeader(undefined, brand)}

  <!-- Main Content -->
  <div style="padding: 40px 30px;">

    <!-- Project Badge -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">
        PROJECT #${project.project_number}
      </div>
    </div>

    <!-- Greeting -->
    <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
      Project Update
    </h1>

    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
      Hi <strong style="color: #1e293b;">${firstName}</strong>, we wanted to let you know that your project has been updated. You can view the latest details below.
    </p>

    <!-- Project Summary Card -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 20px 0;">
        Project Summary
      </h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; width: 120px;">Services</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${servicesText}</td>
        </tr>
        ${project.estimated_duration ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Timeline</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">Estimated ${project.estimated_duration}</td>
        </tr>
        ` : ''}
        ${project.estimated_start ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Start Date</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${formatDate(project.estimated_start)}</td>
        </tr>
        ` : ''}
        ${project.total ? `
        <tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Total</td>
          <td style="padding: 12px 0; color: #ff781d; font-size: 18px; font-weight: 700;">${formatCurrency(project.total)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${project.scope_description ? `
    <!-- Scope Description -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 16px 0;">
        Scope of Work
      </h2>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.7;">
        ${project.scope_description}
      </p>
    </div>
    ` : ''}

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; letter-spacing: 0.5px;">
        View Project Progress
      </a>
    </div>

    <!-- Info Note -->
    <div style="background: linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%); border-left: 4px solid #ff781d; padding: 16px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #9a3412;">
        <strong>Your project portal is ready.</strong> It's your home base for this project — track progress photos, view your documents, and make your selections right from the page.
      </p>
      <p style="margin: 0; font-size: 13px; color: #475569;">
        For your privacy, the first time you open it we'll ask you to confirm this email address — no password to remember.
      </p>
    </div>

    <!-- Contact Section -->
    <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e2e8f0; margin-top: 30px;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Questions about your project?</p>
      <a href="tel:${brand.phoneTel}" style="color: #ff781d; font-size: 20px; font-weight: 700; text-decoration: none;">${brand.phoneDisplay}</a>
    </div>
  </div>

  ${emailFooter({ showEli: true }, brand)}
${emailClose()}
  `;

  const text = `
PROJECT UPDATE FROM ${brand.name.toUpperCase()}
Project #${project.project_number}

Hi ${firstName},

We wanted to let you know that your project has been updated.

PROJECT SUMMARY:
Services: ${servicesText}
${project.estimated_duration ? `Timeline: ${project.estimated_duration}` : ''}
${project.estimated_start ? `Start Date: ${formatDate(project.estimated_start)}` : ''}
${project.total ? `Total: ${formatCurrency(project.total)}` : ''}

View your project progress online:
${projectUrl}

Questions? Call us at ${brand.phoneDisplay}

---
${brand.name} | ${brand.websiteLabel} | ${brand.phoneDisplay}
  `.trim();

  try {
    await resend.emails.send({
      from: emailFrom(brand, 'projects'),
      replyTo: 'mm@mannyknows.com',
      to: project.customer_email,
      subject: `Project Update - #${project.project_number} - ${brand.name}`,
      html,
      text
    });

    return { success: true };
  } catch (error) {
    console.error('[ProjectEmail] Failed to send project update email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================
// PROJECT START NOTIFICATIONS
// ============================================

export interface ProjectStartData {
  project_number: string;
  customer_name: string;
  customer_email: string;
  client_token: string;
  crew_token: string;
  reply_token?: string; // quote_token for Reply-To (stable across lifecycle)
  services?: string;
  scope_description?: string;
  customer_address?: string;
  customer_city?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  crew_lead_name?: string;
  crew_lead_email?: string;
  crew_notes?: string;
}

/**
 * Send project started notification to customer
 * Sent when project status changes to 'in_progress'
 */
export async function sendProjectStartedToClient(
  project: ProjectStartData,
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);

  const firstName = project.customer_name.split(' ')[0];
  const servicesText = formatServices(project.services);
  const projectUrl = `${baseUrl}/project/${project.client_token}`;

  const html = `
${emailOpen()}

  ${emailHeader(undefined, brand)}

  <!-- Main Content -->
  <div style="padding: 40px 30px;">

    <!-- Project Badge -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">
        PROJECT STARTED
      </div>
    </div>

    <!-- Greeting -->
    <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
      Great News, ${firstName}!
    </h1>

    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
      Your project <strong style="color: #ff781d;">#${project.project_number}</strong> has officially started! Our team is now working to transform your space.
    </p>

    <!-- Project Summary Card -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 20px 0;">
        Project Details
      </h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; width: 120px;">Project</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #ff781d; font-size: 14px; font-weight: 700;">#${project.project_number}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Services</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${servicesText}</td>
        </tr>
        ${project.crew_lead_name ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Crew Lead</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${project.crew_lead_name}</td>
        </tr>
        ` : ''}
        ${project.scheduled_start ? `
        <tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Started</td>
          <td style="padding: 12px 0; color: #22c55e; font-size: 14px; font-weight: 600;">${formatDate(project.scheduled_start)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; letter-spacing: 0.5px;">
        Track Your Project
      </a>
    </div>

    <!-- Info Note -->
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%); border-left: 4px solid #22c55e; padding: 16px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>Stay updated!</strong> View progress photos and project updates in real-time on your <a href="${projectUrl}" style="color: #15803d; font-weight: 700;">customer portal</a>.
      </p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #166534; word-break: break-all;">
        <a href="${projectUrl}" style="color: #15803d;">${projectUrl}</a>
      </p>
    </div>

    <!-- Contact Section -->
    <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e2e8f0; margin-top: 30px;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Questions about your project?</p>
      <a href="tel:${brand.phoneTel}" style="color: #ff781d; font-size: 20px; font-weight: 700; text-decoration: none;">${brand.phoneDisplay}</a>
    </div>
  </div>

  ${emailFooter({ showEli: true }, brand)}
${emailClose()}
  `;

  const text = `
Your Project Has Started!

Hi ${firstName},

Great news! Your project #${project.project_number} has officially started. Our team is now working to transform your space.

Project: #${project.project_number}
Services: ${servicesText}
${project.crew_lead_name ? `Crew Lead: ${project.crew_lead_name}` : ''}
${project.scheduled_start ? `Started: ${formatDate(project.scheduled_start)}` : ''}

Track your project progress online:
${projectUrl}

Questions? Call us at ${brand.phoneDisplay}

---
${brand.name} | ${brand.websiteLabel} | ${brand.phoneDisplay}
  `.trim();

  try {
    await resend.emails.send({
      from: emailFrom(brand, 'projects'),
      replyTo: 'mm@mannyknows.com',
      to: project.customer_email,
      subject: `Your Project Has Started! - #${project.project_number} - ${brand.name}`,
      html,
      text
    });

    return { success: true };
  } catch (error) {
    console.error('[ProjectEmail] Failed to send project started email to client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send project started notification to crew lead
 * Sent when project status changes to 'in_progress' and crew lead is assigned
 */
export async function sendProjectStartedToCrewLead(
  project: ProjectStartData,
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  if (!project.crew_lead_email || !project.crew_lead_name) {
    return { success: false, error: 'Crew lead email not provided' };
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);

  const crewLeadFirstName = project.crew_lead_name.split(' ')[0];
  const servicesText = formatServices(project.services);
  const crewPortalUrl = `${baseUrl}/project/crew/${project.crew_token}`;

  const html = `
${emailOpen()}

  ${emailHeader('Crew Portal', brand)}

  <!-- Main Content -->
  <div style="padding: 40px 30px;">

    <!-- Project Badge -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">
        NEW PROJECT ASSIGNMENT
      </div>
    </div>

    <!-- Greeting -->
    <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
      Hey ${crewLeadFirstName}!
    </h1>

    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
      You've been assigned as crew lead for project <strong style="color: #ff781d;">#${project.project_number}</strong>. Let's make this one shine!
    </p>

    <!-- Project Summary Card -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 20px 0;">
        Project Details
      </h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; width: 120px;">Project</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #ff781d; font-size: 14px; font-weight: 700;">#${project.project_number}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Customer</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${project.customer_name}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Services</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${servicesText}</td>
        </tr>
        ${project.customer_address || project.customer_city ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Location</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${[project.customer_address, project.customer_city].filter(Boolean).join(', ')}</td>
        </tr>
        ` : ''}
        ${project.scheduled_start ? `
        <tr>
          <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Start Date</td>
          <td style="padding: 12px 0; color: #22c55e; font-size: 14px; font-weight: 600;">${formatDate(project.scheduled_start)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${project.scope_description ? `
    <!-- Scope Description -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 16px 0;">
        Scope of Work
      </h2>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.7;">
        ${project.scope_description}
      </p>
    </div>
    ` : ''}

    ${project.crew_notes ? `
    <!-- Crew Notes -->
    <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #fcd34d;">
      <h2 style="font-size: 18px; font-weight: 700; color: #92400e; margin: 0 0 16px 0;">
        Notes for Crew
      </h2>
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.7;">
        ${project.crew_notes}
      </p>
    </div>
    ` : ''}

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${crewPortalUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; letter-spacing: 0.5px;">
        Open Crew Portal
      </a>
    </div>

    <!-- Info Note -->
    <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Upload progress photos!</strong> Use the crew portal to add photos and updates. Customers love seeing their project come together.
      </p>
    </div>

    <!-- Contact Section -->
    <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e2e8f0; margin-top: 30px;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Questions? Contact the office</p>
      <a href="tel:${brand.phoneTel}" style="color: #ff781d; font-size: 20px; font-weight: 700; text-decoration: none;">${brand.phoneDisplay}</a>
    </div>
  </div>

  ${emailFooter(undefined, brand)}
${emailClose()}
  `;

  const text = `
New Project Assignment - #${project.project_number}

Hey ${crewLeadFirstName}!

You've been assigned as crew lead for project #${project.project_number}. Let's make this one shine!

Project: #${project.project_number}
Customer: ${project.customer_name}
Services: ${servicesText}
${project.customer_address || project.customer_city ? `Location: ${[project.customer_address, project.customer_city].filter(Boolean).join(', ')}` : ''}
${project.scheduled_start ? `Start Date: ${formatDate(project.scheduled_start)}` : ''}

${project.scope_description ? `Scope of Work:\n${project.scope_description}` : ''}

${project.crew_notes ? `Notes for Crew:\n${project.crew_notes}` : ''}

Access the crew portal to upload progress photos:
${crewPortalUrl}

Questions? Contact the office at (413) 361-8451

---
MannyKnows | mannyknows.com
  `.trim();

  try {
    await resend.emails.send({
      from: 'MannyKnows <projects@send.mannyknows.com>',
      to: project.crew_lead_email,
      subject: `New Assignment: Project #${project.project_number} - MannyKnows`,
      html,
      text
    });

    return { success: true };
  } catch (error) {
    console.error('[ProjectEmail] Failed to send project started email to crew lead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================
// Contract Email - Send contract to customer for review/signing
// ============================================================
export interface ContractEmailData {
  project_number: string;
  customer_name: string;
  customer_email: string;
  contract_url: string;
  client_token: string;
  quote_token?: string;
}

export async function sendContractToCustomer(
  data: ContractEmailData,
  env: QuoteEmailEnv,
  origin: string,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const firstName = data.customer_name.split(' ')[0];
    const contractPageUrl = `${origin}/project/contract/${data.client_token}`;
    const replyTo = 'mm@mannyknows.com';

    const htmlContent = `
${emailOpen()}

  ${emailHeader(undefined, brand)}

    <!-- Body -->
    <div style="background: #ffffff; padding: 40px 30px;">
      <h2 style="font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
        Your Contract is Ready
      </h2>
      <p style="font-size: 16px; color: #475569; line-height: 1.7; text-align: center; margin: 0 0 8px 0;">
        Hi ${firstName}! Your project contract for <strong>${data.project_number}</strong> is ready for review.
      </p>
      <p style="font-size: 14px; color: #64748b; line-height: 1.6; text-align: center; margin: 0 0 30px 0;">
        Please review the contract and download a copy. You can sign it during your in-person meeting or upload a signed copy online.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 0 0 30px 0;">
        <a href="${contractPageUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
          Review & Sign Contract
        </a>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #ff781d; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px 0;">
        <p style="font-size: 14px; color: #92400e; margin: 0;">
          <strong>Note:</strong> You can download the contract to review, and either upload a signed copy online or sign it in person when we meet.
        </p>
      </div>
    </div>

    <!-- Contact -->
    <div style="background: #ffffff; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0;">Questions about the contract?</p>
      <a href="tel:${brand.phoneTel}" style="font-size: 20px; font-weight: 700; color: #ff781d; text-decoration: none;">${brand.phoneDisplay}</a>
    </div>

    ${emailFooter({ showEli: true }, brand)}
${emailClose()}`;

    const result = await resend.emails.send({
      from: emailFrom(brand, 'contracts'),
      to: data.customer_email,
      replyTo,
      subject: `${data.project_number} -- Contract Ready for Review`,
      html: htmlContent,
      text: `Hi ${firstName}, your contract for project ${data.project_number} is ready for review. View and sign it here: ${contractPageUrl}\n\nQuestions? Call us at ${brand.phoneDisplay}\n\n${brand.name}\n${brand.websiteLabel}`,
    });

    console.log(`[ContractEmail] Sent contract email to ${data.customer_email} for ${data.project_number}`);
    return { success: true };
  } catch (error) {
    console.error('[ContractEmail] Failed to send contract email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================
// COLD QUOTE FOLLOW-UP EMAILS
// ============================================================

export interface FollowUpData {
  quote_number: string;
  quote_token: string;
  customer_name: string;
  customer_email: string;
  services?: string;
  address?: string;
  state?: string;
  zip?: string;
  total?: number;
  expiry_date: string; // formatted date string, e.g. "April 9, 2026"
  is_renegotiation: boolean;
  follow_up_number: 1 | 2;
}

/**
 * Send automated follow-up email to a customer with a pending quote.
 * Handles all 4 variants: first-time #1, first-time #2, renego #1, renego #2.
 */
// Neutral "we're reachable" blurb shown in follow-up emails. (Replaced SLP's
// financing-partner pitch — MK has no confirmed financing program; don't
// re-add one here without Manny's sign-off.)
const CALL_US_BLURB = `
  <p style="font-size: 14px; color: #64748b; line-height: 1.7; margin: 0; text-align: center;">
    Questions about the price or the scope? Call us at
    <a href="tel:4133618451" style="color: #ff781d; font-weight: 700; text-decoration: none;">(413) 361-8451</a>
    — we're happy to walk through it with you.
  </p>`;

export async function sendQuoteFollowUp(
  data: FollowUpData,
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);

  const firstName = data.customer_name.split(' ')[0];
  const servicesText = formatServices(data.services);
  const reviewUrl = `${baseUrl}/quote/${data.quote_token}`;
  const addressLine = [data.address, data.state, data.zip].filter(Boolean).join(', ') || 'your property';
  // Replies land in the shared MK inbox (hire-us@) — no per-quote
  // reply-parsing pipeline is configured for this domain.
  const replyTo = 'mm@mannyknows.com';

  let subject: string;
  let heading: string;
  let bodyHtml: string;

  if (!data.is_renegotiation && data.follow_up_number === 1) {
    subject = `Just checking in on your quote — #${data.quote_number}`;
    heading = 'Just checking in!';
    bodyHtml = `
      <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 0 0 20px 0;">Hi ${firstName},</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 16px 0;">
        Just wanted to make sure your quote made it to your inbox! We sent over an estimate for
        <strong>${servicesText}</strong> at ${addressLine} a few days ago and wanted to check in.
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 24px 0;">
        Your quote is valid until <strong>${data.expiry_date}</strong>. If you have any questions or want to
        adjust anything, just reply to this email — we're happy to help.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        ${emailButton(reviewUrl, 'Review & Accept Your Quote', 'blue')}
      </div>
      ${CALL_US_BLURB}`;

  } else if (!data.is_renegotiation && data.follow_up_number === 2) {
    subject = `Your quote expires in 2 days — #${data.quote_number}`;
    heading = 'Your quote expires soon';
    bodyHtml = `
      <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 0 0 20px 0;">Hi ${firstName},</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 16px 0;">
        Your quote for <strong>${servicesText}</strong> at ${addressLine} expires in <strong>2 days</strong>
        on <strong>${data.expiry_date}</strong>.
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 20px 0;">
        We'd love the opportunity to work on your project. If the timing or pricing isn't quite right,
        just reply and let us know — we can work with you.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        ${emailButton(reviewUrl, 'Review & Accept Your Quote', 'green')}
      </div>
      ${CALL_US_BLURB}
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 24px 0 0; text-align: center; font-style: italic;">
        If you've decided to go in a different direction, no hard feelings at all — just let us know so we can close things out on our end.
      </p>`;

  } else if (data.is_renegotiation && data.follow_up_number === 1) {
    subject = `Following up on your revised quote — #${data.quote_number}`;
    heading = 'Following up on your revised quote';
    bodyHtml = `
      <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 0 0 20px 0;">Hi ${firstName},</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 16px 0;">
        Just following up on the revised quote we sent for <strong>${servicesText}</strong> at ${addressLine}.
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 24px 0;">
        We made updates based on your feedback and want to make sure the new estimate works for you.
        If you'd like to talk through anything or make further adjustments, we're just a reply away.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        ${emailButton(reviewUrl, 'Review Your Revised Quote', 'purple')}
      </div>
      ${CALL_US_BLURB}`;

  } else {
    subject = `Your revised quote expires tomorrow — #${data.quote_number}`;
    heading = 'Last chance on your revised quote';
    bodyHtml = `
      <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 0 0 20px 0;">Hi ${firstName},</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 16px 0;">
        Quick note — your revised quote for <strong>${servicesText}</strong> at ${addressLine}
        expires <strong>tomorrow</strong> on <strong>${data.expiry_date}</strong>.
      </p>
      <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 20px 0;">
        If you're still interested, this is a great time to lock in your price. If the timing isn't right
        or you've made other arrangements, just let us know.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        ${emailButton(reviewUrl, 'Review & Accept', 'blue')}
      </div>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0; text-align: center; font-style: italic;">
        Either way, we appreciate you giving us the chance and hope to work with you in the future.
      </p>`;
  }

  const html = `
${emailOpen()}
  ${emailHeader('Quote Follow-Up', brand)}
  <div style="padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #ff781d 0%, #e05e00 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">
        QUOTE #${data.quote_number}
      </div>
    </div>
    <h1 style="font-size: 26px; font-weight: 700; color: #1e293b; margin: 0 0 24px 0; text-align: center;">
      ${heading}
    </h1>
    ${bodyHtml}
  </div>
  ${emailFooter({ showEli: true }, brand)}
${emailClose()}`;

  try {
    await resend.emails.send({
      from: emailFrom(brand, 'quotes'),
      replyTo: isLocalhost ? undefined : replyTo,
      to: isLocalhost ? ['delivered@resend.dev'] : [data.customer_email],
      subject,
      html,
      text: `Hi ${firstName}, this is a follow-up on your quote #${data.quote_number}. Review it here: ${reviewUrl}\n\nReply to this email and we'll get back to you, or call ${brand.phoneDisplay}.\n\n${brand.name}\n${brand.websiteLabel}`,
    });

    console.log(`[FollowUp] Sent follow-up #${data.follow_up_number} to ${data.customer_email} for quote ${data.quote_number}`);
    return { success: true };
  } catch (error) {
    console.error(`[FollowUp] Failed to send follow-up for ${data.quote_number}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Google review deep-link for MannyKnows' Business Profile.
// TODO(eli): fill in the real g.page review link once the Google Business
// Profile exists (tracked in CONTENT_TODOS.md: quotes-google-review-link).
// While '' the review-ask card is skipped entirely — the SLP link that was
// here pointed at S.L. Painting's profile, never use another business's.
const GOOGLE_REVIEW_URL: string = '';

/**
 * Sent when a project's portfolio is PUBLISHED: shares the live portfolio URL
 * and asks the customer for a Google review. Fired once (on first publish).
 */
export async function sendPortfolioReviewToClient(
  data: { customer_name: string; customer_email: string; slug: string; project_number?: string },
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);
  const firstName = (data.customer_name || 'there').split(' ')[0];
  const portfolioUrl = `${baseUrl}/projects/${data.slug}`;
  const stars = `<span style="color:#ffb800; font-size:26px; letter-spacing:3px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>`;

  const html = `
${emailOpen()}

  ${emailHeader('Your Project Is Featured', brand)}

  <!-- Main Content -->
  <div style="padding: 40px 30px;">

    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">
        PROJECT COMPLETE
      </div>
    </div>

    <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
      Thank you, ${escapeHtml(firstName)}!
    </h1>

    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0 0 28px 0; text-align: center;">
      It was a pleasure transforming your space. Your finished project is now featured in our portfolio &mdash; take a look at how it turned out and share it with friends and family.
    </p>

    <!-- View Portfolio button -->
    <div style="text-align: center; margin: 0 0 36px 0;">
      ${emailButton(portfolioUrl, 'View Your Project', 'purple')}
      ${data.project_number ? `<p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">Project #${escapeHtml(data.project_number)}</p>` : ''}
    </div>

    ${GOOGLE_REVIEW_URL ? `
    <!-- Review request card -->
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 28px 24px; margin: 0 0 10px 0; text-align: center;">
      <div style="margin-bottom: 10px;">${stars}</div>
      <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0;">
        Loved the work? Leave us a review
      </h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 22px 0;">
        A quick Google review means the world to a local family business like ours &mdash; and it helps your neighbors find a contractor they can trust. It only takes a minute.
      </p>
      ${emailButton(GOOGLE_REVIEW_URL, 'Leave a Google Review', 'green')}
    </div>` : ''}

    <!-- Contact -->
    <div style="text-align: center; padding: 24px 0 0; border-top: 1px solid #e2e8f0; margin-top: 30px;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Questions or need a touch-up?</p>
      <a href="tel:${brand.phoneTel}" style="color: #ff781d; font-size: 20px; font-weight: 700; text-decoration: none;">${brand.phoneDisplay}</a>
    </div>
  </div>

  ${emailFooter({ showEli: true }, brand)}
${emailClose()}
  `;

  const text = `Thank you, ${firstName}!

It was a pleasure transforming your space. Your finished project${data.project_number ? ` (#${data.project_number})` : ''} is now featured in our portfolio:
${portfolioUrl}
${GOOGLE_REVIEW_URL ? `
Loved the work? A quick Google review helps a local family business like ours — and helps your neighbors find a contractor they can trust:
${GOOGLE_REVIEW_URL}
` : ''}
Questions or need a touch-up? Call ${brand.phoneDisplay}.

${brand.name} | ${brand.websiteLabel}`.trim();

  try {
    await resend.emails.send({
      from: emailFrom(brand, 'projects'),
      to: isLocalhost ? ['delivered@resend.dev'] : [data.customer_email],
      subject: `Your project is featured — and a quick favor, ${firstName}?`,
      html,
      text,
    });
    console.log(`[PortfolioReview] Sent review request to ${data.customer_email} (slug: ${data.slug})`);
    return { success: true };
  } catch (error) {
    console.error('[PortfolioReview] Failed to send:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Payment invoice — emails the customer a single payment that's due, with
 * mail-a-check instructions (we currently accept checks only). Sent from the
 * Contract tab's "Send Invoice" action on a schedule row.
 */
export async function sendPaymentInvoiceToCustomer(
  data: {
    customer_name: string; customer_email: string; project_number?: string;
    label: string; amount: number; due_date?: string | null; client_token?: string | null;
    late_fee_amount?: number; late_fee_grace_days?: number;
  },
  env: QuoteEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);
  const firstName = (data.customer_name || 'there').split(' ')[0];
  const amountStr = `$${(Number(data.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dueStr = data.due_date ? formatDate(data.due_date) : '';
  const portalUrl = data.client_token ? `${baseUrl}/project/${data.client_token}` : '';

  // Late terms straight from the contract (late_fee_grace_days / late_fee_amount).
  // Only shown when the contract actually sets a late fee.
  const graceDays = Math.max(0, Math.round(Number(data.late_fee_grace_days) || 0));
  const lateFee = Number(data.late_fee_amount) || 0;
  const lateFeeStr = `$${lateFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const graceStr = graceDays === 1 ? '1 day' : `${graceDays} days`;
  const lateNote = lateFee > 0
    ? `A ${lateFeeStr} late fee applies to payments received more than ${graceStr} after the due date.`
    : '';

  // Make checks payable to the brand. Only show a mailing address when the
  // brand actually has one on file — MannyKnows' remit address isn't
  // confirmed yet (CONTENT_TODOS.md: quotes-remit-address), so the default
  // brand falls back to a "call us to arrange payment" line instead of an
  // invented street address.
  const remitLines = brand.addressLines.length
    ? [brand.name, ...brand.addressLines]
    : [];

  const html = `
${emailOpen()}

  ${emailHeader('Invoice', brand)}

  <div style="padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #ff781d 0%, #e05e00 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">
        PAYMENT DUE
      </div>
    </div>

    <h1 style="font-size: 26px; font-weight: 700; color: #1e293b; margin: 0 0 14px 0; text-align: center;">
      Hi ${escapeHtml(firstName)},
    </h1>
    <p style="font-size: 15px; font-weight: 400; color: #475569; line-height: 1.7; margin: 0 0 26px 0; text-align: center;">
      Thank you for trusting ${escapeHtml(brand.name)} with your project — it's been a pleasure working with you, and we truly appreciate your business. Below is your invoice for ${escapeHtml(data.label)}${data.project_number ? ` (Project #${escapeHtml(data.project_number)})` : ''}. Thank you in advance for your payment.
    </p>

    <!-- Amount due -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 0 0 24px 0; text-align: center;">
      <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Amount Due</div>
      <div style="font-size: 40px; font-weight: 800; color: #ff781d; line-height: 1.1;">${amountStr}</div>
      ${dueStr ? `<div style="font-size: 13px; color: #64748b; margin-top: 8px;">Due ${dueStr}</div>` : ''}
    </div>

    ${lateNote ? `<p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">${lateNote}</p>` : ''}

    <!-- How to pay -->
    <div style="border: 1px solid #fde68a; background: #fffbeb; border-radius: 12px; padding: 22px 24px; margin: 0 0 24px 0;">
      <h2 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0;">How to pay</h2>
      ${remitLines.length ? `
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 14px 0;">
        We currently accept payment by <strong>check</strong>. Please make your check payable to <strong>${escapeHtml(brand.name)}</strong> for <strong>${amountStr}</strong> and mail it to:
      </p>
      <div style="font-size: 15px; color: #1e293b; line-height: 1.6; font-weight: 600; padding: 14px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        ${remitLines.map(escapeHtml).join('<br>')}
      </div>` : `
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0;">
        We currently accept payment by <strong>check</strong>. Please make your check payable to <strong>${escapeHtml(brand.name)}</strong> for <strong>${amountStr}</strong>, then call us at <a href="tel:${brand.phoneTel}" style="color: #ff781d; font-weight: 700; text-decoration: none;">${escapeHtml(brand.phoneDisplay)}</a> to arrange drop-off or confirm the mailing address.
      </p>`}
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 12px 0 0 0;">
        Please write your project number${data.project_number ? ` (#${escapeHtml(data.project_number)})` : ''} on the memo line so we can match your payment.
      </p>
    </div>

    ${portalUrl ? `<div style="text-align:center; margin: 0 0 8px 0;">${emailButton(portalUrl, 'View Your Project', 'blue')}</div>` : ''}

    <div style="text-align: center; padding: 22px 0 0; border-top: 1px solid #e2e8f0; margin-top: 24px;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Questions about this invoice?</p>
      <a href="tel:${brand.phoneTel}" style="color: #ff781d; font-size: 20px; font-weight: 700; text-decoration: none;">${brand.phoneDisplay}</a>
    </div>
  </div>

  ${emailFooter({ showEli: true }, brand)}
${emailClose()}
  `;

  const text = `Hi ${firstName},

Thank you for trusting ${brand.name} with your project — we truly appreciate your business. Below is your invoice for ${data.label}${data.project_number ? ` (Project #${data.project_number})` : ''}. Thank you in advance for your payment.

Amount due: ${amountStr}${dueStr ? ` (due ${dueStr})` : ''}${lateNote ? `\n${lateNote}` : ''}

HOW TO PAY
${remitLines.length
  ? `We currently accept payment by check. Make your check payable to ${brand.name} for ${amountStr} and mail it to:\n${remitLines.join('\n')}`
  : `We currently accept payment by check. Make your check payable to ${brand.name} for ${amountStr}, then call us at ${brand.phoneDisplay} to arrange drop-off or confirm the mailing address.`}

Please write your project number${data.project_number ? ` (#${data.project_number})` : ''} on the memo line.
${portalUrl ? `\nView your project: ${portalUrl}` : ''}

Questions? Call ${brand.phoneDisplay}.

${brand.name} | ${brand.websiteLabel}`.trim();

  try {
    await resend.emails.send({
      from: emailFrom(brand, 'projects'),
      to: isLocalhost ? ['delivered@resend.dev'] : [data.customer_email],
      subject: `Invoice — ${amountStr} due${data.project_number ? ` · #${data.project_number}` : ''}`,
      html,
      text,
    });
    console.log(`[Invoice] Sent ${amountStr} invoice to ${data.customer_email} (${data.label})`);
    return { success: true };
  } catch (error) {
    console.error('[Invoice] Failed to send:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
