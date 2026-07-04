## 1. Setup

- [x] 1.1 Create the audit deliverable file `openspec/changes/audit-localization-surface/audit.md` and stamp it with the branch/commit the audit is taken against
- [x] 1.2 Confirm and record that no i18n mechanism exists (no `.po`/`.pot`, no locale JSON/YAML, no `lang` switching) and that the current UI language is English-only

## 2. Inventory: HTML visible UI text (`src/index.html`)

- [x] 2.1 List every visible HTML string with `path:line`: page `<title>` (L6), `<h1>` logo (L421), model label (L423), initial status pill "Disconnected" (L424), camera toggle "Camera On" (L444), state text "Loading..." (L447), on-device pill (L449–451)
- [x] 2.2 Scan for placeholder / `aria-label` / `alt` / `title` attribute text and record any found (or note none)

## 3. Inventory: browser-side JavaScript (`src/index.html` script block)

- [x] 3.1 Capture DOM-visible strings with `path:line`: state-label map loading/listening/processing/speaking (L570), WebSocket status "Connected"/"Disconnected" (L616/L620), "Processing", camera toggle "Camera On"/"Camera Off" (L824), transcript timing/meta text ("LLM …s" L634, " · TTS …s" L651, "with camera")
- [x] 3.2 Capture any error/validation/loading/success text injected into the DOM
- [x] 3.3 List `console.*`/log strings (e.g. "Video+audio failed:", barge-in and VAD messages) and explicitly flag them as developer-only, not user-facing

## 4. Inventory: backend responses (`src/server.py`, `src/tts.py`)

- [x] 4.1 List backend strings that may reach the browser (HTTP/WebSocket payloads, exception detail) and classify each as user-facing vs console-only
- [x] 4.2 List server `print`/log strings in `server.py` and the TTS backend messages in `tts.py`, flagged as console-only
- [x] 4.3 Note the benchmark scripts (`src/benchmarks/*`) output as developer-facing / out of translation scope (or in scope) with a reason

## 5. Inventory: AI prompts & language-controlling instructions (`src/server.py`)

- [x] 5.1 Record `SYSTEM_PROMPT` (L37–42) with `path:line` and note whether it constrains the assistant's output language
- [x] 5.2 Record the per-turn instruction strings (L143–149) that steer the assistant per input type
- [x] 5.3 Record the `respond_to_user` tool docstring and argument descriptions (L92–98) as model-facing tool schema; note the "transcribe exactly what the user said" behavior that ties output language to the user's speech

## 6. Context: AI/model runtime dependencies

- [x] 6.1 Record the LLM framework/model from `src/pyproject.toml` (`litert-lm` + Gemma) and the frontend CDN libs (`onnxruntime-web`, `@ricky0123/vad-web`)
- [x] 6.2 Record the TTS stack (`mlx-audio`, `kokoro-onnx`, `num2words`) and default voice `af_heart` from `src/tts.py`
- [x] 6.3 Flag the English-only phonemizer/G2P (`misaki[en]`) as a first-class Bengali-output constraint

## 7. Context: run commands & environment variables

- [x] 7.1 Record the run commands (`uv sync`, `uv run server.py`, open :8000) from `README.md` and the uvicorn entrypoint in `server.py`
- [x] 7.2 Record every env var with source `path:line` and default: `MODEL_PATH` (server.py L28), `PORT` (server.py L235), `KOKORO_ONNX` (tts.py L60); note `.env` loading via `python-dotenv` (server.py L20–21) and `.env.example`

## 8. Audit checklist (embed in deliverable)

- [x] 8.1 Provide a checklist item for each scope category (HTML, browser JS, backend, AI prompts, dependencies, run+env); every item is checked-with-evidence or marked N/A with a reason
- [x] 8.2 For each inventory entry, verify the cited text is present unchanged at its `path:line`
- [x] 8.3 Verify no category is empty by omission and every string is tagged user-facing / developer-log / model-facing

## 9. Acceptance criteria (embed in deliverable)

- [x] 9.1 State the acceptance criteria that gate completeness (all categories covered, all entries `path:line`-verifiable, three-way classification applied, TTS/i18n constraints recorded, no translation or `src/` code changes)
- [x] 9.2 Confirm the change's diff modifies no file under `src/` and translates no string
- [x] 9.3 Capture the open questions (localization mechanism, Bengali TTS path, output-language pinning) for the follow-up proposal
