## Context

The `audit-localization-surface` change inventoried every user-facing language surface in Parlor. Relevant findings for this change (audit §1, §7):

- The entire UI is a single inline template, `src/index.html` — markup + `<style>` + `<script>` in one file. There is **no i18n mechanism** (no gettext, no locale catalog, no language switch).
- The static markup contains exactly seven visible strings plus the `lang` attribute:

  | Audit # | Line | Current text | Element |
  |---|------|------|---------|
  | attr | `src/index.html:2` | `<html lang="en">` | document language |
  | 1 | `src/index.html:6` | `Parlor` | `<title>` |
  | 2 | `src/index.html:421` | `Parlor` | `<h1>` logo wordmark |
  | 3 | `src/index.html:423` | `Gemma 4 E2B` | model-label pill |
  | 4 | `src/index.html:424` | `Disconnected` | status pill (initial) |
  | 5 | `src/index.html:444` | `Camera On` | camera-toggle button (initial) |
  | 6 | `src/index.html:447` | `Loading...` | state-indicator label (initial) |
  | 7 | `src/index.html:451` | `On-device` | privacy pill |

- The backend serves the template verbatim (`src/server.py:82`, `HTMLResponse`) — there is no server-side templating layer, so "template rendering" here means the static HTML file itself; no backend change is required.
- **Overlap with JS (audit §2a):** the initial values of the status pill (`Disconnected`), camera button (`Camera On`), and state label (`Loading...`) are overwritten at runtime by JavaScript (`setStatus(...)`, the `stateLabels` map, `cameraToggle.textContent`). Those JS strings are an explicit non-goal of this change.

## Goals / Non-Goals

**Goals:**
- Render the static template's visible text in natural, professional Bengali on initial paint.
- Set `lang="bn"` so the document is correctly identified as Bengali.
- Preserve the existing layout with the new text.
- Keep the change surgical: static markup of `src/index.html` only.

**Non-Goals:**
- Translating frontend JavaScript user-facing strings (deferred to a sibling change).
- Changing AI prompts / tool schema, or the TTS pipeline (audit §4, §5).
- Building an i18n framework, locale switching, or a string catalog — a single-locale hardcoded translation matches the current single-locale English architecture.
- Adding a Node.js service or any backend change.

## Decisions

### Decision: Hardcode Bengali in place, no i18n framework
Replace the English literals directly, mirroring the current architecture (English was also hardcoded inline). Introducing gettext/JSON catalogs would be scope creep for seven strings and is unjustified until a genuine multi-locale requirement exists.
- *Alternative considered:* extract strings into a locale catalog + switcher. Rejected — no second locale is required, and it would touch far more than the template surface.

### Decision: Keep `Parlor` and `Gemma 4 E2B` untranslated
`Parlor` is the product brand (wordmark + tab title) and `Gemma 4 E2B` is the model identifier. Both are proper nouns; translating or transliterating them would harm brand/technical identity and is not what "localize UI copy" means.
- *Alternative considered:* transliterate `Parlor` to Bengali script (পার্লার). Rejected — brands are conventionally kept in Latin script in Bangladeshi digital products, and the wordmark is a styled logo.

### Decision: Canonical Bengali strings
The implementation SHALL use these translations (natural, concise, layout-friendly). Exact wording may be refined by a native reviewer during implementation, but must preserve meaning and register:

| Element | English | Bengali | Rationale |
|---|---|---|---|
| `lang` attr | `en` | `bn` | Bengali locale |
| status pill (initial) | `Disconnected` | `সংযোগ বিচ্ছিন্ন` | "connection disconnected" — natural status phrasing |
| camera button (initial) | `Camera On` | `ক্যামেরা চালু` | standard "camera on"; pairs with `ক্যামেরা বন্ধ` in the deferred JS change |
| state label (initial) | `Loading...` | `লোড হচ্ছে…` | common Bengali UI phrasing for loading |
| on-device pill | `On-device` | `ডিভাইসেই` | "on the device itself" — conveys the privacy meaning without a literal calque |

Notes: use a real ellipsis character or `...` consistent with the source; `চালু`/`বন্ধ` (on/off) are the idiomatic pair Bangladeshi users expect for toggles.

### Decision: Fix the initial paint even though JS overwrites some values
The status pill, camera button, and state label are set again by runtime JS in English. Translating the static values still improves the first paint (before the socket connects / VAD initializes) and makes the template internally consistent. The residual inconsistency once JS runs is a **known limitation**, recorded below and owned by the follow-up JS-localization change — it is disclosed, not hidden.

## Risks / Trade-offs

- **[Runtime JS reverts labels to English]** → Out of scope by design; documented in the proposal Impact and Open Questions. The follow-up JS change closes the gap. Until then, initial paint is Bengali and post-connect text may briefly show English.
- **[Bengali glyphs wider/taller → layout break]** → Verify the header, fixed-size status pill, button, and pills in desktop and mobile viewports after the edit; the chosen strings are short. Google Fonts `Instrument Sans`/`Syne` (audit §5) are Latin-only and will fall back to a system Bengali font for these glyphs — confirm rendering is legible; if not, the mitigation is a Bengali webfont, tracked as an open question rather than done silently.
- **[Wrong/awkward translation]** → The canonical table is reviewed by a native Bengali speaker before finalizing; meaning and professional register are the acceptance bar, not literal fidelity.

## Open Questions

- Should a Bengali-capable webfont (e.g. a Noto Bengali family) be added for consistent rendering, or is the system fallback acceptable? (Defer unless verification shows poor rendering.)
- Should `Parlor` remain a Latin wordmark permanently, or is a Bengali logo treatment desired later? (Out of scope here.)
