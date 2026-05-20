(function () {
  var STORE_KEY      = 'rh_fab_pos';
  var IDLE_MS        = 4000;
  var DRAG_THRESHOLD = 5;
  var PEEK_PX        = 14; /* px of circle visible when edge-collapsed */

  /* ── Inject CSS ──────────────────────────────────────────────────
     Articles use inline <style> + inline style="" on the <button>.
     Every shape-overriding property needs !important. */
  if (!document.getElementById('rh-fab-ext-css')) {
    var s = document.createElement('style');
    s.id = 'rh-fab-ext-css';
    s.textContent =
      '@keyframes rh-fab-breathe{' +
        '0%,100%{opacity:.18}' +
        '50%{opacity:.32}' +
      '}' +
      '.rh-fab{' +
        'width:52px!important;height:52px!important;border-radius:50%!important;' +
        'padding:0!important;gap:0!important;' +
        'align-items:center!important;justify-content:center!important;' +
        'background:radial-gradient(ellipse at 38% 32%,rgba(255,255,255,.08) 0%,transparent 52%),' +
          'radial-gradient(ellipse at 50% 50%,rgba(61,214,232,.13) 0%,transparent 66%),' +
          'rgba(6,18,14,.88)!important;' +
        'border:1.5px solid rgba(61,214,232,.38)!important;' +
        'box-shadow:0 0 16px rgba(61,214,232,.13),0 6px 22px rgba(0,0,0,.48),' +
          'inset 0 1px 0 rgba(255,255,255,.07)!important;' +
        'touch-action:none!important;will-change:transform;' +
        'transition:border-color .25s,background .25s,' +
          'transform .5s cubic-bezier(0.22,1.8,0.36,1),' +
          'opacity .4s ease,box-shadow .3s!important}' +
      '.rh-fab-lbl{display:none!important}' +
      '.rh-fab:active{transform:scale(.85)!important}' +
      '.rh-fab:hover{' +
        'border-color:rgba(61,214,232,.62)!important;' +
        'box-shadow:0 0 24px rgba(61,214,232,.2),0 6px 22px rgba(0,0,0,.48),' +
          'inset 0 1px 0 rgba(255,255,255,.07)!important}' +
      '.rh-fab.active{' +
        'border-color:rgba(61,214,232,.62)!important;' +
        'background:radial-gradient(ellipse at 38% 32%,rgba(255,255,255,.1) 0%,transparent 52%),' +
          'radial-gradient(ellipse at 50% 50%,rgba(61,214,232,.2) 0%,transparent 66%),' +
          'rgba(10,28,20,.96)!important;' +
        'box-shadow:0 0 28px rgba(61,214,232,.26),0 6px 22px rgba(0,0,0,.48),' +
          'inset 0 1px 0 rgba(255,255,255,.09)!important}' +
      '.rh-fab.idle{' +
        'animation:rh-fab-breathe 2.8s ease-in-out infinite}' +
      '.rh-fab.idle[data-side="right"]{transform:translateX(calc(100% - ' + PEEK_PX + 'px))}' +
      '.rh-fab.idle[data-side="left"]{transform:translateX(calc(-100% + ' + PEEK_PX + 'px))}' +
      '.rh-fab.snapping{transform:scale(.82)!important}' +
      '.rh-fab.dragging{' +
        'transition:none!important;opacity:1!important;' +
        'transform:none!important;animation:none!important;cursor:grabbing}';
    document.head.appendChild(s);
  }

  function init() {
    var fab = document.getElementById('rh-fab');
    if (!fab) return;

    /* Ensure touch-action is set even before CSS cascade resolves */
    fab.style.touchAction = 'none';

    /* Read saved side so first idle collapse goes the right direction */
    var currentSide = 'right';
    try {
      var _pre = JSON.parse(localStorage.getItem(STORE_KEY));
      if (_pre && _pre.side) currentSide = _pre.side;
    } catch (e) {}

    /* dragging at init scope so armIdle guard works correctly */
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

      new MutationObserver(function () {
        var open = sheet.classList.contains('open');
        if (open && !rhInHistory) {
          rhInHistory = true;
          history.pushState({ rhSheet: true }, '');
        } else if (!open && rhInHistory) {
          history.back();
        }
      }).observe(sheet, { attributes: true, attributeFilter: ['class'] });

      window.addEventListener('popstate', function (e) {
        if (!rhInHistory) return;
        rhInHistory = false;
        window.__rhSuppressSpaNav = true;
        if (sheet.classList.contains('open')) closeRhSheet();
      }, true);
    }

    /* ── 3. DRAG + POSITION ────────────────────────────────────────── */

    /* More reliable than (hover:none)&&(pointer:coarse) — catches all touch-capable devices */
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
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
          /* Restore idle state immediately — don't wait 4s after page load */
          clearTimeout(idleTimer);
          fab.dataset.side = currentSide;
          fab.classList.add('idle');
        }
      } catch (e) {}
    }

    function savePos(side, bottom) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ side: side, bottom: bottom })); } catch (e) {}
    }

    window.addEventListener('resize', function () {
      safeAreaCache = null;
      try {
        var saved = JSON.parse(localStorage.getItem(STORE_KEY));
        if (saved && saved.side) applyPos(saved.side, clamp(saved.bottom));
      } catch (e) {}
    });

    /* ── 4. DRAG EVENTS ────────────────────────────────────────────── */
    var moved      = false;
    var pointerDown = false; /* reliable flag instead of hasPointerCapture */
    var dragStartX, dragStartY;
    var fabStartX,  fabStartY; /* set when drag activates, not on pointerdown */

    fab.addEventListener('pointerdown', function (e) {
      cancelIdle();
      dragging    = false;
      moved       = false;
      pointerDown = true;
      dragStartX  = e.clientX;
      dragStartY  = e.clientY;
      /* fabStartX/Y are captured in pointermove when drag activates —
         recording here would be mid-animation if coming from idle state */
      fab.setPointerCapture(e.pointerId);
    });

    fab.addEventListener('pointermove', function (e) {
      if (!pointerDown) return;

      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

      if (!moved) {
        moved = true;
        /* FIX: read current VISUAL position (including any active CSS transform)
           and immediately lock it into left/top BEFORE adding .dragging.
           This prevents the FAB from jumping when transform:none is applied. */
        var rect = fab.getBoundingClientRect();
        fab.style.left   = rect.left + 'px';
        fab.style.top    = rect.top  + 'px';
        fab.style.right  = '';
        fab.style.bottom = '';
        /* NOW remove transform via .dragging — visual position unchanged */
        dragging = true;
        fab.classList.add('dragging');
        /* Re-anchor reference points to this moment */
        fabStartX  = rect.left;
        fabStartY  = rect.top;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        return; /* dx/dy are 0 from new reference — skip this frame */
      }

      var vw = window.innerWidth, vh = window.innerHeight;
      var newLeft = Math.max(0, Math.min(vw - fab.offsetWidth,  fabStartX + (e.clientX - dragStartX)));
      var newTop  = Math.max(60, Math.min(vh - fab.offsetHeight, fabStartY + (e.clientY - dragStartY)));
      fab.style.left = newLeft + 'px';
      fab.style.top  = newTop  + 'px';

      e.preventDefault(); /* stop browser claiming touch for scroll */
    }, { passive: false });

    fab.addEventListener('pointerup', function (e) {
      pointerDown = false;
      fab.classList.remove('dragging');
      if (!dragging) { armIdle(); return; }
      dragging = false;

      var rect   = fab.getBoundingClientRect();
      var side   = (rect.left + rect.width / 2) < window.innerWidth / 2 ? 'left' : 'right';
      var bottom = clamp(window.innerHeight - rect.bottom);
      applyPos(side, bottom);
      savePos(side, bottom);

      /* Jelly bloop: squish → spring back */
      fab.classList.add('snapping');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          fab.classList.remove('snapping');
        });
      });

      armIdle();

      /* Suppress ghost click Android fires after drag */
      fab.addEventListener('click', function suppress(ev) {
        ev.stopImmediatePropagation();
        fab.removeEventListener('click', suppress, true);
      }, { capture: true, once: true });
    });

    fab.addEventListener('pointercancel', function () {
      pointerDown = false;
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
