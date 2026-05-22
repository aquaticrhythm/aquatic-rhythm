/**
 * update-sitemap.mjs
 *
 * Generates localized sitemaps for each language with ready translations,
 * then writes a sitemap-index.xml referencing all sitemaps.
 *
 * Usage:
 *   node scripts/update-sitemap.mjs
 *
 * Output:
 *   sitemap-en.xml    — copy of existing sitemap.xml
 *   sitemap-ms.xml    — Malay articles + /ms/reading
 *   sitemap-ja.xml    — Japanese articles + /ja/reading
 *   sitemap-index.xml — references all sitemaps
 *   robots.txt        — updated to reference sitemap-index.xml
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const TRANS_DIR = path.join(ROOT, 'translations');
const BASE_URL  = 'https://aquaticrhythm.com';
const TODAY     = new Date().toISOString().slice(0, 10);
const LANGS     = ['ms', 'id', 'ja'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getReadySlugs(lang) {
  const dir = path.join(TRANS_DIR, lang);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .filter(f => {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        return j._meta?.status === 'ready';
      } catch { return false; }
    })
    .map(f => f.replace('.json', ''))
    .sort();
}

function urlEntry(loc, priority = '0.8', changefreq = 'monthly') {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${TODAY}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

// ── Build per-language sitemap ────────────────────────────────────────────────

function buildLangSitemap(lang) {
  const slugs = getReadySlugs(lang);
  if (slugs.length === 0) return null;

  const entries = [
    urlEntry(`${BASE_URL}/${lang}/reading`, '0.85', 'weekly'),
    ...slugs.map(slug => urlEntry(`${BASE_URL}/${lang}/articles/${slug}`)),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '',
    entries.join('\n\n'),
    '',
    '</urlset>',
  ].join('\n');
}

// ── Build sitemap-index.xml ───────────────────────────────────────────────────

function buildSitemapIndex(activeLangs) {
  const allLangs = ['en', ...activeLangs];
  const entries = allLangs.map(lang => [
    '  <sitemap>',
    `    <loc>${BASE_URL}/sitemap-${lang}.xml</loc>`,
    `    <lastmod>${TODAY}</lastmod>`,
    '  </sitemap>',
  ].join('\n'));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '',
    entries.join('\n\n'),
    '',
    '</sitemapindex>',
  ].join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('Updating sitemaps…');

// Copy current sitemap.xml → sitemap-en.xml
const existingSitemap = path.join(ROOT, 'sitemap.xml');
const enSitemapPath   = path.join(ROOT, 'sitemap-en.xml');
fs.copyFileSync(existingSitemap, enSitemapPath);
console.log('  → sitemap-en.xml');

// Generate per-language sitemaps
const activeLangs = [];
for (const lang of LANGS) {
  const content = buildLangSitemap(lang);
  if (content) {
    fs.writeFileSync(path.join(ROOT, `sitemap-${lang}.xml`), content + '\n');
    console.log(`  → sitemap-${lang}.xml (${getReadySlugs(lang).length} articles)`);
    activeLangs.push(lang);
  }
}

// Write sitemap-index.xml
fs.writeFileSync(
  path.join(ROOT, 'sitemap-index.xml'),
  buildSitemapIndex(activeLangs) + '\n'
);
console.log('  → sitemap-index.xml');

// Update robots.txt — ensure only sitemap-index.xml is listed
const robotsPath = path.join(ROOT, 'robots.txt');
let robots = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, 'utf8') : 'User-agent: *\nAllow: /\n';
robots = robots.replace(/^Sitemap:.*\n?/gm, '').trimEnd();
robots += `\nSitemap: ${BASE_URL}/sitemap-index.xml\n`;
fs.writeFileSync(robotsPath, robots);
console.log('  → robots.txt');

console.log('Done.');
