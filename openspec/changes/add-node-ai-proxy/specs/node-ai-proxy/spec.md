## ADDED Requirements

### Requirement: Standalone Node.js service startable via npm

The change SHALL add a self-contained Node.js service under `services/ai-proxy/` with its own `package.json` and a start script, runnable independently of the Python FastAPI app. The service SHALL NOT modify or depend on `src/`.

#### Scenario: Service starts with an npm command

- **WHEN** a developer runs `npm install` and then the package's start script (e.g. `npm start`) inside `services/ai-proxy/` with required environment configured
- **THEN** the service boots and listens on the configured port, and logs that it has started

#### Scenario: FastAPI backend is untouched

- **WHEN** the change's diff is inspected
- **THEN** all new files live under `services/ai-proxy/`, and no file under `src/` and neither the root `.env.example` are modified

### Requirement: Health endpoint returns OK

The service SHALL expose a health endpoint (`GET /health`) that returns a successful status and a JSON body indicating the service is up, without calling the AI provider.

#### Scenario: Health check succeeds

- **WHEN** a client sends `GET /health`
- **THEN** the service responds with HTTP `200` and a JSON body indicating an OK/healthy status

#### Scenario: Health check does not depend on the provider

- **WHEN** the AI provider is unreachable or unconfigured and a client sends `GET /health`
- **THEN** the service still responds `200` OK, because the health check does not make an upstream AI call

### Requirement: AI chat endpoint accepts a message and returns a structured response

The service SHALL expose an AI chat/completion endpoint (`POST /chat`) that accepts a JSON body containing a user `message`, forwards it to the configured AI provider, and returns a structured JSON response containing the assistant's reply.

#### Scenario: Valid message returns a structured reply

- **WHEN** a client sends `POST /chat` with a JSON body `{ "message": "hello" }` and the provider is configured and reachable
- **THEN** the service responds with HTTP `200` and a JSON body containing the assistant reply in a defined field (e.g. `reply`)

#### Scenario: Missing or empty message is rejected

- **WHEN** a client sends `POST /chat` with no `message` field, an empty `message`, or a non-JSON/malformed body
- **THEN** the service responds with HTTP `400` and a JSON error describing the invalid input, and does not call the provider

### Requirement: Provider-specific code is isolated

All provider-specific logic (endpoint URL, authentication headers, request payload shape, and response parsing) SHALL live in a single isolated module. The HTTP/route layer SHALL call that module through a provider-agnostic interface and SHALL NOT embed vendor-specific request or response details.

#### Scenario: Routes are provider-agnostic

- **WHEN** a reviewer reads the route/handler code for `/chat`
- **THEN** it invokes a provider-client function (e.g. `chat(message)`) and does not itself construct the provider URL, auth headers, or vendor payload — those live only in the isolated provider module

#### Scenario: Provider can be swapped in one place

- **WHEN** a maintainer needs to point the service at a different AI provider or API contract
- **THEN** the change is confined to the single provider module, and the route layer and endpoint contracts remain unchanged

### Requirement: Configuration comes from environment variables

The service SHALL read its configuration from environment variables: the provider base URL, API key, model name, listening port, and request timeout. Non-critical values (port, timeout) SHALL have safe defaults; the port default SHALL differ from the FastAPI app's `8000` so both can run concurrently. No secret SHALL be committed to the repository.

#### Scenario: Values are read from the environment

- **WHEN** the service starts with the provider base URL, API key, and model set in the environment
- **THEN** it uses those values for its outbound AI calls, and uses its configured or default port and timeout

#### Scenario: Documented example config is provided without secrets

- **WHEN** a reviewer opens `services/ai-proxy/.env.example`
- **THEN** it documents every environment variable the service reads (provider base URL, API key, model, port, timeout) using placeholder values only, and contains no real API key

### Requirement: Missing or invalid provider configuration is handled clearly

When required provider configuration (such as the API key or base URL) is missing, the service SHALL fail gracefully with a clear JSON error rather than crashing or returning an opaque failure, and SHALL surface the misconfiguration at startup.

#### Scenario: Chat request without an API key returns a clear error

- **WHEN** the API key (or base URL) is not configured and a client sends `POST /chat` with a valid message
- **THEN** the service responds with a non-`2xx` status and a JSON error clearly indicating that the AI provider is not configured, and does not crash

#### Scenario: Misconfiguration is visible at startup

- **WHEN** the service starts without required provider configuration
- **THEN** it logs a clear warning about the missing configuration rather than starting silently as if fully configured

### Requirement: Responses are clean JSON and errors degrade gracefully

The service SHALL return clean, consistently shaped JSON for both success and failure. Upstream provider failures, timeouts, and malformed input SHALL be caught and mapped to appropriate HTTP status codes with a structured JSON error body; no unhandled exception, raw stack trace, or vendor-specific error payload SHALL be returned to the client.

#### Scenario: Upstream provider failure is mapped to a clean error

- **WHEN** the AI provider returns an error or is unreachable during a `/chat` request
- **THEN** the service responds with an appropriate error status (e.g. `502`) and a structured JSON error, without leaking the raw provider response or a stack trace

#### Scenario: Upstream timeout is bounded

- **WHEN** the provider does not respond within the configured request timeout
- **THEN** the service aborts the wait and responds with a timeout error status (e.g. `504`) and a structured JSON error, rather than hanging indefinitely

#### Scenario: Consistent error envelope

- **WHEN** any error response is returned by the service
- **THEN** the body is JSON with a stable shape (e.g. an `error` object carrying a code and human-readable message), matching the shape used across the service's error cases
