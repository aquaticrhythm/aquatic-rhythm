/* ar-page.js — shared nav + Rhyssa FAB logic for standalone article/tool pages */
(function () {

  /* ── NAV BURGER ── */
  var burger = document.getElementById('burger');
  var nmob   = document.getElementById('nmob');
  if (burger && nmob) {
    burger.addEventListener('click', function () {
      var o = burger.classList.toggle('open');
      nmob.classList.toggle('open', o);
      burger.setAttribute('aria-expanded', o);
      nmob.setAttribute('aria-hidden', !o);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) {
        burger.classList.remove('open');
        nmob.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        nmob.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ── SETTINGS BUTTON + SETTINGS PANEL ── */
  (function(){
    var GA_ID = 'G-8MDN065WNW';
    var GEAR_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>';

    /* Inject settings button into standard nav (articles / tank-builder) */
    var nav = document.querySelector('nav:not(.bnav)');
    if (nav && !nav.querySelector('.ar-settings-btn')) {
      var btn = document.createElement('button');
      btn.className = 'ar-settings-btn';
      btn.id = 'ar-settings-btn';
      btn.setAttribute('aria-label', 'Settings');
      btn.setAttribute('aria-expanded', 'false');
      btn.title = 'Settings';
      btn.innerHTML = GEAR_SVG;
      var bg = nav.querySelector('.nbg');
      if (bg) nav.insertBefore(btn, bg); else nav.appendChild(btn);
    }

    /* Inject settings panel + backdrop (once) */
    if (!document.getElementById('ar-settings-panel')) {
      var bd = document.createElement('div');
      bd.className = 'ar-settings-backdrop';
      bd.id = 'ar-settings-backdrop';
      bd.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bd);

      var panel = document.createElement('aside');
      panel.className = 'ar-settings-panel';
      panel.id = 'ar-settings-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', 'Settings');
      panel.setAttribute('aria-hidden', 'true');
      panel.innerHTML =
        '<div class="ar-stg-head">' +
          '<div class="ar-stg-head-left">' +
            '<svg class="ar-stg-head-icon" width="15" height="15" viewBox="0 0 17 17" fill="none" aria-hidden="true">' +
              '<path d="M6.8 2.2h3.4l.48 1.6a5 5 0 011.3.76l1.65-.5 1.7 2.94-1.18 1.14c.04.3.07.6.07.86s-.03.57-.07.86l1.18 1.14-1.7 2.94-1.65-.5a5 5 0 01-1.3.76L10.2 14.8H6.8l-.48-1.6a5 5 0 01-1.3-.76l-1.65.5-1.7-2.94 1.18-1.14A5 5 0 012.78 8.5c0-.26.03-.56.07-.86L1.67 6.5l1.7-2.94 1.65.5a5 5 0 011.3-.76L6.8 2.2z" stroke="currentColor" stroke-width="1.15" stroke-linejoin="round" fill="none"/>' +
              '<circle cx="8.5" cy="8.5" r="2.1" stroke="currentColor" stroke-width="1.15" fill="none"/>' +
            '</svg>' +
            '<span class="ar-stg-title">Settings</span>' +
          '</div>' +
          '<button class="ar-stg-close" id="ar-stg-close" aria-label="Close settings">✕</button>' +
        '</div>' +
        '<div class="ar-stg-body">' +
          '<div class="ar-stg-section">' +
            '<span class="ar-stg-label">Ecosystem</span>' +
            '<div class="ar-stg-row"><div class="ar-stg-row-info"><span class="ar-stg-row-label">Fauna</span><span class="ar-stg-row-sub">Fish &amp; animals</span></div><input class="ar-stg-toggle" type="checkbox" id="ar-stg-fauna" role="switch" aria-label="Show fauna"></div>' +
            '<div class="ar-stg-row"><div class="ar-stg-row-info"><span class="ar-stg-row-label">Flora</span><span class="ar-stg-row-sub">Plants &amp; driftwood</span></div><input class="ar-stg-toggle" type="checkbox" id="ar-stg-flora" role="switch" aria-label="Show flora"></div>' +
            '<div class="ar-stg-row"><div class="ar-stg-row-info"><span class="ar-stg-row-label">Reduce Motion</span><span class="ar-stg-row-sub">Pauses background animations</span></div><input class="ar-stg-toggle" type="checkbox" id="ar-stg-motion" role="switch" aria-label="Reduce motion"></div>' +
          '</div>' +
          '<div class="ar-stg-divider"></div>' +
          '<div class="ar-stg-section">' +
            '<span class="ar-stg-label">Units</span>' +
            '<div class="ar-stg-row"><div class="ar-stg-row-info"><span class="ar-stg-row-label">Temperature</span></div><div class="ar-stg-seg" role="group" aria-label="Temperature unit"><button class="ar-stg-seg-btn" data-unit-temp="C">°C</button><button class="ar-stg-seg-btn" data-unit-temp="F">°F</button></div></div>' +
            '<div class="ar-stg-row"><div class="ar-stg-row-info"><span class="ar-stg-row-label">Volume</span></div><div class="ar-stg-seg" role="group" aria-label="Volume unit"><button class="ar-stg-seg-btn" data-unit-vol="L">Litres</button><button class="ar-stg-seg-btn" data-unit-vol="gal">US Gal</button></div></div>' +
          '</div>' +
          '<div class="ar-stg-divider"></div>' +
          '<div class="ar-stg-section">' +
            '<span class="ar-stg-label">Keeper\'s Log</span>' +
            '<div class="ar-stg-row"><div class="ar-stg-row-info"><span class="ar-stg-row-label">Entry Order</span><span class="ar-stg-row-sub">Newest or oldest first</span></div><div class="ar-stg-seg" role="group" aria-label="Entry sort order"><button class="ar-stg-seg-btn" data-sort="desc">Newest</button><button class="ar-stg-seg-btn" data-sort="asc">Oldest</button></div></div>' +
            '<div class="ar-stg-row"><div class="ar-stg-row-info"><span class="ar-stg-row-label">Water Change Alert</span><span class="ar-stg-row-sub">Warn after this many days</span></div><input class="ar-stg-num-input" type="number" id="ar-stg-wc-days" min="3" max="60" value="14" aria-label="Days before water change alert"></div>' +
          '</div>' +
          '<div class="ar-stg-divider"></div>' +
          '<div class="ar-stg-section">' +
            '<span class="ar-stg-label">Privacy</span>' +
            '<div class="ar-stg-row"><div class="ar-stg-row-info"><span class="ar-stg-row-label">Usage Analytics</span><span class="ar-stg-row-sub">Helps improve the app</span></div><input class="ar-stg-toggle" type="checkbox" id="ar-stg-analytics" role="switch" aria-label="Enable usage analytics"></div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(panel);
    }

    /* References */
    var panel    = document.getElementById('ar-settings-panel');
    var backdrop = document.getElementById('ar-settings-backdrop');
    var closeBtn = document.getElementById('ar-stg-close');
    var stgFauna     = document.getElementById('ar-stg-fauna');
    var stgFlora     = document.getElementById('ar-stg-flora');
    var stgMotion    = document.getElementById('ar-stg-motion');
    var stgAnalytics = document.getElementById('ar-stg-analytics');
    var stgWcDays    = document.getElementById('ar-stg-wc-days');

    function syncToggles() {
      if (stgFauna)     stgFauna.checked     = localStorage.getItem('ar_fauna')         !== '0';
      if (stgFlora)     stgFlora.checked     = localStorage.getItem('ar_flora')         !== '0';
      if (stgMotion)    stgMotion.checked    = localStorage.getItem('ar_reduce_motion') === '1';
      if (stgAnalytics) stgAnalytics.checked = localStorage.getItem('ar_analytics_opt') !== '1';
      if (stgWcDays)    stgWcDays.value      = localStorage.getItem('ar_wc_threshold')  || '14';
      var tempUnit = localStorage.getItem('ar_unit_temp') || 'C';
      panel.querySelectorAll('[data-unit-temp]').forEach(function(b) { b.classList.toggle('active', b.dataset.unitTemp === tempUnit); });
      var volUnit = localStorage.getItem('ar_unit_vol') || 'L';
      panel.querySelectorAll('[data-unit-vol]').forEach(function(b) { b.classList.toggle('active', b.dataset.unitVol === volUnit); });
      var sort = localStorage.getItem('ar_jn_sort') || 'desc';
      panel.querySelectorAll('[data-sort]').forEach(function(b) { b.classList.toggle('active', b.dataset.sort === sort); });
    }

    function openSettings() {
      panel.classList.add('open');
      panel.removeAttribute('aria-hidden');
      if (backdrop) { backdrop.classList.add('open'); backdrop.removeAttribute('aria-hidden'); }
      document.body.style.overflow = 'hidden';
      syncToggles();
    }
    function closeSettings() {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      if (backdrop) { backdrop.classList.remove('open'); backdrop.setAttribute('aria-hidden', 'true'); }
      document.body.style.overflow = '';
    }

    /* Wire all settings trigger buttons */
    ['ar-settings-btn', 'tb-settings-btn'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', openSettings);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeSettings);
    if (backdrop) backdrop.addEventListener('click', closeSettings);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeSettings();
    });

    /* Fauna */
    if (stgFauna) stgFauna.addEventListener('change', function() { localStorage.setItem('ar_fauna', stgFauna.checked ? '1' : '0'); });

    /* Flora */
    if (stgFlora) stgFlora.addEventListener('change', function() { localStorage.setItem('ar_flora', stgFlora.checked ? '1' : '0'); });

    /* Reduce Motion */
    function applyReduceMotion(on) {
      document.body.classList.toggle('ar-reduce-motion', on);
      localStorage.setItem('ar_reduce_motion', on ? '1' : '0');
    }
    if (stgMotion) stgMotion.addEventListener('change', function() { applyReduceMotion(stgMotion.checked); });
    if (localStorage.getItem('ar_reduce_motion') === '1') applyReduceMotion(true);

    /* Unit segments */
    panel.querySelectorAll('[data-unit-temp]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        localStorage.setItem('ar_unit_temp', btn.dataset.unitTemp);
        panel.querySelectorAll('[data-unit-temp]').forEach(function(b) { b.classList.toggle('active', b === btn); });
      });
    });
    panel.querySelectorAll('[data-unit-vol]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        localStorage.setItem('ar_unit_vol', btn.dataset.unitVol);
        panel.querySelectorAll('[data-unit-vol]').forEach(function(b) { b.classList.toggle('active', b === btn); });
      });
    });

    /* Sort segments */
    panel.querySelectorAll('[data-sort]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        localStorage.setItem('ar_jn_sort', btn.dataset.sort);
        panel.querySelectorAll('[data-sort]').forEach(function(b) { b.classList.toggle('active', b === btn); });
      });
    });

    /* Water change threshold */
    if (stgWcDays) {
      stgWcDays.addEventListener('change', function() {
        var v = parseInt(stgWcDays.value, 10);
        if (v >= 3 && v <= 60) { localStorage.setItem('ar_wc_threshold', String(v)); }
        else { stgWcDays.value = localStorage.getItem('ar_wc_threshold') || '14'; }
      });
    }

    /* Analytics */
    function applyAnalyticsOpt(enabled) {
      localStorage.setItem('ar_analytics_opt', enabled ? '0' : '1');
      window['ga-disable-' + GA_ID] = !enabled;
    }
    if (stgAnalytics) stgAnalytics.addEventListener('change', function() { applyAnalyticsOpt(stgAnalytics.checked); });
    if (localStorage.getItem('ar_analytics_opt') === '1') { window['ga-disable-' + GA_ID] = true; }

    /* Expose for lab inline scripts */
    window.__arOpenSettings  = openSettings;
    window.__arCloseSettings = closeSettings;
  })();

  /* ── RHYSSA FAB + SHEET ── */
  var W   = 'https://api.aquaticrhythm.com/chat';
  var KEY = 'rh_thread';
  var busy = false;
  var touch = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  var fab = document.getElementById('rh-fab');
  var bd  = document.getElementById('rh-backdrop');
  var sh  = document.getElementById('rh-sheet');
  var thr = document.getElementById('rh-sheet-thread');
  var frm = document.getElementById('rh-sheet-form');
  var inp = document.getElementById('rh-sheet-inp');
  var snd = document.getElementById('rh-sheet-send');
  var cls = document.getElementById('rh-sheet-cls');
  var clr = document.getElementById('rh-sheet-clear');
  var wel = document.getElementById('rh-sheet-welcome');
  var chips = document.getElementById('rh-suggest-chips');

  if (!fab || !sh) return;

  function getStore() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') || { messages: [] }; }
    catch (e) { return { messages: [] }; }
  }
  function setStore(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  function dayKey(ts) { return new Date(ts).toDateString(); }

  function formatDate(ts) {
    var d = new Date(ts), n = new Date();
    if (d.toDateString() === n.toDateString()) return 'Today';
    var y = new Date(n); y.setDate(n.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    var o = { day: 'numeric', month: 'long' };
    if (d.getFullYear() !== n.getFullYear()) o.year = 'numeric';
    return d.toLocaleDateString(undefined, o);
  }

  function addSep(ts) {
    var s = document.createElement('div');
    s.className = 'rh-date-sep';
    s.innerHTML = '<span>' + formatDate(ts) + '</span>';
    thr.appendChild(s);
  }

  function mdToHtml(r) {
    var s = r.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    var ps = s.split(/\n{2,}/);
    if (ps.length > 1) {
      return ps.filter(function (x) { return x.trim(); })
               .map(function (x) { return '<p>' + x.replace(/\n/g, '<br>') + '</p>'; })
               .join('');
    }
    return '<p>' + s.replace(/\n/g, '<br>') + '</p>';
  }

  function addBubble(role, text) {
    var w = document.createElement('div');
    w.className = 'rh-bubble ' + (role === 'assistant' ? 'rh-bubble-rh' : 'rh-bubble-you');
    var who = document.createElement('span');
    who.className = 'rh-bubble-who';
    who.textContent = role === 'assistant' ? 'Rhyssa' : 'You';
    var body = document.createElement('div');
    body.className = 'rh-bubble-body';
    if (text) {
      body.innerHTML = role === 'assistant'
        ? mdToHtml(text)
        : '<p>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>';
    }
    w.appendChild(who);
    w.appendChild(body);
    thr.appendChild(w);
    return body;
  }

  function showTyping() {
    var d = document.createElement('div');
    d.className = 'rh-typing'; d.id = 'rh-ti';
    d.innerHTML = '<span></span><span></span><span></span>';
    thr.appendChild(d);
    thr.scrollTop = thr.scrollHeight;
  }
  function hideTyping() { var t = document.getElementById('rh-ti'); if (t) t.remove(); }

  function getTankContext() {
    try {
      var d = JSON.parse(localStorage.getItem('ar_journal') || '{}');
      var ts = d.tanks || [];
      if (!ts.length) return null;
      var a = ts.find(function (t) { return t.id === d.activeTankId; }) || ts[0];
      if (!a || !a.profile) return null;
      var p = a.profile;
      return { volume: p.volume || null, unit: p.unit || 'L', type: p.type || null, maturity: p.maturity || null };
    } catch (e) { return null; }
  }

  function render() {
    var msgs = getStore().messages;
    Array.from(thr.children).forEach(function (el) { if (el.id !== 'rh-sheet-welcome') el.remove(); });
    if (!msgs.length) {
      if (wel) wel.style.display = '';
      if (chips) chips.style.display = '';
      return;
    }
    if (wel) wel.style.display = 'none';
    var ld = null;
    msgs.forEach(function (m) {
      var md = dayKey(m.ts || Date.now());
      if (md !== ld) { addSep(m.ts || Date.now()); ld = md; }
      addBubble(m.role, m.content);
    });
    thr.scrollTop = thr.scrollHeight;
  }

  function fitViewport() {
    if (!window.visualViewport || window.innerWidth >= 721) return;
    sh.style.top    = '0px';
    sh.style.bottom = 'auto';
    sh.style.height = Math.round(window.visualViewport.height) + 'px';
    thr.scrollTop   = thr.scrollHeight;
  }

  function openSheet() {
    sh.classList.add('open');
    sh.removeAttribute('aria-hidden');
    bd.classList.add('open');
    fab.setAttribute('aria-expanded', 'true');
    fab.classList.add('active');
    document.body.style.overflow = 'hidden';
    fitViewport();
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fitViewport);
    render();
    setTimeout(function () { if (inp) inp.focus(); }, 80);
  }

  function closeSheet() {
    sh.classList.remove('open');
    sh.setAttribute('aria-hidden', 'true');
    bd.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    fab.classList.remove('active');
    document.body.style.overflow = '';
    if (window.innerWidth < 721) { sh.style.top = ''; sh.style.bottom = ''; sh.style.height = ''; }
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', fitViewport);
    fab.focus();
  }

  /* expose for rhyssa-fab-ext.js back-button intercept */
  window.__rhCloseSheet = closeSheet;

  fab.addEventListener('click', function () {
    sh.classList.contains('open') ? closeSheet() : openSheet();
  });
  if (bd) bd.addEventListener('click', closeSheet);
  if (cls) cls.addEventListener('click', closeSheet);
  if (clr) clr.addEventListener('click', function () {
    setStore({ messages: [] });
    render();
    if (inp) { inp.value = ''; inp.style.height = 'auto'; inp.focus(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sh.classList.contains('open')) closeSheet();
  });

  /* suggest chips */
  if (chips) {
    chips.addEventListener('click', function (e) {
      var chip = e.target.closest('.rh-suggest-chip');
      if (!chip) return;
      var msg = chip.dataset.msg || chip.textContent.trim();
      openSheet();
      setTimeout(function () { if (!busy) sendMessage(msg); }, 120);
    });
  }

  if (inp) {
    inp.addEventListener('input', function () {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
    });
    if (!touch) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitForm(); }
      });
    }
  }
  if (frm) frm.addEventListener('submit', function (e) { e.preventDefault(); submitForm(); });

  function submitForm() {
    var t = inp ? inp.value.trim() : '';
    if (!t) return;
    inp.value = '';
    inp.style.height = 'auto';
    sendMessage(t);
  }

  function sendMessage(text) {
    if (busy || !text.trim()) return;
    if (wel) wel.style.display = 'none';
    var now = Date.now(), store = getStore(), prevLen = store.messages.length;
    store.messages.push({ role: 'user', content: text, ts: now });
    setStore(store);
    if (prevLen === 0 || dayKey((store.messages[prevLen - 1] || {}).ts || 0) !== dayKey(now)) addSep(now);
    addBubble('user', text);
    thr.scrollTop = thr.scrollHeight;
    showTyping();
    if (snd) snd.disabled = true;
    busy = true;
    var history = store.messages.map(function (m) { return { role: m.role, content: m.content }; });
    fetch(W, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, tankContext: getTankContext() })
    }).then(function (res) {
      hideTyping();
      if (!res.ok || !res.body) throw new Error('bad');
      var replyTs = Date.now(), bodyEl = addBubble('assistant', ''), acc = '';
      var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            buf += dec.decode(chunk.value || new Uint8Array(0), { stream: false });
            buf.split('\n').forEach(parseLine);
            buf = '';
            var s2 = getStore();
            s2.messages.push({ role: 'assistant', content: acc, ts: replyTs });
            setStore(s2);
            if (snd) snd.disabled = false;
            busy = false;
            if (inp) inp.focus();
            return;
          }
          buf += dec.decode(chunk.value, { stream: true });
          var lines = buf.split('\n'); buf = lines.pop() || '';
          lines.forEach(parseLine);
          return pump();
        });
      }
      function parseLine(l) {
        if (!l.startsWith('data: ')) return;
        var d = l.slice(6).trim();
        if (d === '[DONE]') return;
        try {
          var pr = JSON.parse(d);
          var delta = (pr.delta && pr.delta.text) ? pr.delta.text : '';
          if (delta) { acc += delta; bodyEl.innerHTML = mdToHtml(acc); thr.scrollTop = thr.scrollHeight; }
        } catch (e) {}
      }
      return pump();
    }).catch(function () {
      hideTyping();
      addBubble('assistant', 'Something went wrong — please try again in a moment.');
      if (snd) snd.disabled = false;
      busy = false;
    });
  }

})();
