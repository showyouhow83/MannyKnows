# Architecture Overview

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Astro | 5.13.0 |
| Adapter | @astrojs/cloudflare | 12.6.3 |
| Styling | Tailwind CSS | 3.4.17 |
| Runtime | Cloudflare Workers | - |
| Database | Cloudflare KV | - |
| Storage | Cloudflare R2 | - |
| Email | Resend API | - |
| Language | TypeScript | 5.9.2 |

## Cloudflare Bindings

### KV Namespaces

| Binding | Namespace ID | Purpose |
|---------|--------------|---------|
| `MK_KV_CHATBOT` | ed368c98eef342b79e8f7c4b96b3fb62 | Chat sessions, admin data, newsletter |
| `MK_KV_PROFILES` | 901abbf5b0484165a8eaa35a035f1ba8 | User profiles |
| `MK_KV_SESSIONS` | 4c1513b546c040678d266ba4f103a057 | User sessions |
| `MK_KV_SERVICES` | 13e95a5db28a4a9da5f517fe0a1e4250 | Service configurations |
| `MK_KV_PRODUCTS` | d5cc59ddbef24b8db748c977aee91bb0 | Product data |
| `MK_KV_SCHEDULER` | 22c4ca99de924d07996d6b44d538602a | Discovery calls |

### R2 Buckets

| Binding | Bucket Name | Purpose |
|---------|-------------|---------|
| `MK_R2` | mannyknows-website-analysis | Analysis results, file storage |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `GA_MEASUREMENT_ID` | Google Analytics |
| `OWNER_EMAIL` | Owner notifications |
| `OWNER_TIMEZONE` | Scheduling timezone |
| `RESEND_FROM` | Email sender |
| `ADMIN_KEY` | Admin authentication |
| `ADMIN_EMAIL` | Admin email |

### Secrets (in .dev.vars / Cloudflare)

| Secret | Purpose |
|--------|---------|
| `OPENAI_API_KEY` | OpenAI API |
| `RESEND_API_KEY` | Resend email API |
| `KV_ENCRYPTION_KEY` | KV data encryption |

## Directory Structure

```
src/
├── components/              # 41 Astro components
│   ├── analytics/          # GoogleAnalytics.astro
│   ├── content/            # Content sections
│   ├── footer/             # Footer components
│   ├── layout/             # Container, Section, PageSection
│   ├── navigation/         # NavBar, DockMenu
│   ├── sections/           # Hero, Services, Reviews, Process
│   └── ui/                 # ChatBox, Button, Tag, Modal
│
├── config/chatbot/         # Environment configs
│
├── layouts/
│   └── BaseLayout.astro    # Main layout
│
├── lib/
│   ├── chatbot/            # promptBuilder.ts
│   ├── security/           # 7 security modules
│   ├── services/           # Business logic
│   │   ├── components/     # Service components
│   │   ├── ServiceArchitecture.ts
│   │   ├── serviceOrchestrator.ts
│   │   └── dynamicServiceExecutor.ts
│   └── user/               # ProfileManager.ts
│
├── pages/
│   ├── api/                # 11 API endpoints
│   ├── index.astro         # Homepage
│   ├── admin.astro         # Admin dashboard
│   ├── unsubscribe.astro   # Newsletter unsubscribe
│   └── 404.astro           # Error page
│
└── utils/
    └── debug.ts            # Logging utilities
```

## Security Architecture

### Layers

1. **Domain Validation** - Whitelist allowed origins
2. **Rate Limiting** - Per-IP request limits
3. **CSRF Protection** - Token-based validation
4. **Input Validation** - Schema-based sanitization
5. **Authentication** - Session + token auth
6. **Encryption** - KV data encryption

### Security Modules

| Module | Purpose |
|--------|---------|
| `domainValidator.ts` | CORS and origin validation |
| `rateLimiter.ts` | General rate limiting |
| `adminRateLimiter.ts` | Admin-specific limits |
| `csrfProtection.ts` | CSRF token generation/validation |
| `inputValidator.ts` | Input sanitization |
| `adminAuthenticator.ts` | Admin sessions |
| `kvEncryption.ts` | KV data encryption |

## Data Flow

```
Request → Domain Validator → Rate Limiter → CSRF Check → Input Validation → Business Logic → KV/R2 → Response
```

## Deployment

### Routes

| Pattern | Zone |
|---------|------|
| `mannyknows.com/*` | mannyknows.com |
| `www.mannyknows.com/*` | mannyknows.com |

### Build & Deploy

```bash
npm run build           # Compile Astro to dist/
npx wrangler deploy     # Deploy to Cloudflare
```

### Configuration Files

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Cloudflare Workers config |
| `astro.config.mjs` | Astro build config |
| `tailwind.config.mjs` | Tailwind CSS config |
| `tsconfig.json` | TypeScript config |
