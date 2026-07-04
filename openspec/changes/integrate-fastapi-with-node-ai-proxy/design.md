## Context

The FastAPI app (`src/server.py`) runs a WebSocket handler (`/ws`) that, for each user turn, calls the on-device `litert_lm` engine via `conversation.send_message(...)` (lines 168-170) and then streams the reply through Kokoro/MLX TTS. The reply is extracted either from a `respond_to_user` tool call (yielding `transcription` + `response`) or, on the fallback path, from raw text (lines 174-182). The engine is loaded at startup in `load_models()` (lines 64-76) and requires Apple Silicon/GPU + a multi-GB model.

The repo now contains a standalone Node.js AI proxy at `services/ai-proxy/` (already committed). Its contract is fixed and consumed as-is:
- `POST /chat` with `{ "message": "<text>" }` → `200 { "reply": "<text>", "model": "<model>" }`
- Errors → non-2xx with `{ "error": { "code": "...", "message": "..." } }`
- Defaults to port `3000` (distinct from FastAPI's `8000`).

Constraints: keep Python changes minimal, do not rewrite the FastAPI architecture, do not touch the Node service, do not change the WebSocket protocol or the frontend. The app currently has **no HTTP client dependency**.

## Goals / Non-Goals

**Goals:**
- Let the assistant reply be produced by the Node proxy when `AI_PROXY_URL` is set, keeping the local `litert_lm` path as the default when it is unset.
- Confine the change to a single env-gated branch around the existing inference call plus a small isolated proxy-client helper.
- Preserve the WebSocket request/response shape and the downstream TTS streaming pipeline.
- Bound the outbound call with a configurable timeout and degrade to a Bengali fallback message on any failure.
- Make the app runnable without the multi-GB model in proxy mode.

**Non-Goals:**
- No changes to `services/ai-proxy/` or its contract.
- No streaming from the proxy, no multi-provider logic, no auth — the proxy owns all of that.
- No media understanding through the proxy (its `/chat` is text-only); audio/image inputs are not transcribed/analyzed in proxy mode.
- No frontend/template/JS localization.

## Decisions

### D1: Single opt-in env var `AI_PROXY_URL` gates the whole feature
Proxy mode is enabled iff `AI_PROXY_URL` is a non-empty value (e.g. `http://localhost:3000`). Read once at startup alongside the existing `MODEL_PATH`/`PORT` reads, using the already-present `dotenv`.
- **Why:** one toggle keeps the local path byte-for-byte unchanged by default, satisfies "minimal Python changes", and mirrors the existing env conventions.
- **Alternative — always call the proxy:** rejected; would break the default on-device experience and force the model to be replaced rather than optionally bypassed.

### D2: Isolate the proxy call behind a small helper
Add one async helper, `proxy_chat(prompt: str) -> str | None`, that owns the HTTP call: it POSTs `{ "message": prompt }` to `{AI_PROXY_URL}/chat`, parses `reply` from a 2xx body, and returns `None` on any failure (connection error, timeout, non-2xx, missing `reply`). The WebSocket handler calls this helper and never embeds URL/JSON/timeout details inline.
- **Why:** keeps the handler readable and the failure handling in one place; mirrors the proxy's own "isolate provider code" pattern on the Python side. Helper can live inline in `server.py` or a tiny `proxy_client.py` — either keeps the footprint small.
- **Alternative — inline the httpx call in the handler:** rejected; spreads transport + error mapping through the hot loop.

### D3: Use `httpx.AsyncClient` with an explicit timeout
Add `httpx` to `src/pyproject.toml` and issue the call with a timeout from `AI_PROXY_TIMEOUT` (seconds, default e.g. `30`). Because the handler is async, `httpx` async avoids blocking the event loop and needs no `run_in_executor` wrapper (unlike the blocking `litert_lm` call).
- **Why:** `httpx` is the standard async client in the FastAPI ecosystem; native async keeps the change idiomatic and non-blocking.
- **Alternative — `requests`/`urllib` in an executor:** rejected; reintroduces thread-pool plumbing the async client removes. **Alternative — `aiohttp`:** viable but heavier and less aligned with FastAPI norms.

### D4: Map the proxy reply onto the existing `text_response`, omit transcription
In proxy mode the handler builds a text prompt, calls `proxy_chat`, and sets `text_response` from the returned `reply`; `transcription` is set to `None` (proxy returns none). Everything after line 184 — interrupt checks, the `{type:"text",...}` message, sentence splitting, and TTS streaming — runs unchanged.
- **Why:** the WebSocket protocol and TTS pipeline stay identical; only the *source* of `text_response` changes. Omitting `transcription` (already an optional field, lines 189-190) avoids fabricating data.
- **Prompt construction:** reuse the same text the local path already assembles — the typed `text`, or for audio/image turns the instruction text (`"The user just spoke to you..."` + `BENGALI_DIRECTIVE`) that the code builds at lines 156-163. The proxy cannot process the raw media, so proxy mode is best-effort for media turns; this is a documented limitation, not a regression of the default path.

### D5: Bengali fallback message on any failure
When `proxy_chat` returns `None`, set `text_response` to a fixed, polite Bangladeshi Bengali message (e.g. "দুঃখিত, এই মুহূর্তে আমি উত্তর দিতে পারছি না। একটু পরে আবার চেষ্টা করুন।") and continue the normal send + TTS flow. The socket stays open; no raw error reaches the client.
- **Why:** meets "Bengali user-friendly fallback" and "existing frontend flow continues working"; keeps behavior consistent with the app's Bengali-default posture (`BENGALI_DIRECTIVE`).
- **Alternative — surface the proxy's `error.message`:** rejected; leaks internal/provider detail and may not be Bengali or user-appropriate.

### D6: Skip the engine load in proxy mode
In `load_models()`, guard the `litert_lm.Engine(...)` construction so it is skipped when proxy mode is enabled; still load the TTS backend (replies are still spoken). The `respond_to_user` tool + `create_conversation` setup is only needed for the local path, so it is bypassed in proxy mode too.
- **Why:** the whole point is to run the AI path without the multi-GB model; loading it in proxy mode would defeat the feature and require the GPU/RAM the proxy is meant to avoid.
- **Alternative — always load the engine:** rejected; keeps the hardware requirement the change is meant to remove.

## Risks / Trade-offs

- **[Proxy is text-only; media turns degrade]** → Document clearly that audio/image are not understood in proxy mode; the local `litert_lm` path (default) remains the full multimodal experience. Proxy mode targets text turns and evaluation.
- **[New `httpx` dependency]** → Minimal, well-established, async-native; added only to `src/pyproject.toml`. No change to the local path's dependency behavior.
- **[Proxy latency / hangs]** → Enforce `AI_PROXY_TIMEOUT` on the `httpx` call and treat timeout as a failure → Bengali fallback (D5), so a turn never hangs.
- **[Loss of `llm_time` meaning]** → `llm_time` now measures the proxy round-trip in proxy mode; still a useful latency number, just a different source. No protocol change.
- **[Interrupt handling]** → The existing `interrupted` checks around the reply still apply; the async `httpx` call is awaited like the executor call it replaces, so interrupt semantics are preserved.

## Migration Plan

Additive and env-gated. Deploy: run the Node proxy (`cd services/ai-proxy && npm install && cp .env.example .env` → fill values → `npm start`), then start FastAPI with `AI_PROXY_URL=http://localhost:3000` (and optionally `AI_PROXY_TIMEOUT`) set. Rollback: unset `AI_PROXY_URL` to restore the on-device path with zero code changes, or `git revert` the change. No data or protocol migration.

## Open Questions

- **Prompt for media turns** — send only the instruction text, or also a note that media can't be processed? Leaning on reusing the existing instruction text (D4); finalize at apply time.
- **Helper placement** — inline in `server.py` vs a small `src/proxy_client.py`. Either is acceptable; decide during apply based on readability.
- **Env var naming for timeout** — `AI_PROXY_TIMEOUT` (seconds) is proposed; confirm units/name against any future convention at apply time.
