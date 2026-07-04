## 1. Verify current state against the docs (read-only)

- [x] 1.1 Re-read `src/server.py` and confirm the FastAPI env vars and their defaults: `MODEL_PATH` (auto-download), `PORT` (8000), `AI_PROXY_URL` (unset), `AI_PROXY_TIMEOUT` (30).
- [x] 1.2 Re-read `services/ai-proxy/config.js` and `services/ai-proxy/server.js` and confirm the proxy env vars, required-ness, and defaults: `AI_PROVIDER_BASE_URL`, `AI_API_KEY`, `AI_MODEL` (required), `PORT` (3000), `AI_REQUEST_TIMEOUT_MS` (30000), plus the `/health` and `/chat` contract.
- [x] 1.3 Confirm the actual run commands still match (`uv sync` / `uv run server.py` in `src/`; `npm install` / `npm start` in `services/ai-proxy/`) and note any drift to fix in the docs.

## 2. Complete the .env.example templates

- [x] 2.1 Verify the root `.env.example` documents every FastAPI variable from task 1.1; complete or correct it if any is missing/wrong. Create the file only if absent.
- [x] 2.2 Verify `services/ai-proxy/.env.example` documents every proxy variable from task 1.2 with required/optional noted; complete or correct if needed. Create only if absent.

## 3. Rewrite the README for evaluators

- [x] 3.1 Reframe the README intro so it states up front that this is a Bengali-localized fork of `fikrikarim/parlor` (keep the accurate upstream description of how the app works).
- [x] 3.2 Add a concise **Bengali localization** section summarizing the localized surfaces (HTML UI, frontend JavaScript, AI assistant replies default to Bengali) and pointing to where the work lives (OpenSpec changes / affected files). Do not translate or re-translate anything.
- [x] 3.3 Document the **on-device (default) mode** run path: prerequisites, `uv sync` / `uv run server.py` from `src/`, and `http://localhost:8000`, referencing the root `.env.example`.
- [x] 3.4 Document the **Node proxy (optional, text-only) mode** run path: `npm install` / `npm start` from `services/ai-proxy/`, starting FastAPI with `AI_PROXY_URL` set, and cross-link `services/ai-proxy/README.md` for the endpoint/error contract. Label it clearly as optional and text-only.
- [x] 3.5 Add a single **consolidated environment-variable reference** (variable, process, required?, default, description) covering both processes, keyed so a reader knows what to set for each mode; point to both `.env.example` files.
- [x] 3.6 Add a concise, honest **Known limitations** section: TTS is English-phonemized (Bengali text is not spoken in Bengali), proxy mode is text-only (audio/vision ignored), on-device mode needs Apple Silicon / supported GPU + multi-GB model download.
- [x] 3.7 Add a **Manual verification checklist** with observable outcomes for both modes: start FastAPI + load UI, UI renders in Bengali, a turn yields a Bengali reply; for proxy mode, start proxy, `curl /health` → `{"status":"ok"}`, a text turn returns a reply through the proxy.

## 4. Validate

- [x] 4.1 Cross-check every documented env var, default, port, and command against the source read in section 1; fix any mismatch.
- [x] 4.2 Confirm the README's env-var reference and both `.env.example` files are mutually complete (no documented variable missing from its template).
- [x] 4.3 Run `openspec validate document-runnable-bengali-port` and resolve any errors.
