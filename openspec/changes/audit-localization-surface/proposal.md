## Why

This repository (a fork of `fikrikarim/parlor`) must be adapted so the entire user-facing experience is in Bengali, and future glue/service code should prefer JavaScript/Node.js. Before any translation or code work begins, we need a precise, verified inventory of *every* place where user-facing language and language-controlling configuration lives. Translating blindly risks missing strings (especially DOM-injected JS text and the AI system prompt) and misjudging feasibility — for example, the current TTS stack is English-only, which materially affects how "speak Bengali" can be delivered.

This change delivers **only the audit** — a documented, exhaustive map of the localization surface plus the runtime/dependency and run-command context needed to plan the migration. It does not translate text, change code, or add a Node.js service.

## What Changes

- Add a **localization-surface audit** deliverable that inventories, with exact file paths and line references, every user-facing language surface in the repo:
  - HTML visible UI text in `src/index.html` (title, headings, model label, status pill, camera button, state indicator, on-device pill).
  - Browser-side JavaScript strings in `src/index.html` (state labels, connection status text, camera toggle text, timing/`with camera` metadata, and console/log strings — the latter flagged as non-UI).
  - Backend Python strings in `src/server.py` and `src/tts.py` that may reach a user vs. those that are console-only logs.
  - AI prompts / system instructions that control the assistant's language/behavior: `SYSTEM_PROMPT` and the per-turn instruction strings in `src/server.py`, plus the `respond_to_user` tool docstring/argument descriptions exposed to the model.
- Document the **current AI/model runtime dependencies** (LiteRT-LM + Gemma; Kokoro TTS via mlx-audio/kokoro-onnx; the **English-only `misaki[en]` G2P** constraint) that bound what Bengali output is possible.
- Document the **current run commands and environment variables** (`uv sync` / `uv run server.py`; `MODEL_PATH`, `PORT`, `KOKORO_ONNX`; `.env` via `python-dotenv`).
- Produce a reusable **audit checklist** and **acceptance criteria** so the audit's completeness can be verified and so it can be re-run after code changes.
- Record explicit findings on localization readiness: there is **no existing i18n mechanism**, the UI is **English-only**, and strings are hardcoded inline in `index.html`.

Non-goals (explicitly out of scope for this change): translating any text, implementing localization code, and adding a Node.js service.

## Capabilities

### New Capabilities
- `localization-audit`: Defines what a complete, verifiable localization-surface audit of this repository must contain — the categories of user-facing language to enumerate, the runtime/dependency and run-command context to capture, the required precision (exact file paths + line references), the audit checklist, and the acceptance criteria that mark the audit done. This capability produces documentation only; it mandates no translation or code changes.

### Modified Capabilities
<!-- None. No existing specs in openspec/specs/, and this change introduces no requirement changes to existing behavior. -->

## Impact

- **New artifacts only** — under `openspec/changes/audit-localization-surface/` (proposal, spec, design, tasks) and the audit deliverable they define. No application source is modified.
- **Repositories/files inspected (read-only):** `src/index.html`, `src/server.py`, `src/tts.py`, `src/pyproject.toml`, `src/benchmarks/*`, `README.md`, `.env.example`.
- **Downstream:** The audit becomes the input contract for subsequent proposals (Bengali translation of the UI surface, AI-prompt language control, and a Bengali-capable TTS path given the current English-only phonemizer). No code, dependency, or runtime change results from this change itself.
