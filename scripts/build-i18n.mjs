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
const LANGUAGES  = ['ms', 'id', 'ja'];

const args      = process.argv.slice(2);
const langIdx   = args.indexOf('--lang');
const slugIdx   = args.indexOf('--slug');
const langArg   = langIdx !== -1 ? args[langIdx + 1] : undefined;
const slugArg   = slugIdx !== -1 ? args[slugIdx + 1] : undefined;
const doAll     = args.includes('--all');
const patchEn   = args.includes('--patch-english');

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
  const hreflang = buildHreflangTags(slug, lang);
  h = replaceOnce(h, /(<link rel="canonical"[^>]*>)/,
    (_, canon) => `${canon}\n${hreflang}`);

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

      // mod-title (may contain <em>, <br>)
      c = replaceOnce(c, /(<h2 class="mod-title">)[\s\S]*?(<\/h2>)/,
        (_, a, b) => `${a}${mod.titleHtml}${b}`);

      // mod-body paragraphs
      if (mod.body && mod.body.length) {
        c = replaceOnce(c, /(<div class="mod-body">)([\s\S]*?)(<\/div>)/,
          (_, open, _inner, close) => {
            const paras = mod.body.map(p => `\n      <p>${p}</p>`).join('');
            return `${open}${paras}\n    ${close}`;
          });
      }

      // Pull quote (optional)
      if (mod.pullQuote) {
        c = replaceOnce(c, /(<div class="pq">\s*<p>)([\s\S]*?)(<\/p>)/,
          (_, open, _inner, close) => `${open}${mod.pullQuote}${close}`);
      }

      // Hint box label (optional)
      if (mod.hintLabel) {
        c = replaceOnce(c, /(<span class="hn-label">)[^<]*(<\/span>)/,
          (_, a, b) => `${a}${mod.hintLabel}${b}`);
      }

      // Hint box paragraphs (optional — hintText is array of strings)
      if (mod.hintText && mod.hintText.length) {
        c = replaceOnce(c,
          /(<div class="hn">[\s\S]*?<span[^>]*>[^<]*<\/span>)([\s\S]*?)(<\/div>)/,
          (_, head, _body, tail) => {
            const paras = mod.hintText.map(p => `\n      <p>${p}</p>`).join('');
            return `${head}${paras}\n    ${tail}`;
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
          f = f.replace(/(<a href="\/ara">)[^<]*(<\/a>)/,
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

  // Skip if hreflang already injected
  if (h.includes('hreflang="en"')) {
    console.log(`  already patched: articles/${slug}.html`);
    return;
  }

  const hreflang = buildHreflangTags(slug, 'en');
  h = replaceOnce(h, /(<link rel="canonical"[^>]*>)/,
    (_, canon) => `${canon}\n${hreflang}`);

  fs.writeFileSync(srcPath, h, 'utf8');
  console.log(`  patched: articles/${slug}.html`);
}

// ── Discover translated slugs for a language ─────────────────────────────────

function getTranslatedSlugs(lang) {
  const dir = path.join(TRANS_DIR, lang);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
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
