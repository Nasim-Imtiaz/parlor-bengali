## Context

Parlor is a single-page, on-device multimodal voice/vision app: a FastAPI backend (`src/server.py`) serving one HTML file (`src/index.html`) that contains all markup, CSS, and browser JS inline, talking over a WebSocket. TTS lives in `src/tts.py` (mlx-audio on Apple Silicon, kokoro-onnx on Linux). There is **no templating layer, no static asset split, and no i18n mechanism** — every user-facing string is a hardcoded English literal at its use site.

The assignment is to move the user-facing experience to Bengali. Before touching any string, we need a verified map of the surface so the translation and TTS-language work can be scoped accurately. This design covers *how the audit is conducted and recorded*, not how localization will later be implemented.

Key current-state facts established during inspection (each is evidence to preserve in the deliverable):
- **AI language control** lives in `src/server.py`: `SYSTEM_PROMPT` (~L37–42), per-turn instruction strings (~L143–149), and the `respond_to_user` tool docstring/arg descriptions (~L92–98) that are surfaced to the model as tool schema. The model (Gemma) is multilingual; today nothing pins its *output* language, and the tool instructs "transcribe exactly what the user said" — so the assistant's language is effectively driven by the user's speech, not the prompt.
- **TTS is English-only at the phonemizer level**: `misaki[en]` G2P and default voice `af_heart` (`src/tts.py`), with a `"Hello"` warmup. This is the single biggest feasibility constraint on "speak Bengali."
- **Runtime/deps** in `src/pyproject.toml`: `litert-lm` (Gemma), `mlx-audio`/`kokoro-onnx`/`misaki[en]`/`num2words` (TTS), FastAPI/uvicorn/websockets. Frontend loads `onnxruntime-web` and `@ricky0123/vad-web` from CDN.
- **Run/env**: `uv sync` + `uv run server.py` (README); env vars `MODEL_PATH`, `PORT` (`server.py`), `KOKORO_ONNX` (`tts.py`); `.env` via `python-dotenv`.

## Goals / Non-Goals

**Goals:**
- Produce a single, reviewable audit deliverable that maps 100% of the user-facing language surface with exact `path:line` citations.
- Classify each string by category and by whether it is user-facing, developer-only (logs), or model-facing (prompts/tool schema).
- Capture the runtime/dependency and run-command context that bounds the Bengali migration — especially TTS language support.
- Provide a checklist + acceptance criteria that let a reviewer confirm completeness and let the audit be re-run after code changes.

**Non-Goals:**
- Translating any string to Bengali.
- Implementing i18n, changing prompts, or adding a Bengali TTS path.
- Introducing the Node.js/JavaScript service mentioned for future glue code.
- Deciding the localization architecture (string catalog format, `lang` negotiation, etc.) — that belongs to a follow-up proposal, though this audit should surface the questions.

## Decisions

**D1 — Deliverable is a Markdown audit report living with the change.**
The audit is documentation, not code. Record it under the change directory (e.g. an `audit.md` inventory plus the checklist/acceptance criteria embedded in `tasks.md`/spec). Rationale: keeps the audit versioned with its proposal and reviewable in one diff; alternative (a wiki page or issue) loses traceability to the spec.

**D2 — Organize by the six scope categories, not by file.**
Grouping by category (HTML / browser JS / backend / AI prompts / dependencies / run+env) matches how the follow-up localization work will be planned and makes gaps obvious. A per-file layout was considered but would scatter, e.g., the AI-prompt findings that all live in `server.py` among unrelated backend logs.

**D3 — Three-way classification of every string: user-facing / developer-log / model-facing.**
Bengali translation applies only to user-facing strings; `console.*` and server `print` logs stay English; prompts/tool schema are a separate concern (they steer the assistant, and mistranslating them could break tool-calling). Explicit tagging prevents over- or under-translating later. Alternative (binary UI/not-UI) was rejected because it hides the prompt category, which is central to "control the assistant's language."

**D4 — Every entry must be independently verifiable via `path:line`.**
Line references (not just quotes) let a reviewer re-open the exact site; this also makes the audit re-runnable after edits. Trade-off: line numbers drift as code changes, so the audit notes the commit/branch it was taken against.

**D5 — Record feasibility constraints inline, not just an inventory.**
The English-only TTS phonemizer and the "transcribe exactly" tool instruction are not strings to translate but facts that shape the plan; the deliverable flags them so the next proposal starts from reality.

## Risks / Trade-offs

- **Missed DOM-injected or dynamically-built strings** (template literals, string concatenation) → Mitigation: grep for `textContent`/`innerHTML`/`setStatus`/label maps in addition to reading `index.html` top-to-bottom; cross-check against the categorized checklist so no category is empty-by-omission.
- **Line references go stale** as source changes → Mitigation: stamp the audit with the branch/commit it was taken against and treat re-running the checklist as cheap.
- **Conflating logs with UI** leads to wasted or wrong translation → Mitigation: explicit three-way classification (D3).
- **Underestimating TTS effort**: treating Bengali as "just translate the UI" ignores that Kokoro/`misaki[en]` cannot phonemize Bengali → Mitigation: surface this as a first-class finding and an open question, not a footnote.
- **Prompt mistranslation risk** deferred to implementation: translating `SYSTEM_PROMPT` or the tool docstring could alter tool-calling behavior → Mitigation: audit flags these as model-facing so they are handled deliberately later.

## Migration Plan

Not applicable — this change adds only documentation artifacts and modifies no runtime code, so there is nothing to deploy or roll back. The audit deliverable becomes the input contract for subsequent proposals (UI translation, prompt language control, Bengali-capable TTS).

## Open Questions

- Which localization mechanism will the follow-up adopt (inline `lang`-keyed strings vs. an external catalog), given everything currently lives in one inline `index.html`?
- How will Bengali TTS be delivered given the English-only phonemizer — swap the TTS engine/voice, add a Bengali G2P, or route TTS through a new JS/Node service?
- Should the assistant's *output* language be pinned to Bengali via the system prompt, or remain user-driven (the model mirrors the user's spoken language)?
- Are server/console logs and the benchmark scripts in scope for translation at all, or explicitly out (developer-facing)?
