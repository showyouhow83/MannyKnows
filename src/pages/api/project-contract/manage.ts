// Admin contract management — upload URL, send to customer, mark signed
import type { APIRoute } from 'astro';
import { AdminAuth } from '../../../lib/adminAuth';
import { sendContractToCustomer, type QuoteEmailEnv } from '../../../lib/quote-emails';
import { getBrand } from '../../../lib/brand';

export const prerender = false;

// PATCH: Update contract fields (upload URL, mark signed, send to customer)
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env;
    const db = env?.MK_APP_DB;
    const sessionSecret = env?.SESSION_SECRET || env?.ADMIN_PASSWORD;
    const session = await AdminAuth.validateSession(request, sessionSecret);

    if (!session.isAuthenticated) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as {
      project_id: number;
      action: 'upload' | 'send' | 'mark_signed' | 'remove';
      contract_url?: string;
    };

    if (!body.project_id || !body.action) {
      return new Response(JSON.stringify({ success: false, error: 'project_id and action required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch project with quote info
    const project = await db.prepare(`
      SELECT p.*, q.customer_name, q.customer_email, q.quote_token
      FROM projects p
      LEFT JOIN quotes q ON p.quote_id = q.id
      WHERE p.id = ?
    `).bind(body.project_id).first() as any;

    if (!project) {
      return new Response(JSON.stringify({ success: false, error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (body.action === 'upload') {
      if (!body.contract_url) {
        return new Response(JSON.stringify({ success: false, error: 'contract_url required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      await db.prepare(`
        UPDATE projects SET project_contract_url = ?, contract_status = 'uploaded', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(body.contract_url, body.project_id).run();

      return new Response(JSON.stringify({ success: true, contract_status: 'uploaded' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (body.action === 'send') {
      if (!project.project_contract_url) {
        return new Response(JSON.stringify({ success: false, error: 'No contract uploaded' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (!project.customer_email) {
        return new Response(JSON.stringify({ success: false, error: 'No customer email' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const resendApiKey = env?.RESEND_API_KEY;
      const notificationEmail = env?.NOTIFICATION_EMAIL;
      if (!resendApiKey) {
        return new Response(JSON.stringify({ success: false, error: 'Email not configured' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const origin = request.headers.get('origin') || 'https://mannyknows.com';
      const brand = await getBrand(db, (project as any).partner_id);
      const emailResult = await sendContractToCustomer({
        project_number: project.project_number,
        customer_name: project.customer_name,
        customer_email: project.customer_email,
        contract_url: project.project_contract_url,
        client_token: project.client_token,
        quote_token: project.quote_token,
      }, { RESEND_API_KEY: resendApiKey, NOTIFICATION_EMAIL: notificationEmail || '' }, origin, brand);

      if (!emailResult.success) {
        return new Response(JSON.stringify({ success: false, error: emailResult.error || 'Failed to send email' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await db.prepare(`
        UPDATE projects SET contract_status = 'sent', contract_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(body.project_id).run();

      return new Response(JSON.stringify({ success: true, contract_status: 'sent' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (body.action === 'mark_signed') {
      await db.prepare(`
        UPDATE projects SET contract_status = 'signed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(body.project_id).run();

      return new Response(JSON.stringify({ success: true, contract_status: 'signed' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (body.action === 'remove') {
      await db.prepare(`
        UPDATE projects SET project_contract_url = NULL, project_signed_contract_url = NULL, contract_status = 'none', contract_sent_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(body.project_id).run();

      return new Response(JSON.stringify({ success: true, contract_status: 'none' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Contract] Manage error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
