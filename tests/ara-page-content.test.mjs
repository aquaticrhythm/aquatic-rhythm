/**
 * ARA page content — coverage tests.
 *
 * The site's ARA page (in index.html, pg-ara) is the public-facing
 * version of the framework documented in ARA_Framework_Final-1.pdf.
 * When the source paper is updated, the page tends to drift behind.
 * These tests guard the most consequential concepts so a future
 * edit that accidentally removes them surfaces in CI rather than
 * in user confusion.
 *
 * The tests are intentionally string-grep based: they assume the
 * site is hand-written HTML, not a templating system, and they
 * read the file verbatim. If the page is restructured but a
 * concept is renamed (e.g. "Five principles" → "Five questions"),
 * update the expectation here in the same commit.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INDEX_HTML = path.join(ROOT, 'index.html');
const UI_JS = path.join(ROOT, 'js/ui.js');

function loadAraSection() {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const start = html.indexOf('<div id="pg-ara"');
  assert.ok(start > 0, 'pg-ara section not found in index.html');
  // The pg-ara block ends at the next sibling "page" div.
  const next = html.indexOf('<div id="pg-companion"', start);
  assert.ok(next > start, 'could not locate end of pg-ara section');
  return html.slice(start, next);
}

test('ARA page declares the canonical section anchors', () => {
  const ara = loadAraSection();
  const required = [
    'id="ara-frame"',
    'id="ara-what"',
    'id="ara-scope"',
    'id="ara-lenses"',
    'id="ara-keeper"',
    'id="ara-shame"',
    'id="ara-principles"',
    'id="ara-domains"',
    'id="ara-observe"',
    'id="ara-practice"',
    'id="ara-context"'
  ];
  for (const anchor of required) {
    assert.ok(ara.includes(anchor), `pg-ara is missing section ${anchor}`);
  }
});

test('scroll-spy id list in js/ui.js matches the page sections', () => {
  const js = fs.readFileSync(UI_JS, 'utf8');
  // The spy list lives in initAraModScrollSpy().
  const match = js.match(/var ids = \[([^\]]+)\]/);
  assert.ok(match, 'initAraModScrollSpy ids array not found');
  const expected = [
    'ara-frame', 'ara-what', 'ara-scope', 'ara-lenses', 'ara-keeper',
    'ara-shame', 'ara-principles', 'ara-domains', 'ara-observe',
    'ara-practice', 'ara-context'
  ];
  for (const id of expected) {
    assert.ok(
      match[1].includes(`'${id}'`),
      `scroll-spy ids array is missing '${id}'`
    );
  }
});

test('ARA page surfaces the five alignment principles (not four)', () => {
  const ara = loadAraSection();
  // The principles section title.
  assert.match(
    ara,
    />\s*The five principles\s*</,
    'principles section still says "four"'
  );
  // All five principle titles.
  const titles = [
    'Timing before technique',
    'Capacity before ambition',
    'Rhythm before intensity',
    'Observation before correction',
    'Origin before expression'
  ];
  for (const t of titles) {
    assert.ok(ara.includes(t), `missing principle title: ${t}`);
  }
});

test('ARA page describes the seven alignment domains', () => {
  const ara = loadAraSection();
  const domains = [
    'Water quality',
    'Biological load',
    'Livestock behaviour',
    'Nutrient &amp; chemical balance',
    'Environmental structure',
    'Technology',
    'Human rhythm'
  ];
  for (const d of domains) {
    assert.ok(ara.includes(d), `seven-domains block missing: ${d}`);
  }
});

test('ARA page covers the four foundational assumptions including ecological continuity', () => {
  const ara = loadAraSection();
  for (const label of ['Assumption I', 'Assumption II', 'Assumption III', 'Assumption IV']) {
    assert.ok(ara.includes(label), `four-assumptions block missing: ${label}`);
  }
  assert.match(
    ara,
    /ecological continuity/i,
    'ecological-continuity assumption text not found'
  );
});

test('ARA page covers false maturity and phase regression', () => {
  const ara = loadAraSection();
  assert.match(ara, />\s*False maturity\s*</i, 'false maturity card missing');
  assert.match(ara, />\s*Phase regression\s*</i, 'phase regression card missing');
});

test('ARA page states the high-tech / low-tech neutrality', () => {
  const ara = loadAraSection();
  // The paper's specific wording is "not a low-tech or high-tech framework".
  assert.match(
    ara,
    /not a low-tech or high-tech framework/i,
    'tech-neutrality stance is missing'
  );
});

test('ARA page describes the 3-Day and 7-Day rules and the welfare safeguard', () => {
  const ara = loadAraSection();
  assert.ok(ara.includes('3-Day'), 'missing 3-Day rule');
  assert.ok(ara.includes('7-Day'), 'missing 7-Day rule');
  assert.match(ara, /Welfare safeguard/i, 'missing welfare safeguard subhead');
  assert.match(ara, /acute welfare risk/i, 'welfare safeguard body missing');
});

test('ARA page describes the four observation habits', () => {
  const ara = loadAraSection();
  for (const habit of [
    'Photographic record',
    'Behavioural mapping',
    'Same-time habit',
    'Fresh-eyes practice'
  ]) {
    assert.ok(ara.includes(habit), `four-habits block missing: ${habit}`);
  }
});

test('ARA page includes false-signal taxonomy examples', () => {
  const ara = loadAraSection();
  for (const sig of [
    'Diatom bloom',
    'New-tank cloudiness',
    'White biofilm on hardscape',
    'Post-water-change behaviour',
    'Early-morning surface breathing',
    'Panic window'
  ]) {
    assert.ok(ara.includes(sig), `false-signal taxonomy missing: ${sig}`);
  }
});

test('ARA page names the Malaysian context and author positionality', () => {
  const ara = loadAraSection();
  assert.match(
    ara,
    /Malaysia/,
    'Malaysian-context block missing from pg-ara'
  );
  assert.match(
    ara,
    /Universiti Sains Islam Malaysia/,
    'author affiliation (USIM) missing'
  );
  assert.match(
    ara,
    /Universiti Kebangsaan Malaysia/,
    'author affiliation (UKM) missing'
  );
});

test('ARA page names capacity creep and ecological forgiveness constructs', () => {
  const ara = loadAraSection();
  assert.match(ara, /capacity creep/i, 'capacity creep construct missing');
  assert.match(ara, /ecological forgiveness/i, 'ecological forgiveness construct missing');
});

test('ARA nav lists all module cards in the expected order', () => {
  const ara = loadAraSection();
  const navOrder = [
    'data-ara-nav="ara-frame"',
    'data-ara-nav="ara-what"',
    'data-ara-nav="ara-scope"',
    'data-ara-nav="ara-lenses"',
    'data-ara-nav="ara-keeper"',
    'data-ara-nav="ara-shame"',
    'data-ara-nav="ara-principles"',
    'data-ara-nav="ara-domains"',
    'data-ara-nav="ara-observe"',
    'data-ara-nav="ara-practice"',
    'data-ara-nav="ara-context"'
  ];
  let last = -1;
  for (const tag of navOrder) {
    const idx = ara.indexOf(tag);
    assert.ok(idx > last, `nav card out of order or missing: ${tag}`);
    last = idx;
  }
});
