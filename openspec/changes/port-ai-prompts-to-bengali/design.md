## Context

Parlor is a build-less, single-server FastAPI app that runs Gemma 4 E2B on-device via LiteRT-LM. All AI prompt/instruction text lives in one file, `src/server.py`:

- `SYSTEM_PROMPT` (L37–42) — set once per conversation at `engine.create_conversation(...)` (L103–106).
- Three per-turn instruction strings (L143, L145, L147) appended to the user content depending on which media (audio/image) the turn carries; plus a text fallback `"Hello!"` (L149).
- The `respond_to_user` tool (L92–98), whose docstring and argument descriptions are exposed to the model as a tool schema and registered via `tools=[respond_to_user]` (L105).

The `audit-localization-surface` audit (§4) established the key behavioral fact: **no prompt pins the output language.** Because `SYSTEM_PROMPT` says *"transcribe exactly what the user said, then write your response,"* the multilingual model mirrors the user's language. The audit also confirmed (§4 finding) there is **no literal Indonesian string** in the prompts — the "Indonesian-oriented" behavior is the inherited *mirror-the-user* default from the upstream Indonesian/English-learner project, not translatable text. Sibling changes already localized the HTML template (`bengali-html-ui`) and runtime JS (`bengali-frontend-js`); this change is the conversation-layer counterpart.

A hard constraint sits downstream (audit §5): the TTS pipeline uses an English-only G2P (`misaki[en]`) and an English voice (`af_heart`), so it cannot yet *speak* Bengali. This change makes the assistant's **text** Bengali; audible Bengali is a separate dependency change.

## Goals / Non-Goals

**Goals:**
- Make the assistant default to natural, professional Bangladeshi Bengali responses, replacing the user-driven/English-mirroring default in the main flow.
- Keep the `respond_to_user` tool contract, faithful multi-language transcription, and response-length guidance intact.
- Centralize the Bengali directive in one durable named constant so it (a) also governs the non-tool raw-text path and (b) survives a future model/provider swap.
- Document manual test prompts so the behavior can be verified by hand (no automated eval harness exists).

**Non-Goals:**
- No new AI provider, model, or dependency; no engine/config changes.
- No Node.js proxy or new service.
- No HTML template or browser JavaScript changes (sibling changes own those surfaces).
- No fix for spoken TTS / Bengali G2P — carried as a known limitation.
- No change to backend HTTP/WebSocket response strings or logs beyond the prompt layer.

## Decisions

### D1: Pin Bengali in the prompt layer rather than leave it user-driven
The upstream default mirrors the user's language. For a Bengali product the assistant should default to Bengali. We add an explicit output-language directive rather than relying on emergent multilingual behavior.
- **Alternative — leave user-driven:** rejected; it contradicts the change's goal and leaves the assistant answering in English whenever the user does.
- **Alternative — detect language and branch:** rejected as over-engineering for a prompt-only change; the model is already multilingual and a single directive is sufficient and simpler.

### D2: One named constant `BENGALI_DIRECTIVE` as the single source of truth
Define the normative Bengali-output wording once (e.g. `BENGALI_DIRECTIVE = "Always respond in natural, conversational Bangladeshi Bengali ..."`) near `SYSTEM_PROMPT`, and compose it into: the system prompt (string concatenation), the three per-turn strings, and the `respond_to_user` `response` arg description.
- **Why:** satisfies the change's fallback/durability requirement. Because the directive is in `SYSTEM_PROMPT`, it still governs the raw-text fallback path (L165–167) where the model answers without calling the tool. Because it is one obvious constant, a later model/provider swap inherits it instead of silently reverting to English.
- **Alternative — inline the directive in each string:** rejected; scatters wording, invites drift, and is easy to miss when swapping backends.

### D3: Keep transcription language-faithful; pin only the response
The directive targets the assistant's *response*, not the *transcription*. `transcription` must still record whatever language the user actually spoke (the audit stresses "transcribe exactly"). Practically: the system prompt keeps "transcribe exactly what the user said," and the Bengali directive is scoped to the response ("...your response to the user is in Bengali").
- **Why:** preserves the existing tool contract and avoids corrupting the transcript when a user speaks English.

### D4: Localize the fallback greeting; preserve everything structural
`"Hello!"` (L149) becomes a natural Bengali greeting. Tool registration, `create_conversation`, `send_message`, sentence splitting, streaming, and WebSocket message keys are untouched — this is a text-only change plus one constant.

### D5: Tone via instruction wording, verified manually
Natural, professional Bangladeshi Bengali (not machine-translated feel) is expressed by directing the model to use natural conversational Bangladeshi Bengali and avoid stiff word-for-word translation. Since there is no automated eval, correctness is checked with the documented manual prompts in `tasks.md`.

## Risks / Trade-offs

- **[Model ignores or dilutes the directive on some turns]** → Put the directive in the always-present `SYSTEM_PROMPT` *and* reinforce it in each per-turn string and in the tool `response` description, so it is present on every code path; verify with manual prompts including an English-input prompt.
- **[Per-turn Bengali directive leaks into the transcription]** → Scope the directive wording explicitly to the response, keep "transcribe exactly what the user said" for transcription; include a manual test that speaks English and checks the transcript is English while the reply is Bengali.
- **[Tone reads as machine-translated]** → Directive explicitly asks for natural, conversational Bangladeshi Bengali; manual review of sample replies by a Bengali reader is the acceptance gate. Non-blocking wording can be tuned without structural change.
- **[Spoken output is still English-phonemized]** → Out of scope and documented; TTS/G2P (`misaki[en]`, `af_heart`) is a separate dependency change (audit §5). Text is Bengali even though audio is not yet.
- **[Directive wording drift on future backend swap]** → Single `BENGALI_DIRECTIVE` constant is the mitigation; note it near `SYSTEM_PROMPT` so it is discoverable.

## Migration Plan

Text-only edit to `src/server.py`; no data, schema, or dependency migration. Rollback is a straight `git revert` of the change — no state to unwind, no client coupling (the browser and WebSocket protocol are unchanged).

## Open Questions

- **Exact `BENGALI_DIRECTIVE` wording** (register/formality) — to be finalized during apply and, ideally, reviewed by a native Bangladeshi Bengali reader. Not blocking for the proposal.
- **Bengali TTS** — explicitly deferred; will need its own change (Bengali G2P + voice or an alternate TTS engine).
