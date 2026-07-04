// Typed application errors. Each carries an HTTP status and a stable machine
// `code` so the central error handler can render a consistent JSON envelope
// without leaking stack traces or vendor-specific payloads.
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message) => new AppError(400, "bad_request", message);
export const notConfigured = (message) => new AppError(503, "provider_not_configured", message);
export const upstreamFailure = (message) => new AppError(502, "upstream_error", message);
export const upstreamTimeout = (message) => new AppError(504, "upstream_timeout", message);
