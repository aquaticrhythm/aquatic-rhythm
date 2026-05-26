/**
 * Patches all English article HTML files with 5 SEO fixes:
 * S1: Remove maximum-scale=1.0 from viewport
 * S2: Add fonts.gstatic.com crossorigin preconnect
 * S3: Add analytics opt-out check before GA script
 * S4: Add datePublished, dateModified, image to Article JSON-LD
 * S5: Add og:image:width / og:image:height where missing
 *
 * Run: node scripts/patch-article-seo.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT     = path.join(import.meta.dirname, '..');
const ART_DIR  = path.join(ROOT, 'articles');
const GA_ID    = 'G-8MDN065WNW';
const OG_IMAGE = 'https://aquaticrhythm.com/og-image.png';

// Article dates gathered from git history (datePublished | dateModified)
const ARTICLE_DATES = {
  'adding-new-fish':             { pub: '2026-05-22', mod: '2026-05-25' },
  'algae-in-aquarium':           { pub: '2026-05-22', mod: '2026-05-25' },
  'aquarium-filter-maintenance': { pub: '2026-05-22', mod: '2026-05-25' },
  'aquarium-maintenance-routine':{ pub: '2026-05-22', mod: '2026-05-25' },
  'aquarium-not-a-project':      { pub: '2026-05-22', mod: '2026-05-23' },
  'aquarium-plants-not-growing': { pub: '2026-05-22', mod: '2026-05-23' },
  'aquarium-travel-vacation':    { pub: '2026-05-22', mod: '2026-05-23' },
  'ara-full-framework':          { pub: '2026-05-22', mod: '2026-05-26' },
  'ara-s1-foundation':           { pub: '2026-05-22', mod: '2026-05-26' },
  'ara-s2-five-rhythms':         { pub: '2026-05-22', mod: '2026-05-26' },
  'ara-s3-phases':               { pub: '2026-05-22', mod: '2026-05-23' },
  'ara-s4-alignment':            { pub: '2026-05-22', mod: '2026-05-25' },
  'ara-s5-observation':          { pub: '2026-05-22', mod: '2026-05-23' },
  'ara-s6-ethics':               { pub: '2026-05-22', mod: '2026-05-23' },
  'betta-fish-behaviour':        { pub: '2026-05-22', mod: '2026-05-25' },
  'caring-without-guilt':        { pub: '2026-05-22', mod: '2026-05-25' },
  'community-fish-tank':         { pub: '2026-05-22', mod: '2026-05-23' },
  'community-stress-lab':        { pub: '2026-05-22', mod: '2026-05-22' },
  'cycled-tank-problems':        { pub: '2026-05-22', mod: '2026-05-25' },
  'fish-gasping-surface':        { pub: '2026-05-22', mod: '2026-05-25' },
  'fish-hiding-what-does-it-mean':{ pub: '2026-05-22', mod: '2026-05-25' },
  'fish-keep-dying-new-tank':    { pub: '2026-05-22', mod: '2026-05-25' },
  'four-principles-of-ara':      { pub: '2026-05-22', mod: '2026-05-22' },
  'how-often-water-changes':     { pub: '2026-05-22', mod: '2026-05-23' },
  'ich-keeps-coming-back':       { pub: '2026-05-22', mod: '2026-05-25' },
  'know-your-rhythm':            { pub: '2026-05-22', mod: '2026-05-23' },
  'low-tech-planted-tank':       { pub: '2026-05-22', mod: '2026-05-25' },
  'new-tank-syndrome':           { pub: '2026-05-22', mod: '2026-05-25' },
  'nitrate-keeps-rising':        { pub: '2026-05-22', mod: '2026-05-25' },
  'overfeeding-aquarium':        { pub: '2026-05-22', mod: '2026-05-25' },
  'perfect-parameters-fish-dying':{ pub: '2026-05-22', mod: '2026-05-25' },
  'reading-the-five-rhythms':    { pub: '2026-05-22', mod: '2026-05-22' },
  'shrimp-dying-aquarium':       { pub: '2026-05-22', mod: '2026-05-25' },
  'tank-builder':                { pub: '2026-05-22', mod: '2026-05-22' },
  'tank-crash-recovery':         { pub: '2026-05-22', mod: '2026-05-25' },
  'tank-simulator':              { pub: '2026-05-22', mod: '2026-05-22' },
  'when-hobby-stops-feeling-good':{ pub: '2026-05-22', mod: '2026-05-23' },
  'when-is-tank-ready-for-fish': { pub: '2026-05-22', mod: '2026-05-25' },
  'why-is-my-aquarium-water-cloudy':{ pub: '2026-05-22', mod: '2026-05-25' },
};

function patchArticle(filePath, slug) {
  let html = fs.readFileSync(filePath, 'utf8');
  const dates = ARTICLE_DATES[slug] || { pub: '2026-05-22', mod: '2026-05-22' };
  let changed = false;

  // S1: Remove maximum-scale=1.0 from viewport
  if (html.includes('maximum-scale=1.0')) {
    html = html
      .replace(/, maximum-scale=1\.0/g, '')
      .replace(/maximum-scale=1\.0, /g, '')
      .replace(/maximum-scale=1\.0/g, '');
    changed = true;
    process.stdout.write('  [S1] viewport fixed\n');
  }

  // S2: Add fonts.gstatic.com crossorigin preconnect if missing
  const gstaticTag = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
  if (!html.includes('fonts.gstatic.com')) {
    html = html.replace(
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    );
    changed = true;
    process.stdout.write('  [S2] fonts.gstatic.com preconnect added\n');
  }

  // S3: Add analytics opt-out check before GA async script if missing
  const optOutScript = `<script>if(localStorage.getItem('ar_analytics_opt')==='1'){window['ga-disable-${GA_ID}']=true}</script>\n`;
  const gaAsyncTag = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>`;
  if (html.includes(gaAsyncTag) && !html.includes(`ga-disable-${GA_ID}`)) {
    html = html.replace(gaAsyncTag, optOutScript + gaAsyncTag);
    changed = true;
    process.stdout.write('  [S3] GA opt-out added\n');
  }

  // S4: Update Article JSON-LD with image, datePublished, dateModified
  const ldMatch = html.match(/<script type="application\/ld\+json">(\{.*?\})<\/script>/s);
  if (ldMatch) {
    try {
      const schema = JSON.parse(ldMatch[1]);
      let schemaChanged = false;
      if (schema['@type'] === 'Article') {
        if (!schema.image) {
          schema.image = OG_IMAGE;
          schemaChanged = true;
        }
        if (!schema.datePublished) {
          schema.datePublished = dates.pub;
          schemaChanged = true;
        }
        if (!schema.dateModified) {
          schema.dateModified = dates.mod;
          schemaChanged = true;
        }
        if (schemaChanged) {
          const newLd = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
          html = html.replace(ldMatch[0], newLd);
          changed = true;
          process.stdout.write('  [S4] JSON-LD updated\n');
        }
      }
    } catch (e) {
      process.stdout.write(`  [S4] JSON-LD parse error: ${e.message}\n`);
    }
  }

  // S5: Add og:image:width / og:image:height if missing
  if (!html.includes('og:image:width')) {
    const ogImageTag = '<meta property="og:image" content="https://aquaticrhythm.com/og-image.png">';
    if (html.includes(ogImageTag)) {
      html = html.replace(
        ogImageTag,
        ogImageTag + '\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'
      );
      changed = true;
      process.stdout.write('  [S5] og:image dimensions added\n');
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
  } else {
    process.stdout.write('  (no changes needed)\n');
  }
  return changed;
}

// Run on all article HTML files
const files = fs.readdirSync(ART_DIR).filter(f => f.endsWith('.html'));
let patched = 0;

for (const file of files.sort()) {
  const slug = file.replace('.html', '');
  const filePath = path.join(ART_DIR, file);
  process.stdout.write(`\nPatching: ${file}\n`);
  if (patchArticle(filePath, slug)) patched++;
}

console.log(`\nDone. Patched ${patched}/${files.length} files.`);
