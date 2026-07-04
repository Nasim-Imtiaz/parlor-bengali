## Why

The localization-surface audit (`audit-localization-surface` §4) identified the AI prompt layer in `src/server.py` as the crux of "make the assistant speak Bengali" — and its key behavioral finding is that **today the assistant's output language is user-driven, not Bengali**. The system prompt tells Gemma to *"transcribe exactly what the user said, then write your response"* but never pins an output language, so the multilingual model simply mirrors whatever language the user speaks (its upstream lineage targets an Indonesian/English learning audience). The sibling changes localized the HTML template (`bengali-html-ui`) and runtime JavaScript (`bengali-frontend-js`), but the *chrome* is now Bengali while the *assistant itself* still replies in the user's language. This change updates the prompt/instruction layer so the assistant communicates in natural, professional Bangladeshi Bengali by default — completing the "the app speaks Bengali" experience end to end at the conversation level.

## What Changes

- **Rewrite `SYSTEM_PROMPT`** (`src/server.py:37–42`) so it (a) keeps the existing persona and the `respond_to_user` tool contract verbatim, and (b) adds an explicit, resilient directive that the assistant's **spoken response** is always in natural, conversational **Bangladeshi Bengali** — helpful and professional, never sounding like word-for-word machine translation — while transcription still faithfully records whatever language the user actually spoke.
- **Rewrite the three per-turn instruction strings** (`src/server.py:143`, `145`, `147`) so each carries the Bengali-output directive alongside its existing intent (audio+image, audio-only, image-only). Behavior (which branch fires for which media) is unchanged; only the instruction text changes.
- **Update the `respond_to_user` tool schema** (`src/server.py:92–98`): the `response` argument description gains "in Bengali" so the model-facing contract itself reinforces the output language, while the `transcription` description (exact transcription, any language) and the 1–4-sentence length guidance are preserved.
- **Localize the text fallback greeting** (`src/server.py:149`): the default `"Hello!"` (fired when a turn carries neither audio nor image) becomes a natural Bengali greeting.
- **Centralize the Bengali directive in one named constant** (e.g. `BENGALI_DIRECTIVE`) declared near `SYSTEM_PROMPT`, and reference it from the system prompt, per-turn instructions, and tool description. This is the change's **fallback / durability requirement**: because the directive lives in one clearly-named place rather than being scattered, it (a) still governs the raw-text path (`src/server.py:165–167`) where the model answers without calling the tool, and (b) survives a future model or provider swap — whoever changes the backend inherits one obvious constant that keeps output pinned to Bengali instead of silently reverting to user-driven/English behavior.
- **Remove the Indonesian/English-learner-oriented, user-driven default behavior from the main flow.** The audit confirmed there is no literal Indonesian *string* in the prompts today; the "Indonesian-oriented" behavior is the *mirror-the-user's-language* default inherited from the upstream project. After this change the main conversational flow defaults to Bengali rather than mirroring the input language.

**Explicit non-goals (out of scope for this change):**
- **No new AI provider or model.** The change stays on the current LiteRT-LM + Gemma 4 E2B stack; it edits prompt text only, adds no dependency, and changes no model/engine configuration.
- **No Node.js proxy** or any new service/process.
- **No HTML template text** (`bengali-html-ui`, audit §1) and **no browser-side JavaScript strings** (`bengali-frontend-js`, audit §2) — those surfaces are owned by the sibling changes and are not re-touched here.
- **No backend HTTP/WebSocket response or log-string translation** (audit §3) beyond the prompt/instruction strings named above.
- **TTS / spoken audio is not fixed here.** The audit flagged (§5) that the current TTS pipeline uses an English-only G2P (`misaki[en]`) and an English voice (`af_heart`), so it **cannot yet phonemize spoken Bengali**. This change makes the assistant's *text* Bengali; making that text *audibly* Bengali is a separate, larger dependency change and is documented as a known limitation, not solved here.
- **Tool-calling mechanics, transcription behavior, sentence-splitting, and streaming** are preserved exactly — only instruction/description wording changes.

## Capabilities

### New Capabilities
- `bengali-ai-prompts`: Requires that the AI prompt/instruction layer in `src/server.py` — the system prompt, per-turn instruction strings, the `respond_to_user` tool description, and the text fallback greeting — instructs the assistant to respond by default in natural, professional Bangladeshi Bengali (not machine-translated in tone), sourced from a single durable directive constant that also governs the non-tool raw-text path and survives model/provider changes, while the `respond_to_user` tool contract, faithful multi-language transcription, response-length guidance, and all existing request/streaming behavior are preserved.

### Modified Capabilities
<!-- None. No behavioral specs exist yet in openspec/specs/; sibling changes bengali-html-ui and bengali-frontend-js cover disjoint surfaces (audit §1, §2) and do not touch the src/server.py prompt layer (audit §4). No existing requirement is modified. -->

## Impact

- **Files modified:** `src/server.py` only — `SYSTEM_PROMPT` (L37–42), the per-turn instruction strings (L143, L145, L147), the text fallback (L149), and the `respond_to_user` docstring/arg descriptions (L92–98), plus a new `BENGALI_DIRECTIVE` constant near L37.
- **No dependency, model, or API change:** no additions to `src/pyproject.toml`; the LiteRT-LM engine, Gemma model id, tool registration (`tools=[respond_to_user]`), WebSocket protocol, and message shapes are untouched.
- **Behavioral change (intended):** the assistant now defaults to Bengali responses rather than mirroring the user's input language. Transcription of what the user said remains faithful to the spoken language.
- **Known limitation carried forward:** spoken TTS output remains English-phonemized (audit §5); Bengali *audio* requires a separate TTS/G2P change and is out of scope here.
