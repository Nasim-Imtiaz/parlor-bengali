## Context

This fork of `fikrikarim/parlor` has, across six merged changes, (1) localized the HTML UI, the browser JavaScript, and the AI assistant's replies to Bengali, and (2) added an optional standalone Node.js AI proxy (`services/ai-proxy/`) that FastAPI can route replies through instead of loading the on-device Gemma/LiteRT model. The code and the proxy's own `services/ai-proxy/README.md` are already reasonably documented; the gap is at the **top level**. The root `README.md` still reads like upstream Parlor with a couple of proxy notes bolted on, does not name the Bengali adaptation as this fork's defining change, does not present the two run modes as one evaluator decision, and has no consolidated known-limitations list or manual verification checklist.

Current documentation state (verified by reading the files):
- Root `README.md` already documents `uv sync` / `uv run server.py`, a Configuration table with `MODEL_PATH`/`PORT`/`AI_PROXY_URL`/`AI_PROXY_TIMEOUT`, and a "Running without the local model (Node proxy)" subsection. It does **not** have a Bengali section, a consolidated known-limitations section, or a manual verification checklist, and its intro/persona is upstream-oriented.
- Root `.env.example` already lists `MODEL_PATH`, `PORT`, `AI_PROXY_URL`, `AI_PROXY_TIMEOUT` (all commented).
- `services/ai-proxy/.env.example` already lists `AI_PROVIDER_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `PORT`, `AI_REQUEST_TIMEOUT_MS`.
- `services/ai-proxy/README.md` already documents endpoints, setup, config table, and error envelopes.

So both `.env.example` files already appear complete; the primary editable artifact is `README.md`. This design keeps that reality in mind: the change is mostly *reorganizing and augmenting the README* plus a *verification pass* on the two env templates, not net-new files.

## Goals / Non-Goals

**Goals:**
- Make an evaluator able to clone, choose a run mode, configure env, run, and verify — from the README alone.
- Present on-device mode and Node-proxy mode as two clearly-labeled paths sharing one env-var reference.
- Summarize the Bengali localization scope and point to where it lives.
- State known limitations honestly (TTS English-only phonemizer; proxy is text-only; on-device hardware/model requirements).
- Provide a concrete manual verification checklist with observable outcomes for both modes.
- Guarantee both `.env.example` templates cover every documented variable.

**Non-Goals:**
- No new or changed localization (no string translated/re-translated).
- No new/changed AI provider logic, proxy behavior, model/engine config, or run commands.
- No architecture refactor; no dependency changes; no edits to `src/*` or `services/ai-proxy/*.js`.
- No TTS/Bengali-audio implementation — it is documented as a limitation only.

## Decisions

- **Keep the README as the single entry point; cross-link, don't duplicate.** The detailed proxy contract (endpoints, error envelope) stays in `services/ai-proxy/README.md`; the root README links to it. *Rationale:* avoids two copies drifting apart. *Alternative considered:* inlining the full proxy API into the root README — rejected as duplication that the non-goals discourage.
- **One consolidated env-var table keyed by mode**, rather than two separate scattered tables. Columns: variable, process (FastAPI / proxy), required?, default, description. *Rationale:* the reviewer's real question is "what must I set to run mode X?" *Alternative:* per-process tables — kept close but unified so proxy mode (which needs vars on *both* processes) reads as one setup.
- **Verify, don't rewrite, `.env.example`.** Both templates already cover their variables, so the task is a completeness check against the README table; create-if-missing and correct-if-wrong only. *Rationale:* honors the non-goal of not churning source; avoids gratuitous diffs.
- **Bengali section is a summary with pointers, not a re-statement of the localization.** It names the three localized surfaces (HTML UI, frontend JS, assistant replies) and points to the delivering changes/files. *Rationale:* the localization already has its own specs; this change must not re-implement or re-specify it.
- **Verification checklist uses observable outcomes**, not internal assertions, so a non-developer evaluator can run it (load UI → see Bengali; speak/type a turn → Bengali reply; `curl /health` → `{"status":"ok"}`; text turn via proxy → reply). *Rationale:* the acceptance criterion is "a reviewer can verify," which requires user-visible checks.
- **Preserve existing accurate content.** The Requirements, Quick start, Performance, and Project-structure sections that are still correct are kept; the change augments and reframes rather than deleting working documentation.

## Risks / Trade-offs

- **Docs drift from code** (env defaults, ports, commands) → Mitigation: every documented value is cross-checked against the actual source (`src/server.py`, `services/ai-proxy/config.js`, both `.env.example`, `pyproject.toml`) during implementation, and the checklist itself exercises the documented commands.
- **Over-claiming completeness** (e.g. implying Bengali audio works) → Mitigation: the Known limitations section explicitly states TTS is English-phonemized and proxy mode is text-only; wording is reviewed for honesty per the acceptance criteria.
- **Scope creep into fixing the app while documenting it** → Mitigation: hard non-goals; the only non-`README.md` edits permitted are completing an incomplete `.env.example`, and they are gated on "only if missing/incorrect."
- **Upstream-vs-fork identity confusion** → Mitigation: the README intro is reframed to state this is a Bengali-localized fork up front, so an evaluator is never misled about what they are running.

## Migration Plan

Not applicable — documentation-only change with no runtime, data, or deployment impact. "Rollback" is reverting the `README.md` (and any `.env.example`) edit; nothing else is affected.

## Open Questions

- None blocking. If the maintainer wants the Bengali section to link specific OpenSpec change directories by name (e.g. `localize-html-templates-bn`, `localize-frontend-js-bn`, `port-ai-prompts-to-bengali`) versus a general pointer, that is a wording preference resolved during implementation, not a design blocker.
