# Localization Surface Audit — Parlor

**Purpose:** Map every place in the repository where user-facing language and language-controlling configuration lives, so the Bengali migration can be scoped accurately. This document is an inventory only — **no text is translated and no `src/` code is changed.**

**Taken against:** branch `audit-localization-surface`, commit `de869d6`.
**Line references** are `path:line` into that commit; they may drift as source changes — re-run the checklist (§8) after edits.

**Classification legend** — every string is tagged:
- 🟢 **user-facing** — rendered to the end user; in scope for Bengali translation.
- 🔵 **model-facing** — a prompt / tool-schema string that steers the assistant; changing it can alter behavior/tool-calling.
- ⚪ **developer-log** — `console.*` / server `print` / benchmark output; not shown to end users; out of translation scope.

---

## 1. HTML visible UI text — `src/index.html`

| # | Line | Text | Tag |
|---|------|------|-----|
| 1 | `src/index.html:6` | `<title>Parlor</title>` (browser tab title) | 🟢 |
| 2 | `src/index.html:421` | `<h1>Parlor</h1>` (logo wordmark) | 🟢 |
| 3 | `src/index.html:423` | `Gemma 4 E2B` (model label pill) | 🟢 (brand/model name — likely keep) |
| 4 | `src/index.html:424` | `Disconnected` (initial status pill text) | 🟢 |
| 5 | `src/index.html:444` | `Camera On` (camera toggle button, initial) | 🟢 |
| 6 | `src/index.html:447` | `Loading...` (state indicator text, initial) | 🟢 |
| 7 | `src/index.html:451` | `On-device` (privacy pill) | 🟢 |

**Attribute / `lang` findings:**
- `src/index.html:2` — `<html lang="en">`. The document language attribute; for Bengali this should become `lang="bn"`. 🟢 (structural, not a translated string but must change).
- No `placeholder`, `aria-label`, `alt`, or `title` attribute text found in the markup (only `<title>` above). ✅ checked.

---

## 2. Browser-side JavaScript — `src/index.html` script block (L458–874)

### 2a. User-visible strings injected into the DOM 🟢

| # | Line | Text / Expression | Where it shows |
|---|------|-------------------|----------------|
| 1 | `src/index.html:570` | State-label map: `{ loading: 'Loading...', listening: 'Listening', processing: 'Thinking...', speaking: 'Speaking' }` | state indicator text |
| 2 | `src/index.html:616` | `setStatus('connected', 'Connected')` | status pill on WebSocket open |
| 3 | `src/index.html:620` | `setStatus('disconnected', 'Disconnected')` | status pill on WebSocket close |
| 4 | `src/index.html:717` | `setStatus('processing', 'Processing')` | status pill while awaiting response |
| 5 | `src/index.html:718` | `'with camera'` — message meta when an image is attached | transcript meta line |
| 6 | `src/index.html:634` | `` `LLM ${msg.llm_time}s` `` — meta passed to `addMessage` | assistant message meta |
| 7 | `src/index.html:651` | `` ` · TTS ${msg.tts_time}s` `` — appended to meta | assistant message meta |
| 8 | `src/index.html:807` | `setStatus('connected', 'Connected')` | status pill after playback ends |
| 9 | `src/index.html:824` | `cameraToggle.textContent = cameraEnabled ? 'Camera On' : 'Camera Off'` | camera toggle button (dynamic) |

**Notes:**
- The `.msg.user`/`.msg.assistant` transcript bubbles (`addMessage`, L813–819; user placeholder + assistant text at L634, L718, L631) display **model-generated** text (transcription + response). That content is produced by the LLM at runtime, not a static string — its language is governed by §4, not by translating a literal here.
- `"LLM …s"` / `"TTS …s"` are latency labels; `LLM`/`TTS` are acronyms — decide whether to localize the surrounding format or keep as-is.

### 2b. Developer-only log strings ⚪ (not user-facing — out of translation scope)

| Line | Text |
|------|------|
| `src/index.html:667` | `console.warn('Video+audio failed:', e.message)` |
| `src/index.html:696` | `console.log('Barge-in suppressed (echo grace period)')` |
| `src/index.html:705` | `console.log('Barge-in: interrupted playback')` |
| `src/index.html:846` | `console.log('VAD misfire (too short)')` |
| `src/index.html:871` | `console.log('VAD initialized and listening')` |

---

## 3. Backend responses — `src/server.py`, `src/tts.py`

### 3a. Strings that reach the browser 🟢/🔵

The backend sends **only structured WebSocket JSON**; it renders no user-facing English UI strings of its own.

| Line | Payload | Reaches user? |
|------|---------|---------------|
| `src/server.py:174–177` | `{"type":"text","text":<response>,"llm_time":…,"transcription":<…>}` | Yes — but `text`/`transcription` are **LLM-generated**, governed by §4. The JSON *keys* and `type` values (`text`, `audio_start`, `audio_chunk`, `audio_end`) are protocol identifiers, not display text. |
| `src/server.py:191–195, 212–216, 222–225` | `audio_start` / `audio_chunk` / `audio_end` control messages | Protocol only; no display text. |
| `src/server.py:82` | `GET /` returns `index.html` verbatim via `HTMLResponse` | Serves the HTML in §1/§2; no added strings. |

No `HTTPException`, `detail=`, flash message, or user-visible error string exists in the backend. ✅ checked.

### 3b. Server console logs ⚪ (developer-only — out of scope)

`src/server.py`: L32 `Downloading … (first run only)...`, L52 `Loading Gemma 4 E2B from …`, L60 `Engine loaded.`, L120 `Client interrupted`, L164/L168 `LLM (…s) …`, L171 `Interrupted after LLM…`, L180 `Interrupted before TTS…`, L199 `Interrupted during TTS…`, L219 `TTS (…s): … sentences`, L228 `Client disconnected`.
`src/tts.py`: L63 `TTS: mlx-audio (Apple GPU, …)`, L66 `TTS: mlx-audio not installed, falling back to kokoro-onnx`, L69 `TTS: kokoro-onnx (CPU, …)`.

### 3c. Benchmark scripts ⚪ (developer tooling — out of scope)

`src/benchmarks/bench.py` and `src/benchmarks/benchmark_tts.py` print English table headers, test labels, and section titles. These are developer benchmarking tools, never shown to end users → **out of translation scope** (flag if that decision changes).

---

## 4. AI prompts & language-controlling instructions — `src/server.py` 🔵

These control the assistant's behavior/output and are the crux of "make the assistant speak Bengali." Treat deliberately — mistranslation can break tool-calling.

| # | Line | Content | Effect on language |
|---|------|---------|--------------------|
| 1 | `src/server.py:37–42` | `SYSTEM_PROMPT` = *"You are a friendly, conversational AI assistant. The user is talking to you through a microphone and showing you their camera. You MUST always use the respond_to_user tool to reply. First transcribe exactly what the user said, then write your response."* | Sets persona + tool contract. **Does not pin the output language.** |
| 2 | `src/server.py:143` | Per-turn (audio+image): *"The user just spoke to you (audio) while showing their camera (image). Respond to what they said, referencing what you see if relevant."* | English instruction; does not force reply language. |
| 3 | `src/server.py:145` | Per-turn (audio): *"The user just spoke to you. Respond to what they said."* | Same. |
| 4 | `src/server.py:147` | Per-turn (image): *"The user is showing you their camera. Describe what you see."* | Same. |
| 5 | `src/server.py:149` | Fallback text: `msg.get("text", "Hello!")` | Default `"Hello!"` when no audio/image. |
| 6 | `src/server.py:92–98` | `respond_to_user` tool docstring + arg descriptions (exposed to model as tool schema): *"Respond to the user's voice message." / transcription: "Exact transcription of what the user said in the audio." / response: "Your conversational response to the user. Keep it to 1-4 short sentences."* | Model-facing schema; shapes response length/behavior. |

**Key behavioral finding:** Because the prompt says *"transcribe exactly what the user said"* and never sets an output language, the assistant's language today is **user-driven** — Gemma mirrors whatever language the user speaks (the model is multilingual). To guarantee a Bengali experience, a follow-up must decide whether to **pin output to Bengali** via these prompts or leave it user-driven.

---

## 5. AI / model runtime dependencies

Source: `src/pyproject.toml`, `src/tts.py`, `src/server.py`, `src/index.html`.

**LLM:** `litert-lm >= 0.13.1` (`pyproject.toml`) running **Gemma 4 E2B** — model id `litert-community/gemma-4-E2B-it-litert-lm`, file `gemma-4-E2B-it.litertlm` (`src/server.py:23–24`). Multilingual; no per-language config.

**TTS stack:**
- `mlx-audio >= 0.4.2` — Apple Silicon GPU backend, model `mlx-community/Kokoro-82M-bf16` (`src/tts.py:30`).
- `kokoro-onnx >= 0.5.0` (Linux) — models `kokoro-v1.0.onnx` + `voices-v1.0.bin` from `fastrtc/kokoro-onnx` (`src/tts.py:47–48`).
- `num2words >= 0.5.14` (macOS) — number→words expansion for TTS.
- Default voice **`af_heart`** (English) across all backends (`src/tts.py:20,33,35,53`); warmup text `"Hello"` (`src/tts.py:33`).

**⚠️ Bengali-output constraint (first-class finding):** `misaki[en] >= 0.9.4` (`pyproject.toml`) is the **English-only** grapheme-to-phoneme (G2P) frontend, and Kokoro's `af_heart` is an English voice. **The current TTS pipeline cannot phonemize or speak Bengali.** Delivering spoken Bengali requires either a Bengali G2P + voice, a different TTS engine, or routing TTS through a new service — this is the largest feasibility gap, not a translation task.

**Frontend libraries (CDN, `src/index.html`):** `onnxruntime-web@1.22.0` (L456/L847), `@ricky0123/vad-web@0.0.29` — Silero VAD (L457/L848). Google Fonts (L7–9). None carry translatable UI text.

---

## 6. Run commands & environment variables

**Run commands** (`README.md` "Quick start", L49–60; entrypoint `src/server.py:234–236`):
```bash
cd src
uv sync
uv run server.py         # serves on 0.0.0.0:$PORT  (default 8000)
# open http://localhost:8000
```

**Environment variables:**

| Var | Source | Default | Purpose |
|-----|--------|---------|---------|
| `MODEL_PATH` | `src/server.py:28`; `.env.example` | auto-download from HF | Path to local `gemma-4-E2B-it.litertlm`. |
| `PORT` | `src/server.py:235`; `.env.example` | `8000` | Server port. |
| `KOKORO_ONNX` | `src/tts.py:60` | unset | If set, forces ONNX TTS even on Apple Silicon (skips mlx-audio). |

`.env` is loaded at startup via `python-dotenv` — `load_dotenv()` at `src/server.py:20–21`. `.env.example` documents `MODEL_PATH` and `PORT` (not `KOKORO_ONNX`).

---

## 7. Localization readiness findings

- **No existing i18n mechanism.** No `.po`/`.pot` (gettext), no locale JSON/YAML, no language-switch logic, no locale detection, no string catalog. ✅ checked — confirmed absent.
- **Current UI language: English only.** All 🟢 strings above are hardcoded English literals at their use sites inside the single inline `src/index.html`; there is no templating/asset separation.
- **Assistant output language is user-driven**, not pinned (see §4).
- **Spoken Bengali is blocked by the English-only TTS phonemizer** (see §5).

---

## 8. Audit checklist

Each item is checked-with-evidence (§ reference) or marked N/A with a reason.

- [x] **HTML visible text** enumerated with `path:line` — §1 (7 strings + `lang` attr).
- [x] **HTML attribute text** (placeholder/aria/alt/title) scanned — §1 (none beyond `<title>`; `lang="en"` recorded).
- [x] **Browser JS user-visible strings** enumerated — §2a (9 entries).
- [x] **Browser JS error/validation/loading/success text** covered — §2a (loading/processing/connected/disconnected states); no form-validation text exists (voice UI). 
- [x] **`console.*` logs listed and flagged non-user-facing** — §2b (5 entries).
- [x] **Backend browser-bound responses classified** — §3a (JSON protocol only; LLM-generated text deferred to §4).
- [x] **Backend/TTS console logs flagged developer-only** — §3b.
- [x] **Benchmark output classified out-of-scope** — §3c.
- [x] **AI system prompt recorded** — §4 #1.
- [x] **Per-turn instruction strings recorded** — §4 #2–5.
- [x] **Tool schema (docstring/args) recorded as model-facing** — §4 #6.
- [x] **LLM framework/model documented** — §5.
- [x] **TTS backends & default voice documented** — §5.
- [x] **English-only G2P (`misaki[en]`) flagged as Bengali constraint** — §5.
- [x] **Frontend CDN libs checked for translatable text** — §5 (none).
- [x] **Run commands documented** — §6.
- [x] **Every env var documented with source + default** — §6 (`MODEL_PATH`, `PORT`, `KOKORO_ONNX`; `.env` via dotenv).
- [x] **No existing i18n mechanism** confirmed — §7.
- [x] **Current UI language recorded** — §7 (English only).
- [x] **Every inventory entry is `path:line`-verifiable** — verified against commit `de869d6`.
- [x] **Every string tagged** user-facing / developer-log / model-facing — legend applied throughout.
- [x] **No `src/` file modified and no string translated** — this change adds only `openspec/changes/audit-localization-surface/` docs.

---

## 9. Acceptance criteria

The audit is **complete** — all criteria satisfied:

1. ✅ All six scope categories covered (HTML, browser JS, backend, AI prompts, dependencies, run+env).
2. ✅ Every inventory entry cites an exact `path:line` verifiable at commit `de869d6`.
3. ✅ Three-way classification (user-facing / developer-log / model-facing) applied to every string.
4. ✅ TTS constraint (English-only `misaki[en]` G2P) and the "no i18n mechanism / English-only UI" findings recorded as first-class results.
5. ✅ The change's diff modifies no file under `src/` and translates no string (docs-only under the change directory).

### Open questions for the follow-up proposal
- **Localization mechanism:** inline `lang`-keyed strings vs. an external string catalog, given everything lives in one inline `index.html`?
- **Bengali TTS path:** swap engine/voice, add a Bengali G2P, or route TTS through a new JS/Node service?
- **Output language:** pin the assistant to Bengali via the system prompt, or keep it user-driven (mirror the user's spoken language)?
- **Scope of logs/benchmarks:** confirm developer-facing strings (§2b, §3b, §3c) stay English.
