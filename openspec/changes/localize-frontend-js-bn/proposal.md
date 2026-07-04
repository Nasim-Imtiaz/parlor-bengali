## Why

The localization-surface audit (`audit-localization-surface`) flagged the browser-side JavaScript strings in `src/index.html` as a distinct, higher-risk workstream from the static HTML template — because these strings are written into the DOM at runtime and **overwrite** the initial (now-Bengali) template text as soon as the WebSocket connects or VAD initializes. The sibling change `localize-html-templates-bn` translated only the initial static paint; today, the moment the app becomes interactive it reverts to English (`Connected`, `Listening`, `Thinking...`, `Camera On`, `LLM 1.2s`, etc.). This change translates that runtime JavaScript surface so the experience stays in natural, professional Bengali throughout the entire session, not just on first paint.

## What Changes

- Translate every **user-facing string produced by the inline browser JavaScript** in `src/index.html` into natural, native Bengali (audit §2a):
  - **State-indicator labels** (`setState`, line 570): `Loading...`, `Listening`, `Thinking...`, `Speaking`.
  - **Connection/status-pill text** (`setStatus`): `Connected` (lines 616, 807), `Disconnected` (line 620), `Processing` (line 717).
  - **Dynamic camera-toggle button label** (line 824): `Camera On` / `Camera Off`.
  - **DOM-injected transcript metadata** (`addMessage` / meta updates): the `with camera` tag (line 718), the `LLM {n}s` label (line 634), and the ` · TTS {n}s` label (line 651). Numeric values and the `·` separator are preserved; only the human-readable words are localized (`LLM`/`TTS` acronym handling recorded in design).
- Introduce a **small Bengali string module** — a single `const` string table (e.g. `BN` / `UI_TEXT`) declared at the top of the existing inline `<script>` — and route the strings above through it, replacing scattered inline literals. This is the lightweight "locale/constants" approach appropriate to a single-file, build-less, framework-free app; **no i18n library or build step is added.**
- Keep all existing frontend behavior identical: state machine transitions, status-class names (`connected`/`disconnected`/`processing`), CSS class toggling, WebSocket message handling, audio/VAD/waveform logic, and the metadata string *format* (label + number + unit) are unchanged — only the human-readable words change.

**Explicit non-goals (out of scope for this change):**
- **Static HTML template text** (audit §1) — owned by `localize-html-templates-bn`; not re-touched here.
- **AI system prompt / per-turn instructions / tool schema** in `src/server.py` (audit §4).
- **Backend Python user-facing/log strings**, the TTS pipeline, and its English-only G2P (audit §3, §5).
- **Developer console strings** — `console.warn`/`console.log` messages (lines 667, 696, 705, 846, 871) are diagnostic, never rendered to users, and are intentionally left in English (noted, not translated).
- Dynamic transcript **content** (`msg.text`, `msg.transcription`) is model/STT output, not a hardcoded UI string, and is not in scope.
- No new Node.js service; no unrelated frontend rewrite or refactor beyond routing strings through the new table.

## Capabilities

### New Capabilities
- `bengali-frontend-js`: Requires that every user-facing string emitted by the browser-side JavaScript in `src/index.html` — runtime state labels, connection/status text, dynamic button labels, and DOM-injected transcript metadata — is presented in natural, professional Bengali suitable for Bangladeshi users, sourced from a single lightweight in-file string table, while all existing frontend behavior, class names, and metadata formats are preserved and developer console strings remain untranslated.

### Modified Capabilities
<!-- None. No existing behavioral specs in openspec/specs/. The sibling change bengali-html-ui covers static template text only; this change's runtime strings are a disjoint surface (audit §2a vs §1), so no existing requirement is modified. -->

## Impact

- **Files modified:** `src/index.html` only — the inline `<script>` block (audit §2a lines: `570`, `616`, `620`, `717`, `634`, `651`, `718`, `807`, `824`), plus a new string-table `const` added near the top of that script.
- **No backend/API/dependency change:** `src/server.py` serves `index.html` verbatim; status-class strings (`connected`, `processing`, etc.) and WebSocket message `type` values are protocol/style tokens and stay unchanged, so no server-side coupling is affected.
- **Resolves a known tension from `localize-html-templates-bn`:** that change documented that `Disconnected`, `Camera On`, and `Loading...` would be immediately overwritten in English by runtime JS. This change closes that gap, making the app fully Bengali from first paint through steady-state interaction.
