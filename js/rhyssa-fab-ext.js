(function () {
  var STORE_KEY      = 'rh_fab_pos';
  var IDLE_MS        = 4000;
  var DRAG_THRESHOLD = 5;
  var PEEK_PX        = 14; /* px of circle visible when edge-collapsed */

  /* ── Inject CSS ──────────────────────────────────────────────────
     Articles use inline <style>, not style.css, and the <button>
     itself has inline style="..." (highest specificity).
     Every shape property needs !important to win. */
  if (!document.getElementById('rh-fab-ext-css')) {
    var s = document.createElement('style');
    s.id = 'rh-fab-ext-css';
    s.textContent =
      /* Round jelly shape — override inline button styles */
      '.rh-fab{' +
        'width:52px!important;height:52px!important;border-radius:50%!important;' +
        'padding:0!important;gap:0!important;' +
        'align-items:center!important;justify-content:center!important;' +
        'background:radial-gradient(ellipse at 38% 32%,rgba(255,255,255,.08) 0%,transparent 52%),' +
          'radial-gradient(ellipse at 50% 50%,rgba(61,214,232,.14) 0%,transparent 66%),' +
          'rgba(6,18,14,.95)!important;' +
        'border:1.5px solid rgba(61,214,232,.4)!important;' +
        'box-shadow:0 0 16px rgba(61,214,232,.14),0 6px 22px rgba(0,0,0,.5),' +
          'inset 0 1px 0 rgba(255,255,255,.07)!important;' +
        'touch-action:none!important;will-change:transform;' +
        'transition:border-color .25s,background .25s,' +
          'transform .45s cubic-bezier(0.34,1.56,0.64,1),' +
          'opacity .4s ease,box-shadow .3s!important}' +
      '.rh-fab-lbl{display:none!important}' +
      '.rh-fab:hover{' +
        'border-color:rgba(61,214,232,.65)!important;' +
        'box-shadow:0 0 24px rgba(61,214,232,.22),0 6px 22px rgba(0,0,0,.5),' +
          'inset 0 1px 0 rgba(255,255,255,.07)!important}' +
      '.rh-fab.active{' +
        'border-color:rgba(61,214,232,.65)!important;' +
        'background:radial-gradient(ellipse at 38% 32%,rgba(255,255,255,.1) 0%,transparent 52%),' +
          'radial-gradient(ellipse at 50% 50%,rgba(61,214,232,.2) 0%,transparent 66%),' +
          'rgba(10,28,20,.97)!important;' +
        'box-shadow:0 0 28px rgba(61,214,232,.28),0 6px 22px rgba(0,0,0,.5),' +
          'inset 0 1px 0 rgba(255,255,255,.09)!important}' +
      '.rh-fab.idle{opacity:.75}' +
      '.rh-fab.idle[data-side="right"]{transform:translateX(calc(100% - ' + PEEK_PX + 'px))}' +
      '.rh-fab.idle[data-side="left"]{transform:translateX(calc(-100% + ' + PEEK_PX + 'px))}' +
      '.rh-fab.snapping{transform:scale(.82)}' +
      '.rh-fab.dragging{transition:none!important;opacity:1!important;transform:none!important;cursor:grabbing}';
    document.head.appendChild(s);
  }

  function init() {
    var fab = document.getElementById('rh-fab');
    if (!fab) return;

    /* Read saved side early so armIdle collapses the right way from the start */
    var currentSide = 'right';
    try {
      var _pre = JSON.parse(localStorage.getItem(STORE_KEY));
      if (_pre && _pre.side) currentSide = _pre.side;
    } catch (e) {}

    /* dragging declared at init scope so armIdle can guard against it */
    var dragging = false;

    /* ── 1. IDLE EDGE-COLLAPSE ─────────────────────────────────────── */
    var idleTimer = null;

    function armIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        if (!fab.classList.contains('active') && !dragging) {
          fab.dataset.side = currentSide;
          fab.classList.add('idle');
        }
      }, IDLE_MS);
    }

    function cancelIdle() {
      clearTimeout(idleTimer);
      fab.classList.remove('idle');
      fab.removeAttribute('data-side');
    }

    fab.addEventListener('pointerenter', cancelIdle);
    fab.addEventListener('pointerleave', armIdle);
    armIdle();

    /* ── 2. BACK-BUTTON INTERCEPT ──────────────────────────────────── */
    var sheet = document.getElementById('rh-sheet');
    if (sheet) {
      var rhInHistory = false;

      function closeRhSheet() {
        if (window.__rhCloseSheet) {
          window.__rhCloseSheet();
        } else {
          var bd = document.getElementById('rh-backdrop');
          if (bd) bd.click();
        }
      }

      /* Watch for .open toggling on the sheet */
      new MutationObserver(function () {
        var open = sheet.classList.contains('open');
        if (open && !rhInHistory) {
          rhInHistory = true;
          history.pushState({ rhSheet: true }, '');
        } else if (!open && rhInHistory) {
          /* Sheet closed via UI — clean up the pushed entry.
             rhInHistory stays true so the popstate handler can identify and
             suppress the resulting navigation. */
          history.back();
        }
      }).observe(sheet, { attributes: true, attributeFilter: ['class'] });

      /* Intercept popstate before the SPA router sees it.
         e.state is the DESTINATION state (entry navigated to), not the source.
         We detect our intercept via rhInHistory, not via e.state.rhSheet. */
      window.addEventListener('popstate', function (e) {
        if (!rhInHistory) return;
        rhInHistory = false;
        window.__rhSuppressSpaNav = true;
        if (sheet.classList.contains('open')) {
          closeRhSheet();
        }
      }, true);
    }

    /* ── 3. DRAG + POSITION (touch / coarse-pointer only) ─────────── */
    var isTouch = window.matchMedia('(hover:none) and (pointer:coarse)').matches;
    if (!isTouch) return;

    var safeAreaCache = null;

    function getSafeAreaBottom() {
      if (safeAreaCache !== null) return safeAreaCache;
      var div = document.createElement('div');
      div.style.cssText =
        'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);' +
        'width:0;overflow:hidden;pointer-events:none;visibility:hidden';
      document.body.appendChild(div);
      safeAreaCache = div.offsetHeight;
      document.body.removeChild(div);
      return safeAreaCache;
    }

    function minBottom() { return 56 + getSafeAreaBottom() + 8; }
    function maxBottom() { return window.innerHeight - 60 - fab.offsetHeight - 8; }
    function clamp(px)   { return Math.max(minBottom(), Math.min(maxBottom(), px)); }

    function applyPos(side, bottom) {
      currentSide = side;
      fab.style.top    = '';
      fab.style.left   = '';
      fab.style.right  = '';
      fab.style.bottom = bottom + 'px';
      if (side === 'left') { fab.style.left = '1rem'; }
      else                 { fab.style.right = '1rem'; }
    }

    function loadPos() {
      try {
        var saved = JSON.parse(localStorage.getItem(STORE_KEY));
        if (saved && saved.side) {
          currentSide = saved.side;
          applyPos(saved.side, clamp(saved.bottom));
        }
      } catch (e) {}
    }

    function savePos(side, bottom) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ side: side, bottom: bottom })); } catch (e) {}
    }

    /* Re-clamp on orientation change */
    window.addEventListener('resize', function () {
      safeAreaCache = null;
      try {
        var saved = JSON.parse(localStorage.getItem(STORE_KEY));
        if (saved && saved.side) applyPos(saved.side, clamp(saved.bottom));
      } catch (e) {}
    });

    /* ── 4. DRAG EVENTS ────────────────────────────────────────────── */
    var moved = false;
    var dragStartX, dragStartY, fabStartX, fabStartY;

    fab.addEventListener('pointerdown', function (e) {
      cancelIdle();
      dragging = false;
      moved    = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      var rect = fab.getBoundingClientRect();
      fabStartX = rect.left;
      fabStartY = rect.top;
      fab.setPointerCapture(e.pointerId);
    });

    fab.addEventListener('pointermove', function (e) {
      if (!fab.hasPointerCapture(e.pointerId)) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      moved = true;
      if (!dragging) {
        dragging = true;
        fab.classList.add('dragging');
      }
      var vw = window.innerWidth, vh = window.innerHeight;
      var newLeft = Math.max(0, Math.min(vw - fab.offsetWidth,  fabStartX + dx));
      var newTop  = Math.max(60, Math.min(vh - fab.offsetHeight, fabStartY + dy));
      fab.style.right  = '';
      fab.style.bottom = '';
      fab.style.left   = newLeft + 'px';
      fab.style.top    = newTop  + 'px';
    });

    fab.addEventListener('pointerup', function (e) {
      fab.classList.remove('dragging');
      if (!dragging) { armIdle(); return; }
      dragging = false;

      /* Snap to nearest edge */
      var rect   = fab.getBoundingClientRect();
      var side   = (rect.left + rect.width / 2) < window.innerWidth / 2 ? 'left' : 'right';
      var bottom = clamp(window.innerHeight - rect.bottom);
      applyPos(side, bottom);
      savePos(side, bottom);

      /* Jelly bloop on snap: briefly squish then spring back */
      fab.classList.add('snapping');
      void fab.offsetWidth; /* force reflow so browser sees the 'from' state */
      fab.classList.remove('snapping');

      armIdle();

      /* Suppress the ghost click Android fires after pointerup */
      fab.addEventListener('click', function suppress(ev) {
        ev.stopImmediatePropagation();
        fab.removeEventListener('click', suppress, true);
      }, { capture: true, once: true });
    });

    fab.addEventListener('pointercancel', function () {
      if (dragging) {
        dragging = false;
        fab.classList.remove('dragging');
        loadPos();
      }
      armIdle();
    });

    /* ── 5. RESTORE SAVED POSITION ─────────────────────────────────── */
    loadPos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
