// AI proxy HTTP server.
//
// Two endpoints:
//   GET  /health  → liveness check (never calls the provider)
//   POST /chat    → { message } → { reply, model }
//
// The route layer is provider-agnostic: it validates input, calls
// provider.chat(), and hands all errors to one central error handler that
// renders a consistent JSON envelope.
import express from "express";
import { config, missingConfig } from "./config.js";
import { chat } from "./provider.js";
import { AppError, badRequest } from "./errors.js";

const app = express();
app.use(express.json());

// Liveness — deliberately independent of provider config so it succeeds even
// when the AI provider is down or unconfigured.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// AI chat/completion.
app.post("/chat", async (req, res, next) => {
  try {
    const message = req.body?.message;
    if (typeof message !== "string" || message.trim() === "") {
      throw badRequest("Request body must include a non-empty 'message' string.");
    }
    const result = await chat(message);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Central error handler — the single place that shapes error responses.
// Signature must keep 4 args so Express treats it as an error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Malformed JSON bodies surface as a SyntaxError from express.json().
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: { code: "bad_request", message: "Request body is not valid JSON." } });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  // Unexpected error — never leak internals or a stack trace.
  console.error("Unexpected error:", err);
  res.status(500).json({ error: { code: "internal_error", message: "An unexpected error occurred." } });
});

app.listen(config.port, () => {
  console.log(`AI proxy listening on http://localhost:${config.port}`);
  const missing = missingConfig();
  if (missing.length > 0) {
    console.warn(`[warning] AI provider is not fully configured: ${missing.join("; ")}. /chat will return a provider_not_configured error until this is fixed.`);
  }
});
