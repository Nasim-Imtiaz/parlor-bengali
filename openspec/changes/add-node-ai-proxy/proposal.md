## Why

Parlor's AI runs on-device via LiteRT-LM + Gemma 4 E2B, which requires an Apple-Silicon/GPU machine, ~3 GB RAM, and a multi-GB model download (README "Requirements"). When that local stack is impractical to run — a common situation for reviewers/evaluators and for lighter deployment targets — there is today **no way to exercise the AI conversation path at all**. The project also states a forward preference (audit `proposal.md`, `design.md:24`) that new glue/service code should be JavaScript/Node.js. This change adds a small, self-contained Node.js proxy that can serve AI chat/completion requests by calling a **configurable external provider**, so the AI path can be run without the on-device model, using the repo's preferred stack.

## What Changes

- **Add a standalone Node.js service** in its own directory (`services/ai-proxy/`) with its own `package.json` and npm start script — no coupling to the Python `src/` app.
- **Add a health endpoint** (`GET /health`) that returns a simple OK status for liveness checks.
- **Add an AI chat/completion endpoint** (`POST /chat`) that accepts a user `message` and returns a structured JSON response containing the assistant reply.
- **Isolate all provider-specific code** behind a single small module (a "provider client"), so the HTTP layer never talks to a vendor SDK directly and the provider can be swapped without touching the routes.
- **Drive all configuration from environment variables**: provider base URL, API key, model name, service port, and request timeout — with sane defaults where safe (port, timeout) and required-with-clear-error where not (API key, base URL).
- **Return clean, consistent JSON** for both success and error cases, and **handle errors gracefully**: missing/misconfigured API key or provider, upstream failures/timeouts, and malformed requests each produce a clear JSON error with an appropriate HTTP status — never an unhandled crash or a raw stack trace.
- **Add a service-local `.env.example`** documenting every variable, and add setup/run notes (README section for the service, or a task to write them) so the service is discoverable and runnable.

**Non-goals (explicitly out of scope):**
- **No changes to the FastAPI backend** (`src/server.py`, `src/tts.py`, etc.) — it is not rewritten, edited, or wired to this service.
- **No integration between FastAPI and this proxy** in this change (no shared process, no WebSocket bridge) unless a follow-up change decides to.
- **No UI/localization work** — no HTML or JavaScript frontend strings are touched (owned by the sibling Bengali-localization changes).
- **No provider lock-in and no committed secrets** — only `.env.example` placeholders; the real API key stays in an untracked `.env`.

## Capabilities

### New Capabilities
- `node-ai-proxy`: A standalone Node.js (Express) service that exposes a health endpoint and an AI chat/completion endpoint, calls a configurable external AI provider through an isolated provider-client module, is configured entirely via environment variables (provider base URL, API key, model, port, timeout), returns clean JSON on success, and degrades gracefully with clear JSON errors on missing configuration, upstream failure, timeout, or malformed input.

### Modified Capabilities
<!-- None. No existing behavioral specs exist in openspec/specs/, and this change adds a new, isolated service without modifying the FastAPI backend or any existing requirement. -->

## Impact

- **New files only, under `services/ai-proxy/`:** service entrypoint (e.g. `server.js`), an isolated provider-client module, `package.json` (+ lockfile), and a service-local `.env.example`. Optionally a short README section or a documentation task.
- **New runtime dependency:** Node.js (LTS) plus a minimal HTTP framework (**Express**, chosen for simplicity — the repo has no existing Node toolchain to reuse, so the smallest, most familiar option is preferred over Fastify). No Python dependencies added.
- **No changes** to `src/`, the existing root `.env.example`, the WebSocket protocol, or the on-device model path — the two services are independent and can run separately.
- **New surface to run/test:** `npm install && npm start` inside `services/ai-proxy/`; health and chat endpoints are callable with `curl`.
