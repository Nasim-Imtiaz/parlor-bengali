## Why

This repository is a fork of `fikrikarim/parlor` that was adapted so its user-facing experience defaults to Bengali (HTML UI, browser JavaScript strings, AI assistant replies) and gained an optional standalone Node.js AI proxy so the conversation path can be exercised **without** the on-device Gemma/LiteRT stack. That work is spread across six merged changes, but the top-level documentation was never reconciled with it: the README still opens as if this were vanilla upstream Parlor, the Bengali adaptation is undocumented, the two run modes (on-device vs. Node proxy) are not presented as one coherent evaluator path, and there is no honest list of known limitations or a manual verification checklist. An evaluator cloning this fork today cannot tell *what changed*, *how to run it in each mode*, or *what is deliberately incomplete*. This change makes the fork easy to run and understand — **documentation only**.

## What Changes

- **Update `README.md`** so it presents this fork accurately for an evaluator:
  - A short **"Bengali localization"** section summarizing the scope of the adaptation (HTML UI, frontend JavaScript, AI assistant replies default to Bengali) and pointing to the OpenSpec changes that delivered it — without re-implementing any of it.
  - A **setup + run** path that documents the **Python/FastAPI** run command (`uv sync` / `uv run server.py`) and the optional **Node.js AI proxy** run command (`npm install` / `npm start`), presented as two clearly-labeled modes (on-device model vs. text-only proxy) rather than scattered notes.
  - A consolidated **required environment variables** reference covering both processes (FastAPI: `MODEL_PATH`, `PORT`, `AI_PROXY_URL`, `AI_PROXY_TIMEOUT`; proxy: `AI_PROVIDER_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `PORT`, `AI_REQUEST_TIMEOUT_MS`), stating which are required in which mode.
  - A **Known limitations** section that is honest and concise (e.g. TTS is English-phonemized so Bengali text is not spoken in Bengali; the Node proxy is text-only so audio/vision inputs are ignored in proxy mode; on-device mode needs Apple Silicon / supported GPU and a multi-GB model download).
  - A **Manual verification checklist** an evaluator can follow to confirm each mode runs and the Bengali surfaces render.
- **Add/refresh `.env.example` files** so a copy-to-`.env` flow is documented and complete for both processes: verify the root `.env.example` (FastAPI) and `services/ai-proxy/.env.example` (proxy) exist, cover every variable named above, and are referenced from the README. Create either file only if missing; otherwise correct/complete it.
- **Cross-link** the root README and `services/ai-proxy/README.md` so the proxy's existing detailed docs are discoverable from the top level rather than duplicated.

**Non-goals (explicitly out of scope for this change):**
- **No new localization.** No HTML, JavaScript, AI-prompt, or backend string is translated or re-translated here; this change only *describes* the localization already merged.
- **No new AI provider logic.** No change to `services/ai-proxy/provider.js`, the FastAPI proxy integration, model/engine configuration, or any request/response behavior.
- **No architecture refactor.** No files under `src/` or `services/ai-proxy/` (other than `.env.example`, and only if incomplete) are modified; no dependencies added; no run commands changed — only documented.
- **No TTS/Bengali-audio work.** The English-only phonemizer limitation is documented, not fixed.

## Capabilities

### New Capabilities
- `runnable-docs`: Defines what the fork's evaluator-facing documentation must contain to be considered runnable and understandable — a README setup/run path covering both the Python/FastAPI mode and the optional Node.js proxy mode, a consolidated required-environment-variable reference keyed by mode, complete `.env.example` templates for both processes, a concise summary of the Bengali localization scope, an honest known-limitations list, and a manual verification checklist. This capability produces documentation only; it mandates no source, dependency, or runtime behavior change.

### Modified Capabilities
<!-- None. Existing behavioral specs (bengali-html-ui, bengali-frontend-js, bengali-ai-prompts, and the proxy changes) are unchanged by this documentation-only change; no requirement of theirs is altered. -->

## Impact

- **Files modified:** `README.md` (primary). Possibly `.env.example` and `services/ai-proxy/.env.example` — only to complete/correct them if a documented variable is missing; created only if absent. Possibly a one-line cross-link added to `services/ai-proxy/README.md`.
- **No application source, dependency, model, or protocol change:** nothing under `src/` (`server.py`, `tts.py`, `index.html`, `pyproject.toml`) and no `services/ai-proxy/*.js` file is touched; run commands and environment-variable *semantics* are documented exactly as they already behave.
- **Audience:** an evaluator/reviewer of the fork, who after this change can clone, read the README, pick a run mode, supply the right env vars, run the app, and verify the Bengali adaptation against a checklist — with limitations stated up front.
