/* ============================================================
   ui.js — cursor, nav, page routing, scroll reveal,
            water level, eco toggle, progress bar
   ============================================================ */

(function () {

  /* ── CURSOR ── */
  var cd = document.getElementById('cd'), cr = document.getElementById('cr');
  var mx = 0, my = 0, rx = 0, ry = 0;
  var hasHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  if (hasHover) {
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      cd.style.left = mx + 'px'; cd.style.top = my + 'px';
    }, { passive: true });

    (function cursorLoop() {
      if (!window.AR_PAUSED) {
        rx += (mx - rx) * .09;
        ry += (my - ry) * .09;
        cr.style.left = rx + 'px';
        cr.style.top  = ry + 'px';
      }
      requestAnimationFrame(cursorLoop);
    })();

    document.querySelectorAll('a,button,.ac,.qi,.sl2,.spp,.pc').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('hov'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('hov'); });
    });
  }

  /* ── MOBILE NAV ── */
  var bg = document.getElementById('burger'), nm = document.getElementById('nmob');

  bg.addEventListener('click', function () {
    var o = bg.classList.toggle('open');
    nm.classList.toggle('open', o);
    bg.setAttribute('aria-expanded', o);
    nm.setAttribute('aria-hidden', !o);
  });

  function closeMenu() {
    bg.classList.remove('open');
    nm.classList.remove('open');
    bg.setAttribute('aria-expanded', 'false');
    nm.setAttribute('aria-hidden', 'true');
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) closeMenu();
  }, { passive: true });

  /* ── PAGE ROUTING ── */
  var pageMap = {
    '':         'home',
    '/':        'home',
    '/ara':     'ara',
    '/rhyssa':  'rhyssa',
    '/about':   'about',
    '/privacy': 'privacy',
    '/terms':   'terms'
  };

  var titleMap = {
    'home':    'Aquatic Rhythm — Aligned with Living Systems',
    'ara':     'Aquatic Rhythm Alignment — Reading the Rhythm of Living Aquarium Systems',
    'rhyssa':  'Rhyssa — An Aquarium Companion Shaped by ARA',
    'about':   'About — Where Aquatic Rhythm Came From',
    'privacy': 'Privacy Policy — Aquatic Rhythm',
    'terms':   'Terms of Use — Aquatic Rhythm'
  };

  function go(id, push) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    var t = document.getElementById('pg-' + id);
    if (!t) return;
    t.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'auto' });
    closeMenu();
    setTimeout(function () { observeScrollReveal(t); }, 80);

    /* Update page title */
    if (titleMap[id]) document.title = titleMap[id];

    var path = id === 'home' ? '/' : '/' + id;
    if (push !== false) history.pushState({ page: id }, '', path);

    var can = document.querySelector('link[rel="canonical"]');
    if (can) can.setAttribute('href', 'https://aquaticrhythm.com' + path);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', { page_path: path, page_title: id });
    }

    /* Reset progress bar */
    var bar = document.getElementById('progress-bar');
    if (bar) { bar.style.width = '0%'; bar.classList.remove('visible'); }
    setTimeout(updateWaterLevel, 100);
  }

  /* Expose go() globally so inline data-page links work */
  window.go = go;

  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    go(link.getAttribute('data-page'));
  });

  window.addEventListener('popstate', function (e) {
    var id = (e.state && e.state.page) ? e.state.page : pageMap[location.pathname] || 'home';
    go(id, false);
  });

  /* Initial page load */
  (function () {
    var id = pageMap[location.pathname] || 'home';
    var active = document.querySelector('.page.active');
    if (active) active.classList.remove('active');
    var t = document.getElementById('pg-' + id);
    if (t) {
      t.classList.add('active');
      if (titleMap[id]) document.title = titleMap[id];
      try { history.replaceState({ page: id }, '', location.pathname); } catch (e) {}
      var path = id === 'home' ? '/' : '/' + id;
      var can = document.querySelector('link[rel="canonical"]');
      if (can) can.setAttribute('href', 'https://aquaticrhythm.com' + path);
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', { page_path: path, page_title: titleMap[id] || id });
      }
    }
  })();

  /* ── SCROLL REVEAL ── */
  var currentObserver = null;

  function observeScrollReveal(page) {
    page.querySelectorAll('.sr').forEach(function (el) { el.classList.remove('in'); });
    if (currentObserver) currentObserver.disconnect();
    currentObserver = new IntersectionObserver(function (entries, ob) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); ob.unobserve(e.target); }
      });
    }, { threshold: .07, rootMargin: '0px 0px -24px 0px' });
    page.querySelectorAll('.sr').forEach(function (el) { currentObserver.observe(el); });
  }

  /* defer means DOM is already ready — init immediately */
  (function () {
    var active = document.querySelector('.page.active');
    if (active) observeScrollReveal(active);
  })();

  /* ── READING PROGRESS BAR ── */
  (function () {
    var bar = document.getElementById('progress-bar');
    if (!bar) return;
    var ticking = false;

    function updateProgress() {
      var activePage = document.querySelector('.page.active');
      if (!activePage) { bar.style.width = '0%'; bar.classList.remove('visible'); return; }
      var pageH = activePage.scrollHeight;
      var viewH = window.innerHeight;
      var scrolled = window.scrollY;
      var total = pageH - viewH;
      if (total <= 0) { bar.classList.remove('visible'); return; }
      var pct = Math.min(100, Math.max(0, (scrolled / total) * 100));
      bar.style.width = pct + '%';
      bar.classList.toggle('visible', pct > 0.5 && pct < 99.5);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
    }, { passive: true });
  })();

  /* ── WATER LEVEL ── */
  function updateWaterLevel() {
    var fill   = document.getElementById('water-fill');
    var bubble = document.getElementById('water-bubble');
    if (!fill) return;
    var page = document.querySelector('.page.active');
    if (!page) return;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docH = page.scrollHeight - window.innerHeight;
    if (docH <= 0) { fill.style.height = '100%'; return; }
    var pct = Math.min(100, Math.max(0, (scrollTop / docH) * 100));
    fill.style.height = pct + '%';
    if (bubble) {
      if (pct > 2 && pct < 98) { bubble.style.bottom = pct + '%'; bubble.style.opacity = '1'; }
      else { bubble.style.opacity = '0'; }
    }
  }

  window.addEventListener('scroll', updateWaterLevel, { passive: true });
  updateWaterLevel();

  /* ── ECOSYSTEM TOGGLE ── */
  (function () {
    var faunaBtn  = document.getElementById('fauna-btn');
    var floraBtn  = document.getElementById('flora-btn');
    var fishLayer = document.getElementById('fish-layer');
    var plants    = document.getElementById('plants');
    var driftwood = document.getElementById('driftwood-layer');
    if (!faunaBtn || !floraBtn) return;

    var faunaOff = localStorage.getItem('ar_fauna') === '0';
    var floraOff = localStorage.getItem('ar_flora') === '0';

    function applyFauna(off) {
      faunaOff = off;
      faunaBtn.classList.toggle('off', off);
      faunaBtn.setAttribute('aria-pressed', off ? 'true' : 'false');
      faunaBtn.title = off ? 'Show fish' : 'Hide fish';
      if (fishLayer) { fishLayer.style.transition = 'opacity .6s'; fishLayer.style.opacity = off ? '0' : ''; }
      localStorage.setItem('ar_fauna', off ? '0' : '1');
    }

    function applyFlora(off) {
      floraOff = off;
      floraBtn.classList.toggle('off', off);
      floraBtn.setAttribute('aria-pressed', off ? 'true' : 'false');
      floraBtn.title = off ? 'Show plants' : 'Hide plants';
      if (plants)    { plants.style.transition    = 'opacity .6s'; plants.style.opacity    = off ? '0' : ''; }
      if (driftwood) { driftwood.style.transition = 'opacity .6s'; driftwood.style.opacity = off ? '0' : ''; }
      localStorage.setItem('ar_flora', off ? '0' : '1');
    }

    faunaBtn.addEventListener('click', function (e) { e.stopPropagation(); applyFauna(!faunaOff); });
    floraBtn.addEventListener('click', function (e) { e.stopPropagation(); applyFlora(!floraOff); });

    if (faunaOff) applyFauna(true);
    if (floraOff) applyFlora(true);
  })();

})();
