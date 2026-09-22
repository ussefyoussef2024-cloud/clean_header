(() => {
  'use strict';

  const defaults = {
    domainReplacement: '',
    fromUserTag: '[3LA]',
    messageIdTag: '[EID]',
  };

  let options = { ...defaults };

  const $ = (id) => document.getElementById(id);
  const sourceInput = $('source');
  const resultOutput = $('result');
  const emptyResult = $('empty-result');
  const resultFoot = $('result-foot');
  const errorBox = $('error');

  function drawChips(id, values, key) {
    const container = $(id);
    container.innerHTML = '';
    values.forEach((value) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = value || '(none)';
      button.className = options[key] === value ? 'selected' : '';
      button.addEventListener('click', () => {
        options[key] = value;
        $(keyToInputId(key)).value = value;
        refreshOptions();
        processSingleSource();
      });
      container.appendChild(button);
    });
  }

  function keyToInputId(key) {
    return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }

  function refreshOptions() {
    $('domain-replacement').value = options.domainReplacement;
    $('from-user-tag').value = options.fromUserTag;
    $('message-id-tag').value = options.messageIdTag;
    drawChips('domain-chips', ['[P_PATH]', '[RDNS]', '[DRDNS]', '[RP]'], 'domainReplacement');
    drawChips('from-chips', ['[3LA]', '[EID]', '[RP]', ''], 'fromUserTag');
    drawChips('message-chips', ['[EID]', ''], 'messageIdTag');
  }

  function syncOptionsFromInputs() {
    options = {
      domainReplacement: $('domain-replacement').value,
      fromUserTag: $('from-user-tag').value,
      messageIdTag: $('message-id-tag').value,
    };
    drawChips('domain-chips', ['[P_PATH]', '[RDNS]', '[DRDNS]', '[RP]'], 'domainReplacement');
    drawChips('from-chips', ['[3LA]', '[EID]', '[RP]', ''], 'fromUserTag');
    drawChips('message-chips', ['[EID]', ''], 'messageIdTag');
    processSingleSource();
  }

  function splitSource(text) {
    const separator = text.match(/\r\n\r\n|\n\n|\r\r/);
    return {
      headerText: separator ? text.slice(0, separator.index) : text,
      body: separator ? text.slice((separator.index || 0) + separator[0].length) : '',
      lineEnding: text.includes('\r\n') ? '\r\n' : '\n',
    };
  }

  function processEmailSource(source) {
    const parts = splitSource(source);
    const headers = [];
    parts.headerText.split(/\r\n|\n|\r/).forEach((line) => {
      if (/^[\t ]/.test(line) && headers.length) {
        headers[headers.length - 1].value += ` ${line.trim()}`;
        return;
      }
      const colon = line.indexOf(':');
      if (colon > 0) headers.push({ name: line.slice(0, colon).trim(), value: line.slice(colon + 1).trim() });
    });

    const keep = new Set(['received', 'date', 'mime-version', 'content-type', 'content-transfer-encoding', 'to', 'subject', 'cc', 'from', 'message-id']);
    const output = headers.filter((header) => keep.has(header.name.toLowerCase())).map((header) => {
      const key = header.name.toLowerCase();
      let value = header.value;
      if (key === 'from') {
        value = value.replace(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+/gi, (address) => {
          const at = address.lastIndexOf('@');
          const domain = options.domainReplacement ? `@${options.domainReplacement}` : '';
          return `${address.slice(0, at)}${options.fromUserTag}${domain}`;
        });
      }
    if (key === 'message-id') {
      value = value.replace(/<([^<>\s@]+)@([^<>\s]+)>/g, (_, localPart, domain) => {
        return `<${localPart}${options.messageIdTag}@${domain}>`;
      });
    }
      return `${header.name}: ${value}`;
    });

    if (!output.length) throw new Error('No supported email headers were found in this source.');
    return `${output.join(parts.lineEnding)}${parts.lineEnding}${parts.lineEnding}${parts.body}`;
  }

  function setSingleError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  }

  function processSingleSource() {
    const text = sourceInput.value;
    $('source-status').textContent = `${text ? text.split(/\r\n|\n|\r/).length : 0} lines`;
    if (!text.trim()) {
      resultOutput.hidden = true;
      emptyResult.hidden = false;
      resultFoot.hidden = true;
      $('result-count').textContent = '';
      setSingleError('');
      return;
    }
    try {
      const output = processEmailSource(text);
      resultOutput.textContent = output;
      resultOutput.hidden = false;
      emptyResult.hidden = true;
      resultFoot.hidden = false;
      $('result-count').textContent = `${output.split(/\r\n|\n|\r/).length} lines`;
      setSingleError('');
    } catch (error) {
      resultOutput.hidden = true;
      emptyResult.hidden = false;
      resultFoot.hidden = true;
      setSingleError(error.message || 'This source could not be processed.');
    }
  }

  function downloadText(fileName, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  $('source').addEventListener('input', processSingleSource);
  $('source').onchange = processSingleSource;
  $('source').addEventListener('paste', () => window.setTimeout(processSingleSource, 0));
  $('clear').addEventListener('click', () => { sourceInput.value = ''; processSingleSource(); });
  $('copy').addEventListener('click', async () => { await navigator.clipboard?.writeText(resultOutput.textContent); });
  $('download-single').addEventListener('click', () => downloadText('ems6-sanitized-source.eml', resultOutput.textContent));
  $('reset-options').addEventListener('click', () => { options = { ...defaults }; refreshOptions(); processSingleSource(); });
  ['domain-replacement', 'from-user-tag', 'message-id-tag'].forEach((id) => {
    const input = $(id);
    input.addEventListener('input', syncOptionsFromInputs);
    input.onchange = syncOptionsFromInputs;
  });
  $('theme-toggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    $('theme-toggle').textContent = document.documentElement.classList.contains('dark') ? '☀' : '☾';
    localStorage.setItem('ems6-theme-v2', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });

  if (localStorage.getItem('ems6-theme-v2') !== 'light') {
    document.documentElement.classList.add('dark');
    $('theme-toggle').textContent = '☀';
  }
  refreshOptions();
})();
