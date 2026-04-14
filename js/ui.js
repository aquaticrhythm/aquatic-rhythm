/* ============================================================
   ui.js — cursor, nav, hybrid routing, scroll reveal,
            water level, eco toggle, progress bar
   ============================================================ */

(function () {

  var hasSpaPages = !!document.querySelector('.page');

  /* ── CURSOR ── */
  var cd = document.getElementById('cd'), cr = document.getElementById('cr');
  var mx = 0, my = 0, rx = 0, ry = 0;
  var hasHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  if (hasHover && cd && cr) {
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

  function closeMenu() {
    if (!bg || !nm) return;
    bg.classList.remove('open');
    nm.classList.remove('open');
    bg.setAttribute('aria-expanded', 'false');
    nm.setAttribute('aria-hidden', 'true');
  }

  if (bg && nm) {
    bg.addEventListener('click', function () {
      var o = bg.classList.toggle('open');
      nm.classList.toggle('open', o);
      bg.setAttribute('aria-expanded', o);
      nm.setAttribute('aria-hidden', !o);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) closeMenu();
    }, { passive: true });
  }

  /* ── PAGE ROUTING (SPA root page + standalone fallback) ── */
  var pageMap = {
    '':          'home',
    '/':         'home',
    '/ara':      'ara',
    '/ara/':     'ara',
    '/rhyssa':   'rhyssa',
    '/rhyssa/':  'rhyssa',
    '/about':    'about',
    '/about/':   'about',
    '/privacy':  'privacy',
    '/privacy/': 'privacy',
    '/terms':    'terms',
    '/terms/':   'terms',
    '/reading':  'reading',
    '/reading/': 'reading'
  };

  var titleMap = {
    'home':    'Aquatic Rhythm — Aligned with Living Systems',
    'ara':     'Aquatic Rhythm Alignment — Reading the Rhythm of Living Aquarium Systems',
    'rhyssa':  'Rhyssa — An Aquarium Companion Shaped by ARA',
    'about':   'About — Where Aquatic Rhythm Came From',
    'privacy': 'Privacy Policy — Aquatic Rhythm',
    'terms':   'Terms of Use — Aquatic Rhythm',
    'reading': 'Reading — Aquatic Rhythm'
  };

  var descMap = {
    'home':    'Your aquarium is a living system. Aquatic Rhythm helps you read it — through ARA, a framework for ecological care, and Rhyssa, a companion shaped by it.',
    'ara':     'Aquatic Rhythm Alignment is a framework for reading living aquarium systems — through phase, rhythm, human capacity, and ecological timing.',
    'rhyssa':  'Rhyssa is an AI aquarium companion shaped by ARA. She helps you understand what your tank is doing — and what it actually needs.',
    'about':   'Aquatic Rhythm began with one experience that many aquarium keepers share. This is where that experience led.',
    'privacy': 'Privacy Policy for Aquatic Rhythm. What we collect, how it is handled, and what it means for you.',
    'terms':   'Terms of Use for Aquatic Rhythm and Rhyssa. Written plainly, without unnecessary complexity.',
    'reading': 'Articles and observations from Aquatic Rhythm — on living aquarium systems, ecological care, and the keepers who tend them.'
  };

  function updateMeta(id) {
    var desc = document.getElementById('meta-desc');
    if (desc && descMap[id]) desc.setAttribute('content', descMap[id]);
  }

  function go(id, push) {
    var path = id === 'home' ? '/' : '/' + id;

    if (!hasSpaPages) {
      if (push !== false) window.location.href = path;
      return;
    }

    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    var t = document.getElementById('pg-' + id);
    if (!t) return;
    t.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'auto' });
    closeMenu();
    setTimeout(function () { observeScrollReveal(t); }, 80);

    if (titleMap[id]) document.title = titleMap[id];
    updateMeta(id);

    if (push !== false) history.pushState({ page: id }, '', path);

    var can = document.querySelector('link[rel="canonical"]');
    if (can) can.setAttribute('href', 'https://aquaticrhythm.com' + path);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', { page_path: path, page_title: id });
    }

    var bar = document.getElementById('progress-bar');
    if (bar) { bar.style.width = '0%'; bar.classList.remove('visible'); }
    setTimeout(updateWaterLevel, 100);
  }

  window.go = go;

  if (hasSpaPages) {
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

    (function () {
      var params = new URLSearchParams(location.search);
      var pParam = params.get('p');
      var id = (pParam && pageMap['/' + pParam]) ? pageMap['/' + pParam] : pageMap[location.pathname] || 'home';
      if (pParam) {
        var cleanPath = '/' + pParam;
        try { history.replaceState({ page: id }, '', cleanPath); } catch (e) {}
      }
      var active = document.querySelector('.page.active');
      if (active) active.classList.remove('active');
      var t = document.getElementById('pg-' + id);
      if (t) {
        t.classList.add('active');
        if (titleMap[id]) document.title = titleMap[id];
        updateMeta(id);
        try { history.replaceState({ page: id }, '', location.pathname); } catch (e) {}
        var path = id === 'home' ? '/' : '/' + id;
        var can = document.querySelector('link[rel="canonical"]');
        if (can) can.setAttribute('href', 'https://aquaticrhythm.com' + path);
        if (typeof gtag !== 'undefined') {
          gtag('event', 'page_view', { page_path: path, page_title: titleMap[id] || id });
        }
      }
    })();
  }

  /* ── SCROLL REVEAL ── */
  var currentObserver = null;

  function observeScrollReveal(scope) {
    scope = scope || document;
    scope.querySelectorAll('.sr').forEach(function (el) { el.classList.remove('in'); });
    if (currentObserver) currentObserver.disconnect();
    currentObserver = new IntersectionObserver(function (entries, ob) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); ob.unobserve(e.target); }
      });
    }, { threshold: .07, rootMargin: '0px 0px -24px 0px' });
    scope.querySelectorAll('.sr').forEach(function (el) { currentObserver.observe(el); });
  }

  (function () {
    var active = hasSpaPages ? document.querySelector('.page.active') : document;
    if (active) observeScrollReveal(active);
  })();

  /* ── READING PROGRESS BAR ── */
  (function () {
    var bar = document.getElementById('progress-bar');
    if (!bar) return;
    var ticking = false;

    function updateProgress() {
      var activePage = hasSpaPages ? document.querySelector('.page.active') : document.documentElement;
      if (!activePage) { bar.style.width = '0%'; bar.classList.remove('visible'); return; }
      var pageH = activePage.scrollHeight || document.documentElement.scrollHeight;
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
    var page = hasSpaPages ? document.querySelector('.page.active') : document.documentElement;
    if (!page) return;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docH = (page.scrollHeight || document.documentElement.scrollHeight) - window.innerHeight;
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

  /* ── MODULAR ARTICLE LEARNING UI ── */
  window.ARLearningUI = (function () {
    function ensurePanel(root) {
      if (!root) return null;
      var panel = root.querySelector('.ar-learning-panel');
      if (panel) return panel;
      panel = document.createElement('aside');
      panel.className = 'ar-learning-panel';
      panel.setAttribute('aria-live', 'polite');
      panel.style.cssText = 'position:sticky;top:78px;z-index:88;margin:0 auto 1rem;padding:.85rem 1rem;border:1px solid rgba(139,189,210,.2);background:rgba(6,16,13,.88);backdrop-filter:blur(6px);max-width:680px;display:none;';
      panel.innerHTML = '<div style="display:flex;justify-content:space-between;gap:.8rem;align-items:flex-start;"><div><p class="ar-progress-copy" style="font-size:.8rem;color:rgba(255,255,255,.8);margin:0 0 .25rem 0;"></p><p class="ar-badge-copy" style="font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(61,214,232,.8);margin:0;"></p></div><button type="button" class="ar-dismiss-all" style="background:none;border:0;color:rgba(255,255,255,.4);cursor:pointer;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;padding:0;">Skip hints</button></div>';
      root.insertBefore(panel, root.firstChild);
      return panel;
    }

    function maybeInjectAfterModule(moduleEl, className, html) {
      if (!moduleEl || moduleEl.querySelector('.' + className)) return;
      var next = moduleEl.querySelector('.mod-next');
      var wrap = document.createElement('div');
      wrap.className = className;
      wrap.innerHTML = html + '<button type="button" class="ar-item-close" style="background:none;border:0;color:rgba(255,255,255,.42);font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;padding:0;margin-top:.5rem;">Skip</button>';
      wrap.style.cssText = 'margin-top:1.1rem;padding:.9rem 1rem;border:1px solid rgba(139,189,210,.15);background:rgba(8,20,16,.65);';
      if (next) moduleEl.insertBefore(wrap, next);
      else moduleEl.appendChild(wrap);
      var close = wrap.querySelector('.ar-item-close');
      if (close) close.addEventListener('click', function () { wrap.style.display = 'none'; });
      return wrap;
    }

    function initModularArticle(config) {
      if (!config || !config.totalMods) return null;
      var wrap = document.querySelector(config.wrapSelector || '.module-wrap');
      if (!wrap) return null;
      var panel = ensurePanel(wrap);
      var storageKey = 'ar_learning_hints_skipped:' + (config.id || location.pathname);
      var dismissedAll = false;
      try { dismissedAll = sessionStorage.getItem(storageKey) === '1'; } catch (e) {}

      if (panel) {
        panel.style.display = dismissedAll ? 'none' : panel.style.display;
        panel.querySelector('.ar-dismiss-all').addEventListener('click', function () {
          dismissedAll = true;
          panel.style.display = 'none';
          wrap.querySelectorAll('.ar-knowledge-check,.ar-curiosity-teaser').forEach(function (el) { el.style.display = 'none'; });
          try { sessionStorage.setItem(storageKey, '1'); } catch (e) {}
        });
      }

      function update(currentMod) {
        if (!currentMod || dismissedAll) return;
        var pct = Math.round((currentMod / config.totalMods) * 100);
        if (panel) {
          panel.style.display = '';
          var progressCopy = (config.progressMessages && config.progressMessages[currentMod]) || ('Anda dah faham ' + pct + '% asas nitrogen cycle.');
          panel.querySelector('.ar-progress-copy').textContent = progressCopy;
          var badgeCopy = (config.badges && config.badges[currentMod]) || '';
          panel.querySelector('.ar-badge-copy').textContent = badgeCopy;
        }

        if (config.checkpoints && config.checkpoints[currentMod]) {
          var c = config.checkpoints[currentMod];
          var modEl = document.getElementById('mod-' + currentMod);
          maybeInjectAfterModule(modEl, 'ar-knowledge-check', '<p style="font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(157,191,154,.75);margin:0 0 .45rem 0;">Knowledge check</p><p style="font-size:.88rem;color:rgba(255,255,255,.78);margin:0;">' + c.question + '</p>');
        }

        if (config.teasers && config.teasers[currentMod]) {
          var t = config.teasers[currentMod];
          var mod = document.getElementById('mod-' + currentMod);
          var teaser = maybeInjectAfterModule(mod, 'ar-curiosity-teaser', '<p style="font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(61,214,232,.7);margin:0 0 .45rem 0;">Curiosity teaser</p><p style="font-size:.86rem;color:rgba(255,255,255,.72);margin:0 0 .5rem 0;">' + t.fact + '</p><a href="#mod-' + t.nextModule + '" data-next-module="' + t.nextModule + '" style="font-size:.64rem;letter-spacing:.13em;text-transform:uppercase;color:rgba(61,214,232,.82);text-decoration:none;">Terus ke modul seterusnya →</a>');
          if (!teaser) teaser = mod && mod.querySelector('.ar-curiosity-teaser');
          var jump = teaser && teaser.querySelector('[data-next-module]');
          if (jump) {
            jump.addEventListener('click', function (e) {
              if (typeof window.goMod === 'function') {
                e.preventDefault();
                window.goMod(parseInt(this.getAttribute('data-next-module'), 10));
              }
            });
          }
        }
      }

      function hide() { if (panel) panel.style.display = 'none'; }
      function show() { if (panel && !dismissedAll) panel.style.display = ''; }
      return { update: update, hide: hide, show: show };
    }

    return { initModularArticle: initModularArticle };
  })();

})();
