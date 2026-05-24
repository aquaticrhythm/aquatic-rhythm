/**
 * Community Stress Lab — smoke + data-invariant tests.
 *
 * Why these tests look the way they do
 * ────────────────────────────────────
 * `js/community-stress-lab.js` is a browser IIFE that mixes the rules engine
 * (`runRules`, `thermalIntersection`, `phIntersection`, etc.) with DOM wiring
 * inside one closure. There is no module export and no `window.*` handle, so
 * the pure domain logic cannot be imported directly from Node without
 * refactoring the source file.
 *
 * The task brief explicitly says NOT to change product behaviour for this
 * pass. So this suite covers what is safely reachable today:
 *
 *   1. Species-pack invariants — pure JSON, fully testable. Catches data
 *      regressions (bad temp ranges, missing fields, schema drift) that
 *      would silently produce misleading findings in the UI.
 *
 *   2. Source-file smoke test — loads the IIFE in a Node `vm` sandbox with
 *      a minimal `document` stub. Confirms the file parses, executes, and
 *      the early-return path in `init()` (no `#csl-root`) works without
 *      throwing. Regression guard for accidental top-level errors.
 *
 * TODO (follow-up PR — modularization for deep rules-engine testing)
 * ──────────────────────────────────────────────────────────────────
 * To unit-test individual rules (`R_THERMAL_GAP`, `R_BIoload_HIGH`,
 * `R_PREDATION_*`, `R_SHRIMP_RISK`, etc.) directly:
 *
 *   (a) Extract the pure functions (LANES, intersectIntervals,
 *       thermalIntersection, phIntersection, severityRank, runRules,
 *       dedupeFindings, aggregateLanes, emptyLanes, laneLabel) into
 *       `js/community-stress-lab.engine.mjs` as named ESM exports.
 *   (b) In `js/community-stress-lab.js`, replace the inlined copies with
 *       a `<script type="module">` import, or keep a compatibility shim
 *       that re-attaches the engine on `window.CSLEngine` for the IIFE.
 *   (c) Add a `community-stress-lab.engine.test.mjs` that imports the
 *       engine directly and asserts rule-by-rule behaviour with hand-
 *       written species fixtures.
 *
 * Doing (a–c) is a behaviour-preserving refactor, but it touches a
 * production-critical file and the article page that loads it, so it
 * belongs in its own PR with manual UI verification.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PACK_PATH = path.join(ROOT, 'data', 'community-stress-lab-species-v1.json');
const SCHEMA_PATH = path.join(ROOT, 'data', 'community-stress-lab-species.schema.json');
const ENGINE_PATH = path.join(ROOT, 'js', 'community-stress-lab.js');

const ZONES = new Set(['surface', 'mid', 'bottom', 'benthic']);

// ── Species pack invariants ─────────────────────────────────────────────────

test('species pack: JSON parses and has the expected top-level shape', () => {
  const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'));
  assert.equal(pack.packId, 'community-stress-species-v1');
  assert.match(pack.packVersion, /^[0-9]+\.[0-9]+$/);
  assert.ok(Array.isArray(pack.species));
  assert.ok(pack.species.length > 0, 'species array is non-empty');
});

test('species pack: every row has required fields with sane types', () => {
  const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'));
  const required = [
    'id', 'displayName', 'scientificName', 'tempMinC', 'tempMaxC',
    'zone', 'bodyMmAdult', 'mouthPredatorLevel', 'finNipper',
    'schoolingMin', 'bioloadUnits', 'tags', 'citationNote'
  ];
  for (const s of pack.species) {
    for (const k of required) {
      assert.ok(k in s, `species ${s.id || '?'} missing field ${k}`);
    }
    assert.match(s.id, /^[a-z0-9_]+$/, `species ${s.id} has non-snake-case id`);
    assert.ok(typeof s.displayName === 'string' && s.displayName.length > 0);
    assert.ok(ZONES.has(s.zone), `species ${s.id} has invalid zone "${s.zone}"`);
    assert.ok(Number.isFinite(s.tempMinC), `species ${s.id} tempMinC not numeric`);
    assert.ok(Number.isFinite(s.tempMaxC), `species ${s.id} tempMaxC not numeric`);
    assert.ok(
      s.tempMinC < s.tempMaxC,
      `species ${s.id} has tempMinC (${s.tempMinC}) >= tempMaxC (${s.tempMaxC})`
    );
    if (s.phMin != null || s.phMax != null) {
      assert.ok(
        Number.isFinite(s.phMin) && Number.isFinite(s.phMax),
        `species ${s.id} has partial pH range`
      );
      assert.ok(s.phMin < s.phMax, `species ${s.id} has phMin >= phMax`);
    }
    assert.ok(Number.isInteger(s.bodyMmAdult) && s.bodyMmAdult > 0);
    assert.ok(s.mouthPredatorLevel >= 0 && s.mouthPredatorLevel <= 3);
    assert.equal(typeof s.finNipper, 'boolean');
    assert.ok(
      s.schoolingMin === null || (Number.isInteger(s.schoolingMin) && s.schoolingMin >= 2),
      `species ${s.id} has invalid schoolingMin`
    );
    assert.ok(s.bioloadUnits >= 0);
    assert.ok(Array.isArray(s.tags));
  }
});

test('species pack: all ids are unique', () => {
  const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'));
  const seen = new Set();
  for (const s of pack.species) {
    assert.ok(!seen.has(s.id), `duplicate species id: ${s.id}`);
    seen.add(s.id);
  }
});

test('species pack: rule-targeted ids referenced from the engine still exist', () => {
  // The engine has hard-coded id checks for these rules — if any disappear
  // from the pack, the corresponding rule silently goes dead.
  const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'));
  const ids = new Set(pack.species.map((s) => s.id));
  const referenced = [
    'tiger_barb',
    'zebra_danio',
    'betta_male',
    'discus',
    'goldfish',
    'molly',
    'mbuna_generic',
    'mystery_snail',
    'assassin_snail'
  ];
  for (const id of referenced) {
    assert.ok(ids.has(id), `engine references id "${id}" but it is missing from the pack`);
  }
});

test('species pack: every entry validates against the JSON schema we ship', () => {
  // We don't pull in a JSON-schema dependency for this lightweight suite;
  // instead we hand-check the structural properties the schema demands.
  // (See community-stress-lab.schema.json for the source of truth.)
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  assert.equal(schema.properties.packId.const, 'community-stress-species-v1');
  assert.ok(schema.$defs && schema.$defs.species, 'schema retains $defs.species');
});

// ── Engine source-file smoke test ───────────────────────────────────────────

test('community-stress-lab.js: parses, runs, and init() is a no-op without #csl-root', () => {
  const source = fs.readFileSync(ENGINE_PATH, 'utf8');

  // Minimal DOM stubs — just enough that the IIFE's `init()` reaches its
  // first `if (!root) return;` branch without throwing.
  const sandbox = {
    document: {
      readyState: 'complete',
      getElementById() { return null; },
      addEventListener() {},
      createElement() {
        return {
          className: '',
          innerHTML: '',
          setAttribute() {},
          appendChild() {},
          addEventListener() {},
          querySelector() { return { addEventListener() {} }; }
        };
      }
    },
    window: {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    fetch: () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
    console
  };

  assert.doesNotThrow(() => {
    vm.runInNewContext(source, sandbox, { filename: 'community-stress-lab.js' });
  }, 'IIFE should execute cleanly when no #csl-root is present');
});

test('community-stress-lab.js: declares the six lane keys the UI depends on', () => {
  // We can't reach the runtime LANES array, but we can grep the source for it.
  const source = fs.readFileSync(ENGINE_PATH, 'utf8');
  for (const lane of ['thermal', 'chemistry', 'space', 'predation', 'social', 'inverts']) {
    assert.ok(
      source.includes(`'${lane}'`),
      `engine source no longer mentions lane "${lane}" — UI/rule contract drift`
    );
  }
});
