/* ============================================================
   ui-settings.js
   Extracted from js/ui.js (PR #233) — behaviour unchanged.
   Settings panel: fauna/flora sync, motion, units, analytics opt-out, PWA install.
   ============================================================ */

/* ── SETTINGS PANEL ── */
(function () {
  var panel    = document.getElementById('ar-settings-panel');
  var backdrop = document.getElementById('ar-settings-backdrop');
  var openBtn  = document.getElementById('ar-settings-btn');
  var closeBtn = document.getElementById('ar-settings-close');
  var GA_ID    = 'G-8MDN065WNW';
  if (!panel || !openBtn) return;

  var stgFauna     = document.getElementById('stg-fauna');
  var stgFlora     = document.getElementById('stg-flora');
  var stgMotion    = document.getElementById('stg-motion');
  var stgAnalytics = document.getElementById('stg-analytics');
  var stgWcDays    = document.getElementById('stg-wc-days');

  function openPanel() {
    panel.classList.add('open');
    panel.removeAttribute('aria-hidden');
    if (backdrop) { backdrop.classList.add('open'); backdrop.removeAttribute('aria-hidden'); }
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    try { syncToggles(); } catch (e) {}
  }

  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    if (backdrop) { backdrop.classList.remove('open'); backdrop.setAttribute('aria-hidden', 'true'); }
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    openBtn.focus();
  }

  openBtn.addEventListener('click', openPanel);
  if (closeBtn) closeBtn.addEventListener('click', closePanel);
  if (backdrop) backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });

  /* close panel when navigating via embedded links */
  panel.querySelectorAll('[data-page],[data-kofi-open]').forEach(function (el) {
    el.addEventListener('click', closePanel);
  });

  function syncToggles() {
    if (stgFauna)     stgFauna.checked     = localStorage.getItem('ar_fauna')         !== '0';
    if (stgFlora)     stgFlora.checked     = localStorage.getItem('ar_flora')         !== '0';
    if (stgMotion)    stgMotion.checked    = localStorage.getItem('ar_reduce_motion') === '1';
    if (stgAnalytics) stgAnalytics.checked = localStorage.getItem('ar_analytics_opt') !== '1';
    if (stgWcDays)    stgWcDays.value      = localStorage.getItem('ar_wc_threshold')  || '14';

    var tempUnit = localStorage.getItem('ar_unit_temp') || 'C';
    panel.querySelectorAll('[data-unit-temp]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.unitTemp === tempUnit);
    });

    var volUnit = localStorage.getItem('ar_unit_vol') || 'L';
    panel.querySelectorAll('[data-unit-vol]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.unitVol === volUnit);
    });

    var sort = localStorage.getItem('ar_jn_sort') || 'desc';
    panel.querySelectorAll('[data-sort]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.sort === sort);
    });

    var pwaRow      = document.getElementById('stg-pwa-row');
    var isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (pwaRow) pwaRow.style.display = (!isStandalone && window.__arDeferredPWA) ? '' : 'none';
  }

  /* ── Fauna / Flora (sync with eco-toggle header) ── */
  if (stgFauna) {
    stgFauna.addEventListener('change', function () {
      if (typeof window.__arApplyFauna === 'function') window.__arApplyFauna(!stgFauna.checked);
    });
  }
  if (stgFlora) {
    stgFlora.addEventListener('change', function () {
      if (typeof window.__arApplyFlora === 'function') window.__arApplyFlora(!stgFlora.checked);
    });
  }

  /* Sync settings panel fauna/flora when header eco-toggle is used */
  var faunaHdrBtn = document.getElementById('fauna-btn');
  var floraHdrBtn = document.getElementById('flora-btn');
  if (faunaHdrBtn) {
    faunaHdrBtn.addEventListener('click', function () {
      if (stgFauna && panel.classList.contains('open')) {
        stgFauna.checked = localStorage.getItem('ar_fauna') !== '0';
      }
    });
  }
  if (floraHdrBtn) {
    floraHdrBtn.addEventListener('click', function () {
      if (stgFlora && panel.classList.contains('open')) {
        stgFlora.checked = localStorage.getItem('ar_flora') !== '0';
      }
    });
  }

  /* ── Reduce Motion ── */
  function applyReduceMotion(on) {
    document.body.classList.toggle('ar-reduce-motion', on);
    localStorage.setItem('ar_reduce_motion', on ? '1' : '0');
  }
  if (stgMotion) {
    stgMotion.addEventListener('change', function () { applyReduceMotion(stgMotion.checked); });
  }
  if (localStorage.getItem('ar_reduce_motion') === '1') applyReduceMotion(true);

  /* ── Unit segments ── */
  panel.querySelectorAll('[data-unit-temp]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      localStorage.setItem('ar_unit_temp', btn.dataset.unitTemp);
      panel.querySelectorAll('[data-unit-temp]').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
    });
  });
  panel.querySelectorAll('[data-unit-vol]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      localStorage.setItem('ar_unit_vol', btn.dataset.unitVol);
      panel.querySelectorAll('[data-unit-vol]').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
    });
  });

  /* ── Sort segments ── */
  panel.querySelectorAll('[data-sort]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      localStorage.setItem('ar_jn_sort', btn.dataset.sort);
      panel.querySelectorAll('[data-sort]').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
    });
  });

  /* ── Water change threshold ── */
  if (stgWcDays) {
    stgWcDays.addEventListener('change', function () {
      var v = parseInt(stgWcDays.value, 10);
      if (v >= 3 && v <= 60) { localStorage.setItem('ar_wc_threshold', String(v)); }
      else { stgWcDays.value = localStorage.getItem('ar_wc_threshold') || '14'; }
    });
  }

  /* ── Analytics opt-out ── */
  function applyAnalyticsOpt(enabled) {
    localStorage.setItem('ar_analytics_opt', enabled ? '0' : '1');
    window['ga-disable-' + GA_ID] = !enabled;
  }
  if (stgAnalytics) {
    stgAnalytics.addEventListener('change', function () { applyAnalyticsOpt(stgAnalytics.checked); });
  }
  if (localStorage.getItem('ar_analytics_opt') === '1') { window['ga-disable-' + GA_ID] = true; }

  /* ── Export Journal ── */
  var stgExport = document.getElementById('stg-export');
  if (stgExport) {
    stgExport.addEventListener('click', function () {
      try {
        var raw  = localStorage.getItem('ar_journal');
        var data = raw ? JSON.parse(raw) : {};
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href     = url;
        a.download = 'aquatic-rhythm-journal-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1200);
      } catch (e) {}
    });
  }

  /* ── Import Journal ── */
  var stgImportFile = document.getElementById('stg-import-file');
  if (stgImportFile) {
    stgImportFile.addEventListener('change', function () {
      var file = stgImportFile.files && stgImportFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (evt) {
        try {
          var parsed = JSON.parse(evt.target.result);
          if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
          localStorage.setItem('ar_journal', JSON.stringify(parsed));
          stgImportFile.value = '';
          closePanel();
          location.reload();
        } catch (e) {
          alert('Could not import — file does not appear to be a valid Aquatic Rhythm journal backup.');
        }
      };
      reader.readAsText(file);
    });
  }

  /* ── Clear Rhyssa chat ── */
  var stgClearRhyssa = document.getElementById('stg-clear-rhyssa');
  if (stgClearRhyssa) {
    stgClearRhyssa.addEventListener('click', function () {
      if (!confirm('Clear Rhyssa conversation history?')) return;
      localStorage.removeItem('rh_thread');
      localStorage.removeItem('rh_thread_companion');
      localStorage.removeItem('rh_convs');
    });
  }

  /* ── Reset all data ── */
  var stgResetAll = document.getElementById('stg-reset-all');
  if (stgResetAll) {
    stgResetAll.addEventListener('click', function () {
      if (!confirm('This will delete all your journal entries, settings, and chat history. This cannot be undone.\n\nContinue?')) return;
      localStorage.clear();
      location.reload();
    });
  }

  /* ── PWA install ── */
  window.addEventListener('beforeinstallprompt', function (e) {
    window.__arDeferredPWA = e;
  });
  var stgInstallPWA = document.getElementById('stg-install-pwa');
  if (stgInstallPWA) {
    stgInstallPWA.addEventListener('click', function () {
      if (!window.__arDeferredPWA) return;
      window.__arDeferredPWA.prompt();
      window.__arDeferredPWA.userChoice.then(function () {
        window.__arDeferredPWA = null;
        var pwaRow = document.getElementById('stg-pwa-row');
        if (pwaRow) pwaRow.style.display = 'none';
      });
    });
  }

})();
