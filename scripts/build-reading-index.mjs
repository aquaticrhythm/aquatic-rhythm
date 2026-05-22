/**
 * build-reading-index.mjs
 *
 * Generates a localized /reading index page for each language that has
 * at least one article with status: "ready".
 *
 * Usage:
 *   node scripts/build-reading-index.mjs
 *   node scripts/build-reading-index.mjs --lang ms
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const TRANS_DIR = path.join(ROOT, 'translations');
const BASE_URL  = 'https://aquaticrhythm.com';
const TODAY     = new Date().toISOString().slice(0, 10);

const args     = process.argv.slice(2);
const langArg  = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;
const LANGS    = langArg ? [langArg] : ['ms', 'id', 'ja'];

// Preferred article order for the reading index
const SLUG_ORDER = [
  'new-tank-syndrome',
  'cycled-tank-problems',
  'why-is-my-aquarium-water-cloudy',
  'how-often-water-changes',
  'fish-hiding-what-does-it-mean',
  'adding-new-fish',
  'betta-fish-behaviour',
  'shrimp-dying-aquarium',
  'algae-in-aquarium',
  'overfeeding-aquarium',
  'aquarium-filter-maintenance',
  'fish-gasping-surface',
  'nitrate-keeps-rising',
  'fish-keep-dying-new-tank',
  'perfect-parameters-fish-dying',
  'ich-keeps-coming-back',
  'tank-crash-recovery',
  'aquarium-plants-not-growing',
  'low-tech-planted-tank',
  'community-fish-tank',
  'aquarium-travel-vacation',
  'aquarium-maintenance-routine',
  'aquarium-not-a-project',
  'when-is-tank-ready-for-fish',
  'know-your-rhythm',
  'four-principles-of-ara',
  'reading-the-five-rhythms',
  'when-hobby-stops-feeling-good',
  'caring-without-guilt',
];

// UI strings per language
const UI = {
  ms: {
    lang:        'ms',
    htmlLang:    'ms',
    pageTitle:   'Panduan Akuarium — Aquatic Rhythm',
    metaDesc:    'Panduan ekologi akuarium dalam Bahasa Melayu — nitrogen cycle, ritma penjagaan, dan pendekatan ARA. Mudah dibaca di telefon.',
    ogTitle:     'Panduan Akuarium — Aquatic Rhythm',
    eyebrow:     'Aquatic Rhythm',
    heading:     'Panduan ekologi<br><em>boleh dibaca di mana-mana.</em>',
    intro:       'Artikel ringkas tentang ekosistem akuarium tertutup — dipecah kepada modul pendek untuk telefon dan malam yang tenang. Biologi dan kimia dahulu; hype tidak ada.',
    backToEn:    'Lihat semua artikel dalam English →',
    backHome:    '← Kembali ke Aquatic Rhythm',
    notoFont:    false,
  },
  ja: {
    lang:        'ja',
    htmlLang:    'ja',
    pageTitle:   '水槽ガイド — Aquatic Rhythm',
    metaDesc:    '日本語で読める水槽生態学ガイド — 窒素サイクル、ケアのリズム、ARAフレームワーク。スマートフォンで読みやすいモジュール形式。',
    ogTitle:     '水槽ガイド — Aquatic Rhythm',
    eyebrow:     'Aquatic Rhythm',
    heading:     'どこでも読める<br><em>水槽生態学ガイド</em>',
    intro:       '閉鎖系水槽の生物学と化学を、スマートフォンで読みやすいモジュール形式で解説します。生物学と化学から始める——誇大広告はありません。',
    backToEn:    'すべての記事を英語で見る →',
    backHome:    '← Aquatic Rhythmに戻る',
    notoFont:    true,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getReadyArticles(lang) {
  const dir = path.join(TRANS_DIR, lang);
  if (!fs.existsSync(dir)) return [];

  const articles = [];
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (j._meta?.status !== 'ready') continue;
      articles.push({
        slug:       j._meta.slug,
        titleHtml:  j.intro?.titleHtml  || '',
        subtitle:   j.intro?.subtitle   || '',
        modules:    j.intro?.metaModules || '',
        time:       j.intro?.metaTime   || '',
        level:      j.intro?.metaLevel  || '',
      });
    } catch { /* skip malformed */ }
  }

  // Sort by preferred order, then alphabetically
  articles.sort((a, b) => {
    const ia = SLUG_ORDER.indexOf(a.slug);
    const ib = SLUG_ORDER.indexOf(b.slug);
    if (ia === -1 && ib === -1) return a.slug.localeCompare(b.slug);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return articles;
}

function buildLangSwitcher(lang, slug) {
  // For reading index pages, link between /reading equivalents.
  // Always include the current lang being built even if its file doesn't exist yet.
  const available = ['en', ...LANGS].filter(l => {
    if (l === 'en') return true;
    if (l === lang) return true;
    return fs.existsSync(path.join(ROOT, l, 'reading', 'index.html'));
  });
  if (available.length < 2) return '';

  const parts = available.map(l => {
    const url = l === 'en' ? `${BASE_URL}/reading` : `${BASE_URL}/${l}/reading`;
    if (l === lang) return `<span class="lang-sw-cur" aria-current="page">${l.toUpperCase()}</span>`;
    return `<a href="${url}" class="lang-sw-opt" hreflang="${l}">${l.toUpperCase()}</a>`;
  });

  return `<div class="lang-sw" aria-label="Language">${parts.join('<span class="lang-sw-sep" aria-hidden="true">·</span>')}</div>`;
}

function buildHreflang(lang) {
  const lines = [];
  lines.push(`<link rel="alternate" hreflang="en" href="${BASE_URL}/reading">`);
  for (const l of LANGS) {
    if (fs.existsSync(path.join(ROOT, l, 'reading', 'index.html')) || l === lang) {
      lines.push(`<link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}/reading">`);
    }
  }
  lines.push(`<link rel="alternate" hreflang="x-default" href="${BASE_URL}/reading">`);
  return lines.join('\n');
}

function buildCard(article, lang) {
  const metaParts = [article.modules, article.time, article.level].filter(Boolean);
  const metaStr   = metaParts.join(' &nbsp;·&nbsp; ');
  return `
    <a href="${BASE_URL}/${lang}/articles/${article.slug}" class="card">
      <div class="card-meta">${metaStr}</div>
      <h2>${article.titleHtml}</h2>
      <p>${article.subtitle}</p>
    </a>`;
}

function buildPage(lang, articles, ui) {
  const hreflang    = buildHreflang(lang);
  const cards       = articles.map(a => buildCard(a, lang)).join('\n');
  const canonicalUrl = `${BASE_URL}/${lang}/reading`;
  const notoLink    = ui.notoFont
    ? `\n<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400&display=swap" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400&display=swap" rel="stylesheet"></noscript>`
    : '';
  const sansStack   = ui.notoFont
    ? "'Lexend','Noto Sans JP',system-ui,sans-serif"
    : "'Lexend',system-ui,sans-serif";

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: ui.pageTitle,
    description: ui.metaDesc,
    url: canonicalUrl,
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', name: 'Aquatic Rhythm', url: BASE_URL },
    hasPart: articles.map(a => ({
      '@type': 'Article',
      name: a.titleHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      url: `${BASE_URL}/${lang}/articles/${a.slug}`,
    })),
  };

  return `<!DOCTYPE html>
<html lang="${ui.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${ui.pageTitle}</title>
<meta name="description" content="${ui.metaDesc}">
<link rel="canonical" href="${canonicalUrl}">
${hreflang}
<link rel="icon" type="image/png" sizes="48x48" href="/favicon.png">
<meta name="theme-color" content="#e9f0e4">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:title" content="${ui.ogTitle}">
<meta property="og:description" content="${ui.metaDesc}">
<meta property="og:image" content="${BASE_URL}/og-image.png">
<meta property="og:site_name" content="Aquatic Rhythm">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8MDN065WNW"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-8MDN065WNW');</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Lexend:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Lexend:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet"></noscript>${notoLink}
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:${sansStack};background:#f4f7f2;color:rgba(22,28,24,.88);line-height:1.85}
body::before{content:'';position:fixed;inset:0;z-index:-1;background:linear-gradient(180deg,#f5f8f3 0%,#e9f0e4 55%,#e3ebe0 100%)}
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:.9rem clamp(1rem,4vw,2.5rem);background:rgba(244,247,242,.92);backdrop-filter:blur(8px);border-bottom:1px solid rgba(22,28,24,.07)}
.nl{display:flex;align-items:center;gap:.5rem;text-decoration:none;font-size:.8rem;font-weight:500;color:rgba(22,28,24,.82);letter-spacing:.04em}
.nl svg{width:22px;height:22px;opacity:.7}
.lang-sw{display:flex;align-items:center;gap:.4rem;font-size:.58rem;letter-spacing:.16em;text-transform:uppercase}
.lang-sw-opt{color:rgba(45,107,82,.65);text-decoration:none;transition:color .2s}.lang-sw-opt:hover{color:rgba(45,107,82,.95)}
.lang-sw-cur{color:rgba(22,28,24,.88);font-weight:500}
.lang-sw-sep{color:rgba(22,28,24,.22)}
main{max-width:680px;margin:0 auto;padding:7rem clamp(1.25rem,5vw,2rem) 5rem}
.eyebrow{display:block;font-size:.6rem;font-weight:500;letter-spacing:.26em;text-transform:uppercase;color:rgba(45,107,82,.82);margin-bottom:1.4rem}
h1{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:clamp(2rem,5vw,3.2rem);color:rgba(22,28,24,.92);line-height:1.1;margin-bottom:1.5rem}
h1 em{font-style:italic;color:rgba(45,107,82,.82)}
.intro{font-size:1.05rem;font-weight:400;color:rgba(22,28,24,.58);line-height:1.9;margin-bottom:3rem}
.articles{display:flex;flex-direction:column;gap:1rem}
.card{display:block;padding:1.5rem 1.65rem;border:1px solid rgba(22,28,24,.08);background:rgba(255,255,255,.92);border-radius:14px;box-shadow:0 8px 28px rgba(22,48,32,.08),inset 0 1px 0 rgba(255,255,255,.06);text-decoration:none;transition:border-color .25s,transform .28s cubic-bezier(0.22,1,0.36,1)}
.card:hover{border-color:rgba(45,107,82,.28);transform:translateY(-2px)}
.card-meta{font-size:.56rem;letter-spacing:.16em;text-transform:uppercase;color:rgba(22,28,24,.38);margin-bottom:.55rem}
.card h2{font-family:'Fraunces',Georgia,serif;font-weight:300;font-size:1.35rem;color:rgba(22,28,24,.88);line-height:1.25;margin-bottom:.5rem}
.card h2 em{font-style:italic;color:rgba(45,107,82,.72)}
.card p{font-size:.88rem;font-weight:400;color:rgba(22,28,24,.58);line-height:1.85;margin:0}
.more{margin-top:2rem;padding:1.2rem 1.4rem;border:1px solid rgba(22,28,24,.08);background:rgba(255,255,255,.65);border-radius:8px}
.more p{font-size:.85rem;color:rgba(22,28,24,.54);line-height:1.7;margin-bottom:.6rem}
.more a{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(45,107,82,.82);text-decoration:none}
.more a:hover{color:rgba(45,107,82,.95)}
.back{display:inline-block;margin-top:2.4rem;font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:rgba(45,107,82,.72);text-decoration:none}
.back:hover{color:rgba(45,107,82,.92)}
</style>
</head>
<body>

<nav>
  <a href="/" class="nl" aria-label="Aquatic Rhythm">
    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="11" cy="11" r="9" stroke="rgba(45,107,82,0.4)" stroke-width="1" fill="none"/>
      <ellipse cx="10.5" cy="11" rx="3.2" ry="1.9" fill="rgba(45,107,82,0.7)"/>
      <path d="M7.5 11 L5.8 9.2 L5.8 12.8 Z" fill="rgba(45,107,82,0.6)"/>
      <path d="M3 11 C5.5 7 8 7 10.5 11 C13 15 15.5 15 18 11" stroke="rgba(45,107,82,0.9)" stroke-width="1" fill="none" stroke-linecap="round"/>
    </svg>
    Aquatic Rhythm
  </a>
  ${buildLangSwitcher(lang, 'reading')}
</nav>

<main>
  <span class="eyebrow">${ui.eyebrow}</span>
  <h1>${ui.heading}</h1>
  <p class="intro">${ui.intro}</p>

  <div class="articles">
${cards}
  </div>

  <div class="more">
    <p>${ui.backToEn.replace(' →', '')}</p>
    <a href="${BASE_URL}/reading">${ui.backToEn}</a>
  </div>

  <a href="/" class="back">${ui.backHome}</a>
</main>

</body>
</html>
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('Building localized reading index pages…');

for (const lang of LANGS) {
  const ui = UI[lang];
  if (!ui) { console.log(`  skip ${lang} (no UI strings defined)`); continue; }

  const articles = getReadyArticles(lang);
  if (articles.length === 0) { console.log(`  skip ${lang} (no ready articles)`); continue; }

  const outDir = path.join(ROOT, lang, 'reading');
  fs.mkdirSync(outDir, { recursive: true });

  const html = buildPage(lang, articles, ui);
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`  → ${lang}/reading/index.html (${articles.length} articles)`);
}

console.log('Done.');
