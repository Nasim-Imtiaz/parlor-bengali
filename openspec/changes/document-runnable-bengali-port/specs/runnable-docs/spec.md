## ADDED Requirements

### Requirement: README documents both run modes with exact commands

The `README.md` SHALL document how to run the fork in both supported modes, each with copy-pasteable commands and the working directory they run from:
- **On-device (default) mode:** the Python/FastAPI server via `uv sync` then `uv run server.py` from `src/`.
- **Node proxy (optional, text-only) mode:** the standalone Node.js AI proxy via `npm install` then `npm start` from `services/ai-proxy/`, together with the FastAPI server started with `AI_PROXY_URL` set.

The two modes SHALL be clearly labeled so a reader can tell which command belongs to which mode and that the Node proxy is optional. This requirement mandates documentation only; it SHALL NOT change any run command's behavior.

#### Scenario: Reader runs the default on-device mode

- **WHEN** a reviewer follows the README's default/on-device instructions from a fresh clone
- **THEN** the README gives the exact `uv sync` / `uv run server.py` commands and the `src/` working directory, and states that the app is served at `http://localhost:8000`

#### Scenario: Reader runs the optional Node proxy mode

- **WHEN** a reviewer chooses to run without the on-device model
- **THEN** the README gives the exact `npm install` / `npm start` commands for `services/ai-proxy/`, shows starting FastAPI with `AI_PROXY_URL` pointed at the proxy, and states that this mode is text-only

### Requirement: README consolidates required environment variables per mode

The `README.md` SHALL present a single consolidated reference of the environment variables for both processes, and for each variable state whether it is required or optional and in which mode it applies:
- **FastAPI:** `MODEL_PATH`, `PORT`, `AI_PROXY_URL`, `AI_PROXY_TIMEOUT`.
- **Node proxy:** `AI_PROVIDER_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `PORT`, `AI_REQUEST_TIMEOUT_MS`.

The documented default and semantics of each variable SHALL match the code's actual behavior. This requirement SHALL NOT introduce, rename, or remove any environment variable.

#### Scenario: Reviewer determines what to configure for proxy mode

- **WHEN** a reviewer reads the environment-variable reference to run proxy mode
- **THEN** it is clear that `AI_PROVIDER_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` are required for the proxy, that `AI_PROXY_URL` must be set on FastAPI, and which variables are optional with their defaults

### Requirement: Complete .env.example templates exist for both processes

There SHALL be an up-to-date `.env.example` template for each process — the root `.env.example` (FastAPI) and `services/ai-proxy/.env.example` (proxy) — that documents every environment variable named in the environment-variable reference, and the README SHALL point readers to copy each template to `.env`. A template file SHALL be created only if it is missing; an existing template SHALL be corrected or completed rather than duplicated.

#### Scenario: Reviewer bootstraps configuration from templates

- **WHEN** a reviewer runs the documented `cp .env.example .env` flow for a process
- **THEN** the resulting `.env` contains every variable that process reads, with a comment describing each and whether it is required

#### Scenario: Every documented variable is present in a template

- **WHEN** the `.env.example` templates are compared against the README's environment-variable reference
- **THEN** every FastAPI variable appears in the root template and every proxy variable appears in `services/ai-proxy/.env.example`, with no documented variable missing from its template

### Requirement: README summarizes the Bengali localization scope

The `README.md` SHALL include a concise section summarizing the scope of the Bengali localization already delivered in this fork — that the HTML UI text, the browser-side JavaScript strings, and the AI assistant's replies default to Bengali — and pointing to where that work lives (the OpenSpec changes / affected files). The summary SHALL describe existing work only and SHALL NOT translate or re-translate any string.

#### Scenario: Reviewer understands what was localized

- **WHEN** a reviewer reads the Bengali localization section
- **THEN** they can tell that UI chrome, frontend JavaScript, and assistant replies were localized to Bengali, and where to look for that change, without reading the full commit history

### Requirement: README lists known limitations honestly

The `README.md` SHALL include a concise, honest "Known limitations" section covering at least: that text-to-speech is English-phonemized so Bengali assistant text is not spoken in Bengali audio; that the Node proxy mode is text-only so audio/vision inputs are not understood in that mode; and that on-device mode requires Apple Silicon or a supported GPU plus a multi-GB model download. Limitations SHALL be stated plainly without overselling completeness.

#### Scenario: Reviewer learns what is deliberately incomplete

- **WHEN** a reviewer reads the Known limitations section before evaluating
- **THEN** they know that Bengali audio is not yet supported, that proxy mode ignores audio/vision, and the hardware/model requirements for on-device mode

### Requirement: README provides a manual verification checklist

The `README.md` SHALL include a manual verification checklist a reviewer can follow to confirm the fork runs and the Bengali adaptation is present — including at minimum: starting the FastAPI server and loading the UI, observing that the UI text renders in Bengali, exchanging a turn so the assistant replies in Bengali, and (for proxy mode) starting the proxy, confirming its `/health` endpoint, and confirming a text turn returns a reply through the proxy.

#### Scenario: Reviewer verifies a successful run

- **WHEN** a reviewer works through the manual verification checklist end to end
- **THEN** each step has a concrete, observable expected outcome that confirms either a successful run or the Bengali localization, for both the on-device and proxy modes
