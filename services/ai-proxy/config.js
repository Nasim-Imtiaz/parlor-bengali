// Loads and validates configuration from environment variables.
//
// All provider-agnostic settings live here so the rest of the service never
// reads process.env directly. Required values (base URL, API key) are checked
// at startup and surface a clear warning rather than crashing the boot.
import "dotenv/config";

const DEFAULT_PORT = 3000; // deliberately not 8000, so this can run beside the FastAPI app
const DEFAULT_TIMEOUT_MS = 30000;

export const config = {
  providerBaseUrl: process.env.AI_PROVIDER_BASE_URL || "",
  apiKey: process.env.AI_API_KEY || "",
  model: process.env.AI_MODEL || "",
  port: Number(process.env.PORT) || DEFAULT_PORT,
  requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
};

// Returns a list of human-readable messages for any required config that is
// missing. Empty list means the provider is fully configured.
export function missingConfig() {
  const missing = [];
  if (!config.providerBaseUrl) missing.push("AI_PROVIDER_BASE_URL is not set");
  if (!config.apiKey) missing.push("AI_API_KEY is not set");
  if (!config.model) missing.push("AI_MODEL is not set");
  return missing;
}

export function isProviderConfigured() {
  return missingConfig().length === 0;
}
