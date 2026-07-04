## 1. Add the centralized Bengali directive

- [x] 1.1 In `src/server.py`, near `SYSTEM_PROMPT` (L37), add a single named constant `BENGALI_DIRECTIVE` whose text instructs: respond in natural, conversational, professional Bangladeshi Bengali; sound helpful, not like word-for-word machine translation; and that this applies to the response only (transcription stays in the language the user spoke).
- [x] 1.2 Confirm the constant is the only place the normative Bengali-output wording is defined (single source of truth per design D2).

## 2. Update the system prompt

- [x] 2.1 Rewrite `SYSTEM_PROMPT` (L37–42) to keep the existing persona and the "MUST always use the respond_to_user tool" contract and "transcribe exactly what the user said," and append/compose `BENGALI_DIRECTIVE` so the response language is pinned to Bengali.
- [x] 2.2 Verify the "transcribe exactly what the user said" instruction is preserved so transcription remains language-faithful (spec: faithful transcription).

## 3. Update per-turn instructions and fallback greeting

- [x] 3.1 Update the audio+image instruction (L143) to keep its intent (respond, referencing the camera) and add the Bengali-response directive (reuse `BENGALI_DIRECTIVE`).
- [x] 3.2 Update the audio-only instruction (L145) to keep its intent and add the Bengali-response directive.
- [x] 3.3 Update the image-only instruction (L147) to keep its intent (describe the camera) and add the Bengali-response directive.
- [x] 3.4 Replace the text fallback `"Hello!"` (L149) with a natural Bengali greeting.
- [x] 3.5 Confirm the media-routing branches (which string fires for which audio/image combination) are unchanged — only the text differs.

## 4. Update the tool schema

- [x] 4.1 In the `respond_to_user` docstring (L92–98), extend the `response` argument description to state the response is in Bengali, while keeping the "1–4 short sentences" guidance.
- [x] 4.2 Leave the `transcription` argument description as "exact transcription of what the user said" (any language), and leave the tool name, arguments, and `tools=[respond_to_user]` registration unchanged.

## 5. Verify no structural or dependency change

- [x] 5.1 Diff `src/server.py` and confirm the only changes are prompt/instruction/description text plus the new `BENGALI_DIRECTIVE` constant — no changes to `engine.create_conversation`, `send_message`, `split_sentences`, streaming, or WebSocket message keys.
- [x] 5.2 Confirm `src/pyproject.toml` is unchanged (no new provider/model/dependency).
- [x] 5.3 Confirm the raw-text fallback path (L165–167) needs no edit because it inherits the Bengali directive from `SYSTEM_PROMPT`.

## 6. Manual verification

- [ ] 6.1 Start the app (`cd src && uv run server.py`) and open `http://localhost:8000`; confirm it loads and a WebSocket turn still completes end-to-end.
- [ ] 6.2 **Bengali-input prompt:** speak a simple question in Bengali → the response text is Bengali and reads naturally.
- [ ] 6.3 **English-input prompt:** speak a question in English → the `transcription` is in English but the `response` text is Bengali (verifies D3 / transcription faithfulness).
- [ ] 6.4 **Vision prompt:** show the camera and ask "এটা কী?" (what is this?) → the description is returned in Bengali.
- [ ] 6.5 **No-media / text fallback:** trigger a turn with no audio and no image → the assistant greets in Bengali (verifies the localized fallback).
- [ ] 6.6 **Tone check:** have a native Bangladeshi Bengali reader review 3–5 sample replies and confirm they sound natural and professional, not machine-translated.
- [ ] 6.7 Record the manual results (and note that spoken TTS audio remains English-phonemized, per the known-limitation in design — out of scope here).

## 7. Validate the change

- [x] 7.1 Run `openspec validate --change port-ai-prompts-to-bengali` and resolve any issues.
