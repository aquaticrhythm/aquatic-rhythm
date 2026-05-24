/**
 * check-syntax.mjs
 *
 * Runs `node --check` on every .js / .mjs file under js/, scripts/, worker/,
 * tests/, and the repo root. Catches parse errors with zero install cost.
 *
 * Usage:
 *   node scripts/check-syntax.mjs
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const ROOTS = ['js', 'scripts', 'worker', 'tests'];
const EXTENSIONS = new Set(['.js', '.mjs']);
const SKIP_NAMES = new Set(['node_modules', '.git', '.claude']);

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_NAMES.has(name)) continue;
    const full = path.join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      walk(full, out);
    } else if (EXTENSIONS.has(path.extname(name))) {
      out.push(full);
    }
  }
}

const files = [];
for (const r of ROOTS) walk(path.join(ROOT, r), files);

let failed = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    failed++;
    process.stderr.write(`FAIL  ${rel}\n${result.stderr || result.stdout || ''}\n`);
  } else {
    process.stdout.write(`ok    ${rel}\n`);
  }
}

process.stdout.write(`\n${files.length - failed}/${files.length} files passed syntax check.\n`);
process.exit(failed === 0 ? 0 : 1);
