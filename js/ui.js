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
    '':            'home',
    '/':           'home',
    '/ara':        'ara',
    '/ara/':       'ara',
    '/rhyssa':     'companion',
    '/rhyssa/':    'companion',
    '/companion':  'companion',
    '/companion/': 'companion',
    '/about':      'about',
    '/about/':     'about',
    '/privacy':    'privacy',
    '/privacy/':   'privacy',
    '/terms':      'terms',
    '/terms/':     'terms',
    '/reading':    'reading',
    '/reading/':   'reading',
    '/tools':      'tools',
    '/tools/':     'tools',
    '/journal':    'journal',
    '/journal/':   'journal',
    '/tank-log':   'tank-log',
    '/tank-log/':  'tank-log'
  };

  var titleMap = {
    'home':      'Aquatic Rhythm — Ecological Care for Small Aquariums',
    'ara':       'Aquatic Rhythm Alignment — Reading Aquarium Ecology',
    'companion': 'Rhyssa — AI Aquarium Companion',
    'about':     'About — Aquatic Rhythm',
    'privacy':   'Privacy Policy — Aquatic Rhythm',
    'terms':     'Terms of Use — Aquatic Rhythm',
    'reading':   'Reading — Aquarium Ecology Guides',
    'tools':     'Labs & Tools — Aquatic Rhythm',
    'journal':   'Keeper\'s Log — Aquatic Rhythm',
    'tank-log':  'Keeper\'s Log — Aquatic Rhythm'
  };

  var descMap = {
    'home':      'Aquatic Rhythm — calm ecology guides for home aquariums. ARA (Aquatic Rhythm Alignment) is the reasoning behind Reading, tools, Rhyssa, and your private keeper\'s log.',
    'ara':       'Explore Aquatic Rhythm Alignment (ARA) as a self-paced module on this site — rhythms, phases, keeper care, four guiding questions, and practical next steps without leaving the framework page.',
    'companion': 'Rhyssa — AI aquarium companion on Aquatic Rhythm, shaped by ARA. Chat in the site; optional ChatGPT link for keepers who prefer it.',
    'about':     'Why Aquatic Rhythm exists — from uneven advice to a calmer, ecology-first way of reading small tanks.',
    'privacy':   'Privacy Policy for Aquatic Rhythm. What we collect, how it is handled, and what it means for you.',
    'terms':     'Terms of Use for Aquatic Rhythm and Rhyssa. Written plainly, without unnecessary complexity.',
    'reading':   'Short aquarium ecology guides — modular, mobile-friendly, grounded in ARA. Expand a title for details; simulators live under Labs & tools.',
    'tools':     'Interactive aquarium simulators and planners. Try decisions on screen before you make them in the tank.',
    'journal':   'A keeper\'s log for your aquarium. Observe, reflect, and track your ARA rhythm — stored privately on your device.',
    'tank-log':  'Your aquarium\'s keeper log — ARA phase, rhythm, tank family, and private entries. Stored on your device.'
  };

  function updateMeta(id) {
    var desc = document.getElementById('meta-desc');
    if (desc && descMap[id]) desc.setAttribute('content', descMap[id]);
  }

  function setMetaTag(selector, content) {
    if (!content) return;
    var el = document.querySelector(selector);
    if (el) el.setAttribute('content', content);
  }

  /** Keeps og:* and twitter:* in sync with SPA route (crawlers and shares). */
  function updateSocialMeta(id) {
    var title = titleMap[id];
    var desc = descMap[id];
    if (!title || !desc) return;
    var path = id === 'home' ? '/' : '/' + id;
    var url = 'https://aquaticrhythm.com' + path;
    setMetaTag('meta[property="og:type"]', 'website');
    setMetaTag('meta[property="og:url"]', url);
    setMetaTag('meta[property="og:title"]', title);
    setMetaTag('meta[property="og:description"]', desc);
    setMetaTag('meta[name="twitter:url"]', url);
    setMetaTag('meta[name="twitter:title"]', title);
    setMetaTag('meta[name="twitter:description"]', desc);
  }

  function updateBottomNav(id) {
    var navId = id === 'tank-log' ? 'journal' : id;
    document.querySelectorAll('.bnav-item').forEach(function (item) {
      var tab = item.getAttribute('data-bnav');
      item.classList.toggle('active', tab === navId);
      item.setAttribute('aria-current', tab === navId ? 'page' : 'false');
    });
  }

  function closeAllReadingAccordions() {
    var root = document.getElementById('pg-reading');
    if (!root) return;
    root.querySelectorAll('.rd-card--acc.is-expanded').forEach(function (card) {
      card.classList.remove('is-expanded');
      var btn = card.querySelector('.rd-card-hit');
      var panel = card.querySelector('.rd-card-panel');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (panel) panel.hidden = true;
    });
  }

  function initReadingAccordionTitles() {
    var root = document.getElementById('pg-reading');
    if (!root) return;
    root.querySelectorAll('.rd-card--acc').forEach(function (card) {
      var hitText = card.querySelector('.rd-card-hit-text');
      var h2 = card.querySelector('.rd-card-panel .rd-card-title');
      if (!hitText || !h2 || hitText.textContent.trim()) return;
      hitText.textContent = h2.textContent.replace(/\s+/g, ' ').trim();
    });
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
    document.body.setAttribute('data-active-page', id);
    window.scrollTo({ top: 0, behavior: 'auto' });
    closeMenu();
    updateBottomNav(id);
    setTimeout(function () { observeScrollReveal(t); }, 80);
    if (id === 'companion' && typeof window.__rhCompanionInit === 'function') {
      setTimeout(window.__rhCompanionInit, 80);
    }
    if (window.__araModTick) setTimeout(window.__araModTick, 100);

    if (id !== 'reading') closeAllReadingAccordions();
    else {
      closeAllReadingAccordions();
      initReadingAccordionTitles();
    }

    if (titleMap[id]) document.title = titleMap[id];
    updateMeta(id);
    updateSocialMeta(id);

    if (push !== false) history.pushState({ page: id }, '', path);

    var can = document.querySelector('link[rel="canonical"]');
    if (can) can.setAttribute('href', 'https://aquaticrhythm.com' + path);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', { page_path: path, page_title: id });
    }

    setTimeout(updateWaterLevel, 100);
  }

  window.go = go;

  /* ── Home hero: override .hero min-height on mobile (cache-resilient) ── */
  (function () {
    var hero = document.querySelector('.home-hero');
    if (!hero) return;
    function applyHeroFix() {
      if (window.innerWidth < 900) {
        hero.style.minHeight = 'auto';
        hero.style.display = 'block';
        hero.style.alignItems = 'flex-start';
        hero.style.paddingTop = 'calc(68px + clamp(1.75rem, 7vh, 3.5rem))';
        hero.style.paddingBottom = 'clamp(2rem, 6vh, 3.25rem)';
      } else {
        hero.style.minHeight = '100svh';
        hero.style.display = 'flex';
        hero.style.alignItems = 'center';
        hero.style.paddingTop = '68px';
        hero.style.paddingBottom = '0';
      }
    }
    applyHeroFix();
    window.addEventListener('resize', applyHeroFix, { passive: true });
  }());

  /* ── ARA page: module nav scroll spy (highlights current section) ── */
  function initAraModScrollSpy() {
    if (window.__araModSpyInit) return;
    var root = document.getElementById('pg-ara');
    var nav = root && root.querySelector('.ara-mod-nav');
    if (!root || !nav) return;
    window.__araModSpyInit = true;
    var ids = ['ara-frame', 'ara-what', 'ara-lenses', 'ara-keeper', 'ara-shame', 'ara-principles', 'ara-practice'];
    var links = {};
    ids.forEach(function (id) {
      var a = nav.querySelector('a[href="#' + id + '"]');
      if (a) links[id] = a;
    });
    function setActive(id) {
      ids.forEach(function (i) {
        var link = links[i];
        if (!link) return;
        link.classList.toggle('is-active', i === id);
        link.setAttribute('aria-current', i === id ? 'true' : 'false');
      });
    }
    function tick() {
      if (!root.classList.contains('active')) {
        ids.forEach(function (i) {
          var link = links[i];
          if (!link) return;
          link.classList.remove('is-active');
          link.setAttribute('aria-current', 'false');
        });
        return;
      }
      var y = window.scrollY || document.documentElement.scrollTop;
      var lim = y + 132;
      var activeId = ids[0];
      for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (!el) continue;
        var docTop = el.getBoundingClientRect().top + y;
        if (docTop <= lim) activeId = ids[i];
      }
      var docEl = document.documentElement;
      var maxScroll = Math.max(0, (docEl.scrollHeight || 0) - window.innerHeight);
      if (maxScroll > 0 && y >= maxScroll - 6) activeId = ids[ids.length - 1];
      setActive(activeId);
    }
    window.__araModTick = tick;
    var raf = null;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        tick();
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    tick();
  }
  initAraModScrollSpy();

  if (hasSpaPages) {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-page]');
      if (!link) return;
      e.preventDefault();
      go(link.getAttribute('data-page'));
    });

    window.addEventListener('popstate', function (e) {
      if (window.__rhSuppressSpaNav) { window.__rhSuppressSpaNav = false; return; }
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
        document.body.setAttribute('data-active-page', id);
        updateBottomNav(id);
        if (titleMap[id]) document.title = titleMap[id];
        updateMeta(id);
        updateSocialMeta(id);
        try { history.replaceState({ page: id }, '', location.pathname); } catch (e) {}
        var path = id === 'home' ? '/' : '/' + id;
        var can = document.querySelector('link[rel="canonical"]');
        if (can) can.setAttribute('href', 'https://aquaticrhythm.com' + path);
        if (typeof gtag !== 'undefined') {
          gtag('event', 'page_view', { page_path: path, page_title: titleMap[id] || id });
        }
        if (window.__araModTick && id === 'ara') setTimeout(window.__araModTick, 120);
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

  var RHYSSA_GPT_URL = 'https://chatgpt.com/g/g-6a09401c8ef48191b18deb53565a7fe1-rhyssa-aquarium-companion';

  function rhCopyToClipboard(text, onOk, onFail) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onOk).catch(function () { if (onFail) onFail(); });
      return;
    }
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      onOk();
    } catch (err) {
      if (onFail) onFail();
    }
  }

  function rhFlashLabel(el, labelText, ms) {
    var lbl = el.querySelector('.rh-copy-lbl, .rh-chip-lbl');
    if (!lbl) return;
    if (!lbl.getAttribute('data-rh-orig')) lbl.setAttribute('data-rh-orig', lbl.textContent);
    lbl.textContent = labelText;
    clearTimeout(el._rhFlashT);
    el._rhFlashT = setTimeout(function () {
      lbl.textContent = lbl.getAttribute('data-rh-orig') || '';
    }, ms || 1800);
  }

  document.addEventListener('click', function (e) {
    var pasteEl = e.target.closest('[data-rh-paste]');
    if (pasteEl) {
      e.preventDefault();
      var pasteText = pasteEl.getAttribute('data-rh-paste');
      if (!pasteText) return;
      rhCopyToClipboard(pasteText, function () {
        pasteEl.classList.add('rh-copied');
        rhFlashLabel(pasteEl, 'Copied', 2000);
        setTimeout(function () { pasteEl.classList.remove('rh-copied'); }, 2000);
      });
      return;
    }
    var copyGpt = e.target.closest('[data-copy-rhyssa]');
    if (copyGpt) {
      e.preventDefault();
      rhCopyToClipboard(RHYSSA_GPT_URL, function () {
        rhFlashLabel(copyGpt, 'Copied', 2000);
      });
      return;
    }
    if (e.target.closest('.rd-card-go')) return;
    var hit = e.target.closest('.rd-card-hit');
    if (!hit) return;
    var card = hit.closest('.rd-card--acc');
    var root = document.getElementById('pg-reading');
    if (!card || !root || !root.contains(card)) return;
    e.preventDefault();
    var panel = card.querySelector('.rd-card-panel');
    if (card.classList.contains('is-expanded')) {
      card.classList.remove('is-expanded');
      hit.setAttribute('aria-expanded', 'false');
      if (panel) panel.hidden = true;
      return;
    }
    closeAllReadingAccordions();
    card.classList.add('is-expanded');
    hit.setAttribute('aria-expanded', 'true');
    if (panel) panel.hidden = false;
    initReadingAccordionTitles();
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var pg = document.getElementById('pg-reading');
    if (!pg || !pg.classList.contains('active')) return;
    closeAllReadingAccordions();
  });

  initReadingAccordionTitles();


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

  /* ── JOURNAL ── */
  (function () {
    var JN_KEY = 'ar_journal';
    var jnHistoryPage = 1;
    var JN_PAGE_SIZE  = 10;
    var STREAK_MILESTONES = [4, 8, 12, 26, 52];
    var jnFilter = { query: '', days: 0, care: [], state: [] };
    var jnFilteredEntries = [];
    var INH_CATS = { fish:'🐟', plant:'🌿', invertebrate:'🦐', coral:'🪸', other:'◈' };
    var INH_CAT_LABELS = { fish:'Fish', plant:'Plant', invertebrate:'Invertebrate', coral:'Coral', other:'Other' };

    function escHtml(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function migrateData(d) {
      if (d.profile && !d.tanks) {
        var tank = {
          id: 'tank_' + Date.now(),
          profile: d.profile,
          entries: d.entries || [],
          inhabitants: d.inhabitants || []
        };
        d.tanks = [tank];
        d.activeTankId = tank.id;
        delete d.profile; delete d.entries; delete d.inhabitants;
      }
      if (!d.tanks) d.tanks = [];
      if (!d._entryIdsMigrated) {
        d.tanks.forEach(function (tank) {
          (tank.entries || []).forEach(function (e, i) {
            if (!e.id) e.id = 'e_' + (tank.id || 'x') + '_' + i;
          });
        });
        d._entryIdsMigrated = true;
      }
      return d;
    }

    function loadData() {
      try { return migrateData(JSON.parse(localStorage.getItem(JN_KEY)) || {}); } catch (e) { return migrateData({}); }
    }
    function saveData(d) {
      try { localStorage.setItem(JN_KEY, JSON.stringify(d)); } catch (e) {}
    }

    function getActiveTank(d) {
      if (!d.tanks || !d.tanks.length) return null;
      for (var i = 0; i < d.tanks.length; i++) {
        if (d.tanks[i].id === d.activeTankId) return d.tanks[i];
      }
      return d.tanks[0];
    }

    function assessPhaseFromParams(params) {
      if (!params) return null;
      var nh3 = parseFloat(params.nh3);
      var no2 = parseFloat(params.no2);
      var no3 = parseFloat(params.no3);
      if (isNaN(nh3) && isNaN(no2)) return null;
      nh3 = isNaN(nh3) ? 0 : nh3;
      no2 = isNaN(no2) ? 0 : no2;
      no3 = isNaN(no3) ? 999 : no3;
      if (nh3 > 0.5 || no2 > 0.25) return 'establish';
      if (nh3 > 0 || no2 > 0) return 'stabilise';
      if (no3 > 20) return 'stabilise';
      if (no3 > 10) return 'optimise';
      return 'sustain';
    }

    function assessPhaseFromState(keeperState, setupDate) {
      var ageWeeks = 999;
      if (setupDate) {
        var days = Math.floor((new Date() - new Date(setupDate)) / 86400000);
        ageWeeks = days / 7;
      }
      if (keeperState === 'just-starting' || ageWeeks < 4) return 'establish';
      if (keeperState === 'catching-up') return 'stabilise';
      if (keeperState === 'consistent' && ageWeeks > 8) return 'sustain';
      return 'optimise';
    }

    var phaseInfo = {
      establish: {
        label: 'Establishing',
        note: 'Tank is building its foundation. Biology is still finding rhythm — give it time, avoid big changes.',
        next: 'Watch for: ammonia and nitrite dropping toward zero over the coming weeks.',
        color: 'rgba(220,140,60,.9)'
      },
      stabilise: {
        label: 'Stabilising',
        note: 'The cycle is completing. Parameters are moving in the right direction — maintain routine.',
        next: 'Watch for: consistent zero readings and clearer water.',
        color: 'rgba(200,190,60,.9)'
      },
      optimise: {
        label: 'Optimising',
        note: 'Tank is stable. Focus on rhythm: consistent care, observing behaviour, small refinements.',
        next: 'Watch for: how your care rhythm affects livestock behaviour and plant growth.',
        color: 'rgba(61,214,232,.9)'
      },
      sustain: {
        label: 'Sustaining',
        note: 'Ecosystem is mature. Your rhythm is aligned. Maintain, observe, resist unnecessary interventions.',
        next: 'Watch for: the quiet signs — how your tank feels, not just what it reads.',
        color: 'rgba(100,200,82,.9)'
      }
    };

    function tankAge(dateStr) {
      if (!dateStr) return '';
      var then = new Date(dateStr);
      var now = new Date();
      var days = Math.floor((now - then) / 86400000);
      if (days < 1) return 'set up today';
      if (days === 1) return '1 day old';
      if (days < 30) return days + ' days old';
      var months = Math.floor(days / 30);
      if (months === 1) return '1 month old';
      if (months < 24) return months + ' months old';
      return Math.floor(months / 12) + ' years old';
    }

    var keeperStateLabels = { 'consistent': 'Consistent', 'catching-up': 'Catching up', 'occasional': 'Occasional', 'just-starting': 'Just starting' };
    var careLabels = { 'water_change': 'Water change', 'filter': 'Filter', 'feeding': 'Feeding', 'top_up': 'Topping up', 'treatment': 'Treatment', 'dosing': 'Dosing', 'media': 'Media change', 'trimming': 'Trimming', 'nothing': 'Just observed' };

    /* ── Tank size data ── */
    var PRESETS = [
      { v:10,  u:'L', s:'rect',   d:[30,20,20],  cat:'Nano'   },
      { v:19,  u:'L', s:'rect',   d:[37,22,26],  cat:'Nano'   },
      { v:30,  u:'L', s:'rect',   d:[45,24,28],  cat:'Nano'   },
      { v:45,  u:'L', s:'rect',   d:[55,28,30],  cat:'Small'  },
      { v:60,  u:'L', s:'rect',   d:[60,30,36],  cat:'Small'  },
      { v:75,  u:'L', s:'rect',   d:[70,35,32],  cat:'Small'  },
      { v:90,  u:'L', s:'rect',   d:[80,35,32],  cat:'Medium' },
      { v:120, u:'L', s:'rect',   d:[80,35,44],  cat:'Medium' },
      { v:150, u:'L', s:'rect',   d:[100,40,38], cat:'Medium' },
      { v:200, u:'L', s:'rect',   d:[100,40,50], cat:'Large'  },
      { v:240, u:'L', s:'rect',   d:[120,45,46], cat:'Large'  },
      { v:300, u:'L', s:'rect',   d:[150,50,40], cat:'XL'     },
    ];

    var BRANDS = {
      fluval:   { label:'Fluval', models:[
        { n:'Flex 9 gal',  v:34,  u:'L', s:'curved', d:[33,21,22] },
        { n:'Flex 15 gal', v:57,  u:'L', s:'curved', d:[41,25,31] },
        { n:'Flex 32 gal', v:121, u:'L', s:'curved', d:[64,38,37] },
        { n:'Spec III',    v:10,  u:'L', s:'rect',   d:[38,22,13] },
        { n:'Spec V',      v:19,  u:'L', s:'rect',   d:[52,19,30] },
        { n:'Evo 13.5g',   v:51,  u:'L', s:'rect',   d:[52,27,34] },
        { n:'Roma 90',     v:90,  u:'L', s:'rect',   d:[80,35,40] },
        { n:'Roma 125',    v:125, u:'L', s:'rect',   d:[80,35,50] },
        { n:'Roma 200',    v:200, u:'L', s:'rect',   d:[100,40,55] },
      ]},
      ada:      { label:'ADA', models:[
        { n:'30C Cube',   v:27,  u:'L', s:'cube', d:[30,30,30] },
        { n:'45P',        v:32,  u:'L', s:'rect', d:[45,27,30] },
        { n:'60P',        v:65,  u:'L', s:'rect', d:[60,30,36] },
        { n:'60F (Low)',  v:54,  u:'L', s:'rect', d:[60,30,30] },
        { n:'90P',        v:182, u:'L', s:'rect', d:[90,45,45] },
        { n:'120P',       v:324, u:'L', s:'rect', d:[120,45,60] },
      ]},
      dennerle: { label:'Dennerle', models:[
        { n:'Nano Cube 10L', v:10, u:'L', s:'cube', d:[20,20,28] },
        { n:'Nano Cube 20L', v:20, u:'L', s:'cube', d:[25,25,35] },
        { n:'Nano Cube 30L', v:30, u:'L', s:'cube', d:[30,30,35] },
        { n:'Nano Cube 60L', v:60, u:'L', s:'rect', d:[40,35,45] },
        { n:"Scaper's 35L",  v:35, u:'L', s:'rect', d:[50,30,30] },
        { n:"Scaper's 55L",  v:55, u:'L', s:'rect', d:[60,35,30] },
      ]},
      waterbox: { label:'Waterbox', models:[
        { n:'Mini 6',  v:23,  u:'L', s:'rect', d:[30,26,38] },
        { n:'AIO 20',  v:76,  u:'L', s:'rect', d:[50,38,50] },
        { n:'AIO 45',  v:170, u:'L', s:'rect', d:[70,46,62] },
      ]},
      biorb:    { label:'biOrb', models:[
        { n:'biOrb 15L',  v:15,  u:'L', s:'sphere', d:[28,28,35] },
        { n:'biOrb 30L',  v:30,  u:'L', s:'sphere', d:[37,37,43] },
        { n:'biOrb 60L',  v:60,  u:'L', s:'sphere', d:[49,49,56] },
        { n:'biOrb 105L', v:105, u:'L', s:'sphere', d:[60,60,70] },
      ]},
      juwel:    { label:'Juwel', models:[
        { n:'Primo 70',   v:70,  u:'L', s:'rect',   d:[61,31,47] },
        { n:'Lido 120',   v:120, u:'L', s:'rect',   d:[61,41,58] },
        { n:'Rio 125',    v:125, u:'L', s:'rect',   d:[81,36,50] },
        { n:'Rio 180',    v:180, u:'L', s:'rect',   d:[101,41,50] },
        { n:'Rio 240',    v:240, u:'L', s:'rect',   d:[121,41,55] },
        { n:'Vision 180', v:180, u:'L', s:'curved', d:[92,41,55] },
      ]},
    };

    var CAT_COLORS = { Nano:'rgba(100,200,82,.7)', Small:'rgba(61,214,232,.7)', Medium:'rgba(100,150,220,.7)', Large:'rgba(200,150,60,.7)', XL:'rgba(200,80,80,.7)' };

    function tankCategory(vol) {
      if (!vol) return '';
      if (vol <= 20) return 'Nano';
      if (vol <= 60) return 'Small';
      if (vol <= 120) return 'Medium';
      if (vol <= 250) return 'Large';
      return 'XL';
    }

    function setHiddenInputs(vol, unit, shape) {
      var g = function (id) { return document.getElementById(id); };
      if (g('mt-inp-volume')) g('mt-inp-volume').value = vol || '';
      if (g('mt-inp-unit'))   g('mt-inp-unit').value   = unit  || 'L';
      if (g('mt-inp-shape'))  g('mt-inp-shape').value  = shape || 'rect';
    }

    function updatePreview(vol, unit, shape, dims) {
      var tankEl = document.getElementById('mt-preview-tank');
      var volEl  = document.getElementById('mt-preview-vol');
      var catEl  = document.getElementById('mt-preview-cat');
      if (!tankEl) return;
      var H = 78;
      var ratio = (dims && dims[0] && dims[2]) ? dims[0] / dims[2] : 1.65;
      ratio = Math.max(0.45, Math.min(3.5, ratio));
      var W, br;
      if (shape === 'sphere') {
        W = H; br = '50%';
      } else if (shape === 'cube') {
        W = H; br = '5px';
      } else if (shape === 'curved') {
        W = Math.round(H * ratio);
        W = Math.max(44, Math.min(210, W));
        br = '12px 12px 4px 4px';
      } else {
        W = Math.round(H * ratio);
        W = Math.max(44, Math.min(210, W));
        br = '3px';
      }
      tankEl.style.width  = W + 'px';
      tankEl.style.height = H + 'px';
      tankEl.style.borderRadius = br;
      if (vol) {
        volEl.textContent = vol + ' ' + (unit || 'L');
        var cat = tankCategory(vol);
        catEl.textContent = cat;
        catEl.style.color = CAT_COLORS[cat] || 'rgba(255,255,255,.3)';
      } else {
        volEl.textContent = '—';
        catEl.textContent = 'Choose a size or brand below';
        catEl.style.color = '';
      }
    }

    function recalcCustom() {
      var g = function (id) { var el = document.getElementById(id); return el ? parseFloat(el.value) || 0 : 0; };
      var l = g('mt-dim-l'), w = g('mt-dim-w'), h = g('mt-dim-h');
      var activeUnitBtn = document.querySelector('.mt-unit-btn.active');
      var dimUnit = activeUnitBtn ? activeUnitBtn.dataset.dimunit : 'cm';
      var outEl = document.getElementById('mt-dim-vol-out');
      if (l && w && h) {
        var vol, unit;
        if (dimUnit === 'cm') { vol = Math.round(l * w * h / 1000); unit = 'L'; }
        else { vol = Math.round(l * w * h / 231 * 10) / 10; unit = 'gal'; }
        if (outEl) outEl.textContent = vol + ' ' + unit;
        setHiddenInputs(vol, unit, 'rect');
        updatePreview(vol, unit, 'rect', [l, w, h]);
        var nameEl = document.getElementById('mt-inp-name');
        if (nameEl && !nameEl.value) nameEl.value = 'My ' + vol + ' ' + unit + ' Tank';
      } else {
        if (outEl) outEl.textContent = '—';
      }
    }

    function resetSetupModal() {
      document.querySelectorAll('.mt-preset-chip,.mt-brand-btn,.mt-model-chip').forEach(function (c) { c.classList.remove('active'); });
      var modelSel = document.getElementById('mt-model-selector');
      if (modelSel) { modelSel.style.display = 'none'; modelSel.innerHTML = ''; }
      var outEl = document.getElementById('mt-dim-vol-out');
      if (outEl) outEl.textContent = '—';
      ['mt-dim-l', 'mt-dim-w', 'mt-dim-h'].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = '';
      });
      updatePreview(null);
    }

    function rhythmWeeks(entries) {
      var now = new Date();
      var result = [false, false, false, false, false, false, false, false];
      (entries || []).forEach(function (e) {
        if (!e.date) return;
        var days = Math.floor((now - new Date(e.date)) / 86400000);
        var week = Math.floor(days / 7);
        if (week >= 0 && week < 8) result[week] = true;
      });
      return result;
    }

    /* ── Tank type SVG icon ── */
    function tankTypeIcon(type, shape) {
      var c = {
        freshwater: 'rgba(61,214,232,.6)',
        planted:    'rgba(100,200,82,.7)',
        marine:     'rgba(61,130,232,.7)',
        brackish:   'rgba(150,180,100,.65)',
        coldwater:  'rgba(160,210,240,.65)',
        paludarium: 'rgba(120,200,120,.65)'
      }[type] || 'rgba(61,214,232,.5)';
      if (type === 'planted') {
        return '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="5" width="16" height="11" rx="1.2" stroke="' + c + '" stroke-width="1.2" fill="none"/><line x1="7" y1="16" x2="5" y2="10" stroke="' + c + '" stroke-width="1" stroke-linecap="round"/><line x1="10" y1="16" x2="10" y2="8" stroke="' + c + '" stroke-width="1" stroke-linecap="round"/><line x1="13" y1="16" x2="15" y2="10" stroke="' + c + '" stroke-width="1" stroke-linecap="round"/></svg>';
      }
      if (type === 'marine') {
        return '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="5" width="16" height="11" rx="1.2" stroke="' + c + '" stroke-width="1.2" fill="none"/><path d="M5 14 Q7 11 9 14 Q11 11 13 14" stroke="' + c + '" stroke-width="1" fill="none" stroke-linecap="round"/></svg>';
      }
      if (type === 'paludarium') {
        return '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="5" width="16" height="11" rx="1.2" stroke="' + c + '" stroke-width="1.2" fill="none"/><line x1="2" y1="12" x2="18" y2="12" stroke="' + c + '" stroke-width=".8" opacity=".5"/><line x1="8" y1="12" x2="7" y2="7" stroke="' + c + '" stroke-width="1" stroke-linecap="round"/><line x1="11" y1="12" x2="12" y2="6" stroke="' + c + '" stroke-width="1" stroke-linecap="round"/></svg>';
      }
      if (shape === 'sphere') {
        return '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="' + c + '" stroke-width="1.2" fill="none"/><path d="M4 10 Q10 7.5 16 10" stroke="' + c + '" stroke-width=".8" fill="none" opacity=".5"/></svg>';
      }
      if (shape === 'cube') {
        return '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="13" height="13" stroke="' + c + '" stroke-width="1.2" fill="none"/><line x1="3" y1="11" x2="16" y2="11" stroke="' + c + '" stroke-width=".8" opacity=".4"/></svg>';
      }
      return '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="5" width="16" height="11" rx="1.2" stroke="' + c + '" stroke-width="1.2" fill="none"/><line x1="2" y1="12" x2="18" y2="12" stroke="' + c + '" stroke-width=".7" opacity=".4"/></svg>';
    }

    /* ── Large tank icons for overview cards ── */
    function tankTypeIconLg(type, shape) {
      var cols = {
        freshwater: 'rgba(61,214,232,.55)',
        planted:    'rgba(100,200,82,.65)',
        marine:     'rgba(61,130,232,.7)',
        brackish:   'rgba(150,180,100,.6)',
        coldwater:  'rgba(160,210,240,.65)',
        paludarium: 'rgba(120,200,120,.65)'
      };
      var c = cols[type] || 'rgba(61,214,232,.45)';
      var fill = 'rgba(61,214,232,.04)';
      if (type === 'planted') {
        return '<svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true" fill="none">'
          + '<rect x="5" y="12" width="44" height="30" rx="2.5" stroke="' + c + '" stroke-width="1.5" fill="rgba(100,200,82,.05)"/>'
          + '<line x1="5" y1="34" x2="49" y2="34" stroke="' + c + '" stroke-width=".8" opacity=".3"/>'
          + '<line x1="17" y1="42" x2="13" y2="26" stroke="' + c + '" stroke-width="1.4" stroke-linecap="round"/>'
          + '<line x1="27" y1="42" x2="27" y2="20" stroke="' + c + '" stroke-width="1.4" stroke-linecap="round"/>'
          + '<line x1="37" y1="42" x2="41" y2="26" stroke="' + c + '" stroke-width="1.4" stroke-linecap="round"/>'
          + '</svg>';
      }
      if (type === 'marine') {
        return '<svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true" fill="none">'
          + '<rect x="5" y="12" width="44" height="30" rx="2.5" stroke="' + c + '" stroke-width="1.5" fill="rgba(61,130,232,.05)"/>'
          + '<path d="M10 36 Q15 28 20 36 Q25 28 30 36 Q35 28 40 36 Q44 30 49 33" stroke="' + c + '" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
          + '<circle cx="20" cy="22" r="3.5" stroke="' + c + '" stroke-width="1" opacity=".6"/>'
          + '<line x1="5" y1="29" x2="49" y2="29" stroke="' + c + '" stroke-width=".8" opacity=".2"/>'
          + '</svg>';
      }
      if (type === 'paludarium') {
        return '<svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true" fill="none">'
          + '<rect x="5" y="12" width="44" height="30" rx="2.5" stroke="' + c + '" stroke-width="1.5" fill="rgba(120,200,120,.05)"/>'
          + '<line x1="5" y1="30" x2="49" y2="30" stroke="' + c + '" stroke-width="1" opacity=".35"/>'
          + '<line x1="17" y1="30" x2="14" y2="20" stroke="' + c + '" stroke-width="1.3" stroke-linecap="round"/>'
          + '<line x1="27" y1="30" x2="27" y2="16" stroke="' + c + '" stroke-width="1.3" stroke-linecap="round"/>'
          + '<line x1="37" y1="30" x2="40" y2="20" stroke="' + c + '" stroke-width="1.3" stroke-linecap="round"/>'
          + '</svg>';
      }
      if (shape === 'sphere') {
        return '<svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true" fill="none">'
          + '<circle cx="27" cy="27" r="22" stroke="' + c + '" stroke-width="1.5" fill="rgba(61,214,232,.04)"/>'
          + '<path d="M8 27 Q27 19 46 27" stroke="' + c + '" stroke-width="1" opacity=".4"/>'
          + '<path d="M8 33 Q27 25 46 33" stroke="' + c + '" stroke-width=".8" opacity=".2"/>'
          + '</svg>';
      }
      if (shape === 'cube') {
        return '<svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true" fill="none">'
          + '<rect x="8" y="8" width="37" height="37" stroke="' + c + '" stroke-width="1.5" fill="rgba(61,214,232,.04)"/>'
          + '<line x1="8" y1="33" x2="45" y2="33" stroke="' + c + '" stroke-width=".8" opacity=".3"/>'
          + '</svg>';
      }
      return '<svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true" fill="none">'
        + '<rect x="5" y="14" width="44" height="28" rx="2.5" stroke="' + c + '" stroke-width="1.5" fill="rgba(61,214,232,.04)"/>'
        + '<line x1="5" y1="32" x2="49" y2="32" stroke="' + c + '" stroke-width="1" opacity=".3"/>'
        + '<ellipse cx="20" cy="25" rx="7" ry="4" fill="' + c + '" opacity=".35"/>'
        + '<path d="M14 25 L10 20.5 L10 29.5 Z" fill="' + c + '" opacity=".3"/>'
        + '</svg>';
    }

    /* ── Journal overview: card list of all tanks ── */
    function renderJournalOverview() {
      var cardsEl = document.getElementById('jn-tank-cards');
      if (!cardsEl) return;
      var d = loadData();
      if (!d.tanks || !d.tanks.length) {
        cardsEl.innerHTML = '<div class="jn-ov-empty">'
          + '<div class="jn-ov-empty-icon" aria-hidden="true">'
          + '<svg width="52" height="52" viewBox="0 0 52 52" fill="none"><rect x="5" y="14" width="42" height="27" rx="2.5" stroke="rgba(61,214,232,.28)" stroke-width="1.4"/><line x1="5" y1="32" x2="47" y2="32" stroke="rgba(61,214,232,.14)" stroke-width="1"/><line x1="15" y1="24" x2="37" y2="24" stroke="rgba(61,214,232,.22)" stroke-width="1.2" stroke-linecap="round"/></svg>'
          + '</div>'
          + '<h2 class="jn-ov-empty-title">Start your log</h2>'
          + '<p class="jn-ov-empty-desc">Set up your first aquarium to begin writing entries, tracking your rhythm, and reading your ARA phase.</p>'
          + '<button class="btn bf" id="jn-ov-setup-open">Set up my aquarium</button>'
          + '</div>';
        return;
      }
      cardsEl.innerHTML = d.tanks.map(function (t) {
        var p = t.profile || {};
        var entries = t.entries || [];
        var inhs = t.inhabitants || [];
        var lastEntry = entries.length ? entries[entries.length - 1] : null;
        var phase = null;
        if (lastEntry && lastEntry.params) phase = assessPhaseFromParams(lastEntry.params);
        if (!phase && lastEntry) phase = assessPhaseFromState(lastEntry.keeperState, p.setupDate);
        var phData = phase ? phaseInfo[phase] : null;
        var age = tankAge(p.setupDate);
        var meta = [(p.volume ? p.volume + ' ' + (p.unit || 'L') : ''), p.type, age].filter(Boolean).join(' · ');
        var icon = tankTypeIconLg(p.type, p.shape);
        var activeInhs = inhs.filter(function (i) { return i.status !== 'passed' && i.status !== 'rehomed'; }).length;
        var entryLabel = entries.length ? entries.length + (entries.length === 1 ? ' entry' : ' entries') : '';
        return '<button class="jn-tank-card" data-tank-id="' + t.id + '" aria-label="Open log for ' + (p.name || 'tank') + '">'
          + '<div class="jn-card-icon">' + icon + '</div>'
          + '<div class="jn-card-body">'
          + '<h3 class="jn-card-name">' + (escHtml(p.name) || 'My Tank') + '</h3>'
          + '<p class="jn-card-meta">' + meta + '</p>'
          + (phData ? '<span class="jn-card-phase" style="color:' + phData.color + '">' + phData.label + '</span>'
                    : '<span class="jn-card-phase jn-card-phase--empty">' + (entries.length ? '—' : 'No entries yet') + '</span>')
          + (activeInhs || entryLabel
            ? '<span class="jn-card-stats">' + [activeInhs ? activeInhs + (activeInhs === 1 ? ' resident' : ' residents') : '', entryLabel].filter(Boolean).join(' · ') + '</span>'
            : '')
          + '</div>'
          + '<div class="jn-card-arrow" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
          + '</button>';
      }).join('')
      + '<button class="jn-card-add" id="jn-ov-add-tank">+ Add aquarium</button>';
    }

    /* ── Tank selector renderer ── */
    function renderTankSelector(d) {
      var sel = document.getElementById('jn-tank-selector');
      if (!sel) return;
      if (!d.tanks || d.tanks.length <= 1) { sel.style.display = 'none'; return; }
      sel.classList.add('jn-tank-selector');
      sel.style.display = 'flex';
      sel.innerHTML = d.tanks.map(function (t) {
        var active = t.id === d.activeTankId;
        var icon = tankTypeIcon((t.profile || {}).type, (t.profile || {}).shape);
        var name = ((t.profile || {}).name || 'Tank');
        return '<button class="jn-tank-tab' + (active ? ' active' : '') + '" data-tank-id="' + t.id + '">'
          + '<span class="jn-ttab-icon">' + icon + '</span>'
          + '<span class="jn-ttab-name">' + name + '</span>'
          + '</button>';
      }).join('')
      + '<button class="jn-tank-tab jn-tank-add" id="jn-add-tank" title="Add aquarium">'
      + '<span class="jn-ttab-icon" style="font-size:1.1rem;line-height:1;color:rgba(255,255,255,.3)">+</span>'
      + '<span class="jn-ttab-name" style="color:rgba(255,255,255,.2)">Add</span>'
      + '</button>';
    }

    /* ── P1: Entry list with pagination ── */
    function renderEntryList(entries, page) {
      var entryList = document.getElementById('jn-entry-list');
      if (!entryList) return;
      if (!entries.length) { entryList.innerHTML = ''; return; }
      var reversed = entries.slice().reverse();
      var shown    = reversed.slice(0, page * JN_PAGE_SIZE);
      var hasMore  = reversed.length > shown.length;
      entryList.innerHTML = shown.map(function (e) {
        var stateLabel = keeperStateLabels[e.keeperState] || '';
        var careStr    = (e.care || []).map(function (c) { return careLabels[c] || c; }).join(', ');
        var paramsStr  = '';
        if (e.params) {
          var parts = [];
          if (e.params.ph)   parts.push('pH ' + e.params.ph);
          if (e.params.nh3)  parts.push('NH₃ ' + e.params.nh3);
          if (e.params.no2)  parts.push('NO₂ ' + e.params.no2);
          if (e.params.no3)  parts.push('NO₃ ' + e.params.no3);
          if (e.params.temp) parts.push(e.params.temp + '°C');
          if (e.params.gh)   parts.push('GH ' + e.params.gh);
          if (e.params.kh)   parts.push('KH ' + e.params.kh);
          if (e.params.sg)   parts.push('SG ' + e.params.sg);
          if (parts.length) paramsStr = parts.join(' · ');
        }
        var rhMsg = encodeURIComponent('On ' + (e.date || 'a recent day') + ' I wrote: "' + (e.observation || '').slice(0, 120) + '". What do you think?');
        var nodeClass = 'tl-entry-node' + (e.keeperState ? ' state-' + e.keeperState : '');
        return '<li class="tl-entry-item">'
          + '<div class="' + nodeClass + '" aria-hidden="true"></div>'
          + '<div class="tl-entry-content">'
          + '<div class="tl-entry-meta">'
          + '<span class="tl-entry-date">' + escHtml(e.date) + '</span>'
          + (stateLabel ? '<span class="tl-entry-state-tag">' + stateLabel + '</span>' : '')
          + '<div class="tl-entry-actions">'
          + (e.id ? '<button class="tl-entry-edit-btn" data-entry-id="' + e.id + '" aria-label="Edit entry">Edit</button>' : '')
          + '<button class="rh-inline-btn tl-entry-rh-btn" data-rh-msg="' + rhMsg + '" aria-label="Discuss with Rhyssa"><svg width="10" height="10" viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="11" cy="11" r="3.5" stroke="currentColor" stroke-width="1.6" fill="none" opacity=".55"/><circle cx="11" cy="11" r="1.4" fill="currentColor" opacity=".8"/></svg>Rhyssa</button>'
          + '</div>'
          + '</div>'
          + (e.observation ? '<p class="tl-entry-obs">' + escHtml(e.observation) + '</p>' : '')
          + (careStr ? '<span class="tl-entry-care">' + careStr + '</span>' : '')
          + (e.treatmentNote ? '<span class="tl-entry-treatment">' + escHtml(e.treatmentNote) + '</span>' : '')
          + (paramsStr ? '<span class="tl-entry-params">' + paramsStr + '</span>' : '')
          + '</div>'
          + '</li>';
      }).join('');
      var moreEl = document.getElementById('jn-load-more');
      if (moreEl) moreEl.style.display = hasMore ? '' : 'none';
    }

    /* ── P2: Streak calculation + milestone toast ── */
    function calcStreak(entries) {
      if (!entries || !entries.length) return 0;
      var now = new Date();
      var weekSet = {};
      entries.forEach(function (e) {
        if (!e.date) return;
        var days = Math.floor((now - new Date(e.date)) / 86400000);
        if (days < 0) return;
        weekSet[Math.floor(days / 7)] = true;
      });
      var w = weekSet[0] ? 0 : 1;
      var streak = 0;
      while (weekSet[w]) { streak++; w++; }
      return streak;
    }

    function showJnToast(msg, type) {
      var toastEl = document.getElementById('jn-milestone-toast');
      if (!toastEl) return;
      var msgEl = toastEl.querySelector('.jn-toast-msg');
      if (msgEl) msgEl.textContent = msg || '';
      toastEl.className = 'jn-milestone-toast' + (type ? ' jn-toast--' + type : '');
      toastEl.classList.add('show');
      clearTimeout(toastEl._timer);
      toastEl._timer = setTimeout(function () { toastEl.classList.remove('show'); }, 5000);
    }

    function checkStreakMilestone(entries) {
      var streak = calcStreak(entries);
      if (STREAK_MILESTONES.indexOf(streak) === -1) return;
      var key = 'ar_jn_milestone_' + streak;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      var msgs = {
        4:  'Four weeks in rhythm.',
        8:  'Eight weeks — your tank knows you.',
        12: 'Twelve weeks. That\'s real consistency.',
        26: 'Half a year of keeping. Remarkable.',
        52: 'One full year. Your rhythm is the tank\'s rhythm.'
      };
      showJnToast(msgs[streak] || streak + '-week streak.', 'streak');
    }

    /* ── P3: Parameter sparklines ── */
    function buildSparkline(values, color, dangerMax) {
      if (!values || values.length < 2) return '';
      var W = 80, H = 28, pad = 2;
      var min = Math.min.apply(null, values);
      var max = Math.max.apply(null, values);
      var range = max - min || 1;
      var pts = values.map(function (v, i) {
        var x = pad + (i / (values.length - 1)) * (W - pad * 2);
        var y = H - pad - ((v - min) / range) * (H - pad * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      var lastVal = values[values.length - 1];
      var lastX   = (W - pad).toFixed(1);
      var lastY   = (H - pad - ((lastVal - min) / range) * (H - pad * 2)).toFixed(1);
      var dotColor = (dangerMax !== undefined && lastVal > dangerMax) ? 'rgba(200,80,80,.9)' : color;
      return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">'
        + '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" opacity=".6"/>'
        + '<circle cx="' + lastX + '" cy="' + lastY + '" r="2.2" fill="' + dotColor + '"/>'
        + '</svg>';
    }

    function renderParamCharts(entries, tankType) {
      var chartCard = document.getElementById('jn-param-charts');
      if (!chartCard) return;
      var paramEntries = (entries || []).filter(function (e) { return e.params; });
      if (paramEntries.length < 3) { chartCard.style.display = 'none'; return; }
      chartCard.style.display = '';
      var recent = paramEntries.slice(-12);
      var params = [
        { key:'ph',  label:'pH',   color:'rgba(61,214,232,.75)',  dangerMax:undefined },
        { key:'nh3', label:'NH₃',  color:'rgba(200,140,60,.85)',  dangerMax:0.5 },
        { key:'no2', label:'NO₂',  color:'rgba(200,190,60,.85)',  dangerMax:0.25 },
        { key:'no3', label:'NO₃',  color:'rgba(100,200,82,.75)',  dangerMax:20 }
      ];
      if (tankType === 'marine' || tankType === 'brackish') {
        params.push({ key:'sg', label:'SG', color:'rgba(163,130,200,.75)', dangerMax:undefined });
      } else {
        params.push({ key:'gh', label:'GH', color:'rgba(130,180,200,.75)', dangerMax:undefined });
        params.push({ key:'kh', label:'KH', color:'rgba(100,160,220,.75)', dangerMax:undefined });
      }
      var latestParams = [];
      var html = params.map(function (p) {
        var vals = recent.map(function (e) { return parseFloat(e.params[p.key]); }).filter(function (v) { return !isNaN(v); });
        if (vals.length < 2) return '';
        var last  = vals[vals.length - 1];
        var prev  = vals[vals.length - 2];
        var trend = last > prev ? '↗' : last < prev ? '↘' : '→';
        var dangerColor = (p.dangerMax !== undefined && last > p.dangerMax) ? 'rgba(200,80,80,.85)' : 'rgba(235,240,236,.55)';
        latestParams.push(p.label + ' ' + last);
        return '<div class="jn-spark-row">'
          + '<span class="jn-spark-label">' + p.label + '</span>'
          + '<div class="jn-spark-chart">' + buildSparkline(vals, p.color, p.dangerMax) + '</div>'
          + '<span class="jn-spark-last" style="color:' + dangerColor + '">' + last + '</span>'
          + '<span class="jn-spark-trend">' + trend + '</span>'
          + '</div>';
      }).join('');
      var rhMsg = latestParams.length ? encodeURIComponent('My latest water parameters: ' + latestParams.join(', ') + '. What do you think about these readings?') : '';
      var rhBtn = rhMsg ? '<button class="rh-inline-btn" data-rh-msg="' + rhMsg + '" style="margin-top:.6rem"><svg width="10" height="10" viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="11" cy="11" r="3.5" stroke="currentColor" stroke-width="1.6" fill="none" opacity=".55"/><circle cx="11" cy="11" r="1.4" fill="currentColor" opacity=".8"/></svg>Ask Rhyssa about these trends</button>' : '';
      var bodyEl = document.getElementById('jn-param-charts-body');
      if (bodyEl) bodyEl.innerHTML = (html || '<p class="jn-entry-empty">Log parameters in more entries to see trends.</p>') + rhBtn;
    }

    /* ── P4: Contextual entry prompt ── */
    function buildContextPrompt(data) {
      var lines = [];
      var entries = (data.entries || []).slice().reverse();
      var latest  = entries[0];
      if (latest) {
        var phase = assessPhaseFromParams(latest.params) ||
                    assessPhaseFromState(latest.keeperState, (data.profile || {}).setupDate);
        var phasePrompts = {
          establish:  'Watch for cloudy water, unusual behaviour, or ammonia smell.',
          stabilise:  'Are your parameters moving in the right direction this week?',
          optimise:   'Notice any changes in plant growth, fish behaviour, or water clarity?',
          sustain:    'Your ecosystem is mature — what quiet signs are you reading today?'
        };
        if (phase && phasePrompts[phase]) lines.push(phasePrompts[phase]);
      }
      for (var i = 0; i < entries.length; i++) {
        if ((entries[i].care || []).indexOf('water_change') !== -1 && entries[i].date) {
          var daysSince = Math.floor((new Date() - new Date(entries[i].date)) / 86400000);
          if (daysSince >= 7) lines.push('Last water change: ' + daysSince + ' days ago.');
          break;
        }
      }
      return lines.join(' ');
    }

    /* ── P4b: Entry filter & search ── */
    function applyFilters(entries, filter) {
      return (entries || []).filter(function (e) {
        if (filter.query) {
          var q = filter.query.toLowerCase();
          var inObs  = (e.observation || '').toLowerCase().indexOf(q) !== -1;
          var inCare = (e.care || []).some(function (c) { return (careLabels[c] || c).toLowerCase().indexOf(q) !== -1; });
          var inNote = (e.treatmentNote || '').toLowerCase().indexOf(q) !== -1;
          if (!inObs && !inCare && !inNote) return false;
        }
        if (filter.days > 0 && e.date) {
          if (Math.floor((new Date() - new Date(e.date)) / 86400000) > filter.days) return false;
        }
        if (filter.care.length > 0) {
          if (!filter.care.some(function (c) { return (e.care || []).indexOf(c) !== -1; })) return false;
        }
        if (filter.state.length > 0) {
          if (filter.state.indexOf(e.keeperState) === -1) return false;
        }
        return true;
      });
    }

    function countActiveFilters() {
      var n = 0;
      if (jnFilter.query) n++;
      if (jnFilter.days > 0) n++;
      n += jnFilter.care.length + jnFilter.state.length;
      return n;
    }

    function updateFilterUI() {
      var n = countActiveFilters();
      var badge = document.getElementById('jn-filter-badge');
      if (badge) { badge.textContent = n; badge.style.display = n > 0 ? '' : 'none'; }
      var clearBtn = document.getElementById('jn-filter-clear');
      if (clearBtn) clearBtn.style.display = n > 0 ? '' : 'none';
    }

    function applyAndRender() {
      var tank = getActiveTank(loadData());
      var entries = tank ? (tank.entries || []) : [];
      jnFilteredEntries = applyFilters(entries, jnFilter);
      jnHistoryPage = 1;
      renderEntryList(jnFilteredEntries, 1);
      var noRes = document.getElementById('jn-filter-no-results');
      if (noRes) noRes.style.display = (jnFilteredEntries.length === 0 && entries.length > 0) ? '' : 'none';
      updateFilterUI();
    }

    var searchDebounce = null;
    function setupFilterBar(entries) {
      var bar = document.getElementById('jn-filter-bar');
      if (!bar) return;
      bar.style.display = (entries.length >= 10) ? '' : 'none';

      /* Populate care chips once */
      var careChipsEl = document.getElementById('jn-filter-care-chips');
      if (careChipsEl && !careChipsEl._built) {
        careChipsEl._built = true;
        var careKeys = ['water_change','filter','feeding','top_up','treatment','dosing','media','trimming'];
        careChipsEl.innerHTML = careKeys.map(function (k) {
          return '<button type="button" class="jn-filter-chip" data-filter-care="' + k + '">' + (careLabels[k] || k) + '</button>';
        }).join('');
      }

      /* Sync chip active states to current jnFilter */
      bar.querySelectorAll('[data-filter-days]').forEach(function (el) {
        el.classList.toggle('active', parseInt(el.dataset.filterDays, 10) === jnFilter.days);
      });
      bar.querySelectorAll('[data-filter-state]').forEach(function (el) {
        el.classList.toggle('active', jnFilter.state.indexOf(el.dataset.filterState) !== -1);
      });
      bar.querySelectorAll('[data-filter-care]').forEach(function (el) {
        el.classList.toggle('active', jnFilter.care.indexOf(el.dataset.filterCare) !== -1);
      });

      /* Wire search input (once) */
      var searchEl = document.getElementById('jn-entry-search');
      if (searchEl && !searchEl._wired) {
        searchEl._wired = true;
        searchEl.value = jnFilter.query;
        searchEl.addEventListener('input', function () {
          clearTimeout(searchDebounce);
          searchDebounce = setTimeout(function () {
            jnFilter.query = searchEl.value.trim();
            applyAndRender();
          }, 280);
        });
        searchEl.addEventListener('search', function () {
          jnFilter.query = searchEl.value.trim();
          applyAndRender();
        });
      }
    }

    /* ── P5: Data export ── */
    function exportParamsCSV() {
      var d = loadData();
      var tank = getActiveTank(d);
      if (!tank) return;
      var cols = ['date','keeper_state','observation','care','ph','nh3','no2','no3','temp','gh','kh','sg'];
      var rows = [cols.join(',')];
      (tank.entries || []).forEach(function (e) {
        var obs = (e.observation || '').replace(/"/g, '""');
        var care = (e.care || []).map(function (c) { return careLabels[c] || c; }).join('; ');
        var row = [
          e.date || '',
          keeperStateLabels[e.keeperState] || e.keeperState || '',
          '"' + obs + '"',
          '"' + care + '"',
          e.params ? (e.params.ph || '') : '',
          e.params ? (e.params.nh3 || '') : '',
          e.params ? (e.params.no2 || '') : '',
          e.params ? (e.params.no3 || '') : '',
          e.params ? (e.params.temp || '') : '',
          e.params ? (e.params.gh || '') : '',
          e.params ? (e.params.kh || '') : '',
          e.params ? (e.params.sg || '') : ''
        ];
        rows.push(row.join(','));
      });
      var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var pName = tank.profile && tank.profile.name;
      a.href = url;
      a.download = (pName ? pName.replace(/[^a-z0-9]/gi, '-') : 'aquatic-rhythm') + '-params-' + new Date().toISOString().slice(0,10) + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportJournal() {
      var d    = loadData();
      var tank = getActiveTank(d);
      var json = JSON.stringify(tank || d, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      var pName = tank && tank.profile && tank.profile.name;
      var name = (pName ? pName.replace(/[^a-z0-9]/gi, '-') : 'aquatic-rhythm');
      a.href     = url;
      a.download = name + '-log-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    /* ── Rhyssa integration helpers ── */
    function openRhyssaWith(msg) {
      if (typeof window.__rhOpenWith === 'function') { window.__rhOpenWith(msg); return; }
      if (typeof window.__rhOpenSheet === 'function') window.__rhOpenSheet();
    }

    function buildDashboardAlerts(tank) {
      var alerts = [];
      var entries = (tank.entries || []).slice().reverse();
      var latest = entries[0];
      if (latest && latest.params) {
        var nh3 = parseFloat(latest.params.nh3);
        var no3 = parseFloat(latest.params.no3);
        if (!isNaN(nh3) && nh3 > 0.5) {
          alerts.push({ severity: 'danger', msg: 'Ammonia elevated in last test (' + latest.params.nh3 + ' mg/L)', rhMsg: 'My ammonia was ' + latest.params.nh3 + ' mg/L on ' + (latest.date || 'the last test') + '. What should I do?' });
        }
        if (!isNaN(no3) && no3 > 40) {
          alerts.push({ severity: 'warn', msg: 'Nitrate high at ' + latest.params.no3 + ' mg/L — water change recommended', rhMsg: 'My nitrate is ' + latest.params.no3 + ' mg/L. Should I be concerned for my tank?' });
        }
      }
      if (latest && latest.date) {
        var daysSince = Math.floor((new Date() - new Date(latest.date)) / 86400000);
        if (daysSince >= 7) {
          alerts.push({ severity: 'soft', msg: 'No entry in ' + daysSince + ' days — how\'s the tank doing?', rhMsg: 'I haven\'t logged anything in ' + daysSince + ' days. Just wanted to check in — tank seems okay.' });
        }
      }
      for (var i = 0; i < entries.length; i++) {
        if ((entries[i].care || []).indexOf('water_change') !== -1 && entries[i].date) {
          var days = Math.floor((new Date() - new Date(entries[i].date)) / 86400000);
          if (days > 14) alerts.push({ severity: 'warn', msg: 'Last water change: ' + days + ' days ago', rhMsg: 'I haven\'t done a water change in ' + days + ' days. Should I be concerned for my ' + ((tank.profile && tank.profile.volume) ? tank.profile.volume + (tank.profile.unit || 'L') + ' ' : '') + 'tank?' });
          break;
        }
      }
      return alerts;
    }

    function renderAlertStrip(tank) {
      var el = document.getElementById('jn-alert-strip');
      if (!el) return;
      var alerts = buildDashboardAlerts(tank);
      if (!alerts.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
      el.style.display = '';
      el.innerHTML = alerts.map(function (a) {
        var rhBtn = '<button class="rh-inline-btn jn-alert-rh-btn" data-rh-msg="' + encodeURIComponent(a.rhMsg) + '"><svg width="11" height="11" viewBox="0 0 22 22" fill="none" aria-hidden="true" style="flex-shrink:0"><circle cx="11" cy="11" r="7.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="11" cy="11" r="3.5" stroke="currentColor" stroke-width="1.6" fill="none" opacity=".55"/><circle cx="11" cy="11" r="1.4" fill="currentColor" opacity=".8"/></svg>Ask Rhyssa</button>';
        return '<div class="jn-alert-item jn-alert--' + a.severity + '"><span class="jn-alert-msg">' + a.msg + '</span>' + rhBtn + '</div>';
      }).join('');
    }

    var rhInsightDebounce = null;
    function fetchWeeklyInsight(tank) {
      if (!tank || !tank.id) return;
      var key = 'rh_weekly_' + tank.id;
      var cached = null;
      try { cached = JSON.parse(localStorage.getItem(key)); } catch (e) {}
      var weekStart = new Date(); weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      var weekKey = weekStart.toISOString().slice(0,10);
      var latestEntryDate = (tank.entries || []).length ? (tank.entries[tank.entries.length - 1].date || '') : '';
      if (cached && cached.week === weekKey && cached.lastEntry === latestEntryDate && cached.text) {
        renderWeeklyInsightCard(cached.text, cached.ts);
        return;
      }
      var entries7 = (tank.entries || []).slice().reverse().filter(function (e) {
        if (!e.date) return false;
        var days = Math.floor((new Date() - new Date(e.date)) / 86400000);
        return days <= 7;
      });
      if (!entries7.length) return;
      var summaryParts = entries7.map(function (e) {
        var careStr = (e.care || []).map(function (c) { return careLabels[c] || c; }).join(', ');
        var obs = (e.observation || '').slice(0, 120);
        var params = '';
        if (e.params) {
          var ps = [];
          if (e.params.ph) ps.push('pH ' + e.params.ph);
          if (e.params.nh3) ps.push('NH₃ ' + e.params.nh3);
          if (e.params.no3) ps.push('NO₃ ' + e.params.no3);
          if (ps.length) params = ' [' + ps.join(', ') + ']';
        }
        return '[' + (e.date || '?') + '] ' + (keeperStateLabels[e.keeperState] || '') + (careStr ? ' | ' + careStr : '') + (obs ? ' | "' + obs + '"' : '') + params;
      }).join('\n');
      var prompt = 'From this keeper\'s last 7 days of log entries:\n' + summaryParts + '\n\nWrite a 2–3 sentence weekly observation as Rhyssa. Be specific, warm, and brief. Point out one pattern or detail that might be easy to miss.';
      var insightEl = document.getElementById('jn-weekly-insight-card');
      if (insightEl) {
        insightEl.style.display = '';
        var bodyEl = insightEl.querySelector('.jn-weekly-insight-body');
        if (bodyEl) bodyEl.textContent = '…';
      }
      fetch('https://api.aquaticrhythm.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], tankContext: getTankContext() })
      }).then(function (res) {
        if (!res.ok || !res.body) return;
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buf = ''; var result = '';
        var bodyEl = insightEl ? insightEl.querySelector('.jn-weekly-insight-body') : null;
        function read() {
          return reader.read().then(function (chunk) {
            if (chunk.done) {
              if (result.trim()) {
                try { localStorage.setItem(key, JSON.stringify({ week: weekKey, lastEntry: latestEntryDate, text: result.trim(), ts: Date.now() })); } catch (e) {}
                renderWeeklyInsightCard(result.trim(), Date.now());
              }
              return;
            }
            buf += decoder.decode(chunk.value, { stream: true });
            var lines = buf.split('\n'); buf = lines.pop() || '';
            lines.forEach(function (line) {
              if (!line.startsWith('data: ')) return;
              var d = line.slice(6).trim(); if (d === '[DONE]') return;
              try {
                var parsed = JSON.parse(d);
                var delta = (parsed.delta && parsed.delta.text) ? parsed.delta.text : '';
                result += delta;
                if (bodyEl) bodyEl.textContent = result;
              } catch (e2) {}
            });
            return read();
          });
        }
        return read();
      }).catch(function () {
        var insightEl2 = document.getElementById('jn-weekly-insight-card');
        if (insightEl2) insightEl2.style.display = 'none';
      });
    }

    function renderWeeklyInsightCard(text, ts) {
      var card = document.getElementById('jn-weekly-insight-card');
      if (!card) return;
      card.style.display = '';
      var bodyEl = card.querySelector('.jn-weekly-insight-body');
      var tsEl = card.querySelector('.jn-weekly-insight-ts');
      if (bodyEl) bodyEl.textContent = text;
      if (tsEl && ts) {
        var d = new Date(ts);
        tsEl.textContent = 'Updated ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    }

    var obsHintDebounce = null;
    var obsHintAbort = null;
    function setupObsHint() {
      var obsEl = document.getElementById('jn-entry-obs');
      if (!obsEl || obsEl._rhHintWired) return;
      obsEl._rhHintWired = true;
      obsEl.addEventListener('input', function () {
        clearTimeout(obsHintDebounce);
        var text = obsEl.value.trim();
        var promptEl = document.getElementById('jn-context-prompt');
        if (text.length < 25) {
          if (promptEl) {
            var staticHint = buildContextPrompt(getActiveTank(loadData()) || {});
            promptEl.textContent = staticHint;
            promptEl.style.display = staticHint ? '' : 'none';
          }
          return;
        }
        obsHintDebounce = setTimeout(function () {
          var tank = getActiveTank(loadData());
          if (!tank) return;
          var tankInfo = tank.profile ? ((tank.profile.volume || '') + (tank.profile.unit || 'L') + ' ' + (tank.profile.type || '')) : '';
          var msg = 'My tank is ' + tankInfo + '. I just wrote in my log: "' + text.slice(0, 150) + '". Ask me one short follow-up question to help me observe more carefully.';
          if (promptEl) { promptEl.textContent = '…'; promptEl.style.display = ''; }
          fetch('https://api.aquaticrhythm.com/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: msg }], tankContext: getTankContext() })
          }).then(function (res) {
            if (!res.ok || !res.body) { if (promptEl) promptEl.style.display = 'none'; return; }
            var reader = res.body.getReader();
            var decoder = new TextDecoder();
            var buf2 = ''; var result = '';
            function readHint() {
              return reader.read().then(function (chunk) {
                if (chunk.done) {
                  if (promptEl) { promptEl.textContent = result.trim(); promptEl.style.display = result.trim() ? '' : 'none'; }
                  return;
                }
                buf2 += decoder.decode(chunk.value, { stream: true });
                var lines = buf2.split('\n'); buf2 = lines.pop() || '';
                lines.forEach(function (line) {
                  if (!line.startsWith('data: ')) return;
                  var d = line.slice(6).trim(); if (d === '[DONE]') return;
                  try {
                    var parsed = JSON.parse(d);
                    var delta = (parsed.delta && parsed.delta.text) ? parsed.delta.text : '';
                    result += delta;
                    if (promptEl) promptEl.textContent = result;
                  } catch (e2) {}
                });
                return readHint();
              });
            }
            return readHint();
          }).catch(function () { if (promptEl) promptEl.style.display = 'none'; });
        }, 1500);
      });
    }

    /* ── P6: Tank inhabitants ── */
    function renderInhabitants(data) {
      var card = document.getElementById('jn-inhabitants');
      if (!card) return;
      var inhs = (data.inhabitants || []).filter(function (i) { return i.status === 'active'; });
      var bodyEl = document.getElementById('jn-inh-body');
      if (!bodyEl) return;
      if (!inhs.length) {
        bodyEl.innerHTML = '<p class="jn-entry-empty">No residents recorded yet.</p>';
        return;
      }
      var grouped = {};
      inhs.forEach(function (i) {
        var cat = i.category || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(i);
      });
      var order = ['fish', 'plant', 'invertebrate', 'coral', 'other'];
      bodyEl.innerHTML = '<div class=”tl-inh-chips”>'
        + order.filter(function (cat) { return grouped[cat]; }).map(function (cat) {
          return grouped[cat].map(function (i) {
            var icon  = INH_CATS[cat] || '◈';
            var label = escHtml(i.commonName || i.species || INH_CAT_LABELS[cat] || cat);
            var count = i.count > 1 ? '<span class=”tl-inh-chip-count”>×' + i.count + '</span>' : '';
            return '<div class=”tl-inh-chip” tabindex=”0” data-inh-id=”' + i.id + '”>'
              + '<span class=”tl-inh-chip-icon”>' + icon + '</span>'
              + '<span>' + label + '</span>' + count
              + '<div class=”tl-inh-chip-actions”>'
              + '<button class=”tl-inh-chip-btn jn-inh-edit-btn”'
              + ' data-inh-id=”' + i.id + '”>edit</button>'
              + '<button class=”tl-inh-chip-btn jn-inh-status-btn”'
              + ' data-inh-id=”' + i.id + '” data-action=”rehomed”>rehomed</button>'
              + '<button class=”tl-inh-chip-btn jn-inh-status-btn”'
              + ' data-inh-id=”' + i.id + '” data-action=”passed”>passed</button>'
              + '</div>'
              + '</div>';
          }).join('');
        }).join('')
        + '</div>';
    }

    function showInhabitantToast(inh, action) {
      var displayName = inh.name || inh.commonName || inh.species || (INH_CAT_LABELS[inh.category] || 'Resident');
      var count = inh.count > 1 ? inh.count + '× ' : '';
      var msg, type;
      if (action === 'added') {
        msg  = 'Welcome to the tank, ' + count + displayName + '.';
        type = 'welcome';
      } else if (action === 'passed') {
        msg  = count + displayName + ' has left the tank. We remember them.';
        type = 'passed';
      } else if (action === 'rehomed') {
        msg  = count + displayName + ' has found a new home.';
        type = 'rehomed';
      } else { return; }
      showJnToast(msg, type);
    }

    function updateInhabitantStatus(id, status, note) {
      var d = loadData();
      var tank = getActiveTank(d);
      var inhs = tank ? (tank.inhabitants || []) : [];
      for (var i = 0; i < inhs.length; i++) {
        if (inhs[i].id === id) {
          var inh = inhs[i];
          inh.status      = status;
          inh.removedDate = todayStr();
          inh.removedNote = note || '';
          saveData(d);
          renderDashboard();
          showInhabitantToast(inh, status);
          break;
        }
      }
    }

    function renderDashboard() {
      renderJournalOverview();
      var d = loadData();
      renderTankSelector(d);
      var tank = getActiveTank(d);

      var stickyCTA = document.getElementById('jn-sticky-cta');
      if (!tank) {
        var tlPage = document.getElementById('pg-tank-log');
        if (tlPage && tlPage.classList.contains('active')) window.go('journal', false);
        if (stickyCTA) stickyCTA.classList.remove('visible');
        return;
      }
      if (stickyCTA) stickyCTA.classList.add('visible');

      var p = tank.profile;
      var nameEl = document.getElementById('jn-tank-name');
      var infoEl = document.getElementById('jn-tank-info');
      if (nameEl) nameEl.textContent = p.name || 'My Tank';
      if (infoEl) infoEl.textContent = [(p.volume ? p.volume + ' ' + (p.unit || 'L') : ''), p.type, tankAge(p.setupDate)].filter(Boolean).join(' · ');

      /* Identity hero icon */
      var iconEl = document.getElementById('jn-identity-icon');
      if (iconEl) iconEl.innerHTML = tankTypeIconLg(p.type, p.shape);

      var entries = tank.entries || [];
      var latest = entries.length ? entries[entries.length - 1] : null;

      var phase = null, fromParams = false;
      if (latest && latest.params) {
        phase = assessPhaseFromParams(latest.params);
        if (phase) fromParams = true;
      }
      if (!phase && latest) phase = assessPhaseFromState(latest.keeperState, p.setupDate);
      var info = (phase && phaseInfo[phase]) ? phaseInfo[phase] : null;

      /* Phase pill in identity hero */
      var pillEl = document.getElementById('jn-identity-phase');
      if (pillEl) {
        if (info) { pillEl.textContent = info.label; pillEl.style.color = info.color; pillEl.style.display = ''; }
        else { pillEl.style.display = 'none'; }
      }

      /* Snapshot strip */
      var activeInhCount = (tank.inhabitants || []).filter(function (i) { return i.status === 'active'; }).length;
      var streak = calcStreak(entries);
      var ageDays = p.setupDate ? Math.floor((new Date() - new Date(p.setupDate)) / 86400000) : null;
      var el;
      el = document.getElementById('jn-snap-entries');   if (el) el.textContent = entries.length;
      el = document.getElementById('jn-snap-residents');  if (el) el.textContent = activeInhCount;
      el = document.getElementById('jn-snap-streak');     if (el) el.textContent = streak > 0 ? streak + '' : '—';
      el = document.getElementById('jn-snap-age');        if (el) el.textContent = ageDays !== null ? ageDays : '—';

      /* Phase name, note, next, src */
      var phaseNameEl = document.getElementById('jn-phase-name');
      var phaseNoteEl = document.getElementById('jn-phase-note');
      var phaseNextEl = document.getElementById('jn-phase-next');
      var phaseSrcEl  = document.getElementById('jn-phase-src');
      var phaseJourneyEl = document.getElementById('jn-phase-journey');
      if (phaseNameEl) {
        if (info) {
          phaseNameEl.textContent = info.label;
          phaseNameEl.style.color = info.color;
          phaseNameEl.style.display = '';
          if (phaseJourneyEl) phaseJourneyEl.style.display = 'none';
          if (phaseNoteEl) phaseNoteEl.textContent = info.note;
          if (phaseNextEl) { phaseNextEl.textContent = info.next; phaseNextEl.style.display = ''; }
          if (phaseSrcEl) { phaseSrcEl.textContent = fromParams ? 'Based on water parameters' : 'Estimated from keeper rhythm'; phaseSrcEl.style.display = ''; }
        } else {
          phaseNameEl.style.display = 'none';
          phaseNameEl.style.color = '';
          if (phaseJourneyEl) phaseJourneyEl.style.display = '';
          if (phaseNoteEl) phaseNoteEl.textContent = 'Write your first entry to get an ARA phase reading.';
          if (phaseNextEl) phaseNextEl.style.display = 'none';
          if (phaseSrcEl) phaseSrcEl.style.display = 'none';
        }
      }

      /* Phase card: left accent color + subtle tint */
      var phaseCard = document.getElementById('jn-phase-card');
      if (phaseCard) {
        if (info) {
          phaseCard.style.borderLeftColor = info.color;
          var m = info.color.match(/[\d.]+/g);
          if (m && m.length >= 3) phaseCard.style.setProperty('--tl-phase-bg', 'rgba(' + m[0] + ',' + m[1] + ',' + m[2] + ',.06)');
        } else {
          phaseCard.style.borderLeftColor = 'rgba(255,255,255,.07)';
          phaseCard.style.removeProperty('--tl-phase-bg');
        }
      }

      /* Rhythm dots (8 weeks, RTL grid = week 0 rightmost) */
      var weeks = rhythmWeeks(entries);
      var rhythmEl = document.getElementById('jn-rhythm-dots');
      if (rhythmEl) {
        var weekLabels = ['This week', 'Last week', '2w ago', '3w ago', '4w ago', '5w ago', '6w ago', '7w ago'];
        rhythmEl.innerHTML = weeks.map(function (has, i) {
          return '<div class="jn-rhythm-dot' + (has ? ' active' : '') + '"'
            + ' title="' + weekLabels[i] + '"'
            + ' aria-label="' + weekLabels[i] + (has ? ': entry logged' : ': no entry') + '">'
            + '</div>';
        }).join('');
      }

      /* Streak badge */
      var streakEl = document.getElementById('jn-streak-count');
      if (streakEl) {
        if (streak >= 1) {
          streakEl.textContent = streak === 1 ? '1-week streak' : streak + '-week streak';
          streakEl.style.display = '';
        } else {
          streakEl.style.display = 'none';
        }
      }

      renderAlertStrip(tank);
      renderParamCharts(entries, p.type);
      renderInhabitants(tank);

      var noEntriesEl = document.getElementById('jn-no-entries');
      var hasEntriesEl = document.getElementById('jn-has-entries');
      if (noEntriesEl) noEntriesEl.style.display = entries.length ? 'none' : '';
      if (hasEntriesEl) hasEntriesEl.style.display = entries.length ? '' : 'none';

      setupFilterBar(entries);
      jnFilteredEntries = applyFilters(entries, jnFilter);
      jnHistoryPage = 1;
      renderEntryList(jnFilteredEntries, jnHistoryPage);

      /* My Setup card */
      renderSetupCard(tank);

      /* Rhyssa weekly insight (async, non-blocking) */
      if (entries.length >= 2) fetchWeeklyInsight(tank);
      else { var wc = document.getElementById('jn-weekly-insight-card'); if (wc) wc.style.display = 'none'; }

      /* ARA phase card: Rhyssa touchpoint */
      var phaseRhEl = document.getElementById('jn-phase-rh-btn');
      if (phaseRhEl && info) {
        var phaseRhMsg = encodeURIComponent('My tank is in the ' + info.label + ' phase. ' + info.next + ' What should I be watching for?');
        phaseRhEl.setAttribute('data-rh-msg', phaseRhMsg);
        phaseRhEl.style.display = '';
      } else if (phaseRhEl) {
        phaseRhEl.style.display = 'none';
      }
    }

    function openModal(id) {
      var modal = document.getElementById(id);
      var backdrop = document.getElementById('mt-backdrop');
      if (!modal) return;
      modal.removeAttribute('aria-hidden');
      modal.classList.add('open');
      if (backdrop) { backdrop.classList.add('open'); backdrop.removeAttribute('aria-hidden'); }
      document.body.style.overflow = 'hidden';
      var first = modal.querySelector('input,select,textarea,button');
      if (first) first.focus();
    }

    function closeModal(id) {
      var modal = document.getElementById(id);
      var backdrop = document.getElementById('mt-backdrop');
      if (!modal) return;
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('open');
      if (backdrop) { backdrop.classList.remove('open'); backdrop.setAttribute('aria-hidden', 'true'); }
      document.body.style.overflow = '';
    }

    function closeAllModals() {
      ['mt-modal-setup', 'mt-modal-entry', 'mt-modal-inhabitant', 'mt-modal-gear'].forEach(closeModal);
    }

    /* ── EQ label helper ── */
    function fmtEqLabel(key) {
      return key.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    /* ── renderSetupCard ── */
    function renderSetupCard(tank) {
      var card = document.getElementById('jn-setup-card');
      if (!card) return;
      var setup = tank && tank.setup;
      card.removeAttribute('hidden');
      var eqList = document.getElementById('jn-setup-eq-list');
      var stockList = document.getElementById('jn-setup-stock-list');
      var emptyEl = document.getElementById('jn-setup-empty');
      if (eqList) eqList.innerHTML = '';
      if (stockList) stockList.innerHTML = '';
      var hasEq = setup && setup.equipment && Object.keys(setup.equipment).length;
      var hasStock = setup && setup.stock && setup.stock.length;
      if (!hasEq && !hasStock) {
        if (emptyEl) emptyEl.removeAttribute('hidden');
        return;
      }
      if (emptyEl) emptyEl.setAttribute('hidden', '');
      if (hasEq && eqList) {
        Object.keys(setup.equipment).forEach(function (k) {
          var brand = (setup.brands || {})[k] || '';
          var chip = document.createElement('span');
          chip.className = 'jn-setup-eq-chip';
          chip.textContent = fmtEqLabel(k) + (brand ? ' — ' + brand : '');
          eqList.appendChild(chip);
        });
      }
      if (hasStock && stockList) {
        var catEmoji = { fish: '🐟', plant: '🌿', invertebrate: '🦐', coral: '🪸', other: '◈' };
        setup.stock.forEach(function (s) {
          var chip = document.createElement('span');
          chip.className = 'jn-setup-stock-chip';
          chip.textContent = (catEmoji[s.cat] || '') + ' ' + (s.qty > 1 ? s.qty + '× ' : '') + s.name;
          stockList.appendChild(chip);
        });
      }
    }

    /* ── Gear modal state ── */
    var _gearEqState = {};
    var _gearBrandState = {};
    var _gearStockList = [];
    var _gearStockCat = 'fish';

    function openGearModal() {
      var AR_EQ = window.AR_EQ;
      if (!AR_EQ) { openModal('mt-modal-gear'); return; }
      var tank = getActiveTank(loadData());
      var saved = (tank && tank.setup) || {};
      _gearEqState = {};
      _gearBrandState = {};
      _gearStockList = [];

      if (saved.equipment) Object.keys(saved.equipment).forEach(function (k) { _gearEqState[k] = true; });
      if (saved.brands) Object.keys(saved.brands).forEach(function (k) { _gearBrandState[k] = saved.brands[k]; });
      if (saved.stock) _gearStockList = saved.stock.slice();

      var rowsEl = document.getElementById('jn-setup-eq-rows');
      if (rowsEl) {
        rowsEl.innerHTML = '';
        var CAT_ORDER = ['filtration', 'environment', 'substrate', 'cooling', 'additions'];
        var bycat = {};
        Object.keys(AR_EQ).forEach(function (k) {
          var cat = AR_EQ[k].cat || 'other';
          if (!bycat[cat]) bycat[cat] = [];
          bycat[cat].push(k);
        });
        var cats = CAT_ORDER.filter(function (c) { return bycat[c]; });
        Object.keys(bycat).forEach(function (c) { if (cats.indexOf(c) < 0) cats.push(c); });
        cats.forEach(function (cat) {
          (bycat[cat] || []).forEach(function (k) {
            var eq = AR_EQ[k];
            var row = document.createElement('div');
            row.className = 'jn-setup-eq-row';
            var tog = document.createElement('input');
            tog.type = 'checkbox';
            tog.className = 'jn-setup-eq-toggle';
            tog.dataset.eq = k;
            tog.checked = !!_gearEqState[k];
            var lbl = document.createElement('span');
            lbl.className = 'jn-setup-eq-row-label';
            lbl.textContent = fmtEqLabel(k);
            var sel = document.createElement('select');
            sel.className = 'jn-setup-brand-select' + (tog.checked ? ' visible' : '');
            sel.dataset.eq = k;
            var defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = 'Select brand…';
            sel.appendChild(defaultOpt);
            var brandExamples = (eq.brands && eq.brands.examples) ? eq.brands.examples : [];
            brandExamples.forEach(function (b) {
              var opt = document.createElement('option');
              opt.value = b;
              opt.textContent = b;
              if (_gearBrandState[k] === b) opt.selected = true;
              sel.appendChild(opt);
            });
            tog.addEventListener('change', function () {
              if (tog.checked) {
                _gearEqState[k] = true;
                sel.classList.add('visible');
              } else {
                delete _gearEqState[k];
                delete _gearBrandState[k];
                sel.classList.remove('visible');
                sel.value = '';
              }
            });
            sel.addEventListener('change', function () {
              if (sel.value) _gearBrandState[k] = sel.value;
              else delete _gearBrandState[k];
            });
            row.appendChild(tog);
            row.appendChild(lbl);
            row.appendChild(sel);
            rowsEl.appendChild(row);
          });
        });
      }

      _gearStockCat = 'fish';
      syncGearCatBtns();
      renderGearStockRows();

      var nameInp = document.getElementById('jn-setup-stock-name');
      var qtyInp = document.getElementById('jn-setup-stock-qty');
      if (nameInp) nameInp.value = '';
      if (qtyInp) qtyInp.value = '1';
      openModal('mt-modal-gear');
    }

    function syncGearCatBtns() {
      document.querySelectorAll('.jn-setup-cat-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.cat === _gearStockCat);
      });
    }

    function renderGearStockRows() {
      var el = document.getElementById('jn-setup-stock-rows');
      if (!el) return;
      el.innerHTML = '';
      var catEmoji = { fish: '🐟', plant: '🌿', invertebrate: '🦐', coral: '🪸', other: '◈' };
      _gearStockList.forEach(function (s, idx) {
        var row = document.createElement('div');
        row.className = 'jn-setup-stock-row';
        row.innerHTML = '<span class="jn-setup-stock-row-qty">' + escHtml(s.qty > 1 ? s.qty + '×' : '1×') + '</span>'
          + escHtml(s.name)
          + '<span class="jn-setup-stock-row-cat">' + escHtml((catEmoji[s.cat] || '') + ' ' + (s.cat || '')) + '</span>'
          + '<button type="button" class="jn-setup-stock-row-del" data-idx="' + idx + '" aria-label="Remove">×</button>';
        el.appendChild(row);
      });
    }

    function saveGearModal() {
      var d = loadData();
      var tank = getActiveTank(d);
      if (!tank) return;
      var eq = {};
      document.querySelectorAll('.jn-setup-eq-toggle:checked').forEach(function (tog) {
        if (tog.dataset.eq) eq[tog.dataset.eq] = true;
      });
      var brands = {};
      document.querySelectorAll('.jn-setup-brand-select').forEach(function (sel) {
        if (sel.dataset.eq && sel.value) brands[sel.dataset.eq] = sel.value;
      });
      tank.setup = { equipment: eq, brands: brands, stock: _gearStockList.slice(), savedAt: Date.now() };
      saveData(d);
      closeModal('mt-modal-gear');
      renderSetupCard(tank);
    }

    function todayStr() {
      return new Date().toISOString().slice(0, 10);
    }

    function openEntryModal(entryId) {
      document.querySelectorAll('.jn-state-chip,.jn-care-chip').forEach(function (c) { c.classList.remove('active'); });
      var chipsContainer = document.getElementById('jn-care-chips-container');
      if (chipsContainer) chipsContainer.classList.remove('expanded');
      var editingIdEl = document.getElementById('jn-entry-editing-id');
      if (editingIdEl) editingIdEl.value = '';
      var titleEl = document.querySelector('#mt-modal-entry .mt-modal-title');
      var deleteBtn = document.getElementById('jn-entry-delete-btn');
      var treatRow = document.getElementById('jn-treatment-note-row');
      var treatEl = document.getElementById('jn-treatment-note');
      var paramsSection = document.getElementById('jn-params-section');
      var allParamIds = ['jn-param-ph','jn-param-nh3','jn-param-no2','jn-param-no3','jn-param-temp','jn-param-gh','jn-param-kh','jn-param-sg'];

      /* Show/hide extended params based on tank type */
      var tank = getActiveTank(loadData());
      var tankType = tank && tank.profile ? (tank.profile.type || '') : '';
      var ghRow = document.getElementById('jn-param-gh-row');
      var khRow = document.getElementById('jn-param-kh-row');
      var sgRow = document.getElementById('jn-param-sg-row');
      var isMarine = (tankType === 'marine' || tankType === 'brackish');
      if (ghRow) ghRow.style.display = isMarine ? 'none' : '';
      if (khRow) khRow.style.display = isMarine ? 'none' : '';
      if (sgRow) sgRow.style.display = isMarine ? '' : 'none';

      allParamIds.forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      if (treatRow) treatRow.style.display = 'none';
      if (treatEl) treatEl.value = '';

      if (entryId && tank) {
        var entry = null;
        for (var ei = 0; ei < (tank.entries || []).length; ei++) {
          if (tank.entries[ei].id === entryId) { entry = tank.entries[ei]; break; }
        }
        if (entry) {
          if (editingIdEl) editingIdEl.value = entryId;
          if (titleEl) titleEl.textContent = 'Edit entry';
          if (deleteBtn) deleteBtn.style.display = '';
          var entryDate = document.getElementById('jn-entry-date');
          if (entryDate) entryDate.value = entry.date || todayStr();
          var obsEl = document.getElementById('jn-entry-obs');
          if (obsEl) obsEl.value = entry.observation || '';
          if (entry.keeperState) {
            var stateChip = document.querySelector('.jn-state-chip[data-state="' + entry.keeperState + '"]');
            if (stateChip) stateChip.classList.add('active');
          }
          (entry.care || []).forEach(function (c) {
            var chip = document.querySelector('.jn-care-chip[data-care="' + c + '"]');
            if (chip) chip.classList.add('active');
          });
          if (entry.treatmentNote && treatRow && treatEl) {
            treatRow.style.display = '';
            treatEl.value = entry.treatmentNote;
          }
          if (entry.params) {
            ['ph','nh3','no2','no3','temp','gh','kh','sg'].forEach(function (k) {
              var el = document.getElementById('jn-param-' + k);
              if (el && entry.params[k]) el.value = entry.params[k];
            });
          }
          var cc = document.getElementById('jn-care-chips-container');
          if (cc && cc.querySelector('.jn-care-secondary.active')) cc.classList.add('expanded');
          var ptxt = buildContextPrompt(tank || {});
          var pel = document.getElementById('jn-context-prompt');
          if (pel) { pel.textContent = ptxt || 'What did you notice today?'; pel.style.display = ''; }
          setupObsHint();
          openModal('mt-modal-entry');
          return;
        }
      }

      /* New entry mode */
      if (titleEl) titleEl.textContent = 'Today\'s entry';
      if (deleteBtn) deleteBtn.style.display = 'none';
      var entryDate2 = document.getElementById('jn-entry-date');
      if (entryDate2) entryDate2.value = todayStr();
      var obsEl2 = document.getElementById('jn-entry-obs');
      if (obsEl2) obsEl2.value = '';
      var promptText = buildContextPrompt(tank || {}) || 'What did you notice today?';
      var promptEl = document.getElementById('jn-context-prompt');
      if (promptEl) { promptEl.textContent = promptText; promptEl.style.display = ''; }
      setupObsHint();
      openModal('mt-modal-entry');
    }

    function openInhabitantModal(inhId) {
      document.querySelectorAll('.jn-inh-cat-chip').forEach(function (c) { c.classList.remove('active'); });
      var firstCat = document.querySelector('.jn-inh-cat-chip');
      if (firstCat) firstCat.classList.add('active');
      var editingEl = document.getElementById('jn-inh-editing-id');
      if (editingEl) editingEl.value = '';
      var titleEl = document.querySelector('#mt-modal-inhabitant .mt-modal-title');
      var g = function (id) { var el = document.getElementById(id); if (el) el.value = ''; };
      g('jn-inh-common'); g('jn-inh-species'); g('jn-inh-name');
      var countEl = document.getElementById('jn-inh-count'); if (countEl) countEl.value = '1';
      var dateEl = document.getElementById('jn-inh-date'); if (dateEl) dateEl.value = todayStr();
      if (inhId) {
        var d = loadData(); var tank = getActiveTank(d);
        var inh = null;
        if (tank) { for (var ii = 0; ii < (tank.inhabitants || []).length; ii++) { if (tank.inhabitants[ii].id === inhId) { inh = tank.inhabitants[ii]; break; } } }
        if (inh) {
          if (editingEl) editingEl.value = inhId;
          if (titleEl) titleEl.textContent = 'Edit resident';
          var catChip = document.querySelector('.jn-inh-cat-chip[data-cat="' + (inh.category || 'fish') + '"]');
          document.querySelectorAll('.jn-inh-cat-chip').forEach(function (c) { c.classList.remove('active'); });
          if (catChip) catChip.classList.add('active');
          var s = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
          s('jn-inh-common', inh.commonName); s('jn-inh-species', inh.species); s('jn-inh-name', inh.name);
          var cEl = document.getElementById('jn-inh-count'); if (cEl) cEl.value = inh.count || 1;
          var dEl = document.getElementById('jn-inh-date'); if (dEl) dEl.value = inh.addedDate || todayStr();
          var speciesRowE = document.getElementById('jn-species-row');
          var speciesTogE = document.getElementById('jn-species-toggle');
          if (speciesRowE) speciesRowE.style.display = inh.species ? '' : 'none';
          if (speciesTogE) speciesTogE.textContent = inh.species ? '− Hide scientific name' : '+ Add scientific name';
          var submitBtn = document.querySelector('#mt-modal-inhabitant [type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Save changes';
          openModal('mt-modal-inhabitant');
          return;
        }
      }
      if (titleEl) titleEl.textContent = 'Who joined your tank?';
      var speciesRowN = document.getElementById('jn-species-row');
      var speciesTogN = document.getElementById('jn-species-toggle');
      if (speciesRowN) speciesRowN.style.display = 'none';
      if (speciesTogN) speciesTogN.textContent = '+ Add scientific name';
      var submitBtn2 = document.querySelector('#mt-modal-inhabitant [type="submit"]');
      if (submitBtn2) submitBtn2.textContent = 'Add to tank';
      openModal('mt-modal-inhabitant');
    }

    document.addEventListener('click', function (e) {
      var target = e.target;

      /* Tank card click → navigate to tank log */
      var tankCard = target.closest('.jn-tank-card[data-tank-id]');
      if (tankCard && tankCard.dataset.tankId) {
        var d = loadData();
        if (d.activeTankId !== tankCard.dataset.tankId) {
          jnFilter = { query: '', days: 0, care: [], state: [] };
        }
        d.activeTankId = tankCard.dataset.tankId;
        saveData(d);
        window.go('tank-log', true);
        return;
      }

      /* Add aquarium / Setup from overview */
      if (target.id === 'jn-ov-add-tank' || target.id === 'jn-ov-setup-open') {
        resetSetupModal();
        if (formSetup) formSetup.dataset.editingId = '';
        var delBtnOv = document.getElementById('mt-setup-delete');
        if (delBtnOv) delBtnOv.style.display = 'none';
        openModal('mt-modal-setup');
        return;
      }

      if (target.id === 'mt-setup-open' || target.id === 'jn-setup-open') {
        if (formSetup) formSetup.dataset.editingId = '';
        var delBtnNew = document.getElementById('mt-setup-delete');
        if (delBtnNew) delBtnNew.style.display = 'none';
        openModal('mt-modal-setup'); return;
      }
      if (target.id === 'jn-entry-open' || target.id === 'jn-entry-open-2' || target.id === 'jn-entry-open-main') {
        openEntryModal(); return;
      }
      if (target.id === 'jn-tank-edit') {
        var d = loadData();
        var tank = getActiveTank(d);
        var p = tank ? (tank.profile || {}) : {};
        resetSetupModal();
        var inp = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
        inp('mt-inp-name', p.name);
        inp('mt-inp-date', p.setupDate);
        setHiddenInputs(p.volume, p.unit || 'L', p.shape || 'rect');
        var typeEl = document.getElementById('mt-inp-type');
        if (typeEl && p.type) typeEl.value = p.type;
        if (p.volume) updatePreview(p.volume, p.unit || 'L', p.shape || 'rect', null);
        if (formSetup) formSetup.dataset.editingId = tank ? tank.id : '';
        var delBtn = document.getElementById('mt-setup-delete');
        if (delBtn) delBtn.style.display = (tank && d.tanks.length > 1) ? '' : 'none';
        openModal('mt-modal-setup');
        return;
      }
      if (target.id === 'mt-setup-delete') {
        var d = loadData();
        var editId = formSetup ? formSetup.dataset.editingId : '';
        if (!editId) return;
        var tankDel = null;
        for (var ti = 0; ti < d.tanks.length; ti++) { if (d.tanks[ti].id === editId) { tankDel = d.tanks[ti]; break; } }
        if (!tankDel) return;
        var tName = (tankDel.profile && tankDel.profile.name) || 'this tank';
        if (!confirm('Delete ' + tName + ' and all its data? This cannot be undone.')) return;
        d.tanks = d.tanks.filter(function (t) { return t.id !== editId; });
        if (d.tanks.length) {
          d.activeTankId = d.tanks[0].id;
          saveData(d);
        } else {
          saveData({});
        }
        closeAllModals();
        renderDashboard();
        window.go('journal', false);
        return;
      }
      if (target.id === 'jn-add-tank') {
        resetSetupModal();
        if (formSetup) formSetup.dataset.editingId = '';
        var delBtn2 = document.getElementById('mt-setup-delete');
        if (delBtn2) delBtn2.style.display = 'none';
        openModal('mt-modal-setup');
        return;
      }
      var tankTab = target.closest('.jn-tank-tab[data-tank-id]');
      if (tankTab && tankTab.dataset.tankId) {
        var d = loadData();
        d.activeTankId = tankTab.dataset.tankId;
        saveData(d);
        renderDashboard();
        return;
      }
      if (target.id === 'jn-reset-tank') {
        var d = loadData();
        var tank = getActiveTank(d);
        if (!tank) return;
        var isLast = d.tanks.length <= 1;
        var msg = isLast
          ? 'Delete all log data? This cannot be undone.'
          : 'Delete this tank and all its entries? This cannot be undone.';
        if (confirm(msg)) {
          if (isLast) { saveData({}); }
          else {
            d.tanks = d.tanks.filter(function (t) { return t.id !== tank.id; });
            d.activeTankId = d.tanks[0].id;
            saveData(d);
          }
          renderDashboard();
          window.go('journal', false);
        }
        return;
      }
      if (target.id === 'mt-backdrop' || target.dataset.modalClose) { closeAllModals(); return; }

      var stateChip = target.closest('.jn-state-chip');
      if (stateChip) {
        document.querySelectorAll('.jn-state-chip').forEach(function (c) { c.classList.remove('active'); });
        stateChip.classList.add('active'); return;
      }
      var careChip = target.closest('.jn-care-chip');
      if (careChip) { careChip.classList.toggle('active'); return; }

      if (target.id === 'jn-care-more') {
        var cc2 = document.getElementById('jn-care-chips-container');
        if (cc2) cc2.classList.add('expanded');
        return;
      }

      if (target.id === 'jn-species-toggle') {
        var sRow = document.getElementById('jn-species-row');
        var sTog = document.getElementById('jn-species-toggle');
        if (sRow && sTog) {
          var sHidden = sRow.style.display === 'none' || !sRow.style.display;
          sRow.style.display = sHidden ? '' : 'none';
          sTog.textContent = sHidden ? '− Hide scientific name' : '+ Add scientific name';
        }
        return;
      }

      if (target.id === 'jn-load-more') {
        jnHistoryPage += 1;
        renderEntryList(jnFilteredEntries, jnHistoryPage);
        return;
      }

      if (target.id === 'jn-toast-dismiss') {
        var toastEl = document.getElementById('jn-milestone-toast');
        if (toastEl) toastEl.classList.remove('show');
        return;
      }

      /* Rhyssa prefill (data-rh-msg attribute) */
      var rhBtn = target.closest('[data-rh-msg]');
      if (rhBtn && !target.closest('a[href]')) {
        e.preventDefault();
        var msg = decodeURIComponent(rhBtn.dataset.rhMsg || '');
        if (msg) openRhyssaWith(msg);
        else if (typeof window.__rhOpenSheet === 'function') window.__rhOpenSheet();
        return;
      }

      if (target.id === 'jn-export') { exportJournal(); return; }
      if (target.id === 'jn-export-csv') { exportParamsCSV(); return; }

      /* Filter bar toggle */
      if (target.id === 'jn-filter-toggle') {
        var opts = document.getElementById('jn-filter-options');
        if (opts) {
          var open = opts.style.display === 'none' || !opts.style.display;
          opts.style.display = open ? '' : 'none';
          target.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        return;
      }

      /* Date period chips */
      var dayChip = target.closest('[data-filter-days]');
      if (dayChip) {
        jnFilter.days = parseInt(dayChip.dataset.filterDays, 10) || 0;
        document.querySelectorAll('[data-filter-days]').forEach(function (c) { c.classList.toggle('active', parseInt(c.dataset.filterDays, 10) === jnFilter.days); });
        applyAndRender();
        return;
      }

      /* State filter chips (multi-select) */
      var stateFilterChip = target.closest('[data-filter-state]');
      if (stateFilterChip) {
        var sv = stateFilterChip.dataset.filterState;
        var si = jnFilter.state.indexOf(sv);
        if (si === -1) jnFilter.state.push(sv); else jnFilter.state.splice(si, 1);
        stateFilterChip.classList.toggle('active', jnFilter.state.indexOf(sv) !== -1);
        applyAndRender();
        return;
      }

      /* Care filter chips (multi-select) */
      var careFilterChip = target.closest('[data-filter-care]');
      if (careFilterChip) {
        var cv = careFilterChip.dataset.filterCare;
        var ci = jnFilter.care.indexOf(cv);
        if (ci === -1) jnFilter.care.push(cv); else jnFilter.care.splice(ci, 1);
        careFilterChip.classList.toggle('active', jnFilter.care.indexOf(cv) !== -1);
        applyAndRender();
        return;
      }

      /* Clear all filters */
      if (target.id === 'jn-filter-clear') {
        jnFilter = { query: '', days: 0, care: [], state: [] };
        var searchEl2 = document.getElementById('jn-entry-search');
        if (searchEl2) searchEl2.value = '';
        document.querySelectorAll('[data-filter-days]').forEach(function (c) { c.classList.toggle('active', parseInt(c.dataset.filterDays, 10) === 0); });
        document.querySelectorAll('[data-filter-state],[data-filter-care]').forEach(function (c) { c.classList.remove('active'); });
        applyAndRender();
        return;
      }

      /* Entry edit button */
      var entryEditBtn = target.closest('.tl-entry-edit-btn');
      if (entryEditBtn && entryEditBtn.dataset.entryId) {
        openEntryModal(entryEditBtn.dataset.entryId);
        return;
      }

      /* Entry delete button (inside edit modal) */
      if (target.id === 'jn-entry-delete-btn') {
        var editId = document.getElementById('jn-entry-editing-id');
        if (!editId || !editId.value) return;
        if (!confirm('Delete this entry? This cannot be undone.')) return;
        var d = loadData();
        var tank = getActiveTank(d);
        if (!tank) return;
        tank.entries = tank.entries.filter(function (en) { return en.id !== editId.value; });
        saveData(d);
        closeAllModals();
        renderDashboard();
        showJnToast('Entry removed.', 'passed');
        return;
      }

      /* Inhabitant edit button */
      var inhEditBtn = target.closest('.jn-inh-edit-btn');
      if (inhEditBtn && inhEditBtn.dataset.inhId) {
        openInhabitantModal(inhEditBtn.dataset.inhId);
        return;
      }

      if (target.id === 'jn-inh-add') { openInhabitantModal(); return; }

      /* Treatment/dosing note toggle */
      var careChipTreat = target.closest('.jn-care-chip[data-care="treatment"],.jn-care-chip[data-care="dosing"]');
      if (careChipTreat) {
        var treatRow2 = document.getElementById('jn-treatment-note-row');
        if (treatRow2) {
          var anyTreat = document.querySelector('.jn-care-chip[data-care="treatment"].active, .jn-care-chip[data-care="dosing"].active');
          treatRow2.style.display = anyTreat ? '' : 'none';
        }
      }

      var catChip = target.closest('.jn-inh-cat-chip');
      if (catChip && catChip.closest('#mt-modal-inhabitant')) {
        document.querySelectorAll('.jn-inh-cat-chip').forEach(function (c) { c.classList.remove('active'); });
        catChip.classList.add('active');
        return;
      }

      var inhChip = target.closest('.tl-inh-chip');
      if (inhChip && !target.closest('.jn-inh-status-btn') && !target.closest('.jn-inh-edit-btn')) {
        document.querySelectorAll('.tl-inh-chip').forEach(function (c) {
          if (c !== inhChip) c.classList.remove('expanded');
        });
        inhChip.classList.toggle('expanded');
        return;
      }

      var inhStatusBtn = target.closest('.jn-inh-status-btn');
      if (inhStatusBtn) {
        var inhId  = inhStatusBtn.dataset.inhId;
        var action = inhStatusBtn.dataset.action;
        var d2 = loadData();
        var tank2 = getActiveTank(d2);
        var inhs2 = tank2 ? (tank2.inhabitants || []) : [];
        var inh2 = null;
        for (var ii = 0; ii < inhs2.length; ii++) { if (inhs2[ii].id === inhId) { inh2 = inhs2[ii]; break; } }
        if (!inh2) return;
        var name2 = inh2.name || inh2.commonName || INH_CAT_LABELS[inh2.category] || 'this resident';
        var confirmMsg = action === 'passed'
          ? 'Mark ' + name2 + ' as passed away?'
          : 'Mark ' + name2 + ' as rehomed?';
        if (confirm(confirmMsg)) updateInhabitantStatus(inhId, action, '');
        return;
      }
    });

    var formSetup = document.getElementById('mt-form-setup');
    if (formSetup) {
      formSetup.addEventListener('submit', function (e) {
        e.preventDefault();
        var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
        var d = loadData();
        var newProfile = {
          name:      g('mt-inp-name') || 'My Tank',
          volume:    g('mt-inp-volume'),
          unit:      g('mt-inp-unit') || 'L',
          shape:     g('mt-inp-shape') || 'rect',
          type:      g('mt-inp-type') || 'freshwater',
          setupDate: g('mt-inp-date')
        };
        var editingId = formSetup.dataset.editingId;
        if (editingId) {
          for (var ti = 0; ti < d.tanks.length; ti++) {
            if (d.tanks[ti].id === editingId) { d.tanks[ti].profile = newProfile; break; }
          }
        } else {
          var newTank = { id: 'tank_' + Date.now(), profile: newProfile, entries: [], inhabitants: [] };
          d.tanks.push(newTank);
          d.activeTankId = newTank.id;
        }
        var isNew = !editingId;
        saveData(d);
        resetSetupModal();
        closeAllModals();
        renderDashboard();
        if (isNew) window.go('tank-log', true);
      });
    }

    var formEntry = document.getElementById('jn-form-entry');
    if (formEntry) {
      formEntry.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = loadData();
        var tank = getActiveTank(d);
        if (!tank) return;
        if (!tank.entries) tank.entries = [];
        var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
        var activeState = document.querySelector('.jn-state-chip.active');
        var care = Array.prototype.slice.call(document.querySelectorAll('.jn-care-chip.active')).map(function (c) { return c.dataset.care; });
        var editingId = g('jn-entry-editing-id');
        var ph = g('jn-param-ph'), nh3 = g('jn-param-nh3'), no2 = g('jn-param-no2'), no3 = g('jn-param-no3'), temp = g('jn-param-temp');
        var gh = g('jn-param-gh'), kh = g('jn-param-kh'), sg = g('jn-param-sg');
        var treatmentNote = g('jn-treatment-note');
        var params = null;
        if (ph || nh3 || no2 || no3 || temp || gh || kh || sg) {
          params = { ph: ph, nh3: nh3, no2: no2, no3: no3, temp: temp };
          if (gh) params.gh = gh;
          if (kh) params.kh = kh;
          if (sg) params.sg = sg;
        }
        if (editingId) {
          for (var ei = 0; ei < tank.entries.length; ei++) {
            if (tank.entries[ei].id === editingId) {
              tank.entries[ei].date = g('jn-entry-date') || todayStr();
              tank.entries[ei].keeperState = activeState ? activeState.dataset.state : tank.entries[ei].keeperState;
              tank.entries[ei].observation = g('jn-entry-obs');
              tank.entries[ei].care = care;
              tank.entries[ei].params = params;
              if (treatmentNote) tank.entries[ei].treatmentNote = treatmentNote;
              else delete tank.entries[ei].treatmentNote;
              break;
            }
          }
          tank.entries.sort(function (a, b) { return (a.date || '') < (b.date || '') ? -1 : (a.date || '') > (b.date || '') ? 1 : 0; });
        } else {
          var entry = {
            id: 'e_' + Date.now(),
            date: g('jn-entry-date') || todayStr(),
            keeperState: activeState ? activeState.dataset.state : '',
            observation: g('jn-entry-obs'),
            care: care,
            params: params
          };
          if (treatmentNote) entry.treatmentNote = treatmentNote;
          tank.entries.push(entry);
        }
        saveData(d);
        closeAllModals();
        renderDashboard();
        checkStreakMilestone(tank.entries);
      });
    }

    var formInhabitant = document.getElementById('jn-form-inhabitant');
    if (formInhabitant) {
      formInhabitant.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = loadData();
        var tank = getActiveTank(d);
        if (!tank) return;
        if (!tank.inhabitants) tank.inhabitants = [];
        var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
        var activeCat = document.querySelector('.jn-inh-cat-chip.active');
        var editingId = g('jn-inh-editing-id');
        if (editingId) {
          for (var ii = 0; ii < tank.inhabitants.length; ii++) {
            if (tank.inhabitants[ii].id === editingId) {
              tank.inhabitants[ii].category  = activeCat ? activeCat.dataset.cat : tank.inhabitants[ii].category;
              tank.inhabitants[ii].commonName = g('jn-inh-common') || tank.inhabitants[ii].commonName;
              tank.inhabitants[ii].species    = g('jn-inh-species');
              tank.inhabitants[ii].name       = g('jn-inh-name');
              tank.inhabitants[ii].count      = parseInt(g('jn-inh-count'), 10) || tank.inhabitants[ii].count;
              tank.inhabitants[ii].addedDate  = g('jn-inh-date') || tank.inhabitants[ii].addedDate;
              break;
            }
          }
          saveData(d);
          closeModal('mt-modal-inhabitant');
          renderDashboard();
          showJnToast('Resident updated.', 'welcome');
        } else {
          var inh = {
            id:         'inh_' + Date.now(),
            category:   activeCat ? activeCat.dataset.cat : 'fish',
            commonName: g('jn-inh-common'),
            species:    g('jn-inh-species'),
            name:       g('jn-inh-name'),
            count:      parseInt(g('jn-inh-count'), 10) || 1,
            addedDate:  g('jn-inh-date') || todayStr(),
            status:     'active',
            removedDate: null,
            removedNote: null
          };
          tank.inhabitants.push(inh);
          saveData(d);
          closeModal('mt-modal-inhabitant');
          renderDashboard();
          showInhabitantToast(inh, 'added');
        }
      });
    }

    /* ── Gear modal: open from setup card ── */
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.id === 'jn-setup-edit-btn' || t.id === 'jn-setup-start-btn') {
        openGearModal();
        return;
      }
      /* Stock row remove button */
      var delBtn = t.closest('.jn-setup-stock-row-del');
      if (delBtn && delBtn.closest('#mt-modal-gear')) {
        var idx = parseInt(delBtn.dataset.idx, 10);
        if (!isNaN(idx)) { _gearStockList.splice(idx, 1); renderGearStockRows(); }
        return;
      }
      /* Stock category buttons */
      var catBtn = t.closest('.jn-setup-cat-btn');
      if (catBtn && catBtn.closest('#mt-modal-gear')) {
        _gearStockCat = catBtn.dataset.cat || 'fish';
        syncGearCatBtns();
        return;
      }
      /* Add stock button */
      if (t.id === 'jn-setup-stock-add-btn' || t.closest('#jn-setup-stock-add-btn')) {
        var nameEl = document.getElementById('jn-setup-stock-name');
        var qtyEl = document.getElementById('jn-setup-stock-qty');
        var name = nameEl ? nameEl.value.trim() : '';
        if (!name) return;
        var qty = parseInt(qtyEl ? qtyEl.value : '1', 10) || 1;
        _gearStockList.push({ name: name, qty: qty, cat: _gearStockCat });
        renderGearStockRows();
        if (nameEl) nameEl.value = '';
        if (qtyEl) qtyEl.value = '1';
        if (nameEl) nameEl.focus();
        return;
      }
    });

    /* ── Gear modal: form submit ── */
    var formGear = document.getElementById('jn-form-setup');
    if (formGear) {
      formGear.addEventListener('submit', function (e) {
        e.preventDefault();
        saveGearModal();
      });
      var stockNameInp = document.getElementById('jn-setup-stock-name');
      if (stockNameInp) {
        stockNameInp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('jn-setup-stock-add-btn') && document.getElementById('jn-setup-stock-add-btn').click();
          }
        });
      }
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllModals();
    });

    /* ── Setup UI: populate preset chips ── */
    var presetGrid = document.getElementById('mt-preset-grid');
    if (presetGrid) {
      PRESETS.forEach(function (p) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mt-preset-chip';
        btn.dataset.vol   = p.v;
        btn.dataset.unit  = p.u;
        btn.dataset.shape = p.s;
        btn.dataset.dims  = p.d.join(',');
        btn.innerHTML = '<span class="mt-preset-vol">' + p.v + ' ' + p.u + '</span>'
          + '<span class="mt-preset-cat" style="color:' + (CAT_COLORS[p.cat] || 'rgba(255,255,255,.4)') + '">' + p.cat + '</span>';
        presetGrid.appendChild(btn);
      });
    }

    /* ── Setup UI: populate brand buttons ── */
    var brandSel = document.getElementById('mt-brand-selector');
    if (brandSel) {
      Object.keys(BRANDS).forEach(function (key) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mt-brand-btn';
        btn.dataset.brand = key;
        btn.textContent = BRANDS[key].label;
        brandSel.appendChild(btn);
      });
    }

    /* ── Setup UI: chip / tab / unit click handler ── */
    document.addEventListener('click', function (e) {
      /* Tab switching */
      var stab = e.target.closest('.mt-stab');
      if (stab && stab.closest('#mt-modal-setup')) {
        document.querySelectorAll('#mt-modal-setup .mt-stab').forEach(function (t) {
          t.classList.remove('active'); t.setAttribute('aria-selected', 'false');
        });
        stab.classList.add('active'); stab.setAttribute('aria-selected', 'true');
        var panel = stab.dataset.stab;
        ['preset', 'brand', 'custom'].forEach(function (p) {
          var el = document.getElementById('mt-panel-' + p);
          if (el) el.style.display = (p === panel) ? '' : 'none';
        });
        return;
      }

      /* Preset chip */
      var chip = e.target.closest('.mt-preset-chip');
      if (chip) {
        document.querySelectorAll('.mt-preset-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var vol  = parseFloat(chip.dataset.vol);
        var unit = chip.dataset.unit  || 'L';
        var shp  = chip.dataset.shape || 'rect';
        var dims = chip.dataset.dims  ? chip.dataset.dims.split(',').map(Number) : null;
        setHiddenInputs(vol, unit, shp);
        updatePreview(vol, unit, shp, dims);
        var nameEl = document.getElementById('mt-inp-name');
        if (nameEl && !nameEl.value) nameEl.value = 'My ' + vol + ' ' + unit + ' Tank';
        return;
      }

      /* Brand button */
      var brandBtn = e.target.closest('.mt-brand-btn');
      if (brandBtn) {
        document.querySelectorAll('.mt-brand-btn').forEach(function (b) { b.classList.remove('active'); });
        brandBtn.classList.add('active');
        var brand = BRANDS[brandBtn.dataset.brand];
        var modelSel = document.getElementById('mt-model-selector');
        if (modelSel && brand) {
          modelSel.style.display = '';
          modelSel.innerHTML = brand.models.map(function (m) {
            return '<button type="button" class="mt-model-chip"'
              + ' data-vol="' + m.v + '" data-unit="' + m.u + '" data-shape="' + m.s + '"'
              + ' data-dims="' + m.d.join(',') + '" data-name="' + brand.label + ' ' + m.n + '">'
              + m.n + '<span style="opacity:.42"> · ' + m.v + ' ' + m.u + '</span></button>';
          }).join('');
        }
        return;
      }

      /* Model chip */
      var modelChip = e.target.closest('.mt-model-chip');
      if (modelChip) {
        document.querySelectorAll('.mt-model-chip').forEach(function (c) { c.classList.remove('active'); });
        modelChip.classList.add('active');
        var vol  = parseFloat(modelChip.dataset.vol);
        var unit = modelChip.dataset.unit  || 'L';
        var shp  = modelChip.dataset.shape || 'rect';
        var dims = modelChip.dataset.dims  ? modelChip.dataset.dims.split(',').map(Number) : null;
        setHiddenInputs(vol, unit, shp);
        updatePreview(vol, unit, shp, dims);
        var mname  = modelChip.dataset.name || '';
        var nameEl = document.getElementById('mt-inp-name');
        if (nameEl && !nameEl.value) nameEl.value = mname;
        return;
      }

      /* Dimension unit toggle */
      var unitBtn = e.target.closest('.mt-unit-btn');
      if (unitBtn && unitBtn.closest('#mt-panel-custom')) {
        document.querySelectorAll('#mt-panel-custom .mt-unit-btn').forEach(function (b) { b.classList.remove('active'); });
        unitBtn.classList.add('active');
        recalcCustom();
        return;
      }
    });

    /* ── Custom dimension inputs ── */
    ['mt-dim-l', 'mt-dim-w', 'mt-dim-h'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', recalcCustom);
    });

    /* ── Reset setup modal when opened fresh ── */
    (function () {
      var openBtn = document.getElementById('mt-setup-open');
      if (openBtn) {
        openBtn.addEventListener('click', function () { resetSetupModal(); }, true);
      }
    }());

    /* ── Hook go() to re-render on journal/tank-log navigation ── */
    (function () {
      var _origGo = window.go;
      window.go = function (id, push) {
        _origGo.call(window, id, push);
        if (id === 'journal') renderJournalOverview();
        else if (id === 'tank-log') renderDashboard();
      };
    }());

    renderDashboard();
  })();

  /* ── RHYSSA BOTTOM SHEET ── */
  (function () {
    var WORKER_URL = 'https://api.aquaticrhythm.com/chat';
    var STORE_KEY  = 'rh_thread';
    var isStreaming = false;
    var isTouch     = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

    var fab      = document.getElementById('rh-fab');
    var backdrop = document.getElementById('rh-backdrop');
    var sheet    = document.getElementById('rh-sheet');
    var thread   = document.getElementById('rh-sheet-thread');
    var form     = document.getElementById('rh-sheet-form');
    var inp      = document.getElementById('rh-sheet-inp');
    var sendBtn  = document.getElementById('rh-sheet-send');
    var clsBtn   = document.getElementById('rh-sheet-cls');
    var clearBtn = document.getElementById('rh-sheet-clear');
    var welcome  = document.getElementById('rh-sheet-welcome');

    if (!fab || !sheet) return;

    /* ── Storage ── */
    function getThread() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || { messages: [] }; }
      catch (e) { return { messages: [] }; }
    }
    function saveThread(s) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
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
      var s = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      /* Bold first: non-greedy so pairs match in order; allow * inside bold text */
      s = s.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      var paras = s.split(/\n{2,}/);
      if (paras.length > 1) {
        return paras.filter(function (p) { return p.trim(); }).map(function (p) {
          return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
        }).join('');
      }
      return '<p>' + s.replace(/\n/g, '<br>') + '</p>';
    }

    /* ── Render full thread from storage ── */
    function renderThread() {
      var msgs = getThread().messages;
      Array.from(thread.children).forEach(function (el) {
        if (el.id !== 'rh-sheet-welcome') el.remove();
      });
      if (!msgs.length) {
        if (welcome) welcome.style.display = '';
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
      thread.appendChild(wrap);
      return body;
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

        var phaseKey = latest ? (_phaseFromParams(latest.params) || _phaseFromState(latest.keeperState, p.setupDate)) : null;
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
          recentEntries: recentEntries.length ? recentEntries : null
        };
      } catch (e) { return null; }
    }

    /* ── Visual Viewport fit (Android Chrome address bar fix, mobile only) ── */
    /* ── Visual Viewport fit — keeps sheet inside visible area on mobile ──
       top:0 is correct — Chrome's layout viewport already starts below the
       URL bar (innerHeight excludes it). We only need to fix height so the
       sheet shrinks above the keyboard. bottom:auto releases the CSS
       inset:0 bottom:0 constraint so the explicit height can take effect. */
    function fitSheet() {
      if (!window.visualViewport || window.innerWidth >= 721) return;
      sheet.style.top    = '0px';
      sheet.style.bottom = 'auto';
      sheet.style.height = Math.round(window.visualViewport.height) + 'px';
      thread.scrollTop = thread.scrollHeight;
    }

    /* ── Open / close ── */
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
    if (clearBtn) clearBtn.addEventListener('click', function () {
      saveThread({ messages: [] });
      renderThread();
      if (inp) { inp.value = ''; inp.style.height = 'auto'; inp.focus(); }
    });
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


    /* ── Send message ── */
    function sendMsg(text) {
      if (isStreaming || !text.trim()) return;
      if (welcome) welcome.style.display = 'none';

      var now = Date.now();
      var s = getThread();
      var prevLen = s.messages.length;
      s.messages.push({ role: 'user', content: text, ts: now });
      saveThread(s);

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

  /* ── RHYSSA COMPANION PAGE ── */
  (function () {
    var WORKER_URL  = 'https://api.aquaticrhythm.com/chat';
    var STORE_KEY   = 'rh_thread_companion';
    var cpStreaming  = false;
    var cpIsTouch   = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

    var cpThread  = document.getElementById('rh-cp-thread');
    var cpForm    = document.getElementById('rh-cp-form');
    var cpInp     = document.getElementById('rh-cp-inp');
    var cpSendBtn = document.getElementById('rh-cp-send');
    var cpWelcome = document.getElementById('rh-cp-welcome');
    var cpNewBtn  = document.getElementById('rh-cp-new');
    var cpBackBtn = document.getElementById('rh-cp-back');

    if (!cpThread) return;

    /* ── Storage ── */
    function cpGetThread() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || { messages: [] }; }
      catch (e) { return { messages: [] }; }
    }
    function cpSaveThread(s) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
    }

    /* ── Date helpers ── */
    function cpDayKey(ts) { return new Date(ts).toDateString(); }
    function cpFmtDay(ts) {
      var d = new Date(ts), now = new Date();
      if (d.toDateString() === now.toDateString()) return 'Today';
      var yest = new Date(now); yest.setDate(now.getDate() - 1);
      if (d.toDateString() === yest.toDateString()) return 'Yesterday';
      var opts = { day: 'numeric', month: 'long' };
      if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
      return d.toLocaleDateString(undefined, opts);
    }

    /* ── Markdown → HTML ── */
    function cpMdToHTML(raw) {
      var s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      s = s.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      var paras = s.split(/\n{2,}/);
      if (paras.length > 1) {
        return paras.filter(function (p) { return p.trim(); }).map(function (p) {
          return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
        }).join('');
      }
      return '<p>' + s.replace(/\n/g, '<br>') + '</p>';
    }

    /* ── Thread rendering ── */
    function cpAppendSep(ts) {
      var sep = document.createElement('div');
      sep.className = 'rh-date-sep';
      sep.innerHTML = '<span>' + cpFmtDay(ts) + '</span>';
      cpThread.appendChild(sep);
    }

    function cpAppendBubble(role, text) {
      var wrap = document.createElement('div');
      wrap.className = 'rh-bubble ' + (role === 'assistant' ? 'rh-bubble-rh' : 'rh-bubble-you');
      var who = document.createElement('span');
      who.className = 'rh-bubble-who';
      who.textContent = role === 'assistant' ? 'Rhyssa' : 'You';
      var body = document.createElement('div');
      body.className = 'rh-bubble-body';
      if (text) {
        body.innerHTML = role === 'assistant'
          ? cpMdToHTML(text)
          : '<p>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>';
      }
      wrap.appendChild(who);
      wrap.appendChild(body);
      cpThread.appendChild(wrap);
      return body;
    }

    function cpShowTyping() {
      var d = document.createElement('div');
      d.className = 'rh-typing'; d.id = 'rh-cp-typing';
      d.innerHTML = '<span></span><span></span><span></span>';
      cpThread.appendChild(d);
      cpThread.scrollTop = cpThread.scrollHeight;
    }
    function cpHideTyping() { var t = document.getElementById('rh-cp-typing'); if (t) t.remove(); }

    function cpRenderThread() {
      var msgs = cpGetThread().messages;
      Array.from(cpThread.children).forEach(function (el) {
        if (el.id !== 'rh-cp-welcome') el.remove();
      });
      if (!msgs.length) {
        if (cpWelcome) cpWelcome.style.display = '';
        return;
      }
      if (cpWelcome) cpWelcome.style.display = 'none';
      var lastDay = null;
      msgs.forEach(function (m) {
        var mDay = cpDayKey(m.ts || Date.now());
        if (mDay !== lastDay) { cpAppendSep(m.ts || Date.now()); lastDay = mDay; }
        cpAppendBubble(m.role, m.content);
      });
      cpThread.scrollTop = cpThread.scrollHeight;
    }

    /* ── Send ── */
    function cpSendMsg(text) {
      if (cpStreaming || !text.trim()) return;
      if (cpWelcome) cpWelcome.style.display = 'none';

      var now = Date.now();
      var s = cpGetThread();
      var prevLen = s.messages.length;
      s.messages.push({ role: 'user', content: text, ts: now });
      cpSaveThread(s);

      if (prevLen === 0 || cpDayKey((s.messages[prevLen - 1] || {}).ts || 0) !== cpDayKey(now)) {
        cpAppendSep(now);
      }
      cpAppendBubble('user', text);
      cpThread.scrollTop = cpThread.scrollHeight;

      cpShowTyping();
      if (cpSendBtn) cpSendBtn.disabled = true;
      cpStreaming = true;

      var msgHistory = s.messages.map(function (m) { return { role: m.role, content: m.content }; });

      fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgHistory }),
      })
      .then(function (res) {
        cpHideTyping();
        if (!res.ok || !res.body) throw new Error('status ' + res.status);

        var replyTs = Date.now();
        var p = cpAppendBubble('assistant', '');
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
            if (parsed.type === 'error') { responseText = responseText || '—'; return; }
            var delta = (parsed.delta && parsed.delta.text) ? parsed.delta.text : '';
            if (delta) {
              responseText += delta;
              p.innerHTML = cpMdToHTML(responseText);
              cpThread.scrollTop = cpThread.scrollHeight;
            }
          } catch (e2) {}
        }

        function read() {
          return reader.read().then(function (chunk) {
            if (chunk.done) {
              buf += decoder.decode(chunk.value || new Uint8Array(0), { stream: false });
              buf.split('\n').forEach(feedSseLine);
              buf = '';
              if (!responseText) {
                responseText = 'Something went wrong — please try again in a moment.';
                p.innerHTML = cpMdToHTML(responseText);
              }
              var s2 = cpGetThread();
              s2.messages.push({ role: 'assistant', content: responseText, ts: replyTs });
              cpSaveThread(s2);
              if (cpSendBtn) cpSendBtn.disabled = false;
              cpStreaming = false;
              if (cpInp) cpInp.focus();
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
        cpHideTyping();
        console.error('[Rhyssa companion] fetch failed', err && err.message);
        cpAppendBubble('assistant', 'Something went wrong — please try again in a moment.');
        if (cpSendBtn) cpSendBtn.disabled = false;
        cpStreaming = false;
      });
    }

    /* ── Form events ── */
    if (cpInp) {
      cpInp.addEventListener('input', function () {
        cpInp.style.height = 'auto';
        cpInp.style.height = Math.min(cpInp.scrollHeight, 120) + 'px';
      });
      if (!cpIsTouch) {
        cpInp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); cpDoSubmit(); }
        });
      }
    }
    if (cpForm) cpForm.addEventListener('submit', function (e) { e.preventDefault(); cpDoSubmit(); });

    function cpDoSubmit() {
      var text = cpInp ? cpInp.value.trim() : '';
      if (!text) return;
      cpInp.value = ''; cpInp.style.height = 'auto';
      cpSendMsg(text);
    }

    /* ── Conversation starters ── */
    if (cpThread) {
      cpThread.addEventListener('click', function (e) {
        var chip = e.target.closest('.rh-starter-chip');
        if (!chip) return;
        var starter = chip.getAttribute('data-starter');
        if (starter) cpSendMsg(starter);
      });
    }

    /* ── New conversation ── */
    if (cpNewBtn) {
      cpNewBtn.addEventListener('click', function () {
        cpSaveThread({ messages: [] });
        cpRenderThread();
        if (cpInp) { cpInp.value = ''; cpInp.style.height = 'auto'; cpInp.focus(); }
      });
    }

    /* ── Back button ── */
    if (cpBackBtn) {
      cpBackBtn.addEventListener('click', function () {
        if (history.length > 1) { history.back(); }
        else if (typeof window.go === 'function') { window.go('home'); }
      });
    }

    /* ── Page activation hook ── */
    window.__rhCompanionInit = function () {
      cpRenderThread();
      setTimeout(function () { if (cpInp) cpInp.focus(); }, 80);
    };

    /* If companion page is already active on load, init now */
    if (document.getElementById('pg-companion') && document.getElementById('pg-companion').classList.contains('active')) {
      cpRenderThread();
    }
  })();

})();
