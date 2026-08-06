// Contract email templates — Phase 6D.
//
// Pairs with quote-emails.ts and reuses its emailHeader/emailFooter/etc.
// shared helpers so contract mail looks identical to quote mail.
//
// Two emails:
//   sendContractToCustomer        — fires when admin flips contract draft→sent
//   sendContractSignedNotification — fires after customer signs

import { Resend } from 'resend';
import { emailHeader, emailFooter, emailOpen, emailClose, emailButton } from './quote-emails';
import { type Brand, SL_BRAND, emailFrom } from './brand';

export interface ContractEmailContext {
  // Project + customer identity
  project_id: number;
  project_number: string;
  customer_name: string;
  customer_email: string;
  // Contract terms summary
  contract_token: string;
  total: number;
  start_date?: string | null;
  down_payment_percent: number;
  down_payment_count: number;
  monthly_payment_count: number;
  // Optional pre-rendered payment-plan summary (derived from the actual
  // payment_schedule by the caller). When present it's used verbatim so the
  // email reflects the real plan (balance-on-completion vs monthly), not the
  // raw counts. Falls back to the count-based summary when absent.
  payment_summary?: string;
  warranty_months: number;
  // Signature (for the signed-notification email)
  signer_name?: string;
  signed_at?: string;
}

export interface ContractEmailEnv {
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL?: string;
}

function fmtMoney(n: number | string | null | undefined): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return '$0.00';
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
function fmtDate(s: string | null | undefined): string {
  if (!s) return ': ';
  try {
    // Tolerate SQLite CURRENT_TIMESTAMP ('YYYY-MM-DD HH:MM:SS') and plain
    // 'YYYY-MM-DD'. Splitting on space/T isolates the date portion.
    const trimmed = String(s).split(/[\sT]/)[0];
    const d = new Date(trimmed + 'T00:00:00');
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return String(s); }
}
function getBaseUrl(isLocalhost: boolean): string {
  return isLocalhost ? 'http://localhost:4321' : 'https://mannyknows.com';
}

// ─── Customer email: contract is ready for review + signature ───────────
export async function sendContractToCustomer(
  ctx: ContractEmailContext,
  env: ContractEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  if (!ctx.customer_email) {
    return { success: false, error: 'Customer email is required' };
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);
  const signUrl = `${baseUrl}/project/contract/${ctx.contract_token}/`;
  const firstName = ctx.customer_name?.split(' ')[0] || 'there';

  const html = `
${emailOpen()}
  ${emailHeader('Contract ready to sign', brand)}
  <div style="padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #ff781d 0%, #e05f00 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 1px;">
        CONTRACT #${ctx.project_number}
      </div>
    </div>

    <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0; text-align: center;">
      Your contract is ready, ${firstName}
    </h1>

    <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
      Now that you've accepted the quote, we've prepared the contract that locks in the work, payment schedule, and terms. Please review and sign at your convenience to confirm we can begin the project on schedule.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      ${emailButton(signUrl, 'Review & Sign Contract', 'blue')}
    </div>

    <!-- Contract Summary Card -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ff781d; margin: 0 0 16px 0;">Contract Summary</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; width: 150px;">Total</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 700; text-align: right;">${fmtMoney(ctx.total)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Start date</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${fmtDate(ctx.start_date)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Payment schedule</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${ctx.payment_summary || `${ctx.down_payment_percent}% down × ${ctx.down_payment_count} + ${ctx.monthly_payment_count} monthly`}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Warranty</td>
          <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${ctx.warranty_months} months</td>
        </tr>
      </table>
    </div>

    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-left: 4px solid #ffd700; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Signing is electronic and instant.</strong> Draw your signature with finger or mouse, type your full name, and you're done.
      </p>
    </div>

    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 24px;">
      Questions? Reply to this email${brand.phoneDisplay ? ` or call ${brand.phoneDisplay}` : ''}.
    </p>
  </div>
  ${emailFooter({ showEli: true }, brand)}
${emailClose()}`.trim();

  try {
    const result = await resend.emails.send({
      from: emailFrom(brand, 'contracts'),
      to: ctx.customer_email,
      subject: `Contract ${ctx.project_number}, ready to sign`,
      html,
    });
    if ((result as any)?.error) {
      const errMsg = (result as any).error?.message || JSON.stringify((result as any).error);
      console.error('[contract-emails] sendContractToCustomer Resend error:', errMsg);
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[contract-emails] sendContractToCustomer failed:', msg);
    return { success: false, error: msg };
  }
}

// ─── Customer email: their contract is signed + confirmed ──────────────
// Parallels the quote-acceptance confirmation, but links straight to the
// contract so the customer can view/download their fully-signed copy.
export async function sendContractSignedToCustomer(
  ctx: ContractEmailContext,
  env: ContractEmailEnv,
  isLocalhost = false,
  brand: Brand = SL_BRAND
): Promise<{ success: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) return { success: false, error: 'RESEND_API_KEY not configured' };
  if (!ctx.customer_email) return { success: false, error: 'Customer email is required' };

  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);
  const contractUrl = `${baseUrl}/project/contract/${ctx.contract_token}/`;
  const firstName = ctx.customer_name?.split(' ')[0] || 'there';
  const totalStr = Number(ctx.total) > 0 ? ` (${fmtMoney(ctx.total)})` : '';

  const html = `
${emailOpen()}
  ${emailHeader('Contract signed', brand)}
  <div style="padding: 40px 30px;">
    <p style="font-size:16px; color:#1e293b; margin:0 0 16px;">Hi ${firstName},</p>
    <p style="font-size:15px; color:#475569; line-height:1.6; margin:0 0 16px;">
      Thanks for signing your contract <strong>#${ctx.project_number}</strong>${totalStr}. It's official: ${brand.name} will be in touch to get your project on the schedule.
    </p>
    <p style="font-size:15px; color:#475569; line-height:1.6; margin:0 0 24px;">You can view or download your signed contract anytime:</p>
    <div style="text-align:center; margin: 28px 0;">
      ${emailButton(contractUrl, 'View signed contract', 'green')}
    </div>
    <div style="background:#f8fafc; border-radius:12px; padding:20px 24px; margin:24px 0; border:1px solid #e2e8f0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:14px; width:150px;">Total</td>
          <td style="padding:10px 0; border-bottom:1px solid #e2e8f0; color:#1e293b; font-size:14px; font-weight:700; text-align:right;">${fmtMoney(ctx.total)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; color:#64748b; font-size:14px;">Start date</td>
          <td style="padding:10px 0; color:#1e293b; font-size:14px; font-weight:600; text-align:right;">${fmtDate(ctx.start_date)}</td>
        </tr>
      </table>
    </div>
    <p style="font-size:13px; color:#94a3b8; text-align:center; margin-top:24px;">
      Questions? Reply to this email${brand.phoneDisplay ? ` or call ${brand.phoneDisplay}` : ''}.
    </p>
  </div>
  ${emailFooter({ showEli: true }, brand)}
${emailClose()}`.trim();

  const text = `Hi ${firstName},\n\nThanks for signing contract #${ctx.project_number}${totalStr}. ${brand.name} will be in touch to schedule your project.\n\nView your signed contract: ${contractUrl}\n\nQuestions? Reply to this email${brand.phoneDisplay ? ` or call ${brand.phoneDisplay}` : ''}.\n\n${brand.name}`;

  try {
    const result = await resend.emails.send({
      from: emailFrom(brand, 'contracts'),
      to: ctx.customer_email,
      subject: `Contract ${ctx.project_number}: signed & confirmed`,
      html,
      text,
    });
    if ((result as any)?.error) {
      const errMsg = (result as any).error?.message || JSON.stringify((result as any).error);
      console.error('[contract-emails] sendContractSignedToCustomer Resend error:', errMsg);
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[contract-emails] sendContractSignedToCustomer failed:', msg);
    return { success: false, error: msg };
  }
}

// ─── Admin notification: customer signed the contract ──────────────────
export async function sendContractSignedNotification(
  ctx: ContractEmailContext,
  env: ContractEmailEnv,
  isLocalhost = false
): Promise<{ success: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) return { success: false, error: 'RESEND_API_KEY not configured' };
  // Falls back to the site mailbox so admin notifications still flow before
  // NOTIFICATION_EMAIL is configured in the Worker.
  const notifyTo = env.NOTIFICATION_EMAIL || 'mm@mannyknows.com';

  const resend = new Resend(env.RESEND_API_KEY);
  const baseUrl = getBaseUrl(isLocalhost);
  const projectUrl = `${baseUrl}/admin/projects?open=${ctx.project_id}`;

  const html = `
${emailOpen()}
  ${emailHeader('Contract signed')}
  <div style="padding: 36px 30px;">
    <h1 style="font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0;">
      ${ctx.signer_name || ctx.customer_name} signed Contract ${ctx.project_number}
    </h1>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
      The customer accepted and electronically signed the contract on ${fmtDate(ctx.signed_at || '')}.
      Project is cleared to start.
    </p>

    <div style="background: #f8fafc; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
        <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Customer</td><td style="padding: 6px 0; color: #1e293b; font-size: 13px; font-weight: 600; text-align: right;">${ctx.customer_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Signed name</td><td style="padding: 6px 0; color: #1e293b; font-size: 13px; font-weight: 600; text-align: right;">${ctx.signer_name || ', '}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Total</td><td style="padding: 6px 0; color: #1e293b; font-size: 13px; font-weight: 700; text-align: right;">${fmtMoney(ctx.total)}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Start date</td><td style="padding: 6px 0; color: #1e293b; font-size: 13px; font-weight: 600; text-align: right;">${fmtDate(ctx.start_date)}</td></tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      ${emailButton(projectUrl, 'Open project', 'blue')}
    </div>
  </div>
  ${emailFooter()}
${emailClose()}`.trim();

  try {
    const result = await resend.emails.send({
      from: 'MannyKnows <contracts@send.mannyknows.com>',
      to: notifyTo,
      subject: `Signed: Contract ${ctx.project_number} (${ctx.customer_name})`,
      html,
    });
    if ((result as any)?.error) {
      const errMsg = (result as any).error?.message || JSON.stringify((result as any).error);
      console.error('[contract-emails] sendContractSignedNotification Resend error:', errMsg);
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[contract-emails] sendContractSignedNotification failed:', msg);
    return { success: false, error: msg };
  }
}
