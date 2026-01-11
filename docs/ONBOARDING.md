# AI Agent Onboarding Guide - MannyKnows Project

## Project Overview

**MannyKnows** is an AI-powered business automation platform built with Astro.js and deployed on Cloudflare Workers.

### Core Services
- **AI Sales Agents** - Lead generation, follow-up, appointment booking
- **AI Customer Support** - 24/7 service, voice assistants, multilingual support
- **eCommerce Solutions** - Web scraping, smart forms, dynamic pricing
- **Workflow Automation** - Data entry, invoice processing, CRM automation
- **Creative Services** - Photography, 360 services
- **Business Analytics** - AI web intelligence, competitor analysis
- **Training & Consulting** - AI training, consulting

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 5.13.0 (SSR) |
| Styling | Tailwind CSS 3.4 |
| Runtime | Cloudflare Workers |
| Database | Cloudflare KV |
| Storage | Cloudflare R2 |
| Email | Resend API |
| Analytics | Google Analytics |

## Project Structure

```
MannyKnows/
├── src/
│   ├── components/          # UI components (41 files)
│   │   ├── analytics/       # GA tracking
│   │   ├── content/         # Content components
│   │   ├── footer/          # Footer sections
│   │   ├── layout/          # Layout components
│   │   ├── navigation/      # NavBar, DockMenu
│   │   ├── sections/        # Page sections
│   │   └── ui/              # Base UI (ChatBox, Button, etc.)
│   ├── config/chatbot/      # Chatbot configs
│   ├── layouts/             # BaseLayout.astro
│   ├── lib/
│   │   ├── chatbot/         # Chatbot logic
│   │   ├── security/        # Security utilities
│   │   ├── services/        # Business logic
│   │   └── user/            # User management
│   ├── pages/
│   │   ├── api/             # API routes
│   │   ├── admin.astro      # Admin dashboard
│   │   ├── index.astro      # Homepage
│   │   └── unsubscribe.astro
│   └── utils/               # Utilities
├── docs/                    # Documentation
├── scripts/                 # Build scripts
├── wrangler.jsonc           # Cloudflare config
└── package.json
```

## Cloudflare Bindings

### KV Namespaces (MK_KV_* pattern)

| Binding | ID | Purpose |
|---------|----|---------|
| `MK_KV_CHATBOT` | ed368c98eef342b79e8f7c4b96b3fb62 | Chat sessions, admin sessions, newsletter |
| `MK_KV_PROFILES` | 901abbf5b0484165a8eaa35a035f1ba8 | User profiles |
| `MK_KV_SESSIONS` | 4c1513b546c040678d266ba4f103a057 | User sessions |
| `MK_KV_SERVICES` | 13e95a5db28a4a9da5f517fe0a1e4250 | Service configs |
| `MK_KV_PRODUCTS` | d5cc59ddbef24b8db748c977aee91bb0 | Product data |
| `MK_KV_SCHEDULER` | 22c4ca99de924d07996d6b44d538602a | Discovery calls |

### R2 Bucket

| Binding | Bucket Name | Purpose |
|---------|-------------|---------|
| `MK_R2` | mannyknows-website-analysis | File storage |

### Data Patterns

```typescript
// Newsletter (MK_KV_CHATBOT)
Key: "newsletter:{email}"
Value: { email, status, subscribedAt, unsubscribeToken }

// Discovery calls (MK_KV_SCHEDULER)
Key: "meetreq:{id}"
Value: { id, name, email, phone, project_details, status, createdAt, adminNotes }

// Admin sessions (MK_KV_CHATBOT)
Key: "admin_session:{token}"
Value: { email, createdAt, expiresAt }
```

## API Endpoints

### Core APIs

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/chat` | GET, POST | Chat & scheduling |
| `/api/contact` | GET, POST | Contact form |
| `/api/newsletter` | GET, POST | Newsletter signup |
| `/api/admin-login` | GET, POST | Admin auth |
| `/api/newsletter-admin` | GET | Newsletter management |
| `/api/meetings-admin` | GET, POST | Discovery calls |
| `/api/verify-meeting-action` | GET | Meeting verification |
| `/api/kv-analysis` | GET | KV data analysis |
| `/api/services-analysis` | GET | Services analytics |
| `/api/security-status` | GET, POST | Security monitoring |

### Authentication

```typescript
// Chat API - CSRF token
headers: { 'X-CSRF-Token': csrfToken }

// Admin APIs - Session token
/api/meetings-admin?session=${sessionToken}
```

## Security

### Security Modules (`src/lib/security/`)

| File | Purpose |
|------|---------|
| `adminAuthenticator.ts` | Admin login/sessions |
| `adminRateLimiter.ts` | Rate limiting |
| `csrfProtection.ts` | CSRF tokens |
| `domainValidator.ts` | Domain whitelist |
| `inputValidator.ts` | Input sanitization |
| `kvEncryption.ts` | KV encryption |
| `rateLimiter.ts` | General rate limiting |

### Admin Credentials

```bash
ADMIN_KEY: "mk_admin_merh3t5d_c37019aff77f4677_637b7da191124a68"
ADMIN_EMAIL: "mk@mannyknows.com"
```

## Development

### Commands

```bash
npm run dev          # Start dev server (localhost:4321)
npm run build        # Build for production
npx wrangler deploy  # Deploy to Cloudflare
```

### Environment Files

| File | Purpose |
|------|---------|
| `.dev.vars` | Local secrets (not in git) |
| `wrangler.jsonc` | Production config |

### Important: Always build before deploy

```bash
npm run build && npx wrangler deploy
```

## Key Files

```bash
# Core
src/pages/admin.astro           # Admin dashboard
src/pages/api/chat.ts           # Main chat API
src/pages/api/meetings-admin.ts # Meeting management
src/pages/index.astro           # Homepage

# Security
src/lib/security/inputValidator.ts
src/lib/security/adminAuthenticator.ts

# Services
src/lib/services/ServiceArchitecture.ts
src/lib/services/components/

# Config
wrangler.jsonc
astro.config.mjs
```

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Changes not in production | Run `npm run build` before deploy |
| Admin login failing | Check ADMIN_KEY and ADMIN_EMAIL in wrangler.jsonc |
| KV data not loading | Verify correct binding name (MK_KV_*) |
| Email not sending | Check RESEND_API_KEY in secrets |

### Debug Logging

```typescript
import { devLog, errorLog } from '../../utils/debug';
devLog('Debug message');  // Dev only
errorLog('Error');        // All environments
```

---

*Last updated: January 2026*
