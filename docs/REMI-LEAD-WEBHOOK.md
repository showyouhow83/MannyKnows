# Remi → Admin lead webhook

The endpoint Remi (the opscloud.us widget/app) posts leads to. It already
exists — it shipped with the admin port — nothing new to build on the site.

## Endpoint

```
POST https://mannyknows.com/api/leads/capture
Content-Type: application/json
```

Public (no auth header), rate-limited to 10 submissions/hour per IP.
Works same-origin from the widget on the page, or server-to-server from the
opscloud backend.

## Minimal payload

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "(413) 555-0100",
  "source": "remi-chat",
  "project_description": "Wants a website for her bakery",
  "conversation_summary": "Asked about the $95 plan, bilingual needs, budget ~$100/mo"
}
```

Rules:
- `name` is required; at least one of `email` / `phone` is required.
- `source` must be a short slug — use **`remi-chat`** (the admin UI and the
  lead-alert emails already label it "Remi chat").
- `conversation_summary` is a dedicated column — send Remi's chat recap here,
  not crammed into the description.
- Optional extras it understands: `address`, `city`, `state`, `zip`,
  `service_type`, `preferred_date`, `preferred_time`, `project_images[]`.

## What happens on a successful POST

1. Row inserted into the admin D1 `leads` table (status `pending_confirmation`).
2. A contact is auto-created/linked in the CRM.
3. Lead-alert email to `NOTIFICATION_EMAIL` (defaults to mm@mannyknows.com)
   via Resend, plus admin notify.
4. If the lead included an email: the customer gets a confirmation email with
   an `MK-…` code and a confirm link.

Response: `{ "success": true, "lead_id": 123, "confirmation_code": "MK-…" }`

## Current gating (important)

The endpoint returns **503 `Database not configured`** until the admin's
`MK_APP_DB` D1 binding is created and uncommented in `wrangler.jsonc`
(see SETUP-ADMIN.md). The admin ships dark on purpose; wiring Remi to this
URL now is safe — leads will start landing the day the database goes live.
Until then, Remi's own opscloud dashboard is where its leads live.

## Test it (after MK_APP_DB is live)

```bash
curl -s https://mannyknows.com/api/leads/capture \
  -H 'Content-Type: application/json' \
  -d '{"name":"Webhook Test","email":"mm@mannyknows.com","source":"remi-chat","conversation_summary":"test — delete me"}'
```

Then check `/admin/leads` — the lead should be there with source "Remi chat".
