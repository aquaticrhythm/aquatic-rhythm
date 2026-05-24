/**
 * ui.js extraction — smoke tests.
 *
 * The original `js/ui.js` was ~4100 lines. PR #233 extracted six self-
 * contained IIFEs into sibling files (ECOSYSTEM TOGGLE, READING PATHWAYS,
 * JOURNAL, RHYSSA BOTTOM SHEET, RHYSSA COMPANION PAGE, SETTINGS PANEL).
 * These tests guard the extraction contract:
 *
 *   1. Each extracted file is a top-level IIFE (`(function () { ... })();`)
 *      so DOM-ready execution semantics match the original.
 *   2. `index.html` loads them after `js/ui.js` (so `window.go`,
 *      `window.__arApplyFauna`, etc. exist when the modules run).
 *   3. The service worker shell cache lists the new files so PWA users
 *      do not get a half-cached site after the next deploy.
 *   4. `ui.js` itself still parses and is significantly smaller.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const EXTRACTED = [
  'js/ui-eco-toggle.js',
  'js/ui-reading-pathways.js',
  'js/ui-journal.js',
  'js/ui-rhyssa-sheet.js',
  'js/ui-rhyssa-page.js',
  'js/ui-settings.js'
];

test('every extracted file exists and starts/ends with a top-level IIFE', () => {
  for (const rel of EXTRACTED) {
    const full = path.join(ROOT, rel);
    assert.ok(fs.existsSync(full), `missing ${rel}`);
    const src = fs.readFileSync(full, 'utf8');
    assert.match(
      src,
      /\(function\s*\(\s*\)\s*\{/,
      `${rel} does not open with a function-expression IIFE`
    );
    // Trailing IIFE invocation — `})();` or `}());`.
    const trimmed = src.trimEnd();
    assert.ok(
      trimmed.endsWith('})();') || trimmed.endsWith('}());'),
      `${rel} does not end with a self-invoking IIFE`
    );
  }
});

test('index.html loads ui.js BEFORE every extracted ui-*.js module', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const uiIdx = html.indexOf('js/ui.js"');
  assert.ok(uiIdx > 0, 'index.html no longer references js/ui.js');
  for (const rel of EXTRACTED) {
    const ref = `${rel}"`;
    const idx = html.indexOf(ref);
    assert.ok(idx > 0, `index.html does not load ${rel}`);
    assert.ok(idx > uiIdx, `${rel} must be loaded AFTER js/ui.js (defer order matters)`);
  }
});

test('index.html loads eco-toggle BEFORE settings (settings reads window.__arApply*)', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const ecoIdx = html.indexOf('js/ui-eco-toggle.js"');
  const settingsIdx = html.indexOf('js/ui-settings.js"');
  assert.ok(ecoIdx > 0 && settingsIdx > 0);
  assert.ok(
    ecoIdx < settingsIdx,
    'ui-eco-toggle.js must load before ui-settings.js'
  );
});

test('service worker shell cache lists every extracted module', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  for (const rel of EXTRACTED) {
    const cached = `'/${rel}'`;
    assert.ok(
      sw.includes(cached),
      `sw.js shell cache is missing ${rel} — PWA users will see partial loads`
    );
  }
});

test('ui.js shrank substantially and still parses', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');
  const lines = src.split('\n').length;
  // Original was ~4100 lines; trimmed should be well under 1000.
  assert.ok(lines < 1000, `js/ui.js is ${lines} lines — extraction did not shrink it`);
  // Still wrapped in an outer IIFE.
  assert.match(src, /^\/\*[\s\S]*?\*\/\s*\(function\s*\(\s*\)\s*\{/);
  assert.match(src.trimEnd(), /\}\)\(\);$/);
});

test('ui.js still defines window.go (load contract with ui-journal.js)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');
  assert.match(src, /window\.go\s*=\s*go\b/);
});

test('ui-eco-toggle.js still exposes the window globals settings reads', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/ui-eco-toggle.js'), 'utf8');
  for (const name of ['__arApplyFauna', '__arApplyFlora', '__arGetFauna', '__arGetFlora']) {
    assert.ok(
      src.includes(`window.${name}`),
      `ui-eco-toggle.js no longer exposes window.${name}`
    );
  }
});

test('ui-journal.js still hooks window.go (its own routing integration)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/ui-journal.js'), 'utf8');
  assert.match(src, /window\.go\b/);
});
