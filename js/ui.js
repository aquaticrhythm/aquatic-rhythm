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
    '/mytank':     'mytank',
    '/mytank/':    'mytank'
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
    'mytank':    'My Tank — Aquatic Rhythm'
  };

  var descMap = {
    'home':      'Plain-language ecology for home aquariums: read water, plants, fish, and bacteria together. Guides, ARA, tools, and optional help from Rhyssa.',
    'ara':       'ARA is a framework for closed-loop aquariums — phase, ecological tolerance, keeper rhythm, and timing before big moves.',
    'companion': 'Rhyssa is an AI aquarium companion shaped by ARA. She helps you interpret what your ecosystem is doing — without rushing to a single fix.',
    'about':     'Why Aquatic Rhythm exists — from uneven advice to a calmer, ecology-first way of reading small tanks.',
    'privacy':   'Privacy Policy for Aquatic Rhythm. What we collect, how it is handled, and what it means for you.',
    'terms':     'Terms of Use for Aquatic Rhythm and Rhyssa. Written plainly, without unnecessary complexity.',
    'reading':   'Short aquarium ecology guides — modular, mobile-friendly, grounded in ARA.',
    'tools':     'Interactive aquarium simulators and planners. Try decisions on screen before you make them in the tank.',
    'mytank':    'Track your aquarium water parameters, log maintenance, and assess your ARA phase — stored privately on your device.'
  };

  function updateMeta(id) {
    var desc = document.getElementById('meta-desc');
    if (desc && descMap[id]) desc.setAttribute('content', descMap[id]);
  }

  function updateBottomNav(id) {
    document.querySelectorAll('.bnav-item').forEach(function (item) {
      var tab = item.getAttribute('data-bnav');
      item.classList.toggle('active', tab === id);
      item.setAttribute('aria-current', tab === id ? 'page' : 'false');
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
    window.scrollTo({ top: 0, behavior: 'auto' });
    closeMenu();
    updateBottomNav(id);
    setTimeout(function () { observeScrollReveal(t); }, 80);

    if (titleMap[id]) document.title = titleMap[id];
    updateMeta(id);

    if (push !== false) history.pushState({ page: id }, '', path);

    var can = document.querySelector('link[rel="canonical"]');
    if (can) can.setAttribute('href', 'https://aquaticrhythm.com' + path);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', { page_path: path, page_title: id });
    }

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
        updateBottomNav(id);
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

  /* ── MY TANK ── */
  (function () {
    var MT_KEY = 'ar_mytank';

    function loadData() {
      try { return JSON.parse(localStorage.getItem(MT_KEY)) || {}; } catch (e) { return {}; }
    }
    function saveData(d) {
      try { localStorage.setItem(MT_KEY, JSON.stringify(d)); } catch (e) {}
    }

    function fmt(v, decimals) {
      if (v === null || v === undefined || v === '') return '—';
      return parseFloat(v).toFixed(decimals !== undefined ? decimals : 1);
    }

    function assessPhase(entry) {
      if (!entry) return null;
      var nh3 = parseFloat(entry.ammonia);
      var no2 = parseFloat(entry.nitrite);
      var no3 = parseFloat(entry.nitrate);
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

    var phaseInfo = {
      establish:  { label: 'Phase 1 — Establishing', desc: 'Your tank is still cycling. Ammonia or nitrite are elevated — give the biology time to establish. Avoid adding fish.', color: 'rgba(220,140,60,.9)' },
      stabilise:  { label: 'Phase 2 — Stabilising',  desc: 'Cycle is completing. Parameters are dropping toward zero — maintain routine and avoid big changes.', color: 'rgba(200,190,60,.9)' },
      optimise:   { label: 'Phase 3 — Optimising',   desc: 'Tank is stable. Focus on rhythm: consistent maintenance, observing behaviour, refining conditions.', color: 'rgba(61,214,232,.9)' },
      sustain:    { label: 'Phase 4 — Sustaining',   desc: 'Ecosystem is mature. Your rhythm is aligned. Maintain, observe, and resist unnecessary interventions.', color: 'rgba(100,200,82,.9)' }
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

    var maintLabels = { water_change: 'Water change', filter: 'Filter', feeding: 'Feeding', treatment: 'Treatment', observation: 'Observation', other: 'Other' };

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

    function renderDashboard() {
      var d = loadData();
      if (!d.profile) {
        document.getElementById('mt-empty') && (document.getElementById('mt-empty').style.display = '');
        document.getElementById('mt-dashboard') && (document.getElementById('mt-dashboard').style.display = 'none');
        return;
      }
      document.getElementById('mt-empty') && (document.getElementById('mt-empty').style.display = 'none');
      document.getElementById('mt-dashboard') && (document.getElementById('mt-dashboard').style.display = '');

      var p = d.profile;
      var nameEl = document.getElementById('mt-tank-name');
      var infoEl = document.getElementById('mt-tank-info');
      if (nameEl) nameEl.textContent = p.name || 'My Tank';
      if (infoEl) infoEl.textContent = [(p.volume ? p.volume + ' ' + (p.unit || 'L') : ''), p.type, tankAge(p.setupDate)].filter(Boolean).join(' · ');

      var log = d.waterLog || [];
      var latest = log.length ? log[log.length - 1] : null;
      var paramsCard = document.getElementById('mt-params-card');
      var noReadings = document.getElementById('mt-no-readings');
      if (paramsCard && noReadings) {
        paramsCard.style.display = latest ? '' : 'none';
        noReadings.style.display = latest ? 'none' : '';
      }
      if (latest) {
        var setVal = function (id, val, dec) { var el = document.getElementById(id); if (el) el.textContent = fmt(val, dec); };
        setVal('mt-val-ph', latest.ph, 1);
        setVal('mt-val-nh3', latest.ammonia, 2);
        setVal('mt-val-no2', latest.nitrite, 2);
        setVal('mt-val-no3', latest.nitrate, 0);
        setVal('mt-val-temp', latest.temp, 1);
        var dateEl = document.getElementById('mt-params-date');
        if (dateEl) dateEl.textContent = latest.date || '';
      }

      var phase = assessPhase(latest);
      var phaseCard = document.getElementById('mt-phase-card');
      var phaseBadge = document.getElementById('mt-phase-badge');
      var phaseDesc = document.getElementById('mt-phase-desc');
      if (phaseCard && phaseBadge && phaseDesc) {
        if (phase && phaseInfo[phase]) {
          var info = phaseInfo[phase];
          phaseBadge.textContent = info.label;
          phaseBadge.style.color = info.color;
          phaseDesc.textContent = info.desc;
        } else {
          phaseBadge.textContent = '—';
          phaseBadge.style.color = '';
          phaseDesc.textContent = 'Log a water reading to assess your tank\'s current phase.';
        }
      }

      var maint = d.maintenanceLog || [];
      var maintList = document.getElementById('mt-maint-list');
      if (maintList) {
        if (!maint.length) {
          maintList.innerHTML = '<li class="mt-maint-empty">No entries yet.</li>';
        } else {
          var sorted = maint.slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; });
          maintList.innerHTML = sorted.slice(0, 8).map(function (m) {
            return '<li class="mt-maint-item"><span class="mt-maint-type">' + (maintLabels[m.type] || m.type) + '</span><span class="mt-maint-note">' + (m.note || '') + '</span><span class="mt-maint-date">' + (m.date || '') + '</span></li>';
          }).join('');
        }
      }

      var histList = document.getElementById('mt-history-list');
      var histWrap = document.getElementById('mt-history-wrap');
      if (histWrap) histWrap.style.display = log.length > 1 ? '' : 'none';
      if (histList && log.length) {
        var rev = log.slice().reverse().slice(1, 8);
        histList.innerHTML = rev.map(function (e) {
          return '<li class="mt-history-item"><span class="mt-maint-date">' + (e.date || '') + '</span><span class="mt-history-params">pH ' + fmt(e.ph, 1) + ' · NH₃ ' + fmt(e.ammonia, 2) + ' · NO₂ ' + fmt(e.nitrite, 2) + ' · NO₃ ' + fmt(e.nitrate, 0) + (e.temp ? ' · ' + fmt(e.temp, 1) + '°C' : '') + '</span>' + (e.note ? '<span class="mt-history-note">' + e.note + '</span>' : '') + '</li>';
        }).join('');
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
      ['mt-modal-setup', 'mt-modal-log', 'mt-modal-maint'].forEach(closeModal);
    }

    function todayStr() {
      return new Date().toISOString().slice(0, 10);
    }

    document.addEventListener('click', function (e) {
      var target = e.target;
      if (target.id === 'mt-setup-open') { openModal('mt-modal-setup'); return; }
      if (target.id === 'mt-log-open' || target.id === 'mt-log-open-2') {
        var logDate = document.getElementById('mt-log-date');
        if (logDate && !logDate.value) logDate.value = todayStr();
        openModal('mt-modal-log');
        return;
      }
      if (target.id === 'mt-maint-open') {
        var maintDate = document.getElementById('mt-maint-date');
        if (maintDate && !maintDate.value) maintDate.value = todayStr();
        openModal('mt-modal-maint');
        return;
      }
      if (target.id === 'mt-tank-edit') {
        var d = loadData();
        var p = d.profile || {};
        resetSetupModal();
        var inp = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
        inp('mt-inp-name', p.name);
        inp('mt-inp-date', p.setupDate);
        setHiddenInputs(p.volume, p.unit || 'L', p.shape || 'rect');
        var typeEl = document.getElementById('mt-inp-type');
        if (typeEl && p.type) typeEl.value = p.type;
        if (p.volume) updatePreview(p.volume, p.unit || 'L', p.shape || 'rect', null);
        openModal('mt-modal-setup');
        return;
      }
      if (target.id === 'mt-history-toggle') {
        var histList = document.getElementById('mt-history-list');
        var showing = target.textContent.trim() === 'Hide';
        target.textContent = showing ? 'Show' : 'Hide';
        if (histList) histList.style.display = showing ? 'none' : '';
        return;
      }
      if (target.id === 'mt-reset-tank') {
        if (confirm('Delete all tank data? This cannot be undone.')) {
          saveData({});
          renderDashboard();
        }
        return;
      }
      if (target.id === 'mt-backdrop' || target.dataset.modalClose) {
        closeAllModals();
        return;
      }
    });

    var formSetup = document.getElementById('mt-form-setup');
    if (formSetup) {
      formSetup.addEventListener('submit', function (e) {
        e.preventDefault();
        var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
        var d = loadData();
        d.profile = {
          name:      g('mt-inp-name') || 'My Tank',
          volume:    g('mt-inp-volume'),
          unit:      g('mt-inp-unit') || 'L',
          shape:     g('mt-inp-shape') || 'rect',
          type:      g('mt-inp-type') || 'freshwater',
          setupDate: g('mt-inp-date')
        };
        saveData(d);
        resetSetupModal();
        closeAllModals();
        renderDashboard();
      });
    }

    var formLog = document.getElementById('mt-form-log');
    if (formLog) {
      formLog.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = loadData();
        if (!d.waterLog) d.waterLog = [];
        var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
        d.waterLog.push({
          date:     g('mt-log-date') || todayStr(),
          ph:       g('mt-log-ph'),
          ammonia:  g('mt-log-nh3'),
          nitrite:  g('mt-log-no2'),
          nitrate:  g('mt-log-no3'),
          temp:     g('mt-log-temp'),
          note:     g('mt-log-note')
        });
        saveData(d);
        document.getElementById('mt-form-log').reset();
        closeAllModals();
        renderDashboard();
      });
    }

    var formMaint = document.getElementById('mt-form-maint');
    if (formMaint) {
      formMaint.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = loadData();
        if (!d.maintenanceLog) d.maintenanceLog = [];
        var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
        d.maintenanceLog.push({
          date: g('mt-maint-date') || todayStr(),
          type: g('mt-maint-type') || 'other',
          note: g('mt-maint-note')
        });
        saveData(d);
        document.getElementById('mt-form-maint').reset();
        closeAllModals();
        renderDashboard();
      });
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

    renderDashboard();
  })();

})();
