## Context

Parlor's entire frontend is a single, build-less file: `src/index.html`, served verbatim by `src/server.py`. There is no bundler, no `static/` directory, and no module system — all browser logic lives in one inline `<script>` (lines 458–875). User-facing strings are hardcoded as inline literals at their call sites. The sibling change `localize-html-templates-bn` translated the static markup but explicitly deferred these runtime strings; because JS overwrites the initial paint, the app currently reverts to English the instant it becomes interactive.

The concrete user-facing JS strings (audit §2a), with line references, are:

- **State labels** (`setState`, line 570): `Loading...`, `Listening`, `Thinking...`, `Speaking`.
- **Status pill** (`setStatus`): `Connected` (616, 807), `Disconnected` (620), `Processing` (717).
- **Camera toggle** (824): `Camera On` / `Camera Off`.
- **Transcript metadata**: `with camera` (718), `LLM ${llm_time}s` (634), ` · TTS ${tts_time}s` (651).

Alongside these are non-user-facing developer strings — `console.warn`/`console.log` at lines 667, 696, 705, 846, 871 — and protocol/style tokens (status classes `connected`/`disconnected`/`processing`, WebSocket `type` values) that must NOT change.

## Goals / Non-Goals

**Goals:**
- Every user-facing string produced by the inline JS renders in natural, professional Bengali for the full session lifecycle.
- Consolidate localized strings into one lightweight in-file string table, eliminating scattered literals for reused text (e.g. `Connected`).
- Preserve 100% of existing behavior, class names, message-`type` tokens, and metadata number/unit formatting.

**Non-Goals:**
- No i18n framework, locale-file server route, or build step.
- No changes to static HTML text (owned by `localize-html-templates-bn`), AI prompts, backend Python, TTS, or any Node.js service.
- No refactor beyond routing the identified strings through the new table.

## Decisions

### Decision 1: In-file `const` string table, not a separate locale file
Introduce a single frozen constant (e.g. `const BN = { … }`) near the top of the existing inline `<script>`, grouped by area (`state`, `status`, `camera`, `meta`), and reference it at each call site.

- **Why:** The app is a single served file with no static-asset route or bundler. A separate `locale.js` would require a new server route and a second `<script src>` — added surface area and risk for zero benefit at this scale (~10 strings). An inline table is the faithful realization of the proposal's "small locale/constants module" for a build-less app.
- **Alternatives considered:** (a) Separate `static/locale.js` + new Flask/route — rejected: new backend coupling, violates "no unrelated change." (b) Full i18n library (i18next, etc.) — rejected: heavy dependency for a single-locale app; explicitly out of scope. (c) Leave literals inline, translate in place — rejected: reused strings (`Connected` × 2) would drift; proposal asks to organize repeated strings.

### Decision 2: Localize display words only; preserve keys, classes, tokens, numbers
Translate only the human-readable text. State keys (`loading`/`listening`/…), the `labels`/`stateVars` map keys, status classes, WebSocket `type` values, numeric timing values, the `s` unit, and the ` · ` separator are unchanged.

- **Why:** These are behavioral/style/protocol identifiers; changing them would break CSS, the state machine, or the client/server contract. The spec requires behavior parity.

### Decision 3: `LLM` / `TTS` acronyms kept as Latin acronyms; surrounding format localized
Render timing metadata so the numeric value, `s`, and `·` are intact while any descriptive framing is Bengali. `LLM` and `TTS` are kept as their standard uppercase Latin acronyms (widely recognized untranslated technical terms, mirroring how brand/model identifiers were kept in `localize-html-templates-bn`), e.g. `LLM ১.২s` style, with the label sourced from the table so it can be adjusted centrally.

- **Why:** These acronyms have no natural, unambiguous Bengali expansion that a Bangladeshi technical user would prefer over the acronym; forcing a translation would reduce, not improve, clarity. Keeping them as acronyms is consistent with the project's decision to leave `Parlor` and `Gemma 4 E2B` untranslated.
- **Alternatives considered:** Full Bengali expansion of LLM/TTS — rejected as unnatural/verbose in a compact metadata line. Digit localization (Bengali numerals) is out of scope and left to the existing formatting.

### Decision 4: Developer console strings stay English
`console.log`/`console.warn` diagnostics are not added to the table and remain in English.

- **Why:** They are never shown to users; translating them adds noise and complicates debugging for developers who work in English.

## Risks / Trade-offs

- **[Layout overflow] Bengali text is often longer/taller than English and could overflow the fixed-size status pill, state indicator, or camera button.** → Mitigation: choose concise, natural Bengali wording; visually verify each of the four states, both connection states, both camera states, and a full transcript line render without clipping (task in `tasks.md`).
- **[Behavioral regression from touching hot paths] The edited lines sit inside `setState`, `setStatus`, `addMessage`, and the WebSocket handler.** → Mitigation: change only the string operands, never control flow or keys; run a full manual session (connect → listen → process → speak → camera toggle → barge-in) to confirm parity.
- **[Font rendering] Bengali glyphs depend on the page font stack.** → Mitigation: the static-template change already established Bengali rendering with `lang="bn"`; reuse the same rendering path, no new font work needed.
- **[Double-ownership drift with the HTML change] initial static values (`Disconnected`, `Camera On`, `Loading...`) also exist in markup.** → Mitigation: this change deliberately mirrors those Bengali strings in the JS table; keep wording consistent with `localize-html-templates-bn` so the pre- and post-interactive text match.

## Migration Plan

1. Add the `const BN` table near the top of the inline `<script>`.
2. Replace the identified inline literals (lines 570, 616, 620, 717, 634, 651, 718, 807, 824) with table lookups.
3. Manually verify the app in a browser across all states and interactions.
4. Rollback is trivial: revert the single-file diff; no data, schema, or dependency changes are involved.

## Open Questions

- Final Bengali wording per label is a copy decision to be settled during implementation against the "natural, professional, Bangladeshi-user" bar; the examples in the spec are indicative, not binding.
