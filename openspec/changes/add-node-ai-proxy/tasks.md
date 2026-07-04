## 1. Scaffold the service directory

- [x] 1.1 Create `services/ai-proxy/` and initialize `package.json` with a `"start"` script (e.g. `node server.js`) and `"type": "module"` (or CommonJS — pick one and stay consistent).
- [x] 1.2 Add minimal dependencies: `express` and `dotenv` (D2, D4). Do not add a heavy provider SDK — the provider call uses the built-in `fetch`.
- [x] 1.3 Ensure `services/ai-proxy/node_modules/` and `services/ai-proxy/.env` are gitignored (add to `.gitignore` if not already covered) so no secrets or deps are committed.

## 2. Configuration and environment

- [x] 2.1 Create a small config loader that reads `AI_PROVIDER_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `PORT`, and `AI_REQUEST_TIMEOUT_MS` from the environment via `dotenv` (D4).
- [x] 2.2 Apply safe defaults for non-critical values: `PORT` defaults to a non-8000 value (e.g. `3000`) and `AI_REQUEST_TIMEOUT_MS` to a sane default (e.g. `30000`).
- [x] 2.3 Validate required values (`AI_PROVIDER_BASE_URL`, `AI_API_KEY`); if missing, log a clear startup warning (do not throw at boot) so the state is visible (D4, spec "Misconfiguration is visible at startup").
- [x] 2.4 Write `services/ai-proxy/.env.example` documenting every variable with placeholder values only — no real API key (D6, spec "Documented example config").

## 3. Isolated provider client

- [x] 3.1 Create `services/ai-proxy/provider.js` exposing a provider-agnostic `chat(message)` function; all vendor URL/auth/payload/parse logic lives here only (D3).
- [x] 3.2 Build the outbound request against an OpenAI-compatible `POST {AI_PROVIDER_BASE_URL}/chat/completions` contract using `AI_MODEL` and the `AI_API_KEY` bearer header; normalize the provider response down to `{ reply, model }` (D3, D5).
- [x] 3.3 Enforce the request timeout on the outbound call (e.g. `AbortController` + `AI_REQUEST_TIMEOUT_MS`) and throw a typed timeout error the route layer can map to `504` (D5, spec "Upstream timeout is bounded").
- [x] 3.4 Throw a typed "not configured" error when required config is missing, and a typed "upstream failure" error when the provider returns a non-2xx or unreachable response (do not leak the raw provider body).

## 4. HTTP server and routes

- [x] 4.1 Create `services/ai-proxy/server.js` that builds the Express app, adds `express.json()` body parsing, and starts listening on the configured `PORT`, logging the start (spec "Service starts with an npm command").
- [x] 4.2 Implement `GET /health` returning `200` with a JSON OK body, making no provider call so it succeeds even when the provider is down/unconfigured (spec "Health endpoint").
- [x] 4.3 Implement `POST /chat`: validate the JSON body has a non-empty `message`; on invalid/malformed input return `400` with a structured JSON error and do not call the provider (spec "Missing or empty message is rejected").
- [x] 4.4 On a valid message, call `provider.chat(message)` and return `200` with `{ reply, model }` (spec "Valid message returns a structured reply"). Keep the handler provider-agnostic — no vendor details in the route (D3).

## 5. Error handling and JSON envelope

- [x] 5.1 Add a central Express error handler that maps typed errors to statuses: not-configured → `503`/`500`, bad input → `400`, upstream failure → `502`, timeout → `504` (D5).
- [x] 5.2 Ensure every error response uses one consistent JSON shape (e.g. `{ error: { code, message } }`) and never returns a raw stack trace or the vendor's error payload (spec "Consistent error envelope", "Upstream provider failure is mapped to a clean error").
- [x] 5.3 Add a catch-all so unhandled route errors and JSON parse failures are also returned as clean JSON, not an HTML/Express default error page.

## 6. Documentation

- [x] 6.1 Add run/setup notes: a `services/ai-proxy/README.md` (or a root README section) covering `npm install`, copying `.env.example` to `.env`, filling in provider values, `npm start`, and example `curl` calls for `/health` and `/chat` (D6, acceptance "README/env notes").
- [x] 6.2 Note in the docs that this service is standalone and not yet wired to the FastAPI backend (proposal non-goal).

## 7. Manual verification

- [x] 7.1 From `services/ai-proxy/`, run `npm install` then the start script; confirm it boots and logs the listening port (acceptance "Node service can start with npm command").
- [x] 7.2 `curl http://localhost:<PORT>/health` → returns `200` and an OK JSON body (acceptance "Health endpoint returns OK").
- [x] 7.3 With valid provider config, `curl -X POST .../chat -H 'content-type: application/json' -d '{"message":"hello"}'` → returns `200` with a `reply` field (acceptance "AI endpoint returns a structured response").
- [x] 7.4 Unset/blank the API key and repeat the `/chat` call → returns a clear JSON "provider not configured" error with a non-2xx status and no crash (acceptance "Missing API key/provider errors are handled clearly").
- [x] 7.5 Send an empty/malformed body to `/chat` → returns `400` with a structured JSON error.
- [x] 7.6 Confirm the FastAPI app is unaffected: nothing under `src/` and the root `.env.example` were changed.

## 8. Validate the change

- [x] 8.1 Run `openspec validate --change add-node-ai-proxy` and resolve any issues.
