/**
 * Audit ARA framework alignment across all article HTML files.
 * Reports per-article scores for: rhythm domain label, prescriptive language,
 * keeper psychology depth, ARA reading vocabulary, and authority tone.
 *
 * Run: node scripts/audit-ara-alignment.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT    = path.join(import.meta.dirname, '..');
const ART_DIR = path.join(ROOT, 'articles');

const SKIP = new Set(['four-principles-of-ara.html', 'reading-the-five-rhythms.html']);

// Checks
const RHYTHM_LABELS = ['ARA · Water Rhythm', 'ARA · Biological Rhythm', 'ARA · Environmental Rhythm', 'ARA · Livestock Rhythm', 'ARA · Keeper Rhythm', 'ARA · All Five Rhythms'];
const PRESCRIPTIVE  = ['never replace', 'you must', 'you need to', 'you should always', 'beginners often', 'the correct approach', "the mistake is", 'proper way', 'right way', 'always do'];
const KEEPER_PSYCH  = ['keeper rhythm', 'keeper psychology', 'keeper anxiety', 'ara · keeper rhythm', 'keeper capacity', 'keeper\'s rhythm'];
const READING_VOCAB = ['signal', 'reading', 'observe', 'rhythm', 'aligned', 'drift', 'origin', 'expression'];
const AUTHORITY_TONE = ['beginners often make', 'the correct response is', 'the mistake is', 'you should know', 'proper way to', 'right way to', 'you need to understand'];
const WRONG_TERM    = 'chemical rhythm';

function audit(filePath) {
  const html = fs.readFileSync(filePath, 'utf8').toLowerCase();
  const raw  = fs.readFileSync(filePath, 'utf8');

  // Rhythm domain label in first 100 lines
  const first100 = raw.split('\n').slice(0, 100).join('\n').toLowerCase();
  const hasRhythmLabel = RHYTHM_LABELS.some(r => raw.includes(r));
  const hasRhythmIn100 = RHYTHM_LABELS.some(r => first100.includes(r.toLowerCase()));

  // Wrong terminology
  const chemRhythmCount = (html.match(/chemical rhythm/g) || []).length;

  // Prescriptive phrases
  const prescriptiveFound = PRESCRIPTIVE.filter(p => html.includes(p));

  // Keeper psychology depth
  const keeperPsychFound = KEEPER_PSYCH.filter(k => html.includes(k));
  const hasKeeperBlock = html.includes('ara · keeper rhythm');

  // Reading vocabulary density (per 1000 chars)
  const vocabHits = READING_VOCAB.reduce((n, v) => n + (html.match(new RegExp(v, 'g')) || []).length, 0);
  const vocabDensity = (vocabHits / html.length * 1000).toFixed(2);

  // Authority tone
  const authorityFound = AUTHORITY_TONE.filter(a => html.includes(a));

  return {
    hasRhythmLabel,
    hasRhythmIn100,
    chemRhythmCount,
    prescriptiveFound,
    hasKeeperBlock,
    keeperPsychFound: keeperPsychFound.length,
    vocabDensity: parseFloat(vocabDensity),
    authorityFound,
  };
}

const files = fs.readdirSync(ART_DIR)
  .filter(f => f.endsWith('.html') && !SKIP.has(f))
  .sort();

const COL = {
  file:        16,
  rhythm:      8,
  r100:        6,
  chem:        5,
  prescr:      8,
  keeper:      8,
  vocab:       7,
  authority:   10,
};

function pad(s, n) { return String(s).padEnd(n); }

console.log('\nARA Alignment Audit\n' + '═'.repeat(80));
console.log(
  pad('Article', 38) +
  pad('Rhythm', COL.rhythm) +
  pad('R<100', COL.r100) +
  pad('Chem', COL.chem) +
  pad('Prescr', COL.prescr) +
  pad('Keeper', COL.keeper) +
  pad('Vocab/1k', COL.vocab) +
  pad('Authority', COL.authority)
);
console.log('─'.repeat(80));

let issues = 0;

for (const file of files) {
  const fp = path.join(ART_DIR, file);
  const r  = audit(fp);
  const name = file.replace('.html', '').substring(0, 37);

  const rhythmFlag   = r.hasRhythmLabel ? '✓' : '✗';
  const r100Flag     = r.hasRhythmIn100 ? '✓' : '–';
  const chemFlag     = r.chemRhythmCount > 0 ? `⚠${r.chemRhythmCount}` : '✓';
  const prescrFlag   = r.prescriptiveFound.length > 0 ? `⚠${r.prescriptiveFound.length}` : '✓';
  const keeperFlag   = r.hasKeeperBlock ? '✓' : '–';
  const authorFlag   = r.authorityFound.length > 0 ? `⚠${r.authorityFound.length}` : '✓';

  if (!r.hasRhythmLabel || r.chemRhythmCount > 0 || r.prescriptiveFound.length > 0 || r.authorityFound.length > 0) {
    issues++;
  }

  console.log(
    pad(name, 38) +
    pad(rhythmFlag, COL.rhythm) +
    pad(r100Flag, COL.r100) +
    pad(chemFlag, COL.chem) +
    pad(prescrFlag, COL.prescr) +
    pad(keeperFlag, COL.keeper) +
    pad(r.vocabDensity, COL.vocab) +
    pad(authorFlag, COL.authority)
  );

  if (r.prescriptiveFound.length > 0) {
    console.log('  Prescriptive: ' + r.prescriptiveFound.join(', '));
  }
  if (r.authorityFound.length > 0) {
    console.log('  Authority tone: ' + r.authorityFound.join(', '));
  }
  if (r.chemRhythmCount > 0) {
    console.log('  ⚠ "Chemical Rhythm" found — should be Water Rhythm');
  }
}

console.log('─'.repeat(80));
console.log(`Total files: ${files.length}  |  Files with issues: ${issues}\n`);
console.log('Legend: ✓ pass  ✗ missing  – not present  ⚠N = N issues found');
