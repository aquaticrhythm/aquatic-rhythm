/**
 * Generates localized HTML files from English source articles + translation JSON.
 *
 * Usage:
 *   node scripts/build-i18n.mjs --lang ms [--slug adding-new-fish]
 *   node scripts/build-i18n.mjs --lang ms          (builds all translated articles)
 *   node scripts/build-i18n.mjs --all              (builds all languages)
 *   node scripts/build-i18n.mjs --patch-english    (adds hreflang to English source files)
 *
 * Output:
 *   /<lang>/articles/<slug>.html   — localized article
 *   /articles/<slug>.html          — patched with hreflang (when --patch-english)
 */

import fs from 'fs';
import path from 'path';

const ROOT       = path.join(import.meta.dirname, '..');
const ART_DIR    = path.join(ROOT, 'articles');
const TRANS_DIR  = path.join(ROOT, 'translations');
const BASE_URL   = 'https://aquaticrhythm.com';
const LANGUAGES  = ['ms', 'id', 'ja', 'es'];

const args      = process.argv.slice(2);
const langIdx   = args.indexOf('--lang');
const slugIdx   = args.indexOf('--slug');
const langArg   = langIdx !== -1 ? args[langIdx + 1] : undefined;
const slugArg   = slugIdx !== -1 ? args[slugIdx + 1] : undefined;
const doAll     = args.includes('--all');
const patchEn   = args.includes('--patch-english');

// ── Language switcher ─────────────────────────────────────────────────────────

const LANG_LABELS = { en: 'EN', ms: 'MS', id: 'ID', ja: 'JA', es: 'ES' };

function buildLangSwitcher(slug, currentLang) {
  // Collect available lang → URL pairs
  const options = [{ lang: 'en', url: `${BASE_URL}/articles/${slug}` }];
  for (const lang of LANGUAGES) {
    const tPath = path.join(TRANS_DIR, lang, `${slug}.json`);
    if (!fs.existsSync(tPath)) continue;
    try {
      const t = JSON.parse(fs.readFileSync(tPath, 'utf8'));
      if (t._meta && t._meta.status === 'ready') {
        options.push({ lang, url: `${BASE_URL}/${lang}/articles/${slug}` });
      }
    } catch { /* skip */ }
  }

  // Only inject switcher if more than one language is available
  if (options.length < 2) return '';

  const currentLabel = LANG_LABELS[currentLang];
  const others = options.filter(o => o.lang !== currentLang);
  const menuItems = others.map(({ lang, url }) =>
    `<a href="${url}" class="lang-sw-opt" hreflang="${lang}">${LANG_LABELS[lang]}</a>`
  ).join('');

  const dropdown = `<details class="lang-sw" aria-label="Language"><summary class="lang-sw-cur" aria-current="page">${currentLabel}</summary><div class="lang-sw-menu">${menuItems}</div></details>`;
  const closeScript = `<script>if(!window._lswH){window._lswH=1;document.addEventListener('click',function(e){if(!e.target.closest('.lang-sw'))document.querySelectorAll('details.lang-sw[open]').forEach(function(d){d.removeAttribute('open')})})}</script>`;
  return dropdown + '\n' + closeScript;
}

// ── SEO helpers ───────────────────────────────────────────────────────────────

/** Return hreflang <link> tags for all available language versions of a slug. */
function buildHreflangTags(slug, currentLang) {
  const lines = [];

  // Always include English canonical
  lines.push(`<link rel="alternate" hreflang="en" href="${BASE_URL}/articles/${slug}">`);

  // Include each language that has a translation file
  for (const lang of LANGUAGES) {
    const tPath = path.join(TRANS_DIR, lang, `${slug}.json`);
    if (fs.existsSync(tPath)) {
      lines.push(`<link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${lang}/articles/${slug}">`);
    }
  }

  // x-default always points to English
  lines.push(`<link rel="alternate" hreflang="x-default" href="${BASE_URL}/articles/${slug}">`);

  return lines.join('\n');
}

function buildJsonLd(t, lang, slug) {
  const headline = t.intro.titleHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': headline,
    'description': t.head.description,
    'url': `${BASE_URL}/${lang}/articles/${slug}`,
    'inLanguage': lang,
    'author': { '@type': 'Organization', 'name': 'Aquatic Rhythm' },
    'publisher': { '@type': 'Organization', 'name': 'Aquatic Rhythm', 'url': BASE_URL }
  });
}

// ── Safe string replacement ───────────────────────────────────────────────────
// Using a function as replacement prevents '$' in replacement strings from being
// interpreted as special backreferences.

function replaceOnce(html, pattern, fn) {
  return html.replace(pattern, fn);
}

// ── Build one article ─────────────────────────────────────────────────────────

function buildArticle(slug, lang, t) {
  const srcPath = path.join(ART_DIR, `${slug}.html`);
  if (!fs.existsSync(srcPath)) {
    console.error(`  source not found: ${srcPath}`);
    return;
  }

  let h = fs.readFileSync(srcPath, 'utf8');

  // ── 1. HTML lang attribute ────────────────────────────────────────────────
  h = h.replace(/(<html[^>]*\slang=")[^"]*(")/,
    (_, a, b) => `${a}${lang}${b}`);

  // ── 2. Head meta ──────────────────────────────────────────────────────────
  h = replaceOnce(h, /<title>[^<]*<\/title>/,
    () => `<title>${t.head.title}</title>`);

  h = replaceOnce(h, /(<meta name="description" content=")[^"]*(")/,
    (_, a, b) => `${a}${t.head.description}${b}`);

  h = replaceOnce(h, /(<meta property="og:title" content=")[^"]*(")/,
    (_, a, b) => `${a}${t.head.ogTitle}${b}`);

  h = replaceOnce(h, /(<meta property="og:description" content=")[^"]*(")/,
    (_, a, b) => `${a}${t.head.ogDescription}${b}`);

  // ── 3. Canonical + OG URL ─────────────────────────────────────────────────
  const localUrl = `${BASE_URL}/${lang}/articles/${slug}`;

  h = replaceOnce(h, /(<link rel="canonical" href=")[^"]*(")/,
    (_, a, b) => `${a}${localUrl}${b}`);

  h = replaceOnce(h, /(<meta property="og:url" content=")[^"]*(")/,
    (_, a, b) => `${a}${localUrl}${b}`);

  // ── 4. hreflang tags (inject after canonical) ─────────────────────────────
  // Strip any existing hreflang tags before injecting fresh ones.
  h = h.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\n?/g, '');
  const hreflang = buildHreflangTags(slug, lang);
  h = replaceOnce(h, /(<link rel="canonical"[^>]*>)/,
    (_, canon) => `${canon}\n${hreflang}`);

  // ── 4b. Language switcher (inject before burger button in nav) ────────────
  // Strip any existing lang-sw injected by a previous patch/build run first.
  h = h.replace(/<details class="lang-sw"[\s\S]*?<\/details>\n?/g, '');
  h = h.replace(/<div class="lang-sw"[^>]*>.*?<\/div>\n?/g, '');
  h = h.replace(/<script>if\(!window\._lswH\)[\s\S]*?<\/script>\n?/g, '');
  const switcher = buildLangSwitcher(slug, lang);
  if (switcher) {
    h = replaceOnce(h, /(<button class="nbg")/,
      (_, btn) => `${switcher}\n${btn}`);
  }

  // ── 5. JSON-LD ────────────────────────────────────────────────────────────
  h = replaceOnce(h, /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    () => `<script type="application/ld+json">${buildJsonLd(t, lang, slug)}</script>`);

  // ── 6. Japanese font (Noto Sans JP) ──────────────────────────────────────
  if (lang === 'ja') {
    const notoLink = `\n<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400&display=swap" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400&display=swap" rel="stylesheet"></noscript>`;
    h = h.replace(/(<\/style>)/, `$1${notoLink}`);
    // Override sans-serif stack to include Noto Sans JP
    h = h.replace(
      /(--sans:'DM Sans',system-ui,sans-serif)/,
      "--sans:'DM Sans','Noto Sans JP',system-ui,sans-serif"
    );
  }

  // ── 7. Intro section ─────────────────────────────────────────────────────
  const intro = t.intro;

  h = replaceOnce(h, /(<span class="art-eyebrow">)[^<]*(<\/span>)/,
    (_, a, b) => `${a}${intro.eyebrow}${b}`);

  h = replaceOnce(h, /(<h1 class="art-main-title">)[\s\S]*?(<\/h1>)/,
    (_, a, b) => `${a}${intro.titleHtml}${b}`);

  h = replaceOnce(h, /(<p class="art-intro-subtitle">)[\s\S]*?(<\/p>)/,
    (_, a, b) => `${a}${intro.subtitle}${b}`);

  // Replace art-intro-text paragraphs in order
  let textIdx = 0;
  const texts = intro.texts || [];
  h = h.replace(/(<p class="art-intro-text">)[\s\S]*?(<\/p>)/g, (match, a, b) => {
    if (textIdx < texts.length) return `${a}${texts[textIdx++]}${b}`;
    return match;
  });

  // Replace the three plain <span> in art-intro-meta (not meta-dot spans)
  const metaVals = [intro.metaModules, intro.metaTime, intro.metaLevel].filter(Boolean);
  let metaIdx = 0;
  h = replaceOnce(h, /(<div class="art-intro-meta">)([\s\S]*?)(<\/div>)/,
    (_, open, inner, close) => {
      const newInner = inner.replace(/<span>([^<]*)<\/span>/g, (m) => {
        if (metaIdx < metaVals.length) return `<span>${metaVals[metaIdx++]}</span>`;
        return m;
      });
      return `${open}${newInner}${close}`;
    });

  // CTA button text (before the <span>→</span>)
  h = replaceOnce(h, /(<button class="art-begin-btn"[^>]*>)[^<]*(<span)/,
    (_, btn, arrow) => `${btn}${intro.cta} ${arrow}`);

  // ── 8. Module sections ────────────────────────────────────────────────────
  const modules = t.modules || [];
  h = h.replace(/<section class="module" id="(mod-\d+)"[^>]*>([\s\S]*?)<\/section>/g,
    (match, id, content) => {
      const idx = parseInt(id.replace('mod-', ''), 10) - 1;
      const mod = modules[idx];
      if (!mod) return match;

      let c = content;

      // mod-tag
      c = replaceOnce(c, /(<span class="mod-tag">)[^<]*(<\/span>)/,
        (_, a, b) => `${a}${mod.tag}${b}`);

      // mod-title — mod-1 uses <h1>, others use <h2>
      c = replaceOnce(c, /(<h[12] class="mod-title">)[\s\S]*?(<\/h[12]>)/,
        (_, a, b) => `${a}${mod.titleHtml}${b}`);

      // mod-body paragraphs — replace ALL mod-body divs; translated content goes into
      // the first one, subsequent divs (used for canvas context in some articles) are removed.
      // Uses depth-aware div tracking so nested divs inside mod-body (e.g. pq, hn, rhythm-grid)
      // are handled correctly and don't cause a lazy-regex to stop early.
      // Any pq/hn elements found INSIDE mod-body are rescued and re-injected after the new
      // mod-body so the subsequent pq/hn replacement steps can still find and translate them.
      if (mod.body && mod.body.length) {
        const paras = mod.body.map(p => `\n      <p>${p}</p>`).join('');
        const newModBody = `<div class="mod-body">${paras}\n    </div>`;
        let replaced = false;
        let result = '';
        let rest = c;
        while (rest.length > 0) {
          const mbIdx = rest.indexOf('<div class="mod-body">');
          if (mbIdx === -1) { result += rest; break; }
          result += rest.slice(0, mbIdx);
          let depth = 0, i = mbIdx, endIdx = -1;
          while (i < rest.length) {
            if (rest[i] === '<') {
              if (rest.slice(i, i + 4) === '<div') { depth++; }
              else if (rest.slice(i, i + 6) === '</div>') {
                depth--;
                if (depth === 0) { endIdx = i + 6; break; }
              }
            }
            i++;
          }
          if (endIdx === -1) { result += rest.slice(mbIdx); break; }
          if (!replaced) {
            // Rescue any pq/hn elements nested inside this mod-body so the
            // later replacement steps can still translate them.
            const mbContent = rest.slice(mbIdx, endIdx);
            const rescued = [...mbContent.matchAll(/<div class="(?:pq[^"]*|hn[^"]*)">[\s\S]*?<\/div>/g)]
              .map(m => m[0]).join('\n    ');
            result += newModBody + (rescued ? '\n    ' + rescued : '');
            replaced = true;
          }
          rest = rest.slice(endIdx);
        }
        c = result;
      }

      // Pull quotes — pullQuote for first block, additionalPullQuotes for the rest.
      // Regex matches <div class="pq"> with or without inline style/attrs.
      {
        const allPq = [];
        if (mod.pullQuote) allPq.push(mod.pullQuote);
        if (mod.additionalPullQuotes && mod.additionalPullQuotes.length) allPq.push(...mod.additionalPullQuotes);
        if (allPq.length) {
          let pqIdx = 0;
          c = c.replace(/(<div class="pq"[^>]*>\s*<p>)([\s\S]*?)(<\/p>)/g, (m, open, _inner, close) => {
            if (pqIdx < allPq.length) return `${open}${allPq[pqIdx++]}${close}`;
            return m;
          });
        }
      }

      // Simulator / CTA link text inside a pq block (optional)
      if (mod.simulatorLinkText) {
        c = c.replace(/(href="\/articles\/tank-simulator"[^>]*>)[^<]*/,
          (m, prefix) => `${prefix}${mod.simulatorLinkText}`);
      }

      // Hint boxes — supports up to 3 per module (hintLabel/hintText + hintLabel2/hintText2 + hintLabel3/hintText3).
      {
        const hints = [];
        if (mod.hintLabel) hints.push({ label: mod.hintLabel, text: mod.hintText || [] });
        if (mod.hintLabel2) hints.push({ label: mod.hintLabel2, text: mod.hintText2 || [] });
        if (mod.hintLabel3) hints.push({ label: mod.hintLabel3, text: mod.hintText3 || [] });
        if (hints.length) {
          let hIdx = 0;
          c = c.replace(
            /(<div class="hn[^"]*">)([\s\S]*?)(<span[^>]*>)[^<]*(<\/span>)([\s\S]*?)(<\/div>)/g,
            (full, divOpen, preSpan, spanOpen, spanClose, _body, divClose) => {
              if (hIdx < hints.length) {
                const hint = hints[hIdx++];
                const paras = hint.text.map(p => `\n      <p>${p}</p>`).join('');
                return `${divOpen}${preSpan}${spanOpen}${hint.label}${spanClose}${paras}\n    ${divClose}`;
              }
              return full;
            }
          );
        }
      }

      // Rhythm grid cell names/descriptions (optional — used in cycled-tank-problems).
      if (mod.rhythmGrid && mod.rhythmGrid.length) {
        let nameIdx = 0, descIdx = 0;
        c = c.replace(/(<div class="rhythm-cell-name">)[^<]*(<\/div>)/g, (_, a, b) => {
          if (nameIdx < mod.rhythmGrid.length) return `${a}${mod.rhythmGrid[nameIdx++].name}${b}`;
          return _;
        });
        c = c.replace(/(<div class="rhythm-cell-desc">)[^<]*(<\/div>)/g, (_, a, b) => {
          if (descIdx < mod.rhythmGrid.length) return `${a}${mod.rhythmGrid[descIdx++].desc}${b}`;
          return _;
        });
      }

      // Final CTA block (optional — e.g. mod-6 in cycled-tank-problems).
      if (mod.finalCtaText) {
        c = c.replace(/(<div class="final-cta">[\s\S]*?<p>)([\s\S]*?)(<\/p>)/,
          (_, pre, _body, close) => `${pre}${mod.finalCtaText}${close}`);
      }
      if (mod.finalCtaBtn1 || mod.finalCtaBtn2) {
        let btnIdx = 0;
        c = c.replace(/(<a [^>]*class="btn-reading"[^>]*>)([^<]*)/g, (match, open, _text) => {
          if (btnIdx === 0 && mod.finalCtaBtn1) { btnIdx++; return `${open}${mod.finalCtaBtn1}`; }
          if (btnIdx === 1 && mod.finalCtaBtn2) { btnIdx++; return `${open}${mod.finalCtaBtn2}`; }
          btnIdx++;
          return match;
        });
      }

      // prev button
      if (mod.prevBtn) {
        c = replaceOnce(c, /(<button class="btn-prev"[^>]*>)[^<]*(<\/button>)/,
          (_, a, b) => `${a}${mod.prevBtn}${b}`);
      }

      // next button
      if (mod.nextBtn) {
        c = replaceOnce(c, /(<button class="btn-next"[^>]*>)[^<]*(<span)/,
          (_, a, arrow) => `${a}${mod.nextBtn} ${arrow}`);
      }

      return match.replace(content, () => c);
    });

  // ── 9. Related article link text ─────────────────────────────────────────
  const relatedLinks = t.relatedLinks || [];
  let relIdx = 0;
  h = h.replace(/<a href="([^"]*)" class="btn-ar"[^>]*>([^<]*)/g, (match, href, _origText) => {
    if (relIdx < relatedLinks.length) {
      const rel = relatedLinks[relIdx++];
      return match.replace(_origText, () => rel.text);
    }
    return match;
  });

  // ── 10. Article footer — scoped to art-footer to avoid touching nav links ──
  if (t.footer) {
    h = replaceOnce(h, /(<div class="art-footer">)([\s\S]*?)(<\/div>)/,
      (_, open, inner, close) => {
        let f = inner;
        if (t.footer.allArticles) {
          f = f.replace(/(<a href="\/reading">)[^<]*(<\/a>)/,
            (__, a, b) => `${a}${t.footer.allArticles}${b}`);
        }
        if (t.footer.araLink) {
          f = f.replace(/(<a href="\/articles\/ara-full-framework">)[^<]*(<\/a>)/,
            (__, a, b) => `${a}${t.footer.araLink}${b}`);
        }
        return `${open}${f}${close}`;
      });
  }

  return h;
}

// ── Patch English source files with hreflang ──────────────────────────────────

function patchEnglishArticle(slug) {
  const srcPath = path.join(ART_DIR, `${slug}.html`);
  if (!fs.existsSync(srcPath)) return;

  let h = fs.readFileSync(srcPath, 'utf8');
  let changed = false;

  // Always strip and re-inject hreflang so new languages are picked up.
  const hreflangBefore = h;
  h = h.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\n?/g, '');
  const hreflang = buildHreflangTags(slug, 'en');
  h = replaceOnce(h, /(<link rel="canonical"[^>]*>)/,
    (_, canon) => `${canon}\n${hreflang}`);
  if (h !== hreflangBefore) changed = true;

  // Strip and re-inject language switcher so new languages appear.
  h = h.replace(/<details class="lang-sw"[\s\S]*?<\/details>\n?/g, '');
  h = h.replace(/<div class="lang-sw"[^>]*>.*?<\/div>\n?/g, '');
  h = h.replace(/<script>if\(!window\._lswH\)[\s\S]*?<\/script>\n?/g, '');
  const switcher = buildLangSwitcher(slug, 'en');
  if (switcher) {
    h = replaceOnce(h, /(<button class="nbg")/,
      (_, btn) => `${switcher}\n${btn}`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(srcPath, h, 'utf8');
    console.log(`  patched: articles/${slug}.html`);
  } else {
    console.log(`  up to date: articles/${slug}.html`);
  }
}

// ── Discover translated slugs for a language ─────────────────────────────────

/** Return slugs whose translation JSON has _meta.status === "ready" */
function getTranslatedSlugs(lang) {
  const dir = path.join(TRANS_DIR, lang);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .filter(slug => {
      try {
        const t = JSON.parse(fs.readFileSync(path.join(dir, `${slug}.json`), 'utf8'));
        return t._meta && t._meta.status === 'ready';
      } catch { return false; }
    });
}

// ── Main ──────────────────────────────────────────────────────────────────────

function buildLang(lang) {
  const slugs = slugArg ? [slugArg] : getTranslatedSlugs(lang);
  if (!slugs.length) {
    console.log(`  no translations found for lang=${lang}`);
    return;
  }

  console.log(`Building ${slugs.length} article(s) for lang=${lang}…`);
  const outDir = path.join(ROOT, lang, 'articles');
  fs.mkdirSync(outDir, { recursive: true });

  for (const slug of slugs) {
    const tPath = path.join(TRANS_DIR, lang, `${slug}.json`);
    if (!fs.existsSync(tPath)) {
      console.log(`  no translation: ${tPath}`);
      continue;
    }

    let t;
    try {
      t = JSON.parse(fs.readFileSync(tPath, 'utf8'));
    } catch (e) {
      console.error(`  JSON parse error in ${tPath}: ${e.message}`);
      continue;
    }

    const html = buildArticle(slug, lang, t);
    if (!html) continue;

    const outPath = path.join(outDir, `${slug}.html`);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`  → ${lang}/articles/${slug}.html`);
  }
}

if (patchEn) {
  // Patch all English articles that have at least one translation
  const allSlugs = new Set();
  for (const lang of LANGUAGES) {
    for (const s of getTranslatedSlugs(lang)) allSlugs.add(s);
  }
  console.log(`Patching ${allSlugs.size} English article(s) with hreflang…`);
  for (const slug of allSlugs) patchEnglishArticle(slug);
  console.log('Done.');
} else if (doAll) {
  for (const lang of LANGUAGES) buildLang(lang);
  console.log('Done.');
} else if (langArg) {
  buildLang(langArg);
  console.log('Done.');
} else {
  console.error('Usage:\n  node scripts/build-i18n.mjs --lang ms [--slug <slug>]\n  node scripts/build-i18n.mjs --all\n  node scripts/build-i18n.mjs --patch-english');
  process.exit(1);
}
