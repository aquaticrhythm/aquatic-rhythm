/* ============================================================
   sw.js — Aquatic Rhythm Service Worker
   Cache strategy:
     Shell (index, css, js) → network-first, cache fallback (offline)
     Articles              → network-first, cache fallback (offline)
     Google Fonts          → cache-first
     Analytics             → network-only (pass through)
     SPA sub-pages         → network-first, fallback to /
   Network-first on HTML/CSS/JS keeps the live site aligned with the
   deployed repo; cache is only used when the network request fails.
   ============================================================ */

var SHELL_CACHE   = 'ar-shell-v8';
var ARTICLE_CACHE = 'ar-articles-v8';

var SHELL_URLS = [
  '/',
  '/css/style.css',
  '/js/ui.js',
  '/js/ecosystem.js',
  '/js/fauna.js',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/offline.html'
];

/* A handful of high-value articles pre-fetched after install */
var WARM_ARTICLES = [
  '/articles/new-tank-syndrome.html',
  '/articles/algae-in-aquarium.html',
  '/articles/cycled-tank-problems.html',
  '/articles/aquarium-maintenance-routine.html',
  '/articles/know-your-rhythm.html',
  '/articles/caring-without-guilt.html',
  '/articles/betta-fish-behaviour.html'
];

/* ── INSTALL ── */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function (cache) { return cache.addAll(SHELL_URLS); })
      .then(function () { return self.skipWaiting(); })
  );
});

/* ── ACTIVATE ── */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) { return k !== SHELL_CACHE && k !== ARTICLE_CACHE; })
            .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () {
        /* Opportunistically warm article cache — don't block activation */
        caches.open(ARTICLE_CACHE).then(function (cache) {
          cache.addAll(WARM_ARTICLES).catch(function () {});
        });
        return self.clients.claim();
      })
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);

  /* Rhyssa chat API — always network-only, never cache */
  if (url.hostname === 'api.aquaticrhythm.com') {
    return;
  }

  /* Analytics / tag manager — always network-only */
  if (url.hostname.indexOf('google') !== -1 || url.hostname.indexOf('googletagmanager') !== -1) {
    return;
  }

  /* Google Fonts — cache-first */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(SHELL_CACHE).then(function (cache) {
        return cache.match(event.request).then(function (cached) {
          if (cached) return cached;
          return fetch(event.request).then(function (response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(function () { return new Response('', { status: 503 }); });
        });
      })
    );
    return;
  }

  /* App shell — network-first so deploys match the repo immediately */
  if (SHELL_URLS.indexOf(url.pathname) !== -1) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(function (cache) {
        return fetch(event.request)
          .then(function (response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(function () {
            return cache.match(event.request).then(function (cached) {
              return cached || caches.match('/offline.html');
            });
          });
      })
    );
    return;
  }

  /* Article pages — network-first (same freshness guarantee as shell) */
  if (url.pathname.indexOf('/articles/') === 0) {
    event.respondWith(
      caches.open(ARTICLE_CACHE).then(function (cache) {
        return fetch(event.request)
          .then(function (response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(function () {
            return cache.match(event.request).then(function (cached) {
              return cached || caches.match('/offline.html');
            });
          });
      })
    );
    return;
  }

  /* SPA sub-pages (/ara, /rhyssa, etc.) — network-first, fallback to shell */
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match('/') || caches.match('/offline.html');
    })
  );
});
