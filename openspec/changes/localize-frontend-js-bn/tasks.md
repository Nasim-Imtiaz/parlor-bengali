## 1. Prepare the string table

- [x] 1.1 In `src/index.html`, add a single frozen `const` string table (e.g. `BN` / `UI_TEXT`) near the top of the inline `<script>` (after the element refs, before `setState`), grouped by area: `state`, `status`, `camera`, `meta`.
- [x] 1.2 Draft natural, professional Bengali copy for each entry suitable for Bangladeshi users: state labels (Loading…/Listening/Thinking…/Speaking), status text (Connected/Disconnected/Processing), camera labels (Camera On/Camera Off), and the `with camera` tag; keep `LLM`/`TTS` as Latin acronyms per design Decision 3.
- [x] 1.3 Keep the initial static-paint wording (Disconnected, Camera On, Loading…) consistent with the Bengali strings from `localize-html-templates-bn` (`সংযোগ বিচ্ছিন্ন`, `ক্যামেরা চালু`, `লোড হচ্ছে…`; `ক্যামেরা বন্ধ` for off).

## 2. Route JS strings through the table

- [x] 2.1 Replace the `setState` `labels` map (line ~570) values with `BN.state.*` lookups; leave the state keys and `stateDot`/`viewport-wrap` class names unchanged.
- [x] 2.2 Replace the `setStatus` text arguments with `BN.status.*`: `Connected` (lines ~616 and ~807), `Disconnected` (~620), `Processing` (~717); keep the class tokens (`connected`/`disconnected`/`processing`) unchanged.
- [x] 2.3 Replace the camera-toggle label (line ~824) with `BN.camera.on` / `BN.camera.off`; keep the `active` class toggle and behavior intact.
- [x] 2.4 Replace the `with camera` tag (line ~718) with `BN.meta.withCamera`.
- [x] 2.5 Update the `LLM ${msg.llm_time}s` label (line ~634) and the ` · TTS ${msg.tts_time}s` label (line ~651) to source their words from `BN.meta.*`, preserving the numeric value, `s` unit, and ` · ` separator exactly.

## 3. Preserve non-scope surfaces

- [x] 3.1 Confirm `console.log`/`console.warn` diagnostics (lines ~667, ~696, ~705, ~846, ~871) are left unchanged in English and not added to the table.
- [x] 3.2 Confirm no static HTML template text, WebSocket `type` values, status classes, AI prompts, or backend files were touched. (`git diff --stat`: only `src/index.html`, 17 insertions / 10 deletions.)

## 4. Verify

- [ ] 4.1 Run the app and exercise a full session (connect → listen → process → speak → camera on/off → disconnect/reconnect → barge-in); confirm every user-facing string displays in Bengali and behavior is unchanged. **(Not run in this environment — requires the LiteRT-LM/Gemma model + live mic/camera. Static checks passed: `node --check` on the extracted inline script is OK; all 9 call sites route through `BN`; keys/classes/`type` tokens unchanged. Needs a manual run by the user.)**
- [x] 4.2 Visually verify Bengali text fits without clipping in the status pill, state indicator, camera button, and a transcript metadata line. (Static CSS check: `.status-pill`, `.ctrl-btn`, `.state-indicator`, `.msg .meta` are content-sized — padding-based, `display:flex`, no fixed `width`, no `white-space:nowrap`+`overflow:hidden` — so short Bengali strings expand containers without clipping. Live pixel confirmation recommended alongside 4.1.)
- [x] 4.3 Confirm each reused string (e.g. Connected) resolves to a single table entry and no user-facing English literal remains in the JS. (`grep` for user-facing English literals returns none; `Connected` resolves to the single `BN.status.connected` entry at both call sites.)
