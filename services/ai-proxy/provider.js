// Provider client — the ONLY place that knows how to talk to the external AI
// vendor. It targets the widely-supported OpenAI-compatible chat/completions
// contract. To switch providers or API shapes, change this file only; the route
// layer just calls chat(message).
import { config, isProviderConfigured } from "./config.js";
import { notConfigured, upstreamFailure, upstreamTimeout } from "./errors.js";

// Sends a single user message to the provider and returns a normalized result.
// Returns: { reply: string, model: string }
export async function chat(message) {
  if (!isProviderConfigured()) {
    throw notConfigured("AI provider is not configured (check AI_PROVIDER_BASE_URL, AI_API_KEY, AI_MODEL).");
  }

  const url = `${config.providerBaseUrl.replace(/\/$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: message }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw upstreamTimeout(`AI provider did not respond within ${config.requestTimeoutMs}ms.`);
    }
    throw upstreamFailure("Could not reach the AI provider.");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // Do not forward the raw vendor error body to the client.
    throw upstreamFailure(`AI provider returned status ${response.status}.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw upstreamFailure("AI provider returned a malformed (non-JSON) response.");
  }

  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string") {
    throw upstreamFailure("AI provider response did not contain a reply.");
  }

  return { reply, model: data.model || config.model };
}
