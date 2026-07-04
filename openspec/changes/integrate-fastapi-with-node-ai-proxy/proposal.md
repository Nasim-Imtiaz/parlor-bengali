## Why

Parlor's AI reply is generated on-device by `litert_lm` (Gemma 4 E2B) inside the FastAPI WebSocket handler (`src/server.py:168`), which needs Apple Silicon/GPU, ~3 GB RAM, and a multi-GB model download. The repo now ships a standalone Node.js AI proxy (`services/ai-proxy/`, `POST /chat`) that can answer chat requests from a configurable external provider, but nothing connects the two — the FastAPI app still has no way to use it. This change wires the existing AI reply path to the Node proxy so the conversation flow can run without the local model, with minimal Python changes.

## What Changes

- **Add one opt-in environment variable** (`AI_PROXY_URL`) read by the FastAPI app. When unset, behavior is **unchanged** (local `litert_lm` path). When set, the AI reply is routed through the Node proxy.
- **Adapt the single AI inference call** (`conversation.send_message(...)`, `src/server.py:168-182`) so that in proxy mode it builds a text prompt, calls the proxy's `POST {AI_PROXY_URL}/chat` with `{ "message": ... }`, and maps the returned `{ "reply": ... }` onto the existing `text_response`.
- **Preserve the WebSocket request/response shape** — the browser protocol (`{type:"text", text, llm_time, transcription?}` plus the audio-streaming messages) is untouched; only the source of `text_response` changes. Transcription is omitted on the proxy path (the proxy is text-only).
- **Add timeout handling** on the outbound proxy call via a bounded async HTTP client, configurable by an env var with a safe default.
- **Add a Bengali user-friendly fallback message** used as `text_response` whenever the proxy is unreachable, times out, returns a non-2xx error, or returns a malformed body — so the conversation and TTS keep working instead of crashing the socket.
- **Skip loading the local `litert_lm` engine at startup when proxy mode is enabled**, so the app is runnable without the multi-GB model (TTS still loads, since spoken replies are still produced).
- **Document the new env vars** (queue/add `AI_PROXY_URL` and the timeout var to the root `.env.example` and README).

**Non-goals (out of scope):**
- **No changes to the Node service** (`services/ai-proxy/`) — its endpoints and contract are consumed as-is.
- **No FastAPI architecture rewrite** — same WebSocket handler, same TTS pipeline, one env-gated branch around the inference call.
- **No template or frontend JS localization** — owned by the sibling Bengali-localization changes.
- **No media understanding through the proxy** — the proxy's `/chat` is text-only, so audio/image inputs are not transcribed or analyzed in proxy mode; this limitation is documented, not solved here.

## Capabilities

### New Capabilities
- `fastapi-ai-proxy-integration`: The FastAPI app can route its AI reply generation through the standalone Node.js AI proxy, selected by an environment variable, with the existing WebSocket request/response shape preserved, a bounded request timeout, and a Bengali fallback message on any proxy failure; when the variable is unset the app keeps using the on-device model unchanged.

### Modified Capabilities
<!-- None. openspec/specs/ contains no existing behavioral specs, and this change introduces a new, env-gated integration capability without altering an existing spec. -->

## Impact

- **Affected code:** `src/server.py` — new env read, an isolated proxy-client helper (in `server.py` or a small new module), an env-gated branch around the inference call at lines 168-182, and a conditional skip of `load_models()`'s engine load.
- **New Python dependency:** an async HTTP client (`httpx`) added to `src/pyproject.toml`.
- **Docs:** root `.env.example` and README gain `AI_PROXY_URL` and the proxy timeout var (or a queued documentation task).
- **No changes** to `services/ai-proxy/`, `src/tts.py`, `src/index.html`, the WebSocket message protocol, or the local-model code path when `AI_PROXY_URL` is unset.
- **Runtime:** with `AI_PROXY_URL` set and the Node proxy running (default `http://localhost:3000`), the full voice flow works without the Gemma model; without it, nothing changes.
