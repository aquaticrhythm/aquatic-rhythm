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
  var WORKER_URL = 'https://api.aquaticrhythm.com/chat';
  var STORE_KEY  = 'rh_thread';  /* legacy — migration source only */
  var CONVS_KEY  = 'rh_convs';  /* shared with SPA sheet */
  var isStreaming = false;
  var isTouch = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  var fab = document.getElementById('rh-fab');
  var bd  = document.getElementById('rh-backdrop');
  var sh  = document.getElementById('rh-sheet');
  var thr = document.getElementById('rh-sheet-thread');
  var frm = document.getElementById('rh-sheet-form');
  var inp = document.getElementById('rh-sheet-inp');
  var snd = document.getElementById('rh-sheet-send');
  var cls = document.getElementById('rh-sheet-cls');
  var wel = document.getElementById('rh-sheet-welcome');

  if (!fab || !sh) return;

  /* Hide old clear button — tabs + new conv replace it */
  var clr = document.getElementById('rh-sheet-clear');
  if (clr) clr.style.display = 'none';

  /* ── Inject tabs strip after sheet head (if not already present) ── */
  var tabsEl     = document.getElementById('rh-tabs');
  var tabsList   = document.getElementById('rh-tabs-list');
  var tabsNewBtn = document.getElementById('rh-tabs-new');

  if (!tabsEl) {
    tabsEl = document.createElement('div');
    tabsEl.id = 'rh-tabs';
    tabsEl.setAttribute('aria-label', 'Conversations');

    tabsList = document.createElement('div');
    tabsList.id = 'rh-tabs-list';
    tabsList.setAttribute('role', 'tablist');

    tabsNewBtn = document.createElement('button');
    tabsNewBtn.id = 'rh-tabs-new';
    tabsNewBtn.type = 'button';
    tabsNewBtn.setAttribute('aria-label', 'New conversation');
    tabsNewBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true"><line x1="5.5" y1="1" x2="5.5" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="5.5" x2="10" y2="5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

    tabsEl.appendChild(tabsList);
    tabsEl.appendChild(tabsNewBtn);

    var shHead = sh.querySelector('.rh-sheet-head');
    if (shHead && shHead.nextSibling) {
      sh.insertBefore(tabsEl, shHead.nextSibling);
    } else {
      sh.insertBefore(tabsEl, thr);
    }
  }

  /* Inline styles — resilient to CSS cache */
  tabsEl.style.cssText = 'display:flex;align-items:center;gap:.4rem;padding:.3rem .85rem .28rem;border-bottom:1px solid rgba(255,255,255,.07);overflow-x:auto;scrollbar-width:none;flex-shrink:0';
  tabsList.style.cssText = 'display:flex;gap:.3rem;flex:1;min-width:0;overflow:hidden';
  tabsNewBtn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;background:none;border:1px solid rgba(255,255,255,.13);border-radius:20px;color:rgba(255,255,255,.4);cursor:pointer;padding:.22rem .55rem;line-height:1;flex-shrink:0;-webkit-tap-highlight-color:transparent';

  /* ── Storage — multi-conversation (shared with SPA sheet via rh_convs) ── */
  function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

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
    /* Migrate legacy rh_thread on first load */
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

  /* ── Markdown → HTML (safe, matches SPA sheet) ── */
  function mdToHTML(raw) {
    var display = raw
      .replace(/\[opt\][\s\S]*?\[\/opt\]/g, '')
      .replace(/\s*\[opt\][\s\S]*$/, '')
      .trim();
    var s = display.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\[([^\]]+)\]\(\s*(\/[^)]*)\s*\)/g, '<a href="$2" style="color:rgba(61,214,232,.85);text-decoration:underline;text-underline-offset:2px">$1</a>');
    s = s.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    var lines = s.split('\n'), out = [], inUL = false, inOL = false, inP = false;
    function closeAll() {
      if (inUL) { out.push('</ul>'); inUL = false; }
      if (inOL) { out.push('</ol>'); inOL = false; }
      if (inP)  { out.push('</p>');  inP  = false; }
    }
    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].trim();
      if (!t) { closeAll(); continue; }
      if (/^---+$/.test(t)) { closeAll(); out.push('<hr>'); continue; }
      var ulM = t.match(/^[-*]\s+([\s\S]*)/);
      if (ulM) {
        if (inP) { out.push('</p>'); inP = false; }
        if (inOL) { out.push('</ol>'); inOL = false; }
        if (!inUL) { out.push('<ul>'); inUL = true; }
        out.push('<li>' + ulM[1] + '</li>'); continue;
      }
      var olM = t.match(/^\d+[.)]\s+([\s\S]*)/);
      if (olM) {
        if (inP) { out.push('</p>'); inP = false; }
        if (inUL) { out.push('</ul>'); inUL = false; }
        if (!inOL) { out.push('<ol>'); inOL = true; }
        out.push('<li>' + olM[1] + '</li>'); continue;
      }
      if (inUL) { out.push('</ul>'); inUL = false; }
      if (inOL) { out.push('</ol>'); inOL = false; }
      if (!inP) { out.push('<p>'); inP = true; } else { out.push('<br>'); }
      out.push(t);
    }
    closeAll();
    return out.join('') || '<p>' + display.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>';
  }

  /* ── Interactive option buttons ── */
  function extractOptions(raw) {
    var opts = [], re = /\[opt\]([\s\S]*?)\[\/opt\]/g, m;
    while ((m = re.exec(raw)) !== null) { var t = m[1].trim(); if (t) opts.push(t); }
    return opts.slice(0, 4);
  }

  function addOptionButtons(wrap, options, onPick) {
    if (!options || !options.length) return;
    var group = document.createElement('div');
    group.style.cssText = 'display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.6rem;padding-top:.5rem;border-top:1px solid rgba(255,255,255,.06)';
    var btnBase = 'font-size:.65rem;padding:.32rem .75rem;background:rgba(61,214,232,.07);border:1px solid rgba(61,214,232,.22);border-radius:20px;color:rgba(235,240,236,.82);cursor:pointer;font-family:inherit;letter-spacing:.01em;text-align:left;line-height:1.4;-webkit-tap-highlight-color:transparent';
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = btnBase;
      btn.textContent = opt;
      btn.addEventListener('click', function () { group.remove(); onPick(opt); });
      group.appendChild(btn);
    });
    var writeBtn = document.createElement('button');
    writeBtn.type = 'button';
    writeBtn.style.cssText = 'font-size:.65rem;padding:.32rem .75rem;background:none;border:1px solid rgba(255,255,255,.1);border-radius:20px;color:rgba(255,255,255,.35);cursor:pointer;font-family:inherit;letter-spacing:.01em;text-align:left;line-height:1.4;font-style:italic;-webkit-tap-highlight-color:transparent';
    writeBtn.textContent = 'Write my own…';
    writeBtn.addEventListener('click', function () { group.remove(); if (inp) inp.focus(); });
    group.appendChild(writeBtn);
    wrap.appendChild(group);
  }

  /* ── Tab management ── */
  function renderTabs() {
    if (!tabsList) return;
    var data = initConvs();
    tabsList.innerHTML = '';
    var styleInactive = 'display:inline-flex;align-items:center;gap:.28rem;padding:.22rem .65rem;border-radius:20px;border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.4);cursor:pointer;font-size:.6rem;font-family:inherit;white-space:nowrap;max-width:140px;flex-shrink:0;-webkit-tap-highlight-color:transparent;background:rgba(255,255,255,.05)';
    var styleActive   = 'display:inline-flex;align-items:center;gap:.28rem;padding:.22rem .65rem;border-radius:20px;border:1px solid rgba(61,214,232,.28);color:rgba(61,214,232,.85);cursor:pointer;font-size:.6rem;font-family:inherit;white-space:nowrap;max-width:140px;flex-shrink:0;-webkit-tap-highlight-color:transparent;background:rgba(61,214,232,.1)';
    data.list.forEach(function (conv) {
      var isActive = conv.id === data.activeId;
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.style.cssText = isActive ? styleActive : styleInactive;
      var titleSpan = document.createElement('span');
      titleSpan.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90px;display:block';
      titleSpan.textContent = conv.title || 'New chat';
      tab.appendChild(titleSpan);
      if (data.list.length > 1) {
        var del = document.createElement('button');
        del.type = 'button';
        del.setAttribute('aria-label', 'Delete conversation');
        del.style.cssText = 'background:none;border:none;color:rgba(255,255,255,.28);cursor:pointer;font-size:.85rem;padding:0;line-height:1;flex-shrink:0;-webkit-tap-highlight-color:transparent';
        del.textContent = '×';
        ;(function (id) {
          del.addEventListener('click', function (e) { e.stopPropagation(); deleteConv(id); });
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
    var data = initConvs(); data.activeId = id; saveConvs(data);
    renderTabs(); renderThread();
  }

  function newConv() {
    var data = initConvs();
    var id = genId();
    data.list.push({ id: id, title: '', messages: [] });
    data.activeId = id;
    saveConvs(data);
    renderTabs(); renderThread();
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
    saveConvs(data); renderTabs(); renderThread();
  }

  /* ── Thread rendering ── */
  function appendSep(ts) {
    var sep = document.createElement('div');
    sep.className = 'rh-date-sep';
    sep.innerHTML = '<span>' + fmtDay(ts) + '</span>';
    thr.appendChild(sep);
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
    thr.appendChild(wrap);
    return body;
  }

  function showTyping() {
    var d = document.createElement('div');
    d.className = 'rh-typing'; d.id = 'rh-ti';
    d.innerHTML = '<span></span><span></span><span></span>';
    thr.appendChild(d); thr.scrollTop = thr.scrollHeight;
  }
  function hideTyping() { var t = document.getElementById('rh-ti'); if (t) t.remove(); }

  function renderThread() {
    var msgs = getThread().messages;
    Array.from(thr.children).forEach(function (el) {
      if (el.id !== 'rh-sheet-welcome') el.remove();
    });
    if (!msgs.length) {
      if (wel) wel.style.display = '';
      var chips = document.getElementById('rh-suggest-chips');
      if (chips) chips.style.display = '';
      return;
    }
    if (wel) wel.style.display = 'none';
    var chips = document.getElementById('rh-suggest-chips');
    if (chips) chips.style.display = 'none';
    var lastDay = null;
    msgs.forEach(function (m) {
      var mDay = dayKey(m.ts || Date.now());
      if (mDay !== lastDay) { appendSep(m.ts || Date.now()); lastDay = mDay; }
      appendBubble(m.role, m.content);
    });
    thr.scrollTop = thr.scrollHeight;
  }

  /* ── Tank context + ctx pill ── */
  function getTankContext() {
    try {
      var d = JSON.parse(localStorage.getItem('ar_journal') || '{}');
      var ts = d.tanks || [];
      if (!ts.length) return null;
      var a = ts.find(function (t) { return t.id === d.activeTankId; }) || ts[0];
      if (!a || !a.profile) return null;
      var p = a.profile;
      return { volume: p.volume || null, unit: p.unit || 'L', type: p.type || null };
    } catch (e) { return null; }
  }

  function updateCtxPill() {
    var titleGroup = sh.querySelector('.rh-sheet-title-group');
    if (!titleGroup) return;
    var pill = titleGroup.querySelector('.rh-ctx-pill');
    var ctx = getTankContext();
    if (!ctx) { if (pill) pill.remove(); return; }
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'rh-ctx-pill';
      pill.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:.48rem;padding:2px 7px;border-radius:20px;background:rgba(61,214,232,.08);border:1px solid rgba(61,214,232,.2);color:rgba(61,214,232,.62);font-family:inherit;letter-spacing:.02em;margin-top:.2rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      titleGroup.appendChild(pill);
    }
    var parts = [];
    if (ctx.volume) parts.push(ctx.volume + (ctx.unit || 'L'));
    if (ctx.type) parts.push(ctx.type);
    pill.textContent = parts.join(' ') || 'Tank connected';
  }

  /* ── Visual viewport fix (Android Chrome address bar) ── */
  function fitSheet() {
    if (!window.visualViewport || window.innerWidth >= 721) return;
    sh.style.top = '0px'; sh.style.bottom = 'auto';
    sh.style.height = Math.round(window.visualViewport.height) + 'px';
    thr.scrollTop = thr.scrollHeight;
  }

  /* ── Open / close ── */
  function openSheet() {
    sh.classList.add('open'); sh.removeAttribute('aria-hidden');
    if (bd) { bd.classList.add('open'); }
    fab.setAttribute('aria-expanded', 'true');
    fab.classList.add('active');
    document.body.style.overflow = 'hidden';
    fitSheet();
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fitSheet);
    updateCtxPill(); renderTabs(); renderThread();
    setTimeout(function () { if (inp) inp.focus(); }, 80);
  }

  function closeSheet() {
    sh.classList.remove('open'); sh.setAttribute('aria-hidden', 'true');
    if (bd) { bd.classList.remove('open'); }
    fab.setAttribute('aria-expanded', 'false');
    fab.classList.remove('active');
    document.body.style.overflow = '';
    if (window.innerWidth < 721) { sh.style.top = ''; sh.style.bottom = ''; sh.style.height = ''; }
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', fitSheet);
    fab.focus();
  }

  /* Expose for rhyssa-fab-ext.js back-button intercept */
  window.__rhCloseSheet = closeSheet;

  /* ── Event wiring ── */
  fab.addEventListener('click', function () {
    sh.classList.contains('open') ? closeSheet() : openSheet();
  });
  if (bd) bd.addEventListener('click', closeSheet);
  if (cls) cls.addEventListener('click', closeSheet);
  if (tabsNewBtn) tabsNewBtn.addEventListener('click', newConv);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sh.classList.contains('open')) closeSheet();
  });

  /* Suggest chips */
  var chipsEl = document.getElementById('rh-suggest-chips');
  if (chipsEl) {
    chipsEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.rh-suggest-chip');
      if (!chip) return;
      var msg = chip.dataset.msg || chip.textContent.trim();
      if (!msg) return;
      chipsEl.style.display = 'none';
      sendMsg(msg);
    });
  }

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
  if (frm) frm.addEventListener('submit', function (e) { e.preventDefault(); doSubmit(); });

  function doSubmit() {
    var text = inp ? inp.value.trim() : '';
    if (!text) return;
    inp.value = ''; inp.style.height = 'auto';
    sendMsg(text);
  }

  /* ── Send message ── */
  function sendMsg(text) {
    if (isStreaming || !text.trim()) return;
    if (wel) wel.style.display = 'none';
    var chips = document.getElementById('rh-suggest-chips');
    if (chips) chips.style.display = 'none';

    var now = Date.now();
    var s = getThread();
    var prevLen = s.messages.length;
    s.messages.push({ role: 'user', content: text, ts: now });
    saveThread(s);

    /* Auto-title first message */
    if (!prevLen) {
      var convData = initConvs();
      for (var ci = 0; ci < convData.list.length; ci++) {
        if (convData.list[ci].id === convData.activeId && !convData.list[ci].title) {
          convData.list[ci].title = text.slice(0, 28) + (text.length > 28 ? '…' : '');
          saveConvs(convData); renderTabs(); break;
        }
      }
    }

    if (prevLen === 0 || dayKey((s.messages[prevLen - 1] || {}).ts || 0) !== dayKey(now)) appendSep(now);
    appendBubble('user', text);
    thr.scrollTop = thr.scrollHeight;
    showTyping();
    if (snd) snd.disabled = true;
    isStreaming = true;

    var msgHistory = s.messages.map(function (m) { return { role: m.role, content: m.content }; });

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgHistory, tankContext: getTankContext() })
    }).then(function (res) {
      hideTyping();
      if (!res.ok || !res.body) throw new Error('status ' + res.status);
      var replyTs = Date.now();
      var p = appendBubble('assistant', '');
      var responseText = '';
      var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';

      function feedLine(line) {
        if (!line.startsWith('data: ')) return;
        var d = line.slice(6).trim();
        if (d === '[DONE]') return;
        try {
          var pr = JSON.parse(d);
          if (pr.type === 'error') { responseText = responseText || '—'; return; }
          var delta = (pr.delta && pr.delta.text) ? pr.delta.text : '';
          if (delta) { responseText += delta; p.innerHTML = mdToHTML(responseText); thr.scrollTop = thr.scrollHeight; }
        } catch (e) {}
      }

      function read() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            buf += dec.decode(chunk.value || new Uint8Array(0), { stream: false });
            buf.split('\n').forEach(feedLine); buf = '';
            if (!responseText) {
              responseText = 'Something went wrong — please try again in a moment.';
              p.innerHTML = mdToHTML(responseText);
            }
            /* Strip [opt] markers before saving to history */
            var cleanResponse = responseText.replace(/\[opt\][\s\S]*?\[\/opt\]/g, '').trim() || responseText;
            var s2 = getThread();
            s2.messages.push({ role: 'assistant', content: cleanResponse, ts: replyTs });
            saveThread(s2);
            /* Render option buttons if present */
            var opts = extractOptions(responseText);
            if (opts.length) addOptionButtons(p.parentNode, opts, function (chosen) { sendMsg(chosen); });
            if (snd) snd.disabled = false;
            isStreaming = false;
            if (inp) inp.focus();
            return;
          }
          buf += dec.decode(chunk.value, { stream: true });
          var lines = buf.split('\n'); buf = lines.pop() || '';
          lines.forEach(feedLine);
          return read();
        });
      }
      return read();
    }).catch(function () {
      hideTyping();
      appendBubble('assistant', 'Something went wrong — please try again in a moment.');
      if (snd) snd.disabled = false;
      isStreaming = false;
    });
  }

})();
