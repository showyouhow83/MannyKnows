# Chatbot Runtime & Feature Flags (Authoritative)

This document replaces older scattered markdown files. It describes how the chatbot actually behaves RIGHT NOW.

## 1. Single Source of Truth vs. Reality
- `src/config/chatbot/environments.json` is loaded by `chat.ts` (API) for persona, goals, model, flags.
- `PromptBuilder` ignores that file and uses an internal hardcoded map for the same fields (duplicate config).
  Result: Changing flags or model in `environments.json` updates API logic (model sent) BUT the prompt's embedded tool section & some flags rely on PromptBuilder's internal copy.

## 2. Active Feature Flags
Flag | Where Defined | What It Actually Controls | Current Caveat
---- | ------------- | ------------------------- | -------------
`chatbot_enabled` | environments.json & internal map | Early exit in API returning offline message | Works
`debug_logging` | both | Enables devLog output in API (via utils/debug.ts) | Works
`database_enabled` | both | Determines if a DB adapter (KV/Memory) + ChatbotTools are created | If false: NO lead capture/logging
`tools_enabled` | both | Adds AVAILABLE TOOLS section to system prompt | Does NOT by itself enable any tool persistence; requires `database_enabled`

## 3. tools_enabled vs database_enabled
- Setting `tools_enabled: true` alone only changes prompt text (model sees tools list).
- Tool execution path (lead capture, logging) requires that a `ChatbotTools` instance exists.
- `ChatbotTools` is only constructed when `database_enabled` is true.

Therefore: To actually save leads or log interactions you must have BOTH:
```
"tools_enabled": true,
"database_enabled": true
```

## 4. envConfig.environment Bug
`PromptBuilder`'s internal environment objects DO NOT set `environment` property. Later code checks `envConfig.environment` (e.g., production guardrail fallback, DB adapter environment) — currently undefined.
Consequences:
- Guardrail production override never triggers.
- Database adapter may fall back to Memory even in production if relying on that value.

## 5. OpenAI Call Flow
1. Build messages: system prompt + history + current user.
2. Model: uses `model` from `envConfig` (from environments.json) unless overridden by client `model` (client currently omits model).
3. Adds `max_completion_tokens` only if model does NOT include `gpt-5`.
4. Response normalization chooses `choice.message.content` or fallback fields.

## 6. Lead Capture Trigger Logic
Lead capture attempts when BOTH flags active and either condition holds:
- `shouldCaptureLead(message)` returns true (regex for email/phone/contact intent)
- OR conversation_history length >= 5
Merged data sources:
- Quick regex extraction (email, phone, name) from entire concatenated history + current message
- `LeadScoringService.extractLeadFromConversation` (if implemented) for enriched fields
Scoring & tier added; lead saved if meaningful info present.

## 7. What To Fix (Recommended Order)
1. Remove internal environment map from `PromptBuilder`; pass in loaded env settings.
2. Inject `environment` field explicitly so production checks work.
3. Allow tools without persistence: if `tools_enabled` true and `database_enabled` false, create a MemoryAdapter just for tools.
4. De-duplicate persona/goal definitions into JSON files (optional enhancement).
5. Add streaming (improves UX) and unify model token handling.

## 8. Safe Cleanup Candidates (Unused / Redundant)
File | Status | Action
---- | ------ | ------
`CHATBOT_SYSTEM.md` | Outdated | Delete
`PROJECT_SUMMARY.md` | Overlaps new docs | Keep or archive
`QUICK_DEPLOY.md` | Redundant with deploy.sh + this doc | Delete or merge
`deploy.sh.backup` | Legacy | Delete if identical to current logic

(Verify with a search before deletion.)

## 9. Minimal Patch Spec (if proceeding)
- Update `chat.ts`:
  - After loading envSettings: `const promptBuilder = new PromptBuilder({ ...envSettings, environment });`
  - Remove usage of `createPromptBuilder` if obsolete.
- Update `PromptBuilder`:
  - Constructor accepts full env config (with flags) and sets `this.envConfig = { ...config }`.
  - Delete internal `environments` object.
  - Use `this.config.persona` & `this.config.goals` directly.
- Tool gating:
  ```ts
  const canUseTools = envConfig.tools_enabled;
  if (canUseTools) {
     const adapterEnv = envConfig.database_enabled ? environment : 'development';
     const dbAdapter = createDatabaseAdapter(adapterEnv, envConfig.database_enabled ? storage : undefined);
     chatbotTools = new ChatbotTools(dbAdapter, session_id);
  }
  ```
- Production guardrail:
  ```ts
  if (!validation.valid && environment === 'production') { ... }
  ```

## 10. Deployment Checklist
- Rotate exposed secrets (if any)
- `wrangler secret put OPENAI_API_KEY`
- Ensure KV binding present: `CHATBOT_KV`
- Build & deploy: `npm run build && npx wrangler deploy`
- Test /api/chat via curl with sample message

## 11. Curl Test
```bash
curl -X POST https://<your-worker>/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Need a faster site","conversation_history":[]}'
```
Expected JSON with `reply` field.

## 12. Future Enhancements
- Stream responses (Server-Sent Events or fetch streaming)
- Add rate limiting (IP/session) to prevent abuse
- Move persona/goal config to JSON for non-dev edits
- Add admin authentication for /admin/leads
- Implement D1 adapter usage and migration script

---
Authoritative as of current commit. Update this file whenever behavior changes.
