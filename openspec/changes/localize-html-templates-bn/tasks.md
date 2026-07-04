## 1. Prepare

- [x] 1.1 Re-verify the seven target locations in `src/index.html` still match the audit table (lines `2`, `6`, `421`, `423`, `424`, `444`, `447`, `451`); update line references if the file has drifted.
- [x] 1.2 Confirm the canonical Bengali strings in `design.md` with a native Bengali (Bangladeshi) reviewer; record any wording refinements back into the design table before editing.

## 2. Translate the HTML template

- [x] 2.1 Set the document language: change `<html lang="en">` to `<html lang="bn">` (`src/index.html:2`).
- [x] 2.2 Replace the initial status-pill text `Disconnected` with `সংযোগ বিচ্ছিন্ন` (`src/index.html:424`).
- [x] 2.3 Replace the initial camera-toggle button label `Camera On` with `ক্যামেরা চালু` (`src/index.html:444`).
- [x] 2.4 Replace the initial state-indicator label `Loading...` with `লোড হচ্ছে…` (`src/index.html:447`).
- [x] 2.5 Replace the on-device pill text `On-device` with `ডিভাইসেই` (`src/index.html:451`).
- [x] 2.6 Leave the `Parlor` wordmark (`:6` `<title>`, `:421` `<h1>`) and the `Gemma 4 E2B` model label (`:423`) untranslated, per design.

## 3. Verify scope and layout

- [x] 3.1 Diff the change and confirm only the static markup of `src/index.html` is modified — the inline `<script>` user-facing strings, `src/server.py`, `src/tts.py`, and dependency manifests are untouched.
- [x] 3.2 Serve the app (`cd src && uv run server.py`) and load `http://localhost:8000`; confirm the initial paint shows the Bengali status pill, camera button, state label, and on-device pill, and that `Parlor` / `Gemma 4 E2B` are unchanged.
- [ ] 3.3 Check desktop and mobile viewports: verify the header, status pill, button, state indicator, and on-device pill show Bengali text without overflow, clipping, control-row wrapping, or overlap. If glyph rendering is poor, log the webfont open question rather than expanding scope. _(PENDING — needs a manual visual pass in a real browser; not verifiable headlessly. Strings are short and static analysis shows no obvious overflow risk, but confirm visually.)_
- [x] 3.4 Confirm the browser reports the document language as Bengali (`document.documentElement.lang === "bn"`).

## 4. Validate the change

- [x] 4.1 Run `openspec validate localize-html-templates-bn` and resolve any errors.
- [x] 4.2 Note the known limitation in the PR description: runtime JS still overwrites some labels in English (deferred sibling change), so post-connect text may briefly show English.
