/**
 * Generates sitemap-index.xml + per-language sitemaps for translated articles.
 *
 * Usage:
 *   node scripts/update-sitemap.mjs
 *
 * Output:
 *   /sitemap-index.xml    — sitemap index referencing all sitemaps
 *   /sitemap-ms.xml       — Malay article URLs (if any translations exist)
 *   /sitemap-id.xml       — Indonesian article URLs
 *   /sitemap-ja.xml       — Japanese article URLs
 *
 * The original /sitemap.xml (English) is left unchanged.
 * robots.txt is updated to also reference sitemap-index.xml.
 */

import fs from 'fs';
import path from 'path';

const ROOT        = path.join(import.meta.dirname, '..');
const TRANS_DIR   = path.join(ROOT, 'translations');
const BASE_URL    = 'https://aquaticrhythm.com';
const LANGUAGES   = ['ms', 'id', 'ja'];
const TODAY       = new Date().toISOString().slice(0, 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function buildHreflangSitemapEntries(slug, lang, otherLangs) {
  const lines = [];
  lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/articles/${slug}"/>`);
  lines.push(`    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${lang}/articles/${slug}"/>`);
  for (const other of otherLangs) {
    if (other !== lang) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${other}" href="${BASE_URL}/${other}/articles/${slug}"/>`);
    }
  }
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/articles/${slug}"/>`);
  return lines.join('\n');
}

function buildLangSitemap(lang) {
  const slugs = getTranslatedSlugs(lang);
  if (!slugs.length) return null;

  // Which other languages also have translations (for hreflang in sitemap)
  const otherLangs = LANGUAGES.filter(l => l !== lang && getTranslatedSlugs(l).length > 0);

  const urls = slugs.map(slug => {
    const hreflang = buildHreflangSitemapEntries(slug, lang, otherLangs);
    return `  <url>
    <loc>${BASE_URL}/${lang}/articles/${slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
${hreflang}
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

${urls.join('\n\n')}

</urlset>`;
}

function buildSitemapIndex(activeLangs) {
  const sitemaps = [
    `  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>`
  ];

  for (const lang of activeLangs) {
    sitemaps.push(`  <sitemap>
    <loc>${BASE_URL}/sitemap-${lang}.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${sitemaps.join('\n\n')}

</sitemapindex>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const activeLangs = [];

for (const lang of LANGUAGES) {
  const xml = buildLangSitemap(lang);
  if (!xml) {
    console.log(`  skip ${lang}: no translations`);
    continue;
  }

  const outPath = path.join(ROOT, `sitemap-${lang}.xml`);
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`  written: sitemap-${lang}.xml (${getTranslatedSlugs(lang).length} URLs)`);
  activeLangs.push(lang);
}

if (activeLangs.length) {
  const indexXml = buildSitemapIndex(activeLangs);
  const indexPath = path.join(ROOT, 'sitemap-index.xml');
  fs.writeFileSync(indexPath, indexXml, 'utf8');
  console.log(`  written: sitemap-index.xml (references: en + ${activeLangs.join(', ')})`);

  // Update robots.txt to reference the sitemap index (if not already there)
  const robotsPath = path.join(ROOT, 'robots.txt');
  let robots = fs.readFileSync(robotsPath, 'utf8');
  if (!robots.includes('sitemap-index.xml')) {
    robots = robots.trimEnd() + `\nSitemap: ${BASE_URL}/sitemap-index.xml\n`;
    fs.writeFileSync(robotsPath, robots, 'utf8');
    console.log('  updated: robots.txt (added sitemap-index.xml reference)');
  } else {
    console.log('  robots.txt already references sitemap-index.xml');
  }
} else {
  console.log('No language sitemaps generated — translate some articles first.');
}
