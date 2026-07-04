# Parlor (Bengali fork)

On-device, real-time multimodal AI. Have natural voice and vision conversations with an AI that runs entirely on your machine.

> **This is a Bengali-localized fork of [`fikrikarim/parlor`](https://github.com/fikrikarim/parlor).**
> The user-facing experience — UI chrome, in-browser status text, and the AI
> assistant's replies — defaults to **Bengali (বাংলা)**. This fork also adds an
> **optional Node.js AI proxy** so the conversation path can be run *without* the
> on-device model. See [Bengali localization](#bengali-localization),
> [Running the app](#running-the-app), and [Known limitations](#known-limitations).

Parlor uses [Gemma 4 E2B](https://huggingface.co/google/gemma-4-E2B-it) for understanding speech and vision, and [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) for text-to-speech. You talk, show your camera, and it talks back, all locally.

https://github.com/user-attachments/assets/cb0ffb2e-f84f-48e7-872c-c5f7b5c6d51f

> **Research preview.** This is an early experiment. Expect rough edges and bugs.

## How it works

```
Browser (mic + camera)
    │
    │  WebSocket (audio PCM + JPEG frames)
    ▼
FastAPI server
    ├── Gemma 4 E2B via LiteRT-LM (GPU)  →  understands speech + vision
    │     └── (optional) Node.js AI proxy  →  text-only replies, no local model
    └── Kokoro TTS (MLX on Mac, ONNX on Linux)  →  speaks back
    │
    │  WebSocket (streamed audio chunks)
    ▼
Browser (playback + transcript)
```

- **Voice Activity Detection** in the browser ([Silero VAD](https://github.com/ricky0123/vad)). Hands-free, no push-to-talk.
- **Barge-in.** Interrupt the AI mid-sentence by speaking.
- **Sentence-level TTS streaming.** Audio starts playing before the full response is generated.

## Bengali localization

This fork adapts the upstream project so the whole user-facing surface defaults to
Bengali. The scope of that work:

- **HTML UI text** — the visible chrome in `src/index.html` (title, headings, model
  label, status pill, camera button, state indicator) is in Bengali.
- **Frontend JavaScript strings** — the runtime status/state text injected into the
  DOM by the browser script in `src/index.html` (connection status, state labels,
  camera-toggle text, timing metadata) is in Bengali.
- **AI assistant replies** — the assistant answers in natural, professional
  Bangladeshi Bengali by default. This is pinned by a single `BENGALI_DIRECTIVE`
  constant in `src/server.py`, referenced by the system prompt, the per-turn
  instructions, and the `respond_to_user` tool schema, so it also governs the
  raw-text fallback path. Transcription still faithfully records whatever language
  the user actually spoke.

The design and requirements for each surface live in `openspec/changes/`:
`audit-localization-surface` (the inventory), `localize-html-templates-bn`,
`localize-frontend-js-bn`, and `port-ai-prompts-to-bengali`. The Node.js proxy is
covered by `add-node-ai-proxy` and `integrate-fastapi-with-node-ai-proxy`.

See [Known limitations](#known-limitations) — notably, TTS is not yet Bengali, so
Bengali *text* is produced but not spoken in a Bengali voice.

## Requirements

- Python 3.12 (the project pins `>=3.12,<3.13`)
- macOS with Apple Silicon, or Linux with a supported GPU (for on-device mode)
- ~3 GB free RAM for the model
- Node.js ≥ 18 — only if you use the optional [proxy mode](#mode-2-node-proxy-mode-optional-text-only)

## Running the app

There are two ways to run this fork. Pick one:

| Mode | Runs the AI via | Understands audio + vision? | Needs |
| ---- | --------------- | --------------------------- | ----- |
| **On-device (default)** | Local Gemma 4 E2B (LiteRT-LM) | ✅ Yes | Apple Silicon / supported GPU + model download |
| **Node proxy (optional)** | An external provider through `services/ai-proxy/` | ❌ No — text only | Node.js + an OpenAI-compatible API key |

Both modes serve the same UI at [http://localhost:8000](http://localhost:8000).

### Mode 1: On-device mode (default)

```bash
git clone https://github.com/fikrikarim/parlor.git
cd parlor

# Install uv if you don't have it
curl -LsSf https://astral.sh/uv/install.sh | sh

# (Optional) configure environment variables — see the table below
cp .env.example .env

cd src
uv sync
uv run server.py
```

Open [http://localhost:8000](http://localhost:8000), grant camera and microphone access, and start talking.

Models are downloaded automatically on first run (~2.6 GB for Gemma 4 E2B, plus TTS models).

### Mode 2: Node proxy mode (optional, text-only)

If your machine can't run the on-device Gemma model, generate replies through the
standalone Node.js AI proxy in [`services/ai-proxy/`](services/ai-proxy/) instead.
This mode is **text-only** — audio and image inputs are not understood — and is
intended for text turns and evaluation. See
[`services/ai-proxy/README.md`](services/ai-proxy/README.md) for the full endpoint
and error contract.

```bash
# 1. Start the proxy (needs an OpenAI-compatible provider — see the env table below)
cd services/ai-proxy
npm install
cp .env.example .env   # fill in AI_PROVIDER_BASE_URL, AI_API_KEY, AI_MODEL
npm start              # listens on http://localhost:3000

# 2. In another terminal, start FastAPI pointed at the proxy.
#    The local Gemma model is NOT loaded in this mode.
cd ../src
AI_PROXY_URL=http://localhost:3000 uv run server.py
```

If the proxy is unreachable, times out, or errors, the app returns a friendly
Bengali fallback message and keeps the conversation open. Unset `AI_PROXY_URL` to
restore the on-device model path.

## Environment variables

All variables are optional unless marked **required**. Copy the relevant
`.env.example` to `.env` and edit it (both `.env` files are gitignored).

### FastAPI server (`src/`, template: [`.env.example`](.env.example))

| Variable           | Required     | Default                        | Description                                                                 |
| ------------------ | ------------ | ------------------------------ | --------------------------------------------------------------------------- |
| `MODEL_PATH`       | no           | auto-download from HuggingFace | Path to a local `gemma-4-E2B-it.litertlm` file (on-device mode only).       |
| `PORT`             | no           | `8000`                         | Server / UI port.                                                           |
| `AI_PROXY_URL`     | proxy mode   | _(unset)_                      | If set, route AI replies through the Node proxy and skip loading the local model. |
| `AI_PROXY_TIMEOUT` | no           | `30`                           | Timeout (seconds) for the outbound proxy call.                              |

### Node.js AI proxy (`services/ai-proxy/`, template: [`services/ai-proxy/.env.example`](services/ai-proxy/.env.example))

Only needed in proxy mode.

| Variable                | Required | Default   | Description                                                     |
| ----------------------- | -------- | --------- | --------------------------------------------------------------- |
| `AI_PROVIDER_BASE_URL`  | **yes**  | —         | OpenAI-compatible base URL; the proxy calls `{URL}/chat/completions`. |
| `AI_API_KEY`            | **yes**  | —         | Bearer token for the provider.                                  |
| `AI_MODEL`              | **yes**  | —         | Model name to request.                                          |
| `PORT`                  | no       | `3000`    | Port the proxy listens on (kept off `8000` so it can run alongside FastAPI). |
| `AI_REQUEST_TIMEOUT_MS` | no       | `30000`   | Outbound request timeout in milliseconds.                       |

If a required proxy value is missing, the proxy still starts and `/health` still
works, but it logs a startup warning and `/chat` returns a clear
`provider_not_configured` error.

## Known limitations

- **TTS is not yet Bengali.** The assistant's *text* is Bengali, but the
  text-to-speech stack uses an English-only grapheme-to-phoneme step
  (`misaki[en]` on macOS, `kokoro-onnx` on Linux) and an English voice. Bengali
  text is therefore **not spoken in a correct Bengali voice** — making the audio
  Bengali is a separate, larger change and is out of scope here.
- **Proxy mode is text-only.** When `AI_PROXY_URL` is set, audio and image inputs
  are not understood and no transcription is produced; only the assembled text
  prompt is forwarded to the external provider. Use on-device mode for real
  voice/vision conversations.
- **On-device mode has hardware/model requirements.** It needs Apple Silicon or a
  supported Linux GPU, ~3 GB free RAM, and a multi-GB model download on first run
  (~2.6 GB for Gemma 4 E2B plus TTS models).
- **Research preview.** Expect rough edges and bugs.

## Manual verification checklist

Use this to confirm the fork runs and the Bengali adaptation is present.

### On-device mode

- [ ] From `src/`, `uv sync` completes, then `uv run server.py` starts and the log shows the model loading (or downloading on first run).
- [ ] [http://localhost:8000](http://localhost:8000) loads and grants camera/microphone permission.
- [ ] The UI chrome renders in **Bengali** (title, status pill, camera button, state indicator).
- [ ] Speak (or show the camera) and the assistant's reply appears **in Bengali** in the transcript.
- [ ] Audio plays back (note: the voice is English-phonemized — see [Known limitations](#known-limitations)).

### Node proxy mode

- [ ] From `services/ai-proxy/`, after `cp .env.example .env` and filling `AI_PROVIDER_BASE_URL`/`AI_API_KEY`/`AI_MODEL`, `npm install` then `npm start` logs `AI proxy listening on http://localhost:3000` with no config warning.
- [ ] `curl http://localhost:3000/health` returns `{"status":"ok"}`.
- [ ] `curl -X POST http://localhost:3000/chat -H 'content-type: application/json' -d '{"message":"Hello!"}'` returns a JSON `{"reply":"...","model":"..."}`.
- [ ] Start FastAPI with `AI_PROXY_URL=http://localhost:3000 uv run server.py`; the log shows **proxy mode** (no local model load).
- [ ] Load [http://localhost:8000](http://localhost:8000), send a text turn, and a reply comes back through the proxy (Bengali UI chrome still renders).
- [ ] Stop the proxy and send another turn — the app shows a Bengali fallback message and stays open.

## Performance (Apple M3 Pro)

| Stage                            | Time          |
| -------------------------------- | ------------- |
| Speech + vision understanding    | ~1.8-2.2s     |
| Response generation (~25 tokens) | ~0.3s         |
| Text-to-speech (1-3 sentences)   | ~0.3-0.7s     |
| **Total end-to-end**             | **~2.5-3.0s** |

Decode speed: ~83 tokens/sec on GPU (Apple M3 Pro).

## Project structure

```
src/
├── server.py              # FastAPI WebSocket server + Gemma 4 inference (+ optional proxy path)
├── tts.py                 # Platform-aware TTS (MLX on Mac, ONNX on Linux)
├── index.html             # Frontend UI (VAD, camera, audio playback) — Bengali strings
├── pyproject.toml         # Dependencies
└── benchmarks/
    ├── bench.py           # End-to-end WebSocket benchmark
    └── benchmark_tts.py   # TTS backend comparison

services/
└── ai-proxy/              # Optional standalone Node.js AI proxy (text-only)
    ├── server.js          # Express app: /health, /chat
    ├── provider.js        # Vendor-specific provider call (edit to swap providers)
    ├── config.js          # Env-var config + validation
    └── README.md          # Full endpoint + error contract
```

## Acknowledgments

- [Gemma 4](https://ai.google.dev/gemma) by Google DeepMind
- [LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM) by Google AI Edge
- [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) TTS by Hexgrad
- [Silero VAD](https://github.com/snakers4/silero-vad) for browser voice activity detection
- Upstream project: [`fikrikarim/parlor`](https://github.com/fikrikarim/parlor)

## License

[Apache 2.0](LICENSE)
