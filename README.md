# Model Fingerprint Tester

Local-only LLM API inspector for testing model aliases, gateways and protocol behavior.

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

## Local workspace

The app stores everything in the browser's `localStorage` for `http://127.0.0.1:8787`.

### Multiple model/API profiles

Save as many connection profiles as you want. Each profile keeps:

- profile name
- API mode
- timeout
- endpoint URL
- model ID / alias
- API key

Use **Save profile** to update the currently selected profile, or **Save as new** to create another one.

Existing v1 "remember last form" data is migrated automatically into a saved profile on first launch after upgrading.

### Prompt library

The app includes built-in fingerprint prompts and lets you save your own prompts locally.

You can:

- select a built-in or custom prompt
- edit it
- save/update a custom prompt
- save the current prompt as a new entry
- delete custom prompts

Built-in prompts cannot be deleted.

### Copy for ChatGPT analysis

After a test finishes, click **Copy for ChatGPT analysis**.

The clipboard bundle includes:

- requested model
- selected saved profile name
- endpoint
- API mode
- HTTP status
- TTFB and total time
- the test prompt
- extracted assistant text
- raw JSON / raw response
- response headers
- request body

API keys and sensitive authorization-like response headers are omitted/redacted.

Paste the bundle directly into ChatGPT for model fingerprint analysis.

## Request features

- OpenAI Responses API
- OpenAI Chat Completions API
- Custom JSON body
- Configurable timeout (default 300 seconds)
- Arbitrary reasoning effort values for validation probes
- Extra JSON merge field
- Raw JSON response
- Response headers
- TTFB and total latency
- Extracted assistant text
- Copy equivalent cURL command

## Security

This tool is intended for a trusted local machine only.

- Node binds to `127.0.0.1`.
- Do not expose port `8787` publicly.
- API keys are stored as plaintext in the browser's localStorage.
- The Node server does not persist API keys to disk.
- **Delete all local data** removes saved profiles, API keys, prompts and workspace state.
- Rotate any API key that has already been pasted into a public place, logs, or chat.
