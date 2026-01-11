# MannyKnows Documentation

## Quick Links

| Document | Description |
|----------|-------------|
| [ONBOARDING.md](ONBOARDING.md) | Getting started guide for developers |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Tech stack, bindings, and structure |
| [API.md](API.md) | API endpoint reference |
| [COMPONENTS.md](COMPONENTS.md) | Service component registry |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build and deploy
npm run build && npx wrangler deploy
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
| R2 | `MK_R2` | File storage |

### Production URLs

- https://mannyknows.com
- https://www.mannyknows.com

### Admin Access

- URL: https://mannyknows.com/admin
- Email: mk@mannyknows.com
