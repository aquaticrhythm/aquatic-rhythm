/* ============================================================
   ui-rhyssa-sheet.js
   Extracted from js/ui.js (PR #233) — behaviour unchanged.
   Rhyssa floating chat (bottom sheet) — Anthropic worker proxy.
   ============================================================ */

/* ── RHYSSA BOTTOM SHEET ── */
(function () {
  var WORKER_URL = 'https://api.aquaticrhythm.com/chat';
  var STORE_KEY  = 'rh_thread';
  var isStreaming = false;
  var isTouch     = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  var fab      = document.getElementById('rh-fab');
  var backdrop = document.getElementById('rh-backdrop');
  var sheet    = document.getElementById('rh-sheet');
  var thread   = document.getElementById('rh-sheet-thread');
  var form     = document.getElementById('rh-sheet-form');
  var inp      = document.getElementById('rh-sheet-inp');
  var sendBtn  = document.getElementById('rh-sheet-send');
  var clsBtn   = document.getElementById('rh-sheet-cls');
  var clearBtn = document.getElementById('rh-sheet-clear');
  var welcome  = document.getElementById('rh-sheet-welcome');

  if (!fab || !sheet) return;

  /* ── Storage ── */
  function getThread() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || { messages: [] }; }
    catch (e) { return { messages: [] }; }
  }
  function saveThread(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  /* ── Date helpers ── */
  function dayKey(ts) { return new Date(ts).toDateString(); }
  function fmtDay(ts) {
    var d = new Date(ts), now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    var yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    var opts = { day: 'numeric', month: 'long' };
    if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString(undefined, opts);
  }

  /* ── Markdown → HTML (safe) ── */
  function mdToHTML(raw) {
    var s = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    /* Bold first: non-greedy so pairs match in order; allow * inside bold text */
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

  /* ── Render full thread from storage ── */
  function renderSuggestions() {
    var chips = document.getElementById('rh-suggest-chips');
    if (!chips) return;
    var msgs = getThread().messages;
    chips.style.display = msgs.length ? 'none' : '';
  }

  function renderThread() {
    var msgs = getThread().messages;
    Array.from(thread.children).forEach(function (el) {
      if (el.id !== 'rh-sheet-welcome') el.remove();
    });
    if (!msgs.length) {
      if (welcome) welcome.style.display = '';
      renderSuggestions();
      return;
    }
    if (welcome) welcome.style.display = 'none';
    var lastDay = null;
    msgs.forEach(function (m) {
      var mDay = dayKey(m.ts || Date.now());
      if (mDay !== lastDay) { appendSep(m.ts || Date.now()); lastDay = mDay; }
      appendBubble(m.role, m.content);
    });
    thread.scrollTop = thread.scrollHeight;
    renderSuggestions();
  }

  /* ── Suggestion chips click handler ── */
  var suggestChipsEl = document.getElementById('rh-suggest-chips');
  if (suggestChipsEl) {
    suggestChipsEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.rh-suggest-chip');
      if (!chip) return;
      var msg = chip.dataset.msg;
      if (!msg) return;
      var chips = document.getElementById('rh-suggest-chips');
      if (chips) chips.style.display = 'none';
      if (inp) {
        inp.value = msg;
        inp.style.height = 'auto';
        inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
      }
      if (typeof sendMsg === 'function') {
        sendMsg(msg);
        if (inp) { inp.value = ''; inp.style.height = 'auto'; }
      }
    });
  }

  function appendSep(ts) {
    var sep = document.createElement('div');
    sep.className = 'rh-date-sep';
    sep.innerHTML = '<span>' + fmtDay(ts) + '</span>';
    thread.appendChild(sep);
  }

  function appendBubble(role, text) {
    var wrap = document.createElement('div');
    wrap.className = 'rh-bubble ' + (role === 'assistant' ? 'rh-bubble-rh' : 'rh-bubble-you');
    var who = document.createElement('span');
    who.className = 'rh-bubble-who';
    who.textContent = role === 'assistant' ? 'Rhyssa' : 'You';
    var body = document.createElement('div');
    body.className = 'rh-bubble-body';
    if (text) {
      body.innerHTML = role === 'assistant'
        ? mdToHTML(text)
        : '<p>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>';
    }
    wrap.appendChild(who);
    wrap.appendChild(body);
    thread.appendChild(wrap);
    return body;
  }

  function showTyping() {
    var d = document.createElement('div');
    d.className = 'rh-typing'; d.id = 'rh-typing-ind';
    d.innerHTML = '<span></span><span></span><span></span>';
    thread.appendChild(d);
    thread.scrollTop = thread.scrollHeight;
  }
  function hideTyping() { var t = document.getElementById('rh-typing-ind'); if (t) t.remove(); }

  function getTankContext() {
    try {
      var data = JSON.parse(localStorage.getItem('ar_journal') || '{}');
      var tanks = data.tanks || [];
      if (!tanks.length) return null;
      var active = tanks.find(function (t) { return t.id === data.activeTankId; }) || tanks[0];
      if (!active || !active.profile) return null;
      var p = active.profile;
      var ageWeeks = null;
      if (p.setupDate) ageWeeks = Math.floor((new Date() - new Date(p.setupDate)) / (86400000 * 7));
      var entries = active.entries || [];
      var latest = entries.length ? entries[entries.length - 1] : null;

      /* Phase/label lookups — replicated inline; journal IIFE vars are not in scope here */
      var _phaseLabels  = { establish: 'Establishing', stabilise: 'Stabilising', optimise: 'Optimising', sustain: 'Sustaining' };
      var _stateLabels  = { 'consistent': 'Consistent', 'catching-up': 'Catching up', 'occasional': 'Occasional', 'just-starting': 'Just starting' };
      var _careLabels   = { 'water_change': 'Water change', 'filter': 'Filter', 'feeding': 'Feeding', 'top_up': 'Topping up', 'treatment': 'Treatment', 'dosing': 'Dosing', 'media': 'Media change', 'trimming': 'Trimming', 'nothing': 'Just observed' };

      function _phaseFromParams(params) {
        if (!params) return null;
        var nh3 = parseFloat(params.nh3), no2 = parseFloat(params.no2), no3 = parseFloat(params.no3);
        if (isNaN(nh3) && isNaN(no2)) return null;
        nh3 = isNaN(nh3) ? 0 : nh3; no2 = isNaN(no2) ? 0 : no2; no3 = isNaN(no3) ? 999 : no3;
        if (nh3 > 0.5 || no2 > 0.25) return 'establish';
        if (nh3 > 0 || no2 > 0 || no3 > 20) return 'stabilise';
        if (no3 > 10) return 'optimise';
        return 'sustain';
      }
      function _phaseFromState(keeperState, setupDate) {
        var aw = setupDate ? (new Date() - new Date(setupDate)) / (86400000 * 7) : 999;
        if (keeperState === 'just-starting' || aw < 4) return 'establish';
        if (keeperState === 'catching-up') return 'stabilise';
        if (keeperState === 'consistent' && aw > 8) return 'sustain';
        return 'optimise';
      }

      var _ctxActiveInhs = (active.inhabitants || []).filter(function (i) { return i.status === 'active'; }).length;
      var _ctxHasParam   = entries.some(function (e) { return e.params && (e.params.nh3 || e.params.no2 || e.params.no3); });
      var _ctxSufficient = _ctxHasParam || (entries.length >= 3 && (!!p.setupDate || _ctxActiveInhs > 0));
      var phaseKey = (_ctxSufficient && latest) ? (_phaseFromParams(latest.params) || _phaseFromState(latest.keeperState, p.setupDate)) : null;
      var phase    = phaseKey ? (_phaseLabels[phaseKey] || phaseKey) : null;

      var residents = (active.inhabitants || [])
        .filter(function (i) { return i.status === 'active'; })
        .map(function (i) { return (i.count > 1 ? i.count + '× ' : '') + (i.commonName || i.species || 'Unknown'); });
      var recentEntries = entries.slice(-3).map(function (e) {
        return {
          date: e.date || '',
          state: _stateLabels[e.keeperState] || e.keeperState || '',
          care: (e.care || []).map(function (c) { return _careLabels[c] || c; }),
          obs: (e.observation || '').slice(0, 200),
          params: e.params || null
        };
      });
      var equipment = null;
      var stockedSpecies = null;
      var plantList = null;
      var hardscapeList = null;
      if (active.setup) {
        var _setup = active.setup;
        if (_setup.equipment && Object.keys(_setup.equipment).length) {
          equipment = Object.keys(_setup.equipment).map(function (k) {
            var brand = (_setup.brands || {})[k] || '';
            return k.replace(/-/g, ' ') + (brand ? ' — ' + brand : '');
          });
        }
        if (_setup.stock && _setup.stock.length) {
          stockedSpecies = _setup.stock.map(function (s) {
            return (s.qty > 1 ? s.qty + '× ' : '') + s.name;
          });
        }
        if (_setup.plants && _setup.plants.length) {
          plantList = _setup.plants.map(function (p) { return p.name || p.id; });
        }
        if (_setup.hardscape && _setup.hardscape.length) {
          hardscapeList = _setup.hardscape.map(function (h) { return h.name || h.id; });
        }
      }
      if (!residents.length && stockedSpecies) residents = stockedSpecies;
      return {
        volume: p.volume || null,
        unit: p.unit || 'L',
        type: p.type || null,
        ageWeeks: ageWeeks,
        phase: phase,
        residents: residents.length ? residents : null,
        equipment: equipment,
        plants: plantList,
        hardscape: hardscapeList,
        recentEntries: recentEntries.length ? recentEntries : null
      };
    } catch (e) { return null; }
  }

  /* ── Visual Viewport fit (Android Chrome address bar fix, mobile only) ── */
  /* ── Visual Viewport fit — keeps sheet inside visible area on mobile ──
     top:0 is correct — Chrome's layout viewport already starts below the
     URL bar (innerHeight excludes it). We only need to fix height so the
     sheet shrinks above the keyboard. bottom:auto releases the CSS
     inset:0 bottom:0 constraint so the explicit height can take effect. */
  function fitSheet() {
    if (!window.visualViewport || window.innerWidth >= 721) return;
    sheet.style.top    = '0px';
    sheet.style.bottom = 'auto';
    sheet.style.height = Math.round(window.visualViewport.height) + 'px';
    thread.scrollTop = thread.scrollHeight;
  }

  /* ── Open / close ── */
  function openSheet() {
    sheet.classList.add('open');
    sheet.removeAttribute('aria-hidden');
    backdrop.classList.add('open');
    fab.setAttribute('aria-expanded', 'true');
    fab.classList.add('active');
    document.body.style.overflow = 'hidden';
    fitSheet();
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitSheet);
    }
    renderThread();
    setTimeout(function () { if (inp) inp.focus(); }, 80);
  }
  function closeSheet() {
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    fab.classList.remove('active');
    document.body.style.overflow = '';
    if (window.innerWidth < 721) {
      sheet.style.top    = '';
      sheet.style.bottom = '';
      sheet.style.height = '';
    }
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', fitSheet);
    }
    fab.focus();
  }

  window.__rhOpenSheet  = openSheet;
  window.__rhCloseSheet = closeSheet;
  window.__rhOpenWith   = function (msg) {
    openSheet();
    setTimeout(function () {
      if (inp) {
        inp.value = msg;
        inp.style.height = 'auto';
        inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
        inp.focus();
      }
    }, 100);
  };

  fab.addEventListener('click', function () {
    sheet.classList.contains('open') ? closeSheet() : openSheet();
  });
  backdrop.addEventListener('click', closeSheet);
  if (clsBtn) clsBtn.addEventListener('click', closeSheet);
  if (clearBtn) clearBtn.addEventListener('click', function () {
    saveThread({ messages: [] });
    renderThread();
    if (inp) { inp.value = ''; inp.style.height = 'auto'; inp.focus(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet();
  });


  /* Input auto-grow */
  if (inp) {
    inp.addEventListener('input', function () {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
    });
    if (!isTouch) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSubmit(); }
      });
    }
  }

  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); doSubmit(); });

  function doSubmit() {
    var text = inp ? inp.value.trim() : '';
    if (!text) return;
    inp.value = ''; inp.style.height = 'auto';
    sendMsg(text);
  }


  /* data-rh-open on any element anywhere opens the sheet (skip native links inside) */
  document.addEventListener('click', function (e) {
    if (e.target.closest('a[href]')) return;
    if (e.target.closest('[data-rh-open]')) { e.preventDefault(); openSheet(); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-rh-open]') && !e.target.closest('a[href]')) {
      e.preventDefault(); openSheet();
    }
  });


  var _lastUserObs = ''; // stores observation text to offer logging after Rhyssa responds

  function isObservationLike(text) {
    if (!text || text.length < 20) return false;
    var t = text.toLowerCase().trim();
    if (/^(what|how|why|when|where|who|is |are |can |should |does |do |did |will |would |which )/.test(t)) return false;
    var words = ['notic','saw ','look','seem','appear','eating','not eat','swim','hiding','hide','sick','dead','died','fin ','tail','colou','color','water','cloud','clear','dirt','smell','foam','bubble','algae','spot ','letharg','activ','aggress','behav','filter','heater','light','feeding','today','yesterday','morning','night','hour','week','since','start','usual','strange','weird','different','open','close','surfac','bottom','float'];
    return words.some(function (w) { return t.indexOf(w) !== -1; });
  }

  function showLogOffer(obsText, bubbleWrap) {
    var clean = obsText.trim().replace(/\n+/g, ' ').slice(0, 180);
    var offer = document.createElement('div');
    offer.style.cssText = 'display:flex;align-items:flex-start;gap:.5rem;margin-top:.55rem;padding:.5rem .65rem;background:rgba(61,214,232,.04);border:1px solid rgba(61,214,232,.13);border-radius:8px';

    var icon = document.createElement('span');
    icon.textContent = '📋';
    icon.style.cssText = 'font-size:.75rem;flex-shrink:0;margin-top:.05rem';
    offer.appendChild(icon);

    var mid = document.createElement('div');
    mid.style.cssText = 'flex:1;min-width:0';
    var lbl = document.createElement('p');
    lbl.style.cssText = 'margin:0 0 .35rem;font-size:.62rem;color:rgba(255,255,255,.38);font-family:var(--sans)';
    lbl.textContent = 'Save this to today\'s log?';
    var preview = document.createElement('p');
    preview.style.cssText = 'margin:0;font-size:.65rem;color:rgba(235,240,236,.55);font-family:var(--serif);font-style:italic;line-height:1.5';
    preview.textContent = '"' + clean + '"';
    mid.appendChild(lbl);
    mid.appendChild(preview);
    offer.appendChild(mid);

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;flex-direction:column;gap:.25rem;flex-shrink:0';

    var saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = 'font-size:.58rem;padding:.22rem .6rem;background:rgba(61,214,232,.12);border:1px solid rgba(61,214,232,.3);border-radius:12px;color:rgba(61,214,232,.85);cursor:pointer;font-family:inherit;white-space:nowrap';
    var dimBtn = document.createElement('button');
    dimBtn.textContent = 'Dismiss';
    dimBtn.style.cssText = 'font-size:.56rem;padding:.18rem .5rem;background:none;border:none;color:rgba(255,255,255,.22);cursor:pointer;font-family:inherit';

    btns.appendChild(saveBtn);
    btns.appendChild(dimBtn);
    offer.appendChild(btns);
    bubbleWrap && bubbleWrap.appendChild(offer);

    saveBtn.addEventListener('click', function () {
      offer.remove();
      if (typeof window.__jnAutoSaveEntry === 'function' && window.__jnAutoSaveEntry(clean)) {
        var conf = document.createElement('p');
        conf.style.cssText = 'margin:.4rem 0 0;font-size:.6rem;color:rgba(61,214,232,.55);font-family:var(--sans)';
        conf.textContent = 'Logged ✓';
        bubbleWrap && bubbleWrap.appendChild(conf);
        sendAutoReply('The keeper just saved an observation to their tank log: "' + clean.slice(0, 120) + '". Acknowledge in one warm sentence and share one brief actionable tip related to what they observed.');
      }
    });
    dimBtn.addEventListener('click', function () { offer.remove(); });
  }

  function sendAutoReply(triggerContent) {
    if (isStreaming) return;
    var s = getThread();
    var msgHistory = s.messages.map(function (m) { return { role: m.role, content: m.content }; });
    msgHistory.push({ role: 'user', content: triggerContent });
    showTyping();
    sendBtn.disabled = true;
    isStreaming = true;
    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgHistory, tankContext: getTankContext() })
    }).then(function (res) {
      hideTyping();
      if (!res.ok || !res.body) { sendBtn.disabled = false; isStreaming = false; return; }
      var replyTs = Date.now();
      var bodyEl = appendBubble('assistant', '');
      var responseText = '';
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';
      function feedLine(line) {
        if (!line.startsWith('data: ')) return;
        var d = line.slice(6).trim();
        if (d === '[DONE]') return;
        try {
          var parsed = JSON.parse(d);
          var delta = (parsed.delta && parsed.delta.text) ? parsed.delta.text : '';
          if (delta) { responseText += delta; bodyEl.innerHTML = mdToHTML(responseText); thread.scrollTop = thread.scrollHeight; }
        } catch (e) {}
      }
      function readStream() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            buf += decoder.decode(chunk.value || new Uint8Array(0), { stream: false });
            buf.split('\n').forEach(feedLine);
            buf = '';
            if (!responseText) { responseText = '—'; bodyEl.innerHTML = mdToHTML(responseText); }
            var s2 = getThread();
            s2.messages.push({ role: 'assistant', content: responseText, ts: replyTs });
            saveThread(s2);
            sendBtn.disabled = false;
            isStreaming = false;
            if (inp) inp.focus();
            return;
          }
          buf += decoder.decode(chunk.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop() || '';
          lines.forEach(feedLine);
          return readStream();
        });
      }
      return readStream();
    }).catch(function () { hideTyping(); sendBtn.disabled = false; isStreaming = false; });
  }

  /* ── Send message ── */
  function sendMsg(text) {
    if (isStreaming || !text.trim()) return;
    if (welcome) welcome.style.display = 'none';
    _lastUserObs = isObservationLike(text) ? text : '';

    var now = Date.now();
    var s = getThread();
    var prevLen = s.messages.length;
    s.messages.push({ role: 'user', content: text, ts: now });
    saveThread(s);

    /* Date separator if day changed or first message */
    if (prevLen === 0 || dayKey((s.messages[prevLen - 1] || {}).ts || 0) !== dayKey(now)) {
      appendSep(now);
    }
    appendBubble('user', text);
    thread.scrollTop = thread.scrollHeight;

    showTyping();
    sendBtn.disabled = true;
    isStreaming = true;

    var msgHistory = s.messages.map(function (m) { return { role: m.role, content: m.content }; });

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgHistory, tankContext: getTankContext() }),
    })
    .then(function (res) {
      hideTyping();
      if (!res.ok || !res.body) {
        console.error('[Rhyssa] Worker error', res.status, res.statusText);
        throw new Error('status ' + res.status);
      }

      var replyTs = Date.now();
      var p = appendBubble('assistant', '');
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
          /* Anthropic may emit an error event inside the stream */
          if (parsed.type === 'error') {
            console.error('[Rhyssa] API stream error', parsed.error);
            responseText = responseText || '—';
            return;
          }
          var delta = (parsed.delta && parsed.delta.text) ? parsed.delta.text : '';
          if (delta) {
            responseText += delta;
            p.innerHTML = mdToHTML(responseText);
            thread.scrollTop = thread.scrollHeight;
          }
        } catch (e2) {}
      }

      function read() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            buf += decoder.decode(chunk.value || new Uint8Array(0), { stream: false });
            buf.split('\n').forEach(feedSseLine);
            buf = '';
            /* Guard: if the stream closed with no text at all, show a fallback */
            if (!responseText) {
              responseText = 'Something went wrong — please try again in a moment.';
              p.innerHTML = mdToHTML(responseText);
            }
            var s2 = getThread();
            s2.messages.push({ role: 'assistant', content: responseText, ts: replyTs });
            saveThread(s2);
            /* Offer to log the user's observation if the message looks like one */
            if (_lastUserObs && getTankContext()) {
              showLogOffer(_lastUserObs, p.parentNode);
              _lastUserObs = '';
            }
            sendBtn.disabled = false;
            isStreaming = false;
            if (inp) inp.focus();
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
      hideTyping();
      console.error('[Rhyssa] fetch failed', err && err.message);
      appendBubble('assistant', 'Something went wrong — please try again in a moment.');
      sendBtn.disabled = false;
      isStreaming = false;
    });
  }
})();
