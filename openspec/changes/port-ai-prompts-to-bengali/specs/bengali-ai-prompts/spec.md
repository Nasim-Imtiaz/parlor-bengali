## ADDED Requirements

### Requirement: Assistant responds in Bengali by default

The AI prompt layer in `src/server.py` SHALL instruct the assistant to produce its conversational response in Bangladeshi Bengali by default, rather than mirroring the language the user spoke. The directive SHALL be present in the system prompt so it governs every conversation created from it.

#### Scenario: System prompt pins Bengali output

- **WHEN** a reviewer reads `SYSTEM_PROMPT` (near `src/server.py:37`)
- **THEN** it contains an explicit instruction that the assistant's response to the user is written in Bengali, and it no longer relies on the model mirroring the user's input language

#### Scenario: Reply is Bengali regardless of the user's spoken language

- **WHEN** the user speaks to the assistant in any language (e.g. English or Bengali)
- **THEN** the assistant's `response` text sent back over the WebSocket is in Bengali

### Requirement: Bengali tone is natural and professional

The Bengali produced by the prompt layer SHALL read as helpful, professional, and natural for Bangladeshi Bengali users, and SHALL NOT read as literal, word-for-word machine translation of English.

#### Scenario: Instructions call for natural Bangladeshi Bengali

- **WHEN** a reviewer reads the language directive used by the prompts
- **THEN** it directs the assistant to use natural, conversational, professional Bangladeshi Bengali and to avoid stiff or word-for-word translated phrasing

### Requirement: Faithful transcription is preserved across languages

The change SHALL preserve the assistant's existing behavior of transcribing exactly what the user said. The Bengali-output directive SHALL apply to the assistant's response only, not to the transcription, so a user speaking a non-Bengali language is still transcribed in the language they actually spoke.

#### Scenario: Transcription records the spoken language

- **WHEN** the user speaks in a language other than Bengali and the model calls `respond_to_user`
- **THEN** the `transcription` argument records what the user said in the language they spoke, while the `response` argument is in Bengali

#### Scenario: Tool contract is unchanged

- **WHEN** a reviewer inspects the `respond_to_user` registration (`src/server.py:92–98`, `tools=[respond_to_user]` at `src/server.py:105`)
- **THEN** the tool name, its two arguments (`transcription`, `response`), the "1–4 short sentences" length guidance, and the requirement to always use the tool are all still present; only the `response` description is extended to state that the response is in Bengali

### Requirement: Per-turn instructions carry the Bengali directive

Each of the three per-turn instruction strings — audio+image, audio-only, and image-only — SHALL instruct a Bengali response while preserving its existing intent and the branch that selects it.

#### Scenario: Each per-turn branch instructs Bengali

- **WHEN** a reviewer reads the per-turn instruction strings (`src/server.py:143`, `145`, `147`)
- **THEN** each string still expresses its original intent (respond to speech, respond to speech referencing the camera, or describe the camera) and additionally directs that the response be in Bengali

#### Scenario: Media routing is unchanged

- **WHEN** a turn contains audio and image, audio only, or image only
- **THEN** the same branch fires as before for each media combination, and only the instruction text differs

### Requirement: Text fallback greeting is Bengali

The default greeting used when a turn carries neither audio nor image SHALL be a natural Bengali greeting instead of the English `"Hello!"`.

#### Scenario: No-media turn greets in Bengali

- **WHEN** a turn arrives with no audio, no image, and no `text` field
- **THEN** the fallback content supplied to the model is a Bengali greeting rather than `"Hello!"`

### Requirement: Bengali directive is centralized and durable

The Bengali-output directive SHALL be defined once in a single, clearly named constant (e.g. `BENGALI_DIRECTIVE`) in `src/server.py`, and the system prompt, per-turn instructions, and tool description SHALL derive their Bengali instruction from that single source. This ensures the directive still applies on the non-tool raw-text response path and survives a future model or provider change.

#### Scenario: Single source of truth

- **WHEN** a reviewer searches `src/server.py` for the Bengali-output instruction
- **THEN** the normative wording is defined in exactly one named constant, and the system prompt, per-turn strings, and tool description reference or reuse that constant rather than each hardcoding their own divergent wording

#### Scenario: Raw-text path stays Bengali

- **WHEN** the model returns a response without calling `respond_to_user` and the code falls back to raw text (`src/server.py:165–167`)
- **THEN** that response is still governed by the Bengali directive (because the directive lives in the system prompt), so the user still receives Bengali

#### Scenario: Directive survives a backend swap

- **WHEN** a future maintainer changes the model or inference provider
- **THEN** the Bengali directive remains in its single named constant and continues to pin Bengali output without requiring the maintainer to rediscover scattered instruction strings

### Requirement: Existing request and streaming flow is preserved

The change SHALL be limited to prompt/instruction/description text and the new directive constant. It SHALL NOT alter the AI request construction, tool registration, conversation lifecycle, sentence splitting, streaming, or WebSocket message shapes, and SHALL NOT add an AI provider, model, or dependency.

#### Scenario: No structural or dependency change

- **WHEN** the change's diff is inspected
- **THEN** the only modifications are to prompt text, per-turn instruction text, the `respond_to_user` description, the fallback greeting, and the added directive constant — with no changes to `engine.create_conversation`, the tool registration, `send_message`, `split_sentences`, the streaming logic, WebSocket message keys, or `src/pyproject.toml`

#### Scenario: App still runs and answers

- **WHEN** the app is started and a user completes a voice turn after the change
- **THEN** the end-to-end flow works as before (a response is transcribed, generated, and streamed back), differing only in that the response text is Bengali
