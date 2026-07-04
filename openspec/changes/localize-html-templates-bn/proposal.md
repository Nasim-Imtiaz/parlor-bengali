## Why

The localization-surface audit (`audit-localization-surface`) confirmed that Parlor's UI is English-only, with every visible string hardcoded inline in a single template, `src/index.html`, and no i18n mechanism present. To deliver a native experience for Bangladeshi users, the visible **HTML template copy** — the first thing a user reads before any WebSocket, model, or TTS activity — must be presented in natural, professional Bengali. This change translates that static template surface; it deliberately excludes the runtime JavaScript strings, AI prompts, and TTS pipeline, which the audit flagged as separate, higher-risk workstreams.

## What Changes

- Translate every **visible static HTML string** in `src/index.html` into natural, native-sounding Bengali (audit §1):
  - Browser tab `<title>` (`Parlor`).
  - The `<h1>` logo wordmark and the on-device privacy pill (`On-device`).
  - The initial connection-status pill text (`Disconnected`).
  - The initial camera-toggle button label (`Camera On`).
  - The initial state-indicator label (`Loading...`).
- Set the document language attribute `<html lang="en">` → `lang="bn"` so assistive tech and browsers treat the page as Bengali.
- **Keep brand/model identifiers untranslated:** the `Parlor` wordmark and the `Gemma 4 E2B` model-label pill are proper nouns and stay as-is (decision recorded in design).
- Verify the Bengali text renders without breaking the fixed-size header, status pill, button, and pill layouts (audit §1 elements).

**Explicit non-goals (out of scope for this change):**
- Frontend JavaScript user-facing strings (audit §2a: the state-label map, `Connected`/`Disconnected`/`Processing` status updates, dynamic `Camera On`/`Camera Off` toggle text, transcript metadata). These overwrite some of the static values above at runtime and are deferred to a sibling change.
- AI system prompt / per-turn instructions / tool schema (audit §4).
- The TTS pipeline and its English-only G2P (audit §5).
- Any new Node.js service; backend changes are limited to what template rendering requires (the audit found `src/server.py` serves `index.html` verbatim, so **no backend change is expected**).

## Capabilities

### New Capabilities
- `bengali-html-ui`: Requires that the visible text of Parlor's HTML template (`src/index.html`) — page title, headings, status/label/button/pill text, and the document `lang` attribute — is presented in natural, professional Bengali suitable for Bangladeshi users, while brand and model identifiers remain untranslated and the existing layout is preserved.

### Modified Capabilities
<!-- None. No existing behavioral specs in openspec/specs/; the only prior change (audit-localization-surface) is documentation-only and defines no UI behavior to modify. -->

## Impact

- **Files modified:** `src/index.html` only — the static markup portion (audit §1 lines: `2`, `6`, `421`, `424`, `444`, `447`, `451`; `423` reviewed and intentionally left English).
- **No backend/API/dependency change:** `src/server.py:82` serves the template verbatim; no rendering-layer change is needed.
- **Downstream / known tension:** Because JS is out of scope, several initial static values (`Disconnected`, `Camera On`, `Loading...`) will be immediately overwritten in English by the runtime JS once the socket connects or VAD initializes. This change makes the initial paint Bengali; a follow-up JS-localization change must translate the runtime replacements for full consistency. This is documented, not silently accepted.
