(() => {
  const $ = (id) => document.getElementById(id);

  function polishLabels() {
    const savePrompt = $('savePrompt');
    const savePromptAs = $('savePromptAs');
    const run = $('run');
    const copyAnalysis = $('copyAnalysis');
    const copyExtracted = $('copyExtracted');
    const copyJson = $('v2CopyJson');

    if (savePrompt) {
      savePrompt.classList.remove('primary', 'secondary-primary');
      savePrompt.classList.add('ghost');
      savePrompt.textContent = 'Save';
      savePrompt.title = 'Save changes to the selected custom prompt';
    }

    if (savePromptAs) {
      savePromptAs.classList.remove('primary', 'secondary-primary');
      savePromptAs.classList.add('ghost');
      savePromptAs.textContent = '+ New';
    }

    if (run) {
      run.innerHTML = '<span>⚡ Run test</span><span class="shortcut-hint">Ctrl ↵</span>';
      run.setAttribute('aria-keyshortcuts', 'Control+Enter Meta+Enter');
      run.title = 'Run test (Ctrl/Cmd + Enter)';
    }

    if (copyAnalysis) {
      copyAnalysis.textContent = 'Copy analysis bundle';
      copyAnalysis.title = 'Copy prompt, model, endpoint, timing, answer, raw response and headers for ChatGPT analysis';
    }

    if (copyExtracted) {
      copyExtracted.textContent = 'Copy answer';
      copyExtracted.title = 'Copy only the extracted assistant response';
    }

    if (copyJson) {
      copyJson.textContent = 'Copy JSON';
      copyJson.title = 'Copy the raw JSON response';
    }
  }

  function installRunShortcut() {
    document.addEventListener('keydown', (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return;
      const run = $('run');
      if (!run || run.disabled) return;
      event.preventDefault();
      run.click();
    });
  }

  function keepDynamicLabelsPolished() {
    const resultActions = document.querySelector('.result-copy-actions');
    if (!resultActions) return;
    const observer = new MutationObserver(() => polishLabels());
    observer.observe(resultActions, { childList: true, subtree: true });
  }

  polishLabels();
  installRunShortcut();
  keepDynamicLabelsPolished();
})();
