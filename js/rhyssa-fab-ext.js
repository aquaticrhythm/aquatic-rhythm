(function () {
  var STORE_KEY      = 'rh_fab_pos';
  var IDLE_MS        = 4000;
  var DRAG_THRESHOLD = 5;

  /* Inject CSS for .idle and .dragging — articles use inline <style>, not style.css */
  if (!document.getElementById('rh-fab-ext-css')) {
    var s = document.createElement('style');
    s.id = 'rh-fab-ext-css';
    s.textContent =
      '.rh-fab{touch-action:none;transition-property:border-color,background,transform,opacity!important;transition-duration:.2s,.2s,.15s,.6s!important}' +
      '.rh-fab.idle{opacity:.28}' +
      '.rh-fab.dragging{transition:none!important;opacity:1!important;cursor:grabbing}';
    document.head.appendChild(s);
  }

  function init() {
    var fab = document.getElementById('rh-fab');
    if (!fab) return;

    /* ── 1. IDLE AUTO-DIM ──────────────────────────────────────── */
    var idleTimer = null;

    function armIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        if (!fab.classList.contains('active')) fab.classList.add('idle');
      }, IDLE_MS);
    }
    function cancelIdle() {
      clearTimeout(idleTimer);
      fab.classList.remove('idle');
    }

    fab.addEventListener('pointerenter', cancelIdle);
    fab.addEventListener('pointerleave', armIdle);
    armIdle();

    /* ── 2. DRAG (touch / coarse-pointer devices only) ─────────── */
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
        if (saved && saved.side) applyPos(saved.side, clamp(saved.bottom));
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

    /* ── 3. DRAG EVENTS ────────────────────────────────────────── */
    var dragging = false, moved = false;
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
      var fabW = fab.offsetWidth;
      var fabH = fab.offsetHeight;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var newLeft = Math.max(0, Math.min(vw - fabW, fabStartX + dx));
      var newTop  = Math.max(60, Math.min(vh - fabH, fabStartY + dy));
      fab.style.right  = '';
      fab.style.bottom = '';
      fab.style.left   = newLeft + 'px';
      fab.style.top    = newTop  + 'px';
    });

    fab.addEventListener('pointerup', function (e) {
      fab.classList.remove('dragging');
      if (!dragging) { armIdle(); return; }
      dragging = false;

      var rect = fab.getBoundingClientRect();
      var side   = (rect.left + rect.width / 2) < window.innerWidth / 2 ? 'left' : 'right';
      var bottom = clamp(window.innerHeight - rect.bottom);
      applyPos(side, bottom);
      savePos(side, bottom);
      armIdle();

      /* Suppress the ghost click Android fires after a drag */
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

    /* ── 4. RESTORE SAVED POSITION ─────────────────────────────── */
    loadPos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
