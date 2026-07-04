## ADDED Requirements

### Requirement: Audit deliverable enumerates every user-facing language surface

The audit SHALL produce a written deliverable that enumerates every place in the repository where user-facing language exists, organized by category. Each entry SHALL cite an exact file path and a line reference (or line range). The audit SHALL NOT translate any text and SHALL NOT modify application source code.

#### Scenario: Deliverable exists and is categorized

- **WHEN** the audit is complete
- **THEN** a deliverable document exists that groups findings under the categories: HTML visible UI text, browser-side JavaScript strings, backend Python responses, AI prompts/system instructions, AI/model runtime dependencies, and run commands/environment variables

#### Scenario: Every entry is precisely located

- **WHEN** a reviewer reads any inventory entry
- **THEN** that entry includes the file path and a line number or line range, and the cited text can be found unchanged at that location

#### Scenario: No translation or code changes are introduced

- **WHEN** the change's diff is inspected
- **THEN** no application source file (under `src/`) has been modified and no string has been translated into Bengali

### Requirement: HTML visible UI text is inventoried

The audit SHALL list every visible UI string rendered from HTML templates, including page title, headings, labels, button text, status text, and any placeholder or `aria`/`alt` attribute text.

#### Scenario: index.html strings captured

- **WHEN** the reviewer checks the HTML section
- **THEN** it includes the visible strings in `src/index.html` — at minimum the page `<title>`, the `<h1>` logo text, the model label, the initial connection-status text, the camera toggle button label, the state-indicator label, and the on-device pill — each with its line reference

### Requirement: Browser-side JavaScript language is inventoried

The audit SHALL list every browser-side JavaScript string that becomes user-visible: labels, status/state text, validation text, loading states, error messages, success messages, and text injected into the DOM. Strings that are developer-only (e.g. `console.*` logs) SHALL be listed but explicitly flagged as non-user-facing.

#### Scenario: DOM-injected and status strings captured

- **WHEN** the reviewer checks the JavaScript section
- **THEN** it includes the state-label map (loading/listening/processing/speaking), the WebSocket connection status strings, the dynamic camera toggle text, and any timing/metadata text injected into the transcript, each with its line reference

#### Scenario: Console logs distinguished from UI

- **WHEN** the reviewer checks a `console.*` string
- **THEN** it is marked as developer/log output and not as a user-facing UI string

### Requirement: Backend responses that may be visible to users are inventoried

The audit SHALL list backend (Python) strings that may reach a user — HTTP responses, WebSocket message payloads, exception detail messages — and SHALL distinguish them from server-side console logs that never reach the browser.

#### Scenario: Server and TTS strings classified

- **WHEN** the reviewer checks the backend section
- **THEN** strings in `src/server.py` and `src/tts.py` are each classified as user-facing or console-only, with a note on how (or whether) each reaches the browser

### Requirement: AI prompts and language-controlling instructions are inventoried

The audit SHALL identify every prompt or instruction that controls the assistant's language or behavior, including the system prompt, per-turn instruction strings, and any tool/function schema text (docstrings, argument descriptions) exposed to the model.

#### Scenario: System prompt and instruction strings captured

- **WHEN** the reviewer checks the AI-prompt section
- **THEN** it includes the `SYSTEM_PROMPT`, the per-turn instruction strings, and the `respond_to_user` tool docstring/argument descriptions in `src/server.py`, each with its line reference, plus a note on whether each currently constrains the assistant's output language

### Requirement: AI/model runtime dependencies are documented

The audit SHALL document the current AI/model runtime dependencies and any that constrain Bengali output — in particular the LLM inference framework/model and the TTS stack, including the language of the TTS phonemizer/G2P.

#### Scenario: Model and TTS constraints recorded

- **WHEN** the reviewer checks the dependencies section
- **THEN** it names the LLM framework/model (LiteRT-LM + Gemma) and the TTS backends (mlx-audio / kokoro-onnx) from `src/pyproject.toml`, and explicitly flags the English-only G2P/phonemizer (`misaki[en]`) as a Bengali-output constraint

### Requirement: Run commands and environment variables are documented

The audit SHALL document how the app is currently started and every environment variable it reads.

#### Scenario: Run commands and env vars recorded

- **WHEN** the reviewer checks the run-context section
- **THEN** it records the start commands (from `README.md` and the server entrypoint) and every environment variable referenced (`MODEL_PATH`, `PORT`, `KOKORO_ONNX`) with its source file/line and default, and notes `.env` loading via `python-dotenv`

### Requirement: Audit checklist and acceptance criteria are provided

The audit SHALL include a reusable checklist covering all scope categories and a set of acceptance criteria that determine when the audit is complete, so the audit can be verified and re-run after future code changes.

#### Scenario: Checklist covers all categories

- **WHEN** the reviewer runs the checklist
- **THEN** every scope category (HTML, browser JS, backend, AI prompts, dependencies, run/env) has at least one checklist item, and every item is either checked with evidence or marked not-applicable with a reason

#### Scenario: Acceptance criteria gate completeness

- **WHEN** the audit is evaluated against its acceptance criteria
- **THEN** the audit is considered complete only if all acceptance criteria are satisfied, including confirmation that no existing i18n mechanism was found and that the current UI language is recorded
