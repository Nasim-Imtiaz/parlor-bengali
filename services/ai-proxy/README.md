# AI proxy (Node.js)

A small, standalone Node.js (Express) service that answers AI chat requests by
calling a **configurable external provider**. It exists so the AI conversation
path can be exercised **without** running Parlor's on-device Gemma/LiteRT stack
(which needs Apple Silicon / a GPU, ~3 GB RAM, and a multi-GB model download).

> This service is **standalone**. It does not modify or connect to the FastAPI
> backend in `src/` — wiring the two together is intentionally left for a future
> change.

## Endpoints

| Method | Path      | Description                                             |
| ------ | --------- | ------------------------------------------------------- |
| `GET`  | `/health` | Liveness check. Returns `{ "status": "ok" }`. No AI call. |
| `POST` | `/chat`   | Body `{ "message": "..." }` → `{ "reply": "...", "model": "..." }`. |

## Setup

```bash
cd services/ai-proxy
npm install
cp .env.example .env   # then fill in AI_API_KEY, AI_PROVIDER_BASE_URL, AI_MODEL
npm start
```

The service listens on `http://localhost:3000` by default (port `3000` is chosen
so it can run alongside the FastAPI app on `8000`).

## Configuration

All configuration comes from environment variables (loaded from `.env` in
development). See [`.env.example`](./.env.example) for the documented template.

| Variable                | Required | Default                     | Description                                              |
| ----------------------- | -------- | --------------------------- | -------------------------------------------------------- |
| `AI_PROVIDER_BASE_URL`  | yes      | —                           | OpenAI-compatible base URL; calls `{URL}/chat/completions`. |
| `AI_API_KEY`            | yes      | —                           | Bearer token for the provider.                           |
| `AI_MODEL`              | yes      | —                           | Model name to request.                                   |
| `PORT`                  | no       | `3000`                      | Port the proxy listens on.                               |
| `AI_REQUEST_TIMEOUT_MS` | no       | `30000`                     | Outbound request timeout in milliseconds.                |

If a required value is missing, the service still starts and `/health` still
works, but it logs a warning at startup and `/chat` returns a clear
`provider_not_configured` JSON error.

## Example requests

```bash
# Health
curl http://localhost:3000/health
# → {"status":"ok"}

# Chat
curl -X POST http://localhost:3000/chat \
  -H 'content-type: application/json' \
  -d '{"message":"Hello!"}'
# → {"reply":"...","model":"..."}
```

## Response shapes

Success (`200`):

```json
{ "reply": "the assistant text", "model": "gpt-4o-mini" }
```

Error (any non-2xx) — consistent envelope, no stack traces or raw provider bodies:

```json
{ "error": { "code": "provider_not_configured", "message": "AI provider is not configured (...)." } }
```

| Situation                       | Status | `error.code`               |
| ------------------------------- | ------ | -------------------------- |
| Missing/empty `message`, bad JSON | `400`  | `bad_request`              |
| Provider not configured          | `503`  | `provider_not_configured`  |
| Provider unreachable / non-2xx   | `502`  | `upstream_error`           |
| Provider timed out               | `504`  | `upstream_timeout`         |

## Provider isolation

All vendor-specific logic (URL, auth header, payload, response parsing) lives in
[`provider.js`](./provider.js). The routes in `server.js` only call
`chat(message)`. To target a different provider or API contract, edit
`provider.js` — nothing else changes.
