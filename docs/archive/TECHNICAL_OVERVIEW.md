# MannyKnows Technical Overview

This document provides a fresh, current, single-source reference for how the project works **today** (Workers deployment with GPT-5 based chatbot). It intentionally replaces prior scattered markdown docs.

---
## 1. Stack Summary
- Framework: Astro (SSR) running on Cloudflare Workers (`@astrojs/cloudflare`)
- Language: TypeScript
- Styling: Tailwind CSS
- Deployment: `wrangler deploy` (Worker script + KV bindings)
- Data Storage:
  - KV (binding: `CHATBOT_KV` & `SESSION`) for session/lead storage (Production)
  - In-memory adapter for Development
- AI Model: OpenAI Chat Completions (dev: `gpt-5-nano`, prod: `gpt-5`) configurable

---
## 2. Environment & Config Flow
1. Frontend sends POST to `/api/chat` with: `{ message, conversation_history, (optional) model }`
2. API route (`src/pages/api/chat.ts`) determines environment via `import.meta.env.MODE`.
3. Loads `src/config/chatbot/environments.json` for persona, goals, model, feature flags.
4. Builds system prompt via `PromptBuilder` (`src/lib/chatbot/promptBuilder.ts`).
5. Applies guardrails (response length, prohibited topics, message count limit).
6. Calls OpenAI API with assembled messages.
7. Optionally saves lead + logs interaction if database (KV) enabled.
8. Returns JSON `{ reply, tool_results?, message_limit_reached?, chatbot_offline? }`.

Feature flags in `environments.json`:
- `tools_enabled` – enables tool metadata (not currently used in prompt logic beyond listing)
- `database_enabled` – enables storage adapter + lead capture logic
- `chatbot_enabled` – master on/off switch
- `debug_logging` – toggles verbose logging (uses `src/utils/debug.ts`)

---
## 3. Chatbot Core Modules
| Module | Purpose |
| ------ | ------- |
| `promptBuilder.ts` | Assembles structured sales-focused system prompt + guardrails + tool list. |
| `chat.ts` API route | Validates input, enforces limits, calls OpenAI, triggers lead capture & logging. |
| `leadScoring.ts` | Scores lead quality (0–100) across four dimensions + insights. |
| `chatbotDatabase.ts` | Abstract DB layer with adapters: Memory, KV, (D1-ready). |
| `tools.ts` | High-level operations: save lead, schedule consultation (stubs), log interaction. |

---
## 4. Data & Persistence
Adapters (factory: `createDatabaseAdapter(environment, storage)`):
- Development: Memory only
- Production: KV if available (`globalThis.CHATBOT_KV`)

KV Keys Pattern:
- Leads: `lead:<id>` + `lead_by_email:<email>`
- Consultations: `consultation:<id>`
- Quotes: `quote:<id>`
- Interactions: individual `interaction:<id>` plus session array `session:<session_id>`

Session state is not persisted client-side beyond local JS arrays; server trusts posted `conversation_history`.

---
## 5. Lead Capture Logic
Triggered in `chat.ts` when:
- `envConfig.tools_enabled` AND `database_enabled` AND adapter initialized
- Condition: `chatbotTools.shouldCaptureLead(message)` (heuristic inside `tools.ts`) OR conversation length >= 5
Merged extraction sources:
- Quick pattern-based extraction (name/email/phone) from last user text
- Deep extraction via `LeadScoringService.extractLeadFromConversation` over full history
Scoring applied -> tier + insights stored.

---
## 6. Frontend Chat (Project Consultation Modal)
File: `src/components/ui/ProjectConsultationModal.astro`
Flow:
1. User opens modal, enters first message or selects shortcut.
2. JS collects `conversationHistory` (array of `{ role, content }`).
3. Sends request to `/api/chat` with history.
4. Displays reply; updates history; enforces local max message cap (sync with server limit=15).
5. Handles offline or limit flags by disabling input.

Important: Model is no longer hardcoded. Backend decides actual model; client omits `model` field.

---
## 7. OpenAI Integration
Endpoint: `https://api.openai.com/v1/chat/completions`
Request Body:
```
{
  model: envConfig.model,
  messages: [ {role:'system', content: systemPrompt}, ...history, {role:'user', content: message} ]
}
```
- `max_completion_tokens` added only if model NOT containing `gpt-5` (per current logic).
- Assumes non-streamed usage; synchronous full response.

Potential Improvements:
- Streaming responses
- Per-session IDs for continuity server-side (persist minimal state in KV)
- More robust tool invocation parsing

---
## 8. Known Gaps / Cleanup Targets
1. Security: Secrets should NOT live in `.env` if risk of commit; ensure Wrangler secrets instead.
2. `deploy.sh` currently clears tokens (needs removal of `CLOUDFLARE_API_TOKEN="" CF_API_TOKEN=""`).
3. Missing implementations: `scheduleConsultation`, `generate_quote_request`, list leads in admin (currently mock).
4. No server-side validation of email/phone beyond extraction phase.
5. No rate limiting / abuse protection.
6. D1 schema present but not active unless D1 binding provided.
7. No unit tests.
8. Lead extraction heuristic is shallow (regex + simple keyword).

---
## 9. Troubleshooting Guide
Symptom -> Cause -> Fix:
- 401/403 deploy: API token missing Workers Script write or script cleared in `deploy.sh`.
- Chat returns offline message: `chatbot_enabled` is false in `environments.json` or mismatch build cache (rebuild).
- Empty reply: OpenAI error; check server logs (`debug_logging=true`). Ensure valid OPENAI_API_KEY secret set via Wrangler.
- Message limit triggered early: Client history not preserved or conversation history not sent; ensure `conversationHistory` array updated before next request.
- Leads not saving: `database_enabled` false or KV binding missing (`CHATBOT_KV`). Confirm binding in `wrangler.jsonc`.

Checklist for a working production chat:
- OPENAI_API_KEY set: `npx wrangler secret put OPENAI_API_KEY`
- `CHATBOT_KV` binding present (wrangler config) if database needed
- `environments.json` production block: `chatbot_enabled: true`
- Frontend fetch NOT forcing wrong model
- Deploy with proper token or `wrangler login`

---
## 10. Minimal Operational Commands
Development:
```
npm install
npm run dev
```
Deploy:
```
npm run build
npx wrangler deploy
```
Rotate Secrets:
```
npx wrangler secret put OPENAI_API_KEY
```

---
## 11. Roadmap Suggestions
Short Term:
- Remove token nulling in `deploy.sh`
- Implement streaming; improves UX
- Consolidate environment detection into single utility
Medium:
- Proper lead listing endpoint (iterate KV with prefix lists or maintain an index key)
- Add spam / abuse detection
- Add analytics events emission abstraction
Long Term:
- Migrate to D1 for structured querying of leads
- Add authentication + dashboard metrics real data

---
## 12. Quick Architecture Diagram (Text)
Client Modal -> /api/chat -> PromptBuilder -> OpenAI API
                                 |-> Lead Extraction -> DB Adapter (KV/Memory)
                                 |-> Interaction Log (KV/Memory)

---
## 13. Glossary
- KV: Cloudflare Key-Value store used for lightweight persistence.
- Session: Logical chat continuity identifier (currently default or provided in body).
- Lead Score: Composite 0–100 metric guiding sales prioritization.

---
End of document.
