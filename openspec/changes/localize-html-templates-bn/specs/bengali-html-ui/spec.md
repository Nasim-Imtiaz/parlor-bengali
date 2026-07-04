## ADDED Requirements

### Requirement: Visible HTML template text is presented in Bengali

The visible static text of the HTML template (`src/index.html`) SHALL be presented in natural, professional Bengali (Bangla) appropriate for Bangladeshi users. This covers the browser tab title area, headings, status text, control labels, and informational pills that are authored directly in the markup. Translations SHALL read as native Bengali and SHALL NOT be literal, transliterated, or machine-robotic renderings.

#### Scenario: Initial page render shows Bengali labels

- **WHEN** a user loads the page and the initial markup is rendered (before any WebSocket connection or runtime JavaScript update)
- **THEN** the initial connection-status text, the camera-toggle button label, the state-indicator label, and the on-device pill display Bengali text rather than English

#### Scenario: Translations are natural, not literal

- **WHEN** a native Bengali speaker from Bangladesh reads the rendered template text
- **THEN** each string reads as fluent, professional Bengali, with no word-for-word or transliterated English constructions

### Requirement: Document language attribute declares Bengali

The template SHALL declare Bengali as the document language so browsers and assistive technologies interpret the content as Bengali.

#### Scenario: lang attribute is Bengali

- **WHEN** the served HTML document is inspected
- **THEN** the root `<html>` element carries `lang="bn"` (not `lang="en"`)

### Requirement: Brand and model identifiers are preserved

Proper nouns that identify the product or the underlying model SHALL remain untranslated, so brand and technical identity are not altered.

#### Scenario: Product wordmark unchanged

- **WHEN** the header logo and the browser tab title are rendered
- **THEN** the product name `Parlor` appears unchanged (not translated or transliterated)

#### Scenario: Model label unchanged

- **WHEN** the model-label pill is rendered
- **THEN** the identifier `Gemma 4 E2B` appears unchanged

### Requirement: Layout is preserved with Bengali text

Substituting Bengali text SHALL NOT break the existing layout of the header, status pill, control button, state indicator, or on-device pill.

#### Scenario: No overflow or clipping

- **WHEN** the page is rendered with the Bengali strings in a standard desktop and mobile viewport
- **THEN** the header, status pill, camera-toggle button, state indicator, and on-device pill display their Bengali text without overflow, clipping, wrapping that breaks the control row, or overlap

### Requirement: Change is limited to the HTML template surface

This change SHALL modify only the static HTML template text (and its `lang` attribute) and SHALL NOT alter frontend JavaScript strings, AI prompts, the TTS pipeline, or backend behavior, and SHALL NOT introduce a Node.js service.

#### Scenario: No out-of-scope files changed

- **WHEN** the change's diff is inspected
- **THEN** only the static markup portion of `src/index.html` is modified; the inline `<script>` block's user-facing strings, `src/server.py`, `src/tts.py`, and dependency manifests are unchanged

#### Scenario: Runtime JS behavior is untouched

- **WHEN** the inline `<script>` block is compared before and after the change
- **THEN** its user-facing string literals (state-label map, connection-status updates, dynamic camera-toggle text, transcript metadata) are identical to before
