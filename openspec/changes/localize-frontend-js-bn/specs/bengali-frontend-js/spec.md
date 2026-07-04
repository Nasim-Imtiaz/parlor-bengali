## ADDED Requirements

### Requirement: Runtime state-indicator labels in Bengali

The browser-side JavaScript SHALL render the four state-machine indicator labels driven by `setState` (`loading`, `listening`, `processing`, `speaking`) as natural, professional Bengali text suitable for Bangladeshi users. The mapping from state key to displayed label MUST be preserved, and the underlying state keys and CSS class names (`dot <state>`, `viewport-wrap <state>`) MUST remain unchanged.

#### Scenario: App is initializing
- **WHEN** the state is `loading` and the state indicator is updated
- **THEN** the indicator displays the Bengali equivalent of "Loading…" (e.g. "লোড হচ্ছে…") and not the English word

#### Scenario: App is listening for speech
- **WHEN** the state transitions to `listening`
- **THEN** the indicator displays the Bengali equivalent of "Listening" (e.g. "শুনছি")

#### Scenario: App is processing a turn
- **WHEN** the state transitions to `processing`
- **THEN** the indicator displays the Bengali equivalent of "Thinking…" (e.g. "ভাবছি…")

#### Scenario: App is speaking a response
- **WHEN** the state transitions to `speaking`
- **THEN** the indicator displays the Bengali equivalent of "Speaking" (e.g. "বলছি")

### Requirement: Connection and status-pill text in Bengali

The browser-side JavaScript SHALL render every user-facing status-pill message produced by `setStatus` — the connected, disconnected, and processing states — in natural, professional Bengali. The status **class** token passed to `setStatus` (`connected`, `disconnected`, `processing`) is a styling/protocol identifier and MUST remain unchanged; only the human-readable text is localized.

#### Scenario: WebSocket connects
- **WHEN** the WebSocket `onopen` fires, or playback of a response completes
- **THEN** the status pill displays the Bengali equivalent of "Connected" (e.g. "সংযুক্ত") while keeping the `connected` class

#### Scenario: WebSocket disconnects
- **WHEN** the WebSocket `onclose` fires
- **THEN** the status pill displays the Bengali equivalent of "Disconnected" (e.g. "সংযোগ বিচ্ছিন্ন") while keeping the `disconnected` class

#### Scenario: A user turn is being processed
- **WHEN** speech ends and the turn is sent to the server
- **THEN** the status pill displays the Bengali equivalent of "Processing" (e.g. "প্রক্রিয়াকরণ হচ্ছে") while keeping the `processing` class

### Requirement: Dynamic camera-toggle button label in Bengali

The browser-side JavaScript SHALL render the dynamic camera-toggle button label — set on click based on whether the camera is enabled — in natural, professional Bengali for both states, while preserving the toggle behavior and the `active` class handling.

#### Scenario: Camera is turned on
- **WHEN** the camera toggle is activated (camera enabled)
- **THEN** the button text displays the Bengali equivalent of "Camera On" (e.g. "ক্যামেরা চালু")

#### Scenario: Camera is turned off
- **WHEN** the camera toggle is deactivated (camera disabled)
- **THEN** the button text displays the Bengali equivalent of "Camera Off" (e.g. "ক্যামেরা বন্ধ")

### Requirement: DOM-injected transcript metadata in Bengali

The browser-side JavaScript SHALL localize the human-readable words in DOM-injected transcript metadata: the "with camera" tag on a user message and the timing labels appended to an assistant message. The numeric values, units (`s`), and the ` · ` separator MUST be preserved so timing information remains legible; only the descriptive words are translated. The `LLM` and `TTS` acronyms are handled per the design decision recorded in `design.md`.

#### Scenario: User message captured with camera
- **WHEN** a user turn is submitted with a captured camera frame
- **THEN** the user message metadata displays the Bengali equivalent of "with camera" (e.g. "ক্যামেরাসহ") instead of the English text

#### Scenario: Assistant response timing is shown
- **WHEN** an assistant message is added with an `llm_time`, and later a `tts_time` is appended
- **THEN** the metadata shows the localized timing labels alongside the unchanged numeric values and `·` separator (e.g. the LLM and TTS labels rendered per the design, with values like "1.2s" intact)

### Requirement: Single lightweight in-file string table

The localized frontend strings SHALL be sourced from a single, lightweight string table (a `const` object such as `BN` / `UI_TEXT`) declared once within the existing inline `<script>` in `src/index.html`, rather than scattered as inline literals at each call site. No i18n framework, external locale file requiring a new server route, or build step SHALL be introduced.

#### Scenario: A displayed string is defined once
- **WHEN** a user-facing label (state, status, camera, or metadata word) is rendered by the JavaScript
- **THEN** its Bengali text is read from the shared string table, and any string reused at more than one call site (e.g. "Connected") resolves to a single table entry

#### Scenario: No heavy i18n machinery is added
- **WHEN** the change is implemented
- **THEN** the app remains a single build-less HTML file with no added i18n library, no new static-asset route, and no new build step

### Requirement: Behavior and non-user-facing strings preserved

Localization SHALL be limited to user-facing display text. All existing frontend behavior — state transitions, WebSocket message handling, audio/VAD/waveform logic, class-name toggling, and metadata string *format* (label + number + unit) — MUST remain functionally identical. Developer-facing `console.log`/`console.warn` diagnostic strings MUST remain untranslated.

#### Scenario: Existing behavior is unchanged
- **WHEN** the localized app runs a full session (connect, listen, process, speak, toggle camera, barge-in)
- **THEN** every state transition, status update, audio playback, and camera toggle behaves exactly as before, with only the displayed words changed to Bengali

#### Scenario: Console diagnostics remain in English
- **WHEN** a diagnostic event occurs (e.g. barge-in suppression, VAD misfire, video/audio failure)
- **THEN** the corresponding `console` message is emitted unchanged in English and no such diagnostic string is added to the user-facing string table
