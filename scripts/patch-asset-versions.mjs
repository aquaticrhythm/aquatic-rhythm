/**
 * Adds ?v=25 cache-busting query strings to all local CSS/JS references
 * in article pages. Run after any CSS/JS file change to invalidate browser caches.
 *
 * Run: node scripts/patch-asset-versions.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..');
const V = '25';

const DIRS = [
  path.join(ROOT, 'articles'),
];

// Match local CSS/JS hrefs/srcs that don't already have a version string
const CSS_RE = /href="(\/css\/[^"?]+\.css)"/g;
const JS_RE  = /src="(\/js\/[^"?]+\.js)"/g;

function patchFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const newHtml = html
    .replace(CSS_RE, (m, url) => { changed = true; return `href="${url}?v=${V}"`; })
    .replace(JS_RE,  (m, url) => { changed = true; return `src="${url}?v=${V}"`; });

  if (changed) {
    fs.writeFileSync(filePath, newHtml, 'utf8');
    console.log(`  versioned: ${path.relative(ROOT, filePath)}`);
  }
  return changed;
}

let total = 0;
for (const dir of DIRS) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  for (const f of files) {
    if (patchFile(path.join(dir, f))) total++;
  }
}

console.log(`\nDone. Updated ${total} file(s).`);
