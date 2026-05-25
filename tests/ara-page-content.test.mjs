/**
 * ARA page content — lightweight regression tests.
 * The in-app ARA tour (index.html, #pg-ara) and modular articles are
 * maintained by hand; these tests catch accidental removal of core
 * framing. If copy is renamed, update expectations in the same commit.
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
const ARA_S4 = path.join(ROOT, 'articles', 'ara-s4-alignment.html');

function loadPgAra() {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const start = html.indexOf('<div id="pg-ara"');
  assert.ok(start > 0, 'pg-ara section not found in index.html');
  const next = html.indexOf('<div id="pg-companion"', start);
  assert.ok(next > start, 'could not locate end of pg-ara section');
  return html.slice(start, next);
}

test('ARA in-app tour declares the section anchors used by scroll-spy', () => {
  const ara = loadPgAra();
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

test('scroll-spy id list in js/ui.js matches pg-ara sections', () => {
  const js = fs.readFileSync(UI_JS, 'utf8');
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

test('ARA in-app tour surfaces five alignment principles including origin-before-expression', () => {
  const ara = loadPgAra();
  assert.match(
    ara,
    /The five principles/i,
    'principles section heading should name five principles'
  );
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

test('Alignment article documents Origin before Expression as module 6 of 8', () => {
  const html = fs.readFileSync(ARA_S4, 'utf8');
  assert.ok(
    html.includes('Origin before Expression') || html.includes('Origin <em>before Expression</em>'),
    'ara-s4-alignment should name the fifth principle'
  );
  assert.ok(html.includes('6 / 8'), 'module counter should reflect eight modules');
  assert.ok(html.includes('8 / 8'), 'final module counter should be 8 / 8');
});
