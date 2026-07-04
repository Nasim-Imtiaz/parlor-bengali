## ADDED Requirements

### Requirement: Node proxy URL is configurable via environment

The FastAPI app SHALL read the Node AI proxy base URL from an environment variable (`AI_PROXY_URL`) loaded through the existing `dotenv` mechanism, and SHALL treat proxy integration as opt-in: enabled only when the variable is set to a non-empty value. The outbound request timeout SHALL also be configurable via an environment variable with a safe default. No proxy URL SHALL be hard-coded in the application.

#### Scenario: Proxy URL is read from the environment

- **WHEN** the app starts with `AI_PROXY_URL` set to a base URL (e.g. `http://localhost:3000`)
- **THEN** the app records proxy mode as enabled and uses that base URL for outbound AI calls, appending the proxy's `/chat` path

#### Scenario: Absent proxy URL keeps the local model path

- **WHEN** the app starts with `AI_PROXY_URL` unset or empty
- **THEN** proxy mode is disabled and the AI reply is produced by the existing on-device `litert_lm` path, unchanged

#### Scenario: Timeout is configurable with a default

- **WHEN** no proxy timeout environment variable is provided
- **THEN** the app applies a safe default timeout to the outbound proxy call, and **WHEN** the timeout variable is set it uses that value instead

### Requirement: AI reply is routed through the Node proxy in proxy mode

When proxy mode is enabled, the FastAPI app SHALL generate the assistant reply by sending a JSON request `{ "message": <prompt> }` to the proxy's `POST {AI_PROXY_URL}/chat` endpoint and using the `reply` field of the `2xx` JSON response as the assistant's text, instead of calling the local `litert_lm` engine.

#### Scenario: Text message is answered by the proxy

- **WHEN** proxy mode is enabled and the WebSocket handler receives a user turn carrying text
- **THEN** the app POSTs `{ "message": <text> }` to `{AI_PROXY_URL}/chat`, and on a `200` response with `{ "reply": "<text>", "model": "<model>" }` it uses `<text>` as the assistant reply

#### Scenario: Local engine is not called in proxy mode

- **WHEN** proxy mode is enabled and a user turn is processed
- **THEN** the app does not invoke `conversation.send_message` / the `litert_lm` engine for that turn

#### Scenario: Local model engine is not loaded in proxy mode

- **WHEN** the app starts with proxy mode enabled
- **THEN** it skips loading the `litert_lm` engine (so the app runs without the multi-GB model), while still loading the TTS backend needed to speak replies

### Requirement: Existing WebSocket request/response shape is preserved

The change SHALL NOT alter the WebSocket message protocol used by the frontend. The server SHALL continue to emit the same `text`, `audio_start`, `audio_chunk`, and `audio_end` message shapes, and the downstream sentence-splitting and streaming-TTS pipeline SHALL continue to operate on the assistant reply regardless of its source.

#### Scenario: Text reply message shape is unchanged

- **WHEN** the app sends the assistant reply over the WebSocket in proxy mode
- **THEN** it emits a `{ "type": "text", "text": <reply>, "llm_time": <float> }` message matching the existing shape, and the frontend requires no changes to consume it

#### Scenario: TTS streaming still runs on the proxy reply

- **WHEN** a proxy reply has been received
- **THEN** the reply text is split into sentences and streamed as `audio_start` / `audio_chunk` / `audio_end` messages exactly as in the local-model path

#### Scenario: Transcription is omitted when unavailable

- **WHEN** the reply is produced by the text-only proxy, which returns no transcription
- **THEN** the app omits the optional `transcription` field rather than sending an empty or fabricated value, and the frontend still renders the reply

### Requirement: Proxy failures return a Bengali fallback message

When the proxy call fails for any reason — connection error, timeout, non-`2xx` status (including the proxy's own `{ "error": { ... } }` envelope), or a malformed/missing `reply` — the app SHALL NOT crash the WebSocket connection or leak a raw error to the client. Instead it SHALL use a fixed, user-friendly Bengali fallback message as the assistant reply so the conversation and TTS continue.

#### Scenario: Proxy is unreachable

- **WHEN** proxy mode is enabled but the Node service is down or the connection fails
- **THEN** the app uses the Bengali fallback message as the assistant reply, sends it over the WebSocket with the normal text shape, and keeps the connection open

#### Scenario: Proxy call times out

- **WHEN** the proxy does not respond within the configured timeout
- **THEN** the app aborts the wait, uses the Bengali fallback message as the reply, and does not hang the WebSocket turn

#### Scenario: Proxy returns an error or malformed response

- **WHEN** the proxy responds with a non-`2xx` status or a body missing a usable `reply` field
- **THEN** the app uses the Bengali fallback message as the reply and does not raise the raw provider/proxy error to the client

#### Scenario: Fallback message is user-friendly Bengali

- **WHEN** any fallback is produced
- **THEN** the reply text is a natural, polite Bangladeshi Bengali sentence indicating the assistant is temporarily unavailable and asking the user to try again shortly
