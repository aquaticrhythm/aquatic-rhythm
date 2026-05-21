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

  /* ── SETTINGS BUTTON — inject into nav if not present ── */
  (function(){
    var nav = document.querySelector('nav:not(.bnav)');
    if (!nav || nav.querySelector('.ar-settings-btn')) return;
    var btn = document.createElement('button');
    btn.className = 'ar-settings-btn';
    btn.id = 'ar-settings-btn';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.title = 'Menu';
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="2.2" stroke="currentColor" stroke-width="1.35"/><path d="M9 2v1.2M9 14.8V16M2 9h1.2M14.8 9H16M3.7 3.7l.85.85M13.45 13.45l.85.85M14.3 3.7l-.85.85M4.55 13.45l-.85.85" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg>';
    var bg = nav.querySelector('.nbg');
    if (bg) nav.insertBefore(btn, bg); else nav.appendChild(btn);
    btn.addEventListener('click', function(){
      var nmob = document.getElementById('nmob');
      if (!nmob) return;
      var open = nmob.classList.toggle('open');
      nmob.setAttribute('aria-hidden', String(!open));
      btn.setAttribute('aria-expanded', String(open));
      var bg2 = document.getElementById('burger');
      if (bg2) { bg2.classList.toggle('open', open); bg2.setAttribute('aria-expanded', String(open)); }
    });
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
