# Model Fingerprint Tester

Local-only LLM API inspector for testing model aliases/gateways.

## Run on Windows

Requirements: Node.js 18 or newer.

1. Clone or download this repository.
2. Double-click `start.bat`.
3. Open `http://127.0.0.1:8787` if the browser does not open automatically.
4. Enter endpoint, API key, model name and prompt.
5. Click **Run test**.

The app can remember your current configuration in the browser's `localStorage`, including the API key, so you do not need to paste it again after restarting the local app.

## Run from terminal

```bash
npm start
```

Then open:

```text
http://127.0.0.1:8787
```

## Local persistence

With **Nhớ cấu hình trên máy này** enabled (default), the browser automatically stores:

- API mode
- Timeout
- Endpoint URL
- Model name
- API key
- Selected template and prompt
- Reasoning effort
- Max output tokens
- Extra JSON
- Custom request body
- Advanced panel open/closed state

Use **Forget saved data** to remove all saved settings and the API key from localStorage.

> Security note: `localStorage` is not encrypted. The API key is stored as plaintext in the local browser profile for `http://127.0.0.1:8787`. Use this only on a computer/browser profile you trust. The local Node server itself does not persist the API key to disk.

## Features

- OpenAI Responses API
- OpenAI Chat Completions API
- Custom JSON body
- Configurable timeout (default 300 seconds)
- Reasoning effort field accepts arbitrary values for validation probes
- Extra JSON merge field, e.g. encrypted reasoning include
- Raw JSON response
- Upstream response headers
- TTFB and total latency
- Extracted assistant text
- Copy equivalent cURL command
- Built-in model fingerprint prompts
- Automatic local settings persistence

## Security notes

- Intended for localhost use only (`127.0.0.1`).
- The Node server binds to localhost by default.
- Do not expose port 8787 to the public Internet.
- Rotate any API key that has already been shared publicly or pasted into logs/chat.
