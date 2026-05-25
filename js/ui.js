/* ============================================================
   ui.js — cursor, nav, hybrid routing, scroll reveal,
            reading progress bar, eco toggle
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
      if (!hitText || !h2 || hitText.childNodes.length) return;
      var mainTitle = '';
      var subtitle = '';
      h2.childNodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !mainTitle) {
          mainTitle = node.textContent.trim();
        } else if (node.nodeName === 'EM') {
          subtitle = node.textContent.trim();
        }
      });
      if (!mainTitle) mainTitle = h2.textContent.replace(/\s+/g, ' ').trim();
      hitText.appendChild(document.createTextNode(mainTitle));
      if (subtitle) {
        var sub = document.createElement('span');
        sub.className = 'rd-hit-sub';
        sub.textContent = subtitle;
        hitText.appendChild(sub);
      }
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

    setTimeout(updateReadingProgress, 100);
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
    var ids = [
      'ara-frame', 'ara-what', 'ara-scope', 'ara-lenses', 'ara-keeper', 'ara-shame',
      'ara-principles', 'ara-domains', 'ara-observe', 'ara-practice', 'ara-context'
    ];
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

  /* ── READING PROGRESS ── */
  var _rpBar  = document.getElementById('reading-progress');
  var _rpFill = document.getElementById('reading-progress-fill');
  function updateReadingProgress() {
    if (!_rpFill) return;
    var page = hasSpaPages ? document.querySelector('.page.active') : document.documentElement;
    if (!page) return;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docH = (page.scrollHeight || document.documentElement.scrollHeight) - window.innerHeight;
    if (docH <= 0) { _rpBar && _rpBar.classList.remove('visible'); return; }
    var pct = Math.min(100, Math.max(0, (scrollTop / docH) * 100));
    _rpFill.style.width = pct + '%';
    if (_rpBar) _rpBar.classList.toggle('visible', pct > 0);
  }

  window.addEventListener('scroll', updateReadingProgress, { passive: true });
  updateReadingProgress();

  /* ────────────────────────────────────────────────────────────
     The following sections used to live in this file and have
     been extracted into sibling scripts loaded after ui.js
     (defer order preserved by index.html):

       • ECOSYSTEM TOGGLE        → js/ui-eco-toggle.js
       • READING PATHWAYS        → js/ui-reading-pathways.js
       • JOURNAL                 → js/ui-journal.js
       • RHYSSA BOTTOM SHEET     → js/ui-rhyssa-sheet.js
       • RHYSSA COMPANION PAGE   → js/ui-rhyssa-page.js
       • SETTINGS PANEL          → js/ui-settings.js

     They are top-level IIFEs that talk to ui.js only through
     window.go / window.__arApplyFauna / window.__arApplyFlora,
     so the extraction is behaviour-preserving.
     ──────────────────────────────────────────────────────────── */
})();
