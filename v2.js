(() => {
  const HISTORY_KEY = 'modelFingerprintTester.history.v1';
  const HISTORY_LIMIT = 24;
  const HISTORY_BUDGET = 3000000;
  let activeHistory = null;

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  const pretty = (v) => typeof v === 'string' ? v : JSON.stringify(v, null, 2);

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch { return []; }
  }

  function writeHistory(items) {
    let next = items.slice(0, HISTORY_LIMIT);
    while (next.length > 1 && JSON.stringify(next).length > HISTORY_BUDGET) next.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    renderHistory();
  }

  function redactHeaders(headers = {}) {
    const copy = { ...headers };
    Object.keys(copy).forEach((key) => {
      if (/authorization|api[-_]?key|token|cookie|set-cookie/i.test(key)) copy[key] = '[REDACTED]';
    });
    return copy;
  }

  function compactResult(data) {
    const base = {
      ok: data.ok,
      networkError: data.networkError,
      upstreamStatus: data.upstreamStatus,
      name: data.name,
      error: data.error,
      timing: data.timing,
      headers: redactHeaders(data.headers || {}),
      extractedText: data.extractedText,
      raw: data.raw,
      json: data.json
    };
    if (JSON.stringify(base).length < 220000) return base;
    return {
      ...base,
      extractedText: String(data.extractedText || data.raw || '').slice(0, 120000),
      raw: String(data.raw || '').slice(0, 60000),
      json: { _truncated: true, note: 'Large raw JSON omitted from local history.' }
    };
  }

  function currentContext(payload) {
    const profile = $('profileSelect')?.selectedOptions?.[0]?.textContent || '(unsaved)';
    const promptName = $('promptLibrary')?.selectedOptions?.[0]?.textContent || 'Prompt';
    return {
      profile,
      promptName,
      prompt: $('prompt')?.value || '',
      mode: $('mode')?.value || '',
      model: payload?.body?.model || $('model')?.value || '(unknown)',
      endpoint: payload?.url || $('url')?.value || ''
    };
  }

  function bundle(item) {
    const r = item.result || {};
    const c = item.context || {};
    return [
      '# MODEL FINGERPRINT TEST RESULT', '',
      `Saved profile: ${c.profile || '(unsaved)'}`,
      `Prompt: ${c.promptName || 'Prompt'}`,
      `Requested model: ${c.model || '(unknown)'}`,
      `Endpoint: ${c.endpoint || ''}`,
      `API mode: ${c.mode || ''}`,
      `HTTP status: ${r.upstreamStatus ?? '(network error)'}`,
      `TTFB: ${r.timing?.ttfbMs ?? '—'} ms`,
      `Total: ${r.timing?.totalMs ?? '—'} ms`, '',
      '## Prompt text', c.prompt || '', '',
      '## Extracted assistant text', r.extractedText || r.raw || '(no extracted text)', '',
      '## Raw JSON / response', r.json ? pretty(r.json) : (r.raw || ''), '',
      '## Response headers', pretty(redactHeaders(r.headers || {})), '',
      '## Request body (API key omitted)', pretty(item.request?.body || {}), '',
      'Please analyze whether the provider/model label is consistent with the observed response. Separate hard protocol evidence from weak self-reported identity evidence.'
    ].join('\n');
  }

  async function copy(text, button) {
    await navigator.clipboard.writeText(text);
    const old = button.textContent;
    button.textContent = 'Copied ✓';
    setTimeout(() => { button.textContent = old; }, 1200);
  }

  function decorateLayout() {
    const shell = document.querySelector('.shell');
    if (!shell) return;
    shell.classList.add('workspace-v2');
    const cards = [...shell.querySelectorAll(':scope > .card')];
    const [connection, prompt, result] = cards;
    connection?.classList.add('connection-card-v2');
    prompt?.classList.add('prompt-panel-v2');
    result?.classList.add('result-panel-v2');

    if (connection) {
      $('saveProfile').textContent = 'Save changes';
      $('saveProfileAs').textContent = '+ New';
      const summary = document.createElement('div');
      summary.className = 'connection-v2-summary';
      summary.innerHTML = `
        <span id="v2Model" class="strong"></span><span class="sep">•</span>
        <span id="v2Mode"></span><span class="sep">•</span>
        <span id="v2Host"></span><span class="sep">•</span>
        <span id="v2Key" class="ok"></span>
        <span class="summary-actions"><button id="v2EditConnection" class="ghost" type="button">Edit connection</button></span>`;
      connection.querySelector('.profile-toolbar')?.insertAdjacentElement('afterend', summary);

      const overflow = document.createElement('details');
      overflow.className = 'v2-overflow';
      overflow.innerHTML = `<summary>•••</summary><div class="v2-overflow-menu">
        <button id="v2DeleteProfile" class="danger-link" type="button">Delete selected profile</button>
        <button id="v2DeleteAll" class="danger-link" type="button">Delete all local data</button>
      </div>`;
      connection.querySelector('.profile-toolbar')?.appendChild(overflow);
      $('v2EditConnection')?.addEventListener('click', () => connection.classList.toggle('expanded'));
      $('v2DeleteProfile')?.addEventListener('click', () => $('deleteProfile')?.click());
      $('v2DeleteAll')?.addEventListener('click', () => $('forgetSaved')?.click());
    }

    if (prompt) {
      $('savePrompt').textContent = 'Save';
      $('savePromptAs').textContent = '+ New';
      const overflow = document.createElement('details');
      overflow.className = 'v2-overflow';
      overflow.innerHTML = `<summary>•••</summary><div class="v2-overflow-menu">
        <button id="v2DuplicatePrompt" type="button">Save as new</button>
        <button id="v2DeletePrompt" class="danger-link" type="button">Delete prompt</button>
      </div>`;
      prompt.querySelector('.prompt-toolbar')?.appendChild(overflow);
      $('v2DuplicatePrompt')?.addEventListener('click', () => $('savePromptAs')?.click());
      $('v2DeletePrompt')?.addEventListener('click', () => $('deletePrompt')?.click());
    }

    if (result) {
      result.classList.remove('hidden');
      if (!$('outText').textContent.trim()) {
        $('outText').textContent = 'Run a probe to inspect the response.';
        $('outText').classList.add('v2-empty');
      }
      const jsonBtn = document.createElement('button');
      jsonBtn.id = 'v2CopyJson';
      jsonBtn.type = 'button';
      jsonBtn.className = 'v2-copy-json';
      jsonBtn.textContent = 'Copy JSON';
      jsonBtn.disabled = true;
      result.querySelector('.result-copy-actions')?.appendChild(jsonBtn);
      jsonBtn.addEventListener('click', () => copy($('outJson')?.textContent || '', jsonBtn));
    }

    makeHistoryPanel(shell, result);
    updateConnectionSummary();
  }

  function updateConnectionSummary() {
    if (!$('v2Model')) return;
    const model = $('model')?.value?.trim() || 'No model';
    const mode = $('mode')?.selectedOptions?.[0]?.textContent || '';
    let host = $('url')?.value?.trim() || 'No endpoint';
    try { host = new URL(host).host; } catch {}
    $('v2Model').textContent = model;
    $('v2Mode').textContent = mode;
    $('v2Host').textContent = host;
    $('v2Key').textContent = $('key')?.value ? 'Key saved' : 'No key';
  }

  function makeHistoryPanel(shell, result) {
    const panel = document.createElement('section');
    panel.className = 'history-card-v2';
    panel.innerHTML = `
      <div class="history-v2-head">
        <div><div class="eyebrow">RECENT TESTS</div><h2>Test history</h2></div>
        <div class="history-v2-actions"><span id="v2HistoryCount" class="history-v2-count"></span><button id="v2ClearHistory" class="history-v2-clear" type="button">Clear history</button></div>
      </div>
      <div id="v2HistoryList" class="history-v2-list"></div>`;
    result?.insertAdjacentElement('afterend', panel);
    $('v2ClearHistory')?.addEventListener('click', () => {
      const items = readHistory();
      if (!items.length || !confirm('Clear saved test history? Profiles and prompts are kept.')) return;
      writeHistory([]);
    });
    $('v2HistoryList')?.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('[data-history-copy]');
      if (copyBtn) {
        e.stopPropagation();
        const item = readHistory().find((x) => x.id === copyBtn.dataset.historyCopy);
        if (item) copy(bundle(item), copyBtn);
        return;
      }
      const row = e.target.closest('[data-history-id]');
      if (row) openHistory(row.dataset.historyId);
    });
    renderHistory();
  }

  function renderHistory() {
    const list = $('v2HistoryList');
    if (!list) return;
    const items = readHistory();
    $('v2HistoryCount').textContent = `${items.length} saved`;
    if (!items.length) {
      list.innerHTML = '<div class="history-v2-empty">Completed tests will appear here and stay on this browser.</div>';
      return;
    }
    list.innerHTML = items.map((item) => {
      const d = new Date(item.createdAt);
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const ok = !item.result?.networkError && item.result?.ok;
      return `<button class="history-v2-row" type="button" data-history-id="${escapeHtml(item.id)}">
        <span class="history-v2-time">${escapeHtml(time)}</span>
        <span class="history-v2-model">${escapeHtml(item.context?.model || '(unknown)')}</span>
        <span class="history-v2-prompt">${escapeHtml(item.context?.promptName || 'Prompt')}</span>
        <span class="history-v2-duration">${escapeHtml(item.result?.timing?.totalMs ?? '—')} ms</span>
        <span class="history-v2-status ${ok ? 'ok' : 'err'}">${ok ? 'OK' : 'ERROR'}</span>
        <span class="history-v2-copy" data-history-copy="${escapeHtml(item.id)}">Copy</span>
      </button>`;
    }).join('');
  }

  function openHistory(id) {
    const item = readHistory().find((x) => x.id === id);
    if (!item) return;
    activeHistory = item;
    const r = item.result || {};
    const ok = !r.networkError && r.ok;
    $('statusCard')?.classList.remove('hidden');
    $('statusBadge').textContent = r.networkError ? 'NETWORK' : (ok ? `${r.upstreamStatus} OK` : `${r.upstreamStatus ?? 'ERR'} ERROR`);
    $('statusBadge').className = `status ${ok ? 'ok' : 'err'}`;
    $('modelEcho').textContent = item.context?.model || '(unknown)';
    $('timing').textContent = `History · TTFB ${r.timing?.ttfbMs ?? '—'} ms · total ${r.timing?.totalMs ?? '—'} ms`;
    $('outText').textContent = r.extractedText || r.raw || r.error || '(no text)';
    $('outText').classList.remove('v2-empty');
    $('outJson').textContent = r.json ? pretty(r.json) : (r.raw || pretty(r));
    $('outHeaders').textContent = pretty(redactHeaders(r.headers || {}));
    $('outRequest').textContent = pretty({ url: item.request?.url, body: item.request?.body, apiKey: '[REDACTED]' });
    $('copyExtracted').disabled = false;
    $('v2CopyJson').disabled = false;
    $('copyAnalysis').disabled = false;
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === 'text'));
    document.querySelectorAll('.pane').forEach((x) => x.classList.toggle('active', x.id === 'pane-text'));
    $('statusCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function saveIntercepted(payload, data) {
    const items = readHistory();
    const item = {
      id: `history:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      context: currentContext(payload),
      request: { url: payload.url, body: payload.body },
      result: compactResult(data)
    };
    items.unshift(item);
    writeHistory(items);
    activeHistory = null;
    setTimeout(() => {
      if ($('v2CopyJson')) $('v2CopyJson').disabled = false;
      $('outText')?.classList.remove('v2-empty');
    }, 0);
  }

  function installFetchCapture() {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const [input, options = {}] = args;
      const response = await originalFetch(...args);
      if (String(input) === '/api/proxy' && options.method === 'POST') {
        try {
          const payload = JSON.parse(options.body || '{}');
          const clone = response.clone();
          clone.json().then((data) => saveIntercepted(payload, data)).catch(() => {});
        } catch {}
      }
      return response;
    };
  }

  function bindUpdates() {
    ['model', 'mode', 'url', 'key', 'profileSelect'].forEach((id) => {
      $(id)?.addEventListener('input', updateConnectionSummary);
      $(id)?.addEventListener('change', updateConnectionSummary);
    });
    $('run')?.addEventListener('click', () => { activeHistory = null; });

    $('copyAnalysis')?.addEventListener('click', (e) => {
      if (!activeHistory) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      copy(bundle(activeHistory), $('copyAnalysis'));
    }, true);

    $('forgetSaved')?.addEventListener('click', () => {
      setTimeout(() => {
        if (!localStorage.getItem('modelFingerprintTester.workspace.v2')) writeHistory([]);
      }, 0);
    });
  }

  installFetchCapture();
  decorateLayout();
  bindUpdates();
})();
