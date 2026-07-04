## 1. Configuration & dependency

- [x] 1.1 Add `httpx` to `dependencies` in `src/pyproject.toml`.
- [x] 1.2 In `src/server.py`, read `AI_PROXY_URL` (default empty) after `load_dotenv()`, and derive a boolean `PROXY_ENABLED = bool(AI_PROXY_URL)`.
- [x] 1.3 Read `AI_PROXY_TIMEOUT` (seconds, safe default e.g. `30`) from the environment.

## 2. Proxy client helper

- [x] 2.1 Add an async helper `proxy_chat(prompt: str) -> str | None` that POSTs `{ "message": prompt }` to `{AI_PROXY_URL}/chat` using `httpx.AsyncClient` with the configured timeout.
- [x] 2.2 On a `2xx` response, parse and return the `reply` string; return `None` if it is missing/empty or the body is malformed.
- [x] 2.3 Catch connection errors, timeouts, and non-`2xx` responses (including the proxy's `{ "error": {...} }` envelope) and return `None` — never raise to the caller, never log a raw stack trace to the client.
- [x] 2.4 Define the Bengali fallback message constant (e.g. `AI_PROXY_FALLBACK_BN = "দুঃখিত, এই মুহূর্তে আমি উত্তর দিতে পারছি না। একটু পরে আবার চেষ্টা করুন।"`).

## 3. Startup: skip local engine in proxy mode

- [x] 3.1 In `load_models()`, guard the `litert_lm.Engine(...)` construction so it is skipped when `PROXY_ENABLED` is true; still load the TTS backend.
- [x] 3.2 Ensure `resolve_model_path()` / model download is not triggered when proxy mode is enabled.

## 4. WebSocket handler: route inference through the proxy

- [x] 4.1 In the per-turn loop, branch on `PROXY_ENABLED`: when enabled, build the text prompt from the same content the local path assembles (typed `text`, or the instruction text + `BENGALI_DIRECTIVE` for audio/image turns) instead of calling the local engine.
- [x] 4.2 Await `proxy_chat(prompt)`, timing it into `llm_time`; when it returns `None`, use `AI_PROXY_FALLBACK_BN`.
- [x] 4.3 Set `text_response` from the proxy reply (or fallback) and set `transcription = None`; skip the `create_conversation`/`respond_to_user` setup in proxy mode.
- [x] 4.4 Leave the interrupt checks, `{type:"text",...}` send, sentence splitting, and TTS streaming (lines ~184-239) unchanged so the WebSocket shape and audio pipeline are preserved.

## 5. Documentation

- [x] 5.1 Add commented `AI_PROXY_URL` and `AI_PROXY_TIMEOUT` entries to the root `.env.example` with the default proxy URL (`http://localhost:3000`) noted.
- [x] 5.2 Add a short README note describing how to run FastAPI in proxy mode against the Node service (start proxy, set `AI_PROXY_URL`, start FastAPI).

## 6. Verification

- [x] 6.1 With `AI_PROXY_URL` unset: confirm the app behaves exactly as before (local `litert_lm` path, engine loaded).
- [x] 6.2 With `AI_PROXY_URL` set and the Node proxy running: send a text turn and confirm the reply comes from the proxy, the `{type:"text",...}` shape is unchanged, and TTS streams normally.
- [x] 6.3 With `AI_PROXY_URL` set and the Node proxy stopped: confirm the Bengali fallback message is returned, the WebSocket stays open, and no raw error reaches the client.
- [x] 6.4 Confirm the outbound call honors `AI_PROXY_TIMEOUT` (a slow/unresponsive proxy yields the fallback rather than hanging).
