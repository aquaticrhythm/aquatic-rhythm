/* ============================================================
   ui-rhyssa-sheet.js
   Extracted from js/ui.js (PR #233) — behaviour unchanged.
   Rhyssa floating chat (bottom sheet) — Anthropic worker proxy.
   ============================================================ */

/* ── RHYSSA BOTTOM SHEET ── */
(function () {
  var WORKER_URL = 'https://api.aquaticrhythm.com/chat';
  var STORE_KEY  = 'rh_thread';   /* legacy — migration source only */
  var CONVS_KEY  = 'rh_convs';
  var isStreaming = false;
  var isTouch     = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  var fab        = document.getElementById('rh-fab');
  var backdrop   = document.getElementById('rh-backdrop');
  var sheet      = document.getElementById('rh-sheet');
  var thread     = document.getElementById('rh-sheet-thread');
  var form       = document.getElementById('rh-sheet-form');
  var inp        = document.getElementById('rh-sheet-inp');
  var sendBtn    = document.getElementById('rh-sheet-send');
  var clsBtn     = document.getElementById('rh-sheet-cls');
  var welcome    = document.getElementById('rh-sheet-welcome');
  var tabsList   = document.getElementById('rh-tabs-list');
  var tabsNewBtn = document.getElementById('rh-tabs-new');
  var tabsEl     = document.getElementById('rh-tabs');

  if (!fab || !sheet) return;

  /* ── Tab strip inline styles (resilient to CSS cache) ── */
  if (tabsEl) tabsEl.style.cssText = 'display:flex;align-items:center;gap:.4rem;padding:.3rem .85rem .28rem;border-bottom:1px solid rgba(255,255,255,.07);overflow-x:auto;scrollbar-width:none;flex-shrink:0';
  if (tabsList) tabsList.style.cssText = 'display:flex;gap:.3rem;flex:1;min-width:0;overflow:hidden';
  if (tabsNewBtn) tabsNewBtn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;background:none;border:1px solid rgba(255,255,255,.13);border-radius:20px;color:rgba(255,255,255,.4);cursor:pointer;padding:.22rem .55rem;line-height:1;flex-shrink:0;-webkit-tap-highlight-color:transparent';

  /* ── Storage — multi-conversation ── */
  function genId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function getConvs() {
    try { return JSON.parse(localStorage.getItem(CONVS_KEY) || 'null') || null; }
    catch (e) { return null; }
  }

  function saveConvs(data) {
    try { localStorage.setItem(CONVS_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function initConvs() {
    var data = getConvs();
    if (data && data.list && data.list.length) return data;
    /* Migrate from legacy rh_thread on first load */
    var old = null;
    try { old = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) {}
    var id = genId();
    data = { activeId: id, list: [{ id: id, title: '', messages: (old && old.messages) ? old.messages : [] }] };
    saveConvs(data);
    return data;
  }

  function getThread() {
    var data = initConvs();
    for (var i = 0; i < data.list.length; i++) {
      if (data.list[i].id === data.activeId) return data.list[i];
    }
    return data.list[0] || { id: '', title: '', messages: [] };
  }

  function saveThread(s) {
    var data = initConvs();
    for (var i = 0; i < data.list.length; i++) {
      if (data.list[i].id === data.activeId) {
        data.list[i].messages = s.messages;
        saveConvs(data);
        return;
      }
    }
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
    /* Strip [opt] blocks — options are rendered as interactive buttons */
    var display = raw
      .replace(/\[opt\][\s\S]*?\[\/opt\]/g, '')
      .replace(/\s*\[opt\][\s\S]*$/, '')
      .trim();
    var s = display
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    /* Markdown links — relative URLs only for security */
    s = s.replace(/\[([^\]]+)\]\(\s*(\/[^)]*)\s*\)/g, '<a href="$2" style="color:rgba(61,214,232,.85);text-decoration:underline;text-underline-offset:2px">$1</a>');
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
    return result || '<p>' + display.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>';
  }

  /* ── Interactive option buttons ── */
  function extractOptions(raw) {
    var opts = [];
    var re = /\[opt\]([\s\S]*?)\[\/opt\]/g;
    var m;
    while ((m = re.exec(raw)) !== null) {
      var t = m[1].trim();
      if (t) opts.push(t);
    }
    return opts.slice(0, 4);
  }

  function addOptionButtons(wrap, options, onPick) {
    if (!options || !options.length) return;
    var group = document.createElement('div');
    group.className = 'rh-opt-group';
    group.style.cssText = 'display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.6rem;padding-top:.5rem;border-top:1px solid rgba(255,255,255,.06)';
    var btnBase = 'font-size:.65rem;padding:.32rem .75rem;background:rgba(61,214,232,.07);border:1px solid rgba(61,214,232,.22);border-radius:20px;color:rgba(235,240,236,.82);cursor:pointer;font-family:inherit;letter-spacing:.01em;text-align:left;line-height:1.4;-webkit-tap-highlight-color:transparent';
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'rh-opt-btn';
      btn.type = 'button';
      btn.style.cssText = btnBase;
      btn.textContent = opt;
      btn.addEventListener('click', function () {
        group.remove();
        onPick(opt);
      });
      group.appendChild(btn);
    });
    var writeBtn = document.createElement('button');
    writeBtn.className = 'rh-opt-btn rh-opt-write';
    writeBtn.type = 'button';
    writeBtn.style.cssText = 'font-size:.65rem;padding:.32rem .75rem;background:none;border:1px solid rgba(255,255,255,.1);border-radius:20px;color:rgba(255,255,255,.35);cursor:pointer;font-family:inherit;letter-spacing:.01em;text-align:left;line-height:1.4;font-style:italic;-webkit-tap-highlight-color:transparent';
    writeBtn.textContent = 'Write my own…';
    writeBtn.addEventListener('click', function () {
      group.remove();
      if (inp) inp.focus();
    });
    group.appendChild(writeBtn);
    wrap.appendChild(group);
  }

  /* ── Tab management ── */
  function renderTabs() {
    if (!tabsList) return;
    var data = initConvs();
    var isActive;
    tabsList.innerHTML = '';
    var styleInactive = 'display:inline-flex;align-items:center;gap:.28rem;padding:.22rem .65rem;border-radius:20px;border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.4);cursor:pointer;font-size:.6rem;font-family:var(--sans);white-space:nowrap;max-width:140px;flex-shrink:0;-webkit-tap-highlight-color:transparent;background:rgba(255,255,255,.05)';
    var styleActive = 'display:inline-flex;align-items:center;gap:.28rem;padding:.22rem .65rem;border-radius:20px;border:1px solid rgba(61,214,232,.28);color:rgba(61,214,232,.85);cursor:pointer;font-size:.6rem;font-family:var(--sans);white-space:nowrap;max-width:140px;flex-shrink:0;-webkit-tap-highlight-color:transparent;background:rgba(61,214,232,.1)';
    data.list.forEach(function (conv) {
      isActive = conv.id === data.activeId;
      var tab = document.createElement('button');
      tab.className = 'rh-tab' + (isActive ? ' rh-tab-active' : '');
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.style.cssText = isActive ? styleActive : styleInactive;
      var titleSpan = document.createElement('span');
      titleSpan.className = 'rh-tab-title';
      titleSpan.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90px;display:block';
      titleSpan.textContent = conv.title || 'New chat';
      tab.appendChild(titleSpan);
      if (data.list.length > 1) {
        var del = document.createElement('button');
        del.className = 'rh-tab-del';
        del.type = 'button';
        del.setAttribute('aria-label', 'Delete conversation');
        del.style.cssText = 'background:none;border:none;color:rgba(255,255,255,.28);cursor:pointer;font-size:.85rem;padding:0;line-height:1;flex-shrink:0;-webkit-tap-highlight-color:transparent';
        del.textContent = '×';
        ;(function (id) {
          del.addEventListener('click', function (e) {
            e.stopPropagation();
            deleteConv(id);
          });
        }(conv.id));
        tab.appendChild(del);
      }
      ;(function (id) {
        tab.addEventListener('click', function () {
          var cur = getConvs();
          if (cur && id !== cur.activeId) switchConv(id);
        });
      }(conv.id));
      tabsList.appendChild(tab);
    });
  }

  function switchConv(id) {
    var data = initConvs();
    data.activeId = id;
    saveConvs(data);
    renderTabs();
    renderThread();
  }

  function newConv() {
    var data = initConvs();
    var id = genId();
    data.list.push({ id: id, title: '', messages: [] });
    data.activeId = id;
    saveConvs(data);
    renderTabs();
    renderThread();
    if (inp) { inp.value = ''; inp.style.height = 'auto'; inp.focus(); }
  }

  function deleteConv(id) {
    var data = initConvs();
    var idx = -1;
    for (var i = 0; i < data.list.length; i++) {
      if (data.list[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return;
    data.list.splice(idx, 1);
    if (!data.list.length) {
      var newId = genId();
      data.list.push({ id: newId, title: '', messages: [] });
      data.activeId = newId;
    } else if (data.activeId === id) {
      data.activeId = data.list[Math.min(idx, data.list.length - 1)].id;
    }
    saveConvs(data);
    renderTabs();
    renderThread();
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

    if (role === 'assistant') {
      var copyBtn = document.createElement('button');
      copyBtn.className = 'rh-copy-btn' + (isTouch ? ' rh-copy-visible' : '');
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
          navigator.clipboard.writeText(msgText).then(markCopied).catch(function () { fallbackCopy(msgText); markCopied(); });
        } else {
          fallbackCopy(msgText); markCopied();
        }
      });
      wrap.appendChild(copyBtn);
    }

    thread.appendChild(wrap);
    return body;
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
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
  function fitSheet() {
    if (!window.visualViewport || window.innerWidth >= 721) return;
    sheet.style.top    = '0px';
    sheet.style.bottom = 'auto';
    sheet.style.height = Math.round(window.visualViewport.height) + 'px';
    thread.scrollTop = thread.scrollHeight;
  }

  /* ── Open / close ── */
  function updateCtxPill() {
    var titleGroup = document.querySelector('.rh-sheet-title-group');
    if (!titleGroup) return;
    var pill = titleGroup.querySelector('.rh-ctx-pill');
    var ctx = getTankContext();
    if (!ctx) { if (pill) pill.remove(); return; }
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'rh-ctx-pill';
      /* Inline styles ensure correct appearance even before CSS loads/caches */
      pill.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:.48rem;padding:2px 7px;border-radius:20px;background:rgba(61,214,232,.08);border:1px solid rgba(61,214,232,.2);color:rgba(61,214,232,.62);font-family:var(--sans);letter-spacing:.02em;margin-top:.2rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      titleGroup.appendChild(pill);
    }
    var parts = [];
    if (ctx.volume) parts.push(ctx.volume + (ctx.unit || 'L'));
    if (ctx.type) parts.push(ctx.type);
    pill.textContent = parts.join(' ') || 'Tank connected';
  }

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
    updateCtxPill();
    renderTabs();
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
  window.__rhGetTankCtx = getTankContext;
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
  if (tabsNewBtn) tabsNewBtn.addEventListener('click', newConv);
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


  var _lastUserObs = '';

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

    /* Auto-title on first user message */
    if (!prevLen) {
      var convData = initConvs();
      for (var ci = 0; ci < convData.list.length; ci++) {
        if (convData.list[ci].id === convData.activeId && !convData.list[ci].title) {
          convData.list[ci].title = text.slice(0, 28) + (text.length > 28 ? '…' : '');
          saveConvs(convData);
          renderTabs();
          break;
        }
      }
    }

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
            /* Strip [opt] markers before saving to history */
            var cleanResponse = responseText.replace(/\[opt\][\s\S]*?\[\/opt\]/g, '').trim() || responseText;
            var s2 = getThread();
            s2.messages.push({ role: 'assistant', content: cleanResponse, ts: replyTs });
            saveThread(s2);
            /* Offer to log the user's observation if the message looks like one */
            if (_lastUserObs && getTankContext()) {
              showLogOffer(_lastUserObs, p.parentNode);
              _lastUserObs = '';
            }
            /* Render interactive option buttons if Rhyssa included choices */
            var opts = extractOptions(responseText);
            if (opts.length) {
              addOptionButtons(p.parentNode, opts, function (chosen) { sendMsg(chosen); });
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
