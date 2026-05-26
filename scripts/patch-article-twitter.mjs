/**
 * Adds Twitter/X card meta block to articles that are missing it.
 * Also adds og:image to caring-without-guilt.html which skipped it.
 *
 * Run: node scripts/patch-article-twitter.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT    = path.join(import.meta.dirname, '..');
const ART_DIR = path.join(ROOT, 'articles');
const OG_IMG  = 'https://aquaticrhythm.com/og-image.png';

// Skip redirect stubs (no body content)
const SKIP = new Set(['four-principles-of-ara.html', 'reading-the-five-rhythms.html']);

function patchArticle(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix caring-without-guilt: missing og:image block before og:site_name
  if (!html.includes('og:image')) {
    html = html.replace(
      '<meta property="og:site_name" content="Aquatic Rhythm">',
      '<meta property="og:image" content="' + OG_IMG + '">\n' +
      '<meta property="og:image:width" content="1200">\n' +
      '<meta property="og:image:height" content="630">\n' +
      '<meta property="og:site_name" content="Aquatic Rhythm">'
    );
    changed = true;
    process.stdout.write('  [OG] og:image added\n');
  }

  // Add Twitter card block after og:site_name if missing
  if (!html.includes('twitter:card')) {
    // Extract og:url, og:title, og:description values
    const urlM   = html.match(/<meta property="og:url" content="([^"]+)"/);
    const titleM = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descM  = html.match(/<meta property="og:description" content="([^"]+)"/);

    if (urlM && titleM && descM) {
      const twitterBlock =
        '<meta name="twitter:card" content="summary_large_image">\n' +
        '<meta name="twitter:url" content="' + urlM[1] + '">\n' +
        '<meta name="twitter:title" content="' + titleM[1] + '">\n' +
        '<meta name="twitter:description" content="' + descM[1] + '">\n' +
        '<meta name="twitter:image" content="' + OG_IMG + '">';

      html = html.replace(
        '<meta property="og:site_name" content="Aquatic Rhythm">',
        '<meta property="og:site_name" content="Aquatic Rhythm">\n' + twitterBlock
      );
      changed = true;
      process.stdout.write('  [TW] twitter:card added\n');
    } else {
      process.stdout.write('  [TW] SKIP — could not extract OG values\n');
    }
  }

  if (changed) fs.writeFileSync(filePath, html, 'utf8');
  return changed;
}

const files = fs.readdirSync(ART_DIR)
  .filter(f => f.endsWith('.html') && !SKIP.has(f));

let patched = 0;
for (const file of files.sort()) {
  const fp = path.join(ART_DIR, file);
  process.stdout.write(`\nPatching: ${file}\n`);
  if (patchArticle(fp)) patched++;
}

console.log(`\nDone. Patched ${patched}/${files.length} files.`);
