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
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    var paras = s.split(/\n{2,}/);
    if (paras.length > 1) {
      return paras.filter(function (p) { return p.trim(); }).map(function (p) {
        return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
      }).join('');
    }
    return '<p>' + s.replace(/\n/g, '<br>') + '</p>';
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
    cpThread.appendChild(wrap);
    return body;
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

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgHistory }),
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
