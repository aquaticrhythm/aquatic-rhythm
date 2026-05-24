/* ============================================================
   ui-reading-pathways.js
   Extracted from js/ui.js (PR #233) — behaviour unchanged.
   'Continue reading' card + intent click analytics.
   ============================================================ */

/* ── READING PATHWAYS + CONTINUE STATE ── */
(function () {
  var STORAGE_KEY = 'ar_last_location';

  function saveCurrentLocation() {
    try {
      var title = document.title || '';
      var path = window.location.pathname + window.location.hash;
      var type = window.location.pathname.indexOf('/articles/') === 0 ? 'article' : 'page';
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ href: path, title: title, type: type }));
    } catch (e) {}
  }

  function hydrateContinueCard() {
    var wrap = document.getElementById('continue-reading');
    var link = document.getElementById('continue-link');
    var copy = document.getElementById('continue-copy');
    if (!wrap || !link || !copy) return;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var last = JSON.parse(raw);
      if (!last || !last.href) return;
      if (last.href === window.location.pathname + window.location.hash) return;
      wrap.classList.add('show');
      link.href = last.href;
      copy.textContent = 'Resume from: ' + (last.title || last.href);
    } catch (e) {}
  }

  function trackIntentClick(e) {
    var el = e.target.closest('[data-analytics-event]');
    if (!el || typeof gtag === 'undefined') return;
    gtag('event', el.getAttribute('data-analytics-event'), {
      pathway: el.getAttribute('data-pathway') || '',
      cta: el.getAttribute('data-cta') || '',
      destination: el.getAttribute('href') || ''
    });
  }

  hydrateContinueCard();
  saveCurrentLocation();
  document.addEventListener('click', trackIntentClick);
})();
