## Context

Parlor's AI path is on-device: a FastAPI server (`src/server.py`) runs Gemma 4 E2B through LiteRT-LM and speaks back with Kokoro TTS. Running it needs Apple Silicon (or a supported GPU), ~3 GB RAM, and a multi-GB model download (README "Requirements"). For a reviewer/evaluator on a machine that can't run that stack, the entire conversation path is currently unreachable.

The project has stated a forward preference — new glue/service code should be JavaScript/Node.js (audit `proposal.md`; `design.md:24` lists "introducing the Node.js/JavaScript service mentioned for future glue code" as deliberately deferred to a later change). This change is that later change, scoped narrowly: a **standalone** Node.js proxy that answers AI chat requests by calling a **configurable external provider**, so the AI path can be exercised without the local model.

Current constraints:
- The repo has **no existing Node.js toolchain** — this service introduces the first `package.json`.
- There is already a root `.env.example` for the Python app (`MODEL_PATH`, `PORT=8000`). The Node service must not collide with it.
- The service must stay decoupled from FastAPI (no rewrite, no integration) per the proposal's non-goals.

## Goals / Non-Goals

**Goals:**
- Provide a minimal, runnable Node.js service (`npm install && npm start`) that exposes a health check and an AI chat/completion endpoint.
- Call a configurable external AI provider, with all provider details supplied via environment variables (base URL, API key, model, port, timeout).
- Keep provider-specific code behind one isolated module so the HTTP layer is provider-agnostic and the provider can be swapped without touching routes.
- Return clean, consistent JSON on both success and failure; never crash on bad input or upstream failure.
- Ship a service-local `.env.example` and run/setup notes so it is discoverable.

**Non-Goals:**
- No changes to the FastAPI backend or the on-device model path.
- No FastAPI↔proxy integration (no shared process, no WebSocket bridge) in this change.
- No UI/localization work.
- No streaming, auth, rate-limiting, persistence, or multi-provider registry — explicitly deferred to keep the service small and evaluator-friendly.

## Decisions

### D1: Standalone service in its own directory (`services/ai-proxy/`)
The service lives under `services/ai-proxy/` with its own `package.json`, entrypoint, and `.env.example`, fully separate from `src/`.
- **Why:** honors the "no FastAPI rewrite / no integration" non-goal, avoids clashing with the Python root `.env.example`, and gives the evaluator one obvious directory to `cd` into and run.
- **Alternative — nest inside `src/`:** rejected; entangles Node and Python tooling and blurs the boundary the proposal draws.

### D2: Express over Fastify
Use Express as the HTTP framework.
- **Why:** the repo has no Node toolchain to reuse, so "simpler based on current repo structure" means the smallest, most universally familiar option. Express needs the least boilerplate and is the most readable for a reviewer skimming the code — matching the "simple, readable, evaluator-friendly" requirement.
- **Alternative — Fastify:** rejected here; its schema/plugin model is more capable but adds concepts that aren't needed for two endpoints.

### D3: Isolate all provider code behind one client module
A single module (e.g. `provider.js`) owns the HTTP call to the external AI API — building the request from env config, sending it, and normalizing the response to `{ reply }`. Routes call `provider.chat(message)` and never see vendor URLs, headers, or payload shapes.
- **Why:** satisfies "keep provider-specific code isolated" and makes a future provider swap a one-file change. It also keeps the route layer testable against a fake client.
- **Provider shape:** target an OpenAI-compatible `POST {BASE_URL}/chat/completions` JSON contract by default, since most providers (OpenAI, OpenRouter, Groq, local llama.cpp/Ollama gateways) expose it — but that assumption is confined to the one module.
- **Alternative — call the provider inline in the route:** rejected; couples transport to routing and spreads provider assumptions.

### D4: All configuration via environment variables, with fail-fast on required ones
Config comes from env: `AI_PROVIDER_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `PORT`, `AI_REQUEST_TIMEOUT_MS`. Non-critical values (`PORT`, timeout) get safe defaults; required values (base URL, API key) are validated. `dotenv` loads a local `.env` in development.
- **Why:** keeps secrets out of the repo and makes the service portable across providers with no code edits.
- **Config-error behavior:** a missing API key or base URL surfaces as a clear JSON error (see D5), not a silent misfire — a startup log warning plus a `500`/`503` JSON error on `/chat` when unconfigured.
- **Naming:** prefix with `AI_` to avoid collision with the Python app's `PORT`/`MODEL_PATH` conventions; the service's own `PORT` defaults to a non-8000 value (e.g. `3000`) so both services can run side by side.
- **Alternative — a config file:** rejected; env vars are the twelve-factor norm and match the existing `.env.example` pattern.

### D5: One consistent JSON envelope for success and error
Success: `200` with `{ "reply": "<text>", "model": "<model>" }`. Errors: an appropriate status (`400` bad input, `502`/`504` upstream failure/timeout, `500`/`503` misconfiguration) with `{ "error": { "code": "<machine_code>", "message": "<human message>" } }`. A central error handler guarantees no raw stack traces or unhandled crashes escape.
- **Why:** "clean JSON responses" and "graceful error handling" — a stable shape the caller (curl, a test, or a future FastAPI bridge) can rely on.
- **Alternative — pass provider errors through verbatim:** rejected; leaks vendor-specific shapes and undermines the isolation from D3.

### D6: Document via service-local `.env.example` + README notes
Every env var is documented in `services/ai-proxy/.env.example` with placeholder values (no real secrets). Run/setup notes are added — a short README section for the service and/or a documentation task — so acceptance criterion "README/env notes are added or task-created" is met.

## Risks / Trade-offs

- **[Provider contract varies across vendors]** → Default to the widely-supported OpenAI-compatible `chat/completions` shape and confine the assumption to the single provider module (D3); swapping to a different contract is a one-file edit.
- **[Required config missing at runtime → confusing failure]** → Validate required env vars; return a clear, typed JSON config error and log a startup warning (D4/D5) instead of throwing an opaque exception.
- **[Upstream provider hangs]** → Enforce `AI_REQUEST_TIMEOUT_MS` on the outbound call and map a timeout to a `504` JSON error (D5), so the proxy never hangs indefinitely.
- **[Port collision with FastAPI (8000)]** → Node service defaults to a distinct port (e.g. `3000`) and reads `PORT` from its own env (D4).
- **[Secret leakage]** → Only `.env.example` with placeholders is committed; real `.env` stays untracked (ensure it is gitignored). No key is logged.
- **[Scope creep toward a full gateway]** → Streaming/auth/multi-provider are explicit non-goals; keep to two endpoints and one provider module for readability.

## Migration Plan

Purely additive — new files under `services/ai-proxy/` only; nothing existing is modified, so there is no data or protocol migration. Deploy/run is `cd services/ai-proxy && npm install && cp .env.example .env` (fill in real values) `&& npm start`. Rollback is deleting the directory (or `git revert`); the FastAPI app is unaffected either way.

## Open Questions

- **Default provider target** — is the OpenAI-compatible `chat/completions` contract the right default, or should the first provider be a specific service (e.g. Anthropic Messages API)? Confined to `provider.js` either way; to be confirmed at apply time.
- **Documentation placement** — a dedicated `services/ai-proxy/README.md` vs a section in the root README. Leaning service-local README to keep the root focused on the on-device app; finalized during apply.
- **Test depth** — whether to add a minimal automated test (route with a stubbed provider) or rely on documented `curl` checks. Non-blocking for the proposal.
