# Model Fingerprint Tester

Local-only LLM model investigation console for probing model aliases/gateways, inspecting protocol evidence, keeping repeatable prompts, and copying clean evidence into ChatGPT.

## Run on Windows

Requirements: Node.js 18 or newer.

```bash
git clone https://github.com/otis226/model-fingerprint-tester.git
cd model-fingerprint-tester
start.bat
```

Then open:

```text
http://127.0.0.1:8787
```

Or:

```bash
npm start
```

## V2 workspace

The main desktop workflow is now optimized around:

1. Pick a saved connection profile.
2. Pick or edit a fingerprint prompt.
3. Run the probe.
4. Inspect answer / raw JSON / headers / request next to the prompt.
5. Copy the analysis bundle and paste it into ChatGPT.
6. Re-open or copy older runs from local **Test history**.

Connection settings are collapsed during normal use so Prompt and Result stay visible together.

## Multiple model/API profiles

Save as many connection profiles as you want. Each profile keeps:

- profile name
- API mode
- timeout
- endpoint URL
- model ID / alias
- API key

Use **Save changes** to update the selected profile or **+ New** to keep another model/key configuration.

Existing v1 local settings continue to be migrated into the current workspace.

## Prompt library

The app includes built-in fingerprint prompts and lets you save your own prompts locally.

You can select, edit, save, duplicate, and delete custom prompts. Built-in prompts are protected from deletion.

## Test history

Recent tests are saved in a separate local browser history store. Each entry keeps:

- requested model
- prompt name and prompt text
- endpoint + API mode
- HTTP result and timing
- request body without the API key
- extracted answer
- raw response / JSON, subject to a local size cap
- response headers with authorization/token/cookie-like fields redacted

Use a history row to inspect an older result, or its **Copy** action to copy a ready-to-paste analysis bundle.

History is capped to keep browser `localStorage` usage reasonable.

## Copy for ChatGPT analysis

After a live test finishes, click **Copy for ChatGPT analysis**. The clipboard bundle includes:

- requested model
- saved profile name
- prompt name and text
- endpoint and API mode
- HTTP status
- TTFB and total time
- extracted assistant text
- raw JSON / raw response
- response headers
- request body

API keys and sensitive authorization-like headers are omitted/redacted.

## Request features

- OpenAI Responses API
- OpenAI Chat Completions API
- Custom JSON body
- Configurable timeout (default 300 seconds)
- Arbitrary reasoning-effort values for validation probes
- Extra JSON merge field
- Raw JSON response
- Response headers
- TTFB and total latency
- Extracted assistant text
- Copy cURL

## Security

This tool is intended for a trusted local machine only.

- Node binds to `127.0.0.1`.
- Do not expose port `8787` publicly.
- Profiles, API keys, prompts and workspace state are stored in browser `localStorage`.
- API keys are plaintext in that browser profile.
- Test history is stored separately in browser `localStorage` and never includes the API key.
- The Node server does not persist API keys to disk.
- **Delete all local data** removes the main workspace; the V2 layer also clears its separate history after that action.
- Rotate any API key that has already been pasted into a public place, logs, or chat.
