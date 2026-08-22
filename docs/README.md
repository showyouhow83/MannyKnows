# MannyKnows Documentation

## Quick Links

| Document | Description |
|----------|-------------|
| [ONBOARDING.md](ONBOARDING.md) | Getting started guide for developers |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Tech stack, bindings, and structure |
| [API.md](API.md) | API endpoint reference |
| [COMPONENTS.md](COMPONENTS.md) | Tombstone: the retired service-component registry |
| [../SETUP-ADMIN.md](../SETUP-ADMIN.md) | Admin/CRM setup + what's already done |
| [../ADMIN-HEROUI-MIGRATION.md](../ADMIN-HEROUI-MIGRATION.md) | Live tracker for the admin HeroUI migration |
| [PORTFOLIO-TO-WORK-HANDOFF.md](PORTFOLIO-TO-WORK-HANDOFF.md) | Spec: connect admin Portfolios to public /work/ |
| [REMI-LEAD-WEBHOOK.md](REMI-LEAD-WEBHOOK.md) | Remi AI → leads webhook contract |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build and deploy
./deploy.sh   # builds + deploys from dist/server/wrangler.json + verifies live
```

## Key Information

### Cloudflare Bindings

| Type | Binding | Purpose |
|------|---------|---------|
| KV | `MK_KV_CHATBOT` | Chat, admin, newsletter |
| KV | `MK_KV_PROFILES` | User profiles |
| KV | `MK_KV_SESSIONS` | User sessions |
| KV | `MK_KV_SERVICES` | Service configs |
| KV | `MK_KV_PRODUCTS` | Product data |
| KV | `MK_KV_SCHEDULER` | Discovery calls |
| D1 | `MK_APP_DB` | Admin CRM database (`mannyknows-db`) |
| R2 | `MK_MEDIA_BUCKET` | Media pool, quote/project uploads, contract PDFs (`mannyknows-media`) |
| Assets | `ASSETS` | Static files from `dist/client` |

### Production URLs

- https://mannyknows.com
- https://www.mannyknows.com

### Admin Access

- URL: https://mannyknows.com/admin
- Login is a username + password (bootstrap pair in Worker secrets, real users
  in D1 `admin_users`). Credentials are never stored in this repo — local ones
  live in `.dev.vars`, which is gitignored.
