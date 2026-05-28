/* ============================================================
   ui-rhyssa-page.js
   Extracted from js/ui.js (PR #233) — behaviour unchanged.
   Rhyssa standalone companion page (rh-cp-*) — Anthropic worker proxy.
   ============================================================ */

/* ── RHYSSA COMPANION PAGE ── */
(function () {
  var WORKER_URL  = 'https://api.aquaticrhythm.com/chat';
  var STORE_KEY   = 'rh_thread_companion';
  var cpStreaming  = false;
  var cpIsTouch   = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  var cpThread  = document.getElementById('rh-cp-thread');
  var cpForm    = document.getElementById('rh-cp-form');
  var cpInp     = document.getElementById('rh-cp-inp');
  var cpSendBtn = document.getElementById('rh-cp-send');
  var cpWelcome = document.getElementById('rh-cp-welcome');
  var cpNewBtn  = document.getElementById('rh-cp-new');
  var cpBackBtn = document.getElementById('rh-cp-back');

  if (!cpThread) return;

  /* ── Storage ── */
  function cpGetThread() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || { messages: [] }; }
    catch (e) { return { messages: [] }; }
  }
  function cpSaveThread(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  /* ── Date helpers ── */
  function cpDayKey(ts) { return new Date(ts).toDateString(); }
  function cpFmtDay(ts) {
    var d = new Date(ts), now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    var yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    var opts = { day: 'numeric', month: 'long' };
    if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString(undefined, opts);
  }

  /* ── Markdown → HTML ── */
  function cpMdToHTML(raw) {
    var s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

    var lines = s.split('\n');
    var out = [];
    var inUL = false, inOL = false, inP = false;

    function closeAll() {
      if (inUL) { out.push('</ul>'); inUL = false; }
      if (inOL) { out.push('</ol>'); inOL = false; }
      if (inP)  { out.push('</p>');  inP  = false; }
    }

    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].trim();
      if (!trimmed) { closeAll(); continue; }
      if (/^---+$/.test(trimmed)) { closeAll(); out.push('<hr>'); continue; }

      var ulM = trimmed.match(/^[-*]\s+([\s\S]*)/);
      if (ulM) {
        if (inP) { out.push('</p>'); inP = false; }
        if (inOL) { out.push('</ol>'); inOL = false; }
        if (!inUL) { out.push('<ul>'); inUL = true; }
        out.push('<li>' + ulM[1] + '</li>');
        continue;
      }

      var olM = trimmed.match(/^\d+[.)]\s+([\s\S]*)/);
      if (olM) {
        if (inP) { out.push('</p>'); inP = false; }
        if (inUL) { out.push('</ul>'); inUL = false; }
        if (!inOL) { out.push('<ol>'); inOL = true; }
        out.push('<li>' + olM[1] + '</li>');
        continue;
      }

      if (inUL) { out.push('</ul>'); inUL = false; }
      if (inOL) { out.push('</ol>'); inOL = false; }
      if (!inP) { out.push('<p>'); inP = true; }
      else { out.push('<br>'); }
      out.push(trimmed);
    }

    closeAll();
    var result = out.join('');
    return result || '<p>' + s.replace(/\n/g, '<br>') + '</p>';
  }

  /* ── Thread rendering ── */
  function cpAppendSep(ts) {
    var sep = document.createElement('div');
    sep.className = 'rh-date-sep';
    sep.innerHTML = '<span>' + cpFmtDay(ts) + '</span>';
    cpThread.appendChild(sep);
  }

  function cpAppendBubble(role, text) {
    var wrap = document.createElement('div');
    wrap.className = 'rh-bubble ' + (role === 'assistant' ? 'rh-bubble-rh' : 'rh-bubble-you');
    var who = document.createElement('span');
    who.className = 'rh-bubble-who';
    who.textContent = role === 'assistant' ? 'Rhyssa' : 'You';
    var body = document.createElement('div');
    body.className = 'rh-bubble-body';
    if (text) {
      body.innerHTML = role === 'assistant'
        ? cpMdToHTML(text)
        : '<p>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>';
    }
    wrap.appendChild(who);
    wrap.appendChild(body);

    if (role === 'assistant') {
      var copyBtn = document.createElement('button');
      copyBtn.className = 'rh-copy-btn' + (cpIsTouch ? ' rh-copy-visible' : '');
      copyBtn.setAttribute('aria-label', 'Copy message');
      copyBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.15"/><path d="M4.5 4.5V2.5A1 1 0 0 1 5.5 1.5h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H9.5" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/></svg>';
      copyBtn.addEventListener('click', function () {
        var msgText = (body.innerText || body.textContent || '').trim();
        function markCopied() {
          copyBtn.classList.add('copied');
          copyBtn.setAttribute('aria-label', 'Copied!');
          setTimeout(function () {
            copyBtn.classList.remove('copied');
            copyBtn.setAttribute('aria-label', 'Copy message');
          }, 1800);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(msgText).then(markCopied).catch(function () { cpFallbackCopy(msgText); markCopied(); });
        } else {
          cpFallbackCopy(msgText); markCopied();
        }
      });
      wrap.appendChild(copyBtn);
    }

    cpThread.appendChild(wrap);
    return body;
  }

  function cpFallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function cpShowTyping() {
    var d = document.createElement('div');
    d.className = 'rh-typing'; d.id = 'rh-cp-typing';
    d.innerHTML = '<span></span><span></span><span></span>';
    cpThread.appendChild(d);
    cpThread.scrollTop = cpThread.scrollHeight;
  }
  function cpHideTyping() { var t = document.getElementById('rh-cp-typing'); if (t) t.remove(); }

  function cpRenderThread() {
    var msgs = cpGetThread().messages;
    Array.from(cpThread.children).forEach(function (el) {
      if (el.id !== 'rh-cp-welcome') el.remove();
    });
    if (!msgs.length) {
      if (cpWelcome) cpWelcome.style.display = '';
      return;
    }
    if (cpWelcome) cpWelcome.style.display = 'none';
    var lastDay = null;
    msgs.forEach(function (m) {
      var mDay = cpDayKey(m.ts || Date.now());
      if (mDay !== lastDay) { cpAppendSep(m.ts || Date.now()); lastDay = mDay; }
      cpAppendBubble(m.role, m.content);
    });
    cpThread.scrollTop = cpThread.scrollHeight;
  }

  /* ── Send ── */
  function cpSendMsg(text) {
    if (cpStreaming || !text.trim()) return;
    if (cpWelcome) cpWelcome.style.display = 'none';

    var now = Date.now();
    var s = cpGetThread();
    var prevLen = s.messages.length;
    s.messages.push({ role: 'user', content: text, ts: now });
    cpSaveThread(s);

    if (prevLen === 0 || cpDayKey((s.messages[prevLen - 1] || {}).ts || 0) !== cpDayKey(now)) {
      cpAppendSep(now);
    }
    cpAppendBubble('user', text);
    cpThread.scrollTop = cpThread.scrollHeight;

    cpShowTyping();
    if (cpSendBtn) cpSendBtn.disabled = true;
    cpStreaming = true;

    var msgHistory = s.messages.map(function (m) { return { role: m.role, content: m.content }; });
    var tankCtx = typeof window.__rhGetTankCtx === 'function' ? window.__rhGetTankCtx() : null;

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgHistory, tankContext: tankCtx }),
    })
    .then(function (res) {
      cpHideTyping();
      if (!res.ok || !res.body) throw new Error('status ' + res.status);

      var replyTs = Date.now();
      var p = cpAppendBubble('assistant', '');
      var responseText = '';
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';

      function feedSseLine(line) {
        if (!line.startsWith('data: ')) return;
        var d = line.slice(6).trim();
        if (d === '[DONE]') return;
        try {
          var parsed = JSON.parse(d);
          if (parsed.type === 'error') { responseText = responseText || '—'; return; }
          var delta = (parsed.delta && parsed.delta.text) ? parsed.delta.text : '';
          if (delta) {
            responseText += delta;
            p.innerHTML = cpMdToHTML(responseText);
            cpThread.scrollTop = cpThread.scrollHeight;
          }
        } catch (e2) {}
      }

      function read() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            buf += decoder.decode(chunk.value || new Uint8Array(0), { stream: false });
            buf.split('\n').forEach(feedSseLine);
            buf = '';
            if (!responseText) {
              responseText = 'Something went wrong — please try again in a moment.';
              p.innerHTML = cpMdToHTML(responseText);
            }
            var s2 = cpGetThread();
            s2.messages.push({ role: 'assistant', content: responseText, ts: replyTs });
            cpSaveThread(s2);
            if (cpSendBtn) cpSendBtn.disabled = false;
            cpStreaming = false;
            if (cpInp) cpInp.focus();
            return;
          }
          buf += decoder.decode(chunk.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop() || '';
          lines.forEach(feedSseLine);
          return read();
        });
      }
      return read();
    })
    .catch(function (err) {
      cpHideTyping();
      console.error('[Rhyssa companion] fetch failed', err && err.message);
      cpAppendBubble('assistant', 'Something went wrong — please try again in a moment.');
      if (cpSendBtn) cpSendBtn.disabled = false;
      cpStreaming = false;
    });
  }

  /* ── Form events ── */
  if (cpInp) {
    cpInp.addEventListener('input', function () {
      cpInp.style.height = 'auto';
      cpInp.style.height = Math.min(cpInp.scrollHeight, 120) + 'px';
    });
    if (!cpIsTouch) {
      cpInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); cpDoSubmit(); }
      });
    }
  }
  if (cpForm) cpForm.addEventListener('submit', function (e) { e.preventDefault(); cpDoSubmit(); });

  function cpDoSubmit() {
    var text = cpInp ? cpInp.value.trim() : '';
    if (!text) return;
    cpInp.value = ''; cpInp.style.height = 'auto';
    cpSendMsg(text);
  }

  /* ── Conversation starters ── */
  if (cpThread) {
    cpThread.addEventListener('click', function (e) {
      var chip = e.target.closest('.rh-starter-chip');
      if (!chip) return;
      var starter = chip.getAttribute('data-starter');
      if (starter) cpSendMsg(starter);
    });
  }

  /* ── New conversation ── */
  if (cpNewBtn) {
    cpNewBtn.addEventListener('click', function () {
      cpSaveThread({ messages: [] });
      cpRenderThread();
      if (cpInp) { cpInp.value = ''; cpInp.style.height = 'auto'; cpInp.focus(); }
    });
  }

  /* ── Back button ── */
  if (cpBackBtn) {
    cpBackBtn.addEventListener('click', function () {
      if (history.length > 1) { history.back(); }
      else if (typeof window.go === 'function') { window.go('home'); }
    });
  }

  /* ── Page activation hook ── */
  window.__rhCompanionInit = function () {
    cpRenderThread();
    setTimeout(function () { if (cpInp) cpInp.focus(); }, 80);
  };

  /* If companion page is already active on load, init now */
  if (document.getElementById('pg-companion') && document.getElementById('pg-companion').classList.contains('active')) {
    cpRenderThread();
  }
})();
