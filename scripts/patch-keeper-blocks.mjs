/**
 * Adds ARA · Keeper Rhythm blocks to practical articles that are missing them.
 * Also fixes 2 prescriptive language issues.
 *
 * Run: node scripts/patch-keeper-blocks.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT    = path.join(import.meta.dirname, '..');
const ART_DIR = path.join(ROOT, 'articles');

function hn(label, text) {
  return `\n    <div class="hn">\n      <span class="hn-label">${label}</span>\n      <p>${text}</p>\n    </div>\n`;
}

const KEEPER = 'ARA · Keeper Rhythm';

// Each entry: { file, anchor, insert, replace?, with? }
// anchor: the string before which (or around which) the change is made
// insert: content to insert BEFORE anchor
// replace/with: for text substitutions (prescriptive language fixes)

const PATCHES = [

  /* ── aquarium-maintenance-routine ──
     Theme: guilt when real routine diverges from "ideal" schedule. */
  {
    file: 'aquarium-maintenance-routine.html',
    anchor: '    <div class="hn">\n      <span class="hn-label">Know Your Rhythm</span>',
    insert: hn(KEEPER, 'The gap between the routine you intend to have and the one you actually manage is one of the most common sources of keeper guilt in this hobby. It is worth naming: feeling behind on water changes is not a character flaw — it is information about the match between the tank\'s demands and your actual available rhythm. When that gap creates guilt, keepers often swing between over-compensating (large emergency changes) and avoidance — both of which produce more instability than a modest, imperfect routine would. The misalignment between keeper and tank is adjustable. The guilt about it is optional.'),
  },

  /* ── new-tank-syndrome ──
     Theme: panic and guilt when fish die during cycling. */
  {
    file: 'new-tank-syndrome.html',
    anchor: '    <div class="hn">\n      <span class="hn-label">Aquatic Rhythm perspective</span>\n      <p>New tank syndrome is not an obstacle',
    insert: hn(KEEPER, 'Watching fish struggle or die during the cycling phase produces a specific kind of distress — the feeling that you are doing something wrong even when you are following every piece of advice you could find. That feeling is real, and it is worth acknowledging. What it is not is accurate feedback about your competence as a keeper. New tank syndrome is a biological phase every tank moves through, not a reflection on who is tending it. The impulse to act — to add something, change something, fix something — is natural. Sitting with observation when the instinct is to intervene is one of the harder skills in this hobby, and this phase is where most keepers first learn it.'),
  },

  /* ── low-tech-planted-tank ──
     Theme: feeling inadequate compared to high-tech setups. */
  {
    file: 'low-tech-planted-tank.html',
    anchor: '    <div class="hn">\n      <span class="hn-label">ARA · Technical Infrastructure</span>',
    insert: hn(KEEPER, 'There is a particular pressure in planted tank communities: the sense that what you are doing is a lesser version of what serious keepers do. High-tech setups get more photography, more forum attention, more detailed discussion. A low-tech tank running quietly in the corner can start to feel like evidence of limitation rather than a deliberate, calibrated choice. That comparison is worth examining. A low-tech tank that matches the keeper\'s actual rhythm — their available time, their honest maintenance pattern, their capacity for complexity — is not a compromise. It is alignment. A high-tech tank that requires more than the keeper can reliably give is the less stable of the two, regardless of how it photographs.'),
  },

  /* ── how-often-water-changes ──
     Theme: anxiety from conflicting advice, feeling like you're always getting frequency wrong. */
  {
    file: 'how-often-water-changes.html',
    anchor: '    <div class="mod-next" style="margin-top:1.5rem">',
    insert: hn(KEEPER, 'The volume of conflicting water change advice — weekly, fortnightly, only when nitrate hits a number, never without testing — can produce a specific kind of keeper anxiety: the feeling that you are permanently doing it wrong, that the right answer exists and you just haven\'t found it yet. That anxiety tends to produce the most disruptive care pattern of all: large irregular changes done reactively when something looks off, interspersed with long periods of inaction. The rhythm between keeper and tank matters more than the exact frequency. An honest 15% every ten days, done consistently, produces less instability than an aspirational 30% weekly that actually happens once a month.'),
  },

  /* ── overfeeding-aquarium ──
     Theme: shame when realising you've been unknowingly overfeeding. */
  {
    file: 'overfeeding-aquarium.html',
    anchor: '    <div class="mod-next" style="margin-top:1.5rem">',
    insert: hn(KEEPER, 'Finding out that overfeeding is driving most of the problems you have been troubleshooting for months can produce a specific reaction — embarrassment, or a sharp self-critical reading of what you should have known. That reaction is worth noticing. Overfeeding is the most common invisible driver of aquarium problems not because keepers are careless, but because feeding generously feels like caring well. The connection between what goes in and what the water column carries is not intuitive until you have read a tank long enough to see the pattern. What you fed yesterday is ecological information, not a verdict on your competence.'),
  },

  /* ── aquarium-filter-maintenance ──
     Theme: guilt and confusion when tank crashes after "doing everything right." */
  {
    file: 'aquarium-filter-maintenance.html',
    anchor: '    <div class="hn">\n      <span class="hn-label">ARA · Technical Infrastructure</span>',
    insert: hn(KEEPER, 'A tank crash after a filter clean is one of the most disorienting experiences in this hobby — you did maintenance, you did what you were supposed to do, and the tank got worse. That specific confusion tends to produce either over-caution (avoiding filter maintenance entirely) or repetition (cleaning again, harder, trying to fix what the cleaning created). Both responses come from a reasonable place and both extend the problem. The biology in the filter is not visible, which makes it easy to treat the filter as a mechanical object rather than a living one. Recognising that the crash is not evidence of a wrong action, but of a timing or method mismatch, is what makes the next clean different.'),
  },

  /* ── fish-hiding-what-does-it-mean ──
     Theme: alarm and helplessness when fish suddenly hide. */
  {
    file: 'fish-hiding-what-does-it-mean.html',
    anchor: '    <div class="hn">\n      <span class="hn-label">Remember</span>',
    insert: hn(KEEPER, 'Walking past a tank and finding the fish gone — tucked away, motionless, invisible — can trigger an immediate alarm that makes it hard to observe calmly. That alarm is a Keeper Rhythm signal worth reading. The urge to tap the glass, rearrange hiding spots, or dose something is a natural response to feeling helpless. But fish that are hiding are already signalling — the tap or intervention adds a variable to a system that is already under stress. The most useful keeper action in the first hours of unexpected hiding is stillness: sit near the tank, watch without interacting, and give the Livestock Rhythm time to show you what it is expressing.'),
  },

  /* ── betta-fish-behaviour ──
     Theme: personal attachment and anxiety when betta changes behaviour. */
  {
    file: 'betta-fish-behaviour.html',
    anchor: '    <div class="mod-next" style="margin-top:1.5rem">',
    insert: hn(KEEPER, 'Bettas are kept singularly, which means every change in behaviour lands differently than it would in a community tank — there is no school to compare against, no other fish whose normal behaviour provides context. When a betta changes, the keeper notices, and the attachment to that specific fish means the noticing comes with weight. That weight is real. It also means that the keeper\'s state — heightened attention, anxiety about what the change means, urgency to act — is part of the ecological picture. A betta keeper checking parameters more frequently, disrupting the tank more often, during a period of worry is a keeper whose Rhythm has changed too. Read both at once.'),
  },

  /* ── algae-in-aquarium ──
     Theme: shame and failure feeling when algae appears. */
  {
    file: 'algae-in-aquarium.html',
    anchor: '    <div class="mod-next" style="margin-top:1.5rem">',
    insert: hn(KEEPER, 'Algae carries more shame than almost any other aquarium problem. The clean, clear tanks in photographs do not have it. The advice columns treat it as something to be eliminated. The experience of finding hair algae on the glass or black beard algae on a favourite piece of wood can feel like evidence of poor keeping — a visible failure on display. That shame is worth examining, because it tends to produce the least effective responses: panic scrubbing, multiple simultaneous interventions, or a sense that the hobby is harder for you than it is for others. Algae is a condition read, not a verdict. Every tank produces the conditions for some type of algae at some point. The useful question is not "why do I have algae" but "what is the Environmental Rhythm expressing right now."'),
  },

  /* ── perfect-parameters-fish-dying ──
     Theme: helplessness and self-blame when fish die despite "perfect" water. */
  {
    file: 'perfect-parameters-fish-dying.html',
    anchor: '    <div class="mod-next" style="margin-top:1.5rem">',
    insert: hn(KEEPER, 'There is a particular helplessness in testing perfect parameters while a fish fades. The test kit was supposed to be the diagnostic tool — it says everything is fine, and yet something is clearly not. That gap between what the numbers say and what the tank is expressing can lead keepers to distrust their own observation, to repeat the tests in case they made an error, or to reach for a treatment when there is no identified disease. The test kit reads chemistry. The keeper reads the fish. When those two signals conflict, the fish is not wrong. Something the test kit does not measure is operating — and that something is findable through the observation methods in this guide.'),
  },

  /* ── when-is-tank-ready-for-fish ──
     Theme: impatience and anxiety about getting timing right. */
  {
    file: 'when-is-tank-ready-for-fish.html',
    anchor: '    <div class="hn">\n      <span class="hn-label">ARA · Capacity before Ambition</span>',
    insert: hn(KEEPER, 'The waiting period before adding fish is one of the harder stretches for new keepers. The tank is running, it looks good, and the delay feels arbitrary — a formality before the real hobby begins. That impatience is a Keeper Rhythm signal: it is information about your relationship with process and uncertainty, which is also exactly the relationship the hobby will keep asking you to develop. The tanks that cycle quietly, with a keeper who checks occasionally rather than daily, often cycle faster — because the keeper is not intervening out of impatience. What you do during the wait is already practice for the kind of observation the fish will require once they arrive.'),
  },

  /* ── why-is-my-aquarium-water-cloudy ──
     Theme: worry when water looks wrong, impulse to add treatments. */
  {
    file: 'why-is-my-aquarium-water-cloudy.html',
    anchor: '    <div class="hn">\n      <span class="hn-label">If it is a new tank</span>',
    insert: hn(KEEPER, 'Cloudy water produces a specific keeper response — the need to do something visible. The tank looks wrong. There must be something to add, something to remove, some action that will make it clear. That impulse is understandable, and it is also the most common reason cloudy water becomes prolonged cloudy water. Treatments and flocculants address the symptom without addressing the origin, and they often add chemical variables that slow whatever biological process was already working to resolve the cloudiness. The keeper who can identify the type of cloudiness, confirm it is not an emergency, and then observe without intervening is practising one of the most ecologically useful skills in the hobby.'),
  },

  /* ── aquarium-not-a-project ──
     Theme: restlessness and anxiety about whether tank is "good enough." */
  {
    file: 'aquarium-not-a-project.html',
    anchor: '    <div class="mod-next" style="margin-top:1.5rem">',
    insert: hn(KEEPER, 'The impulse to keep improving a tank that is already stable is not a design flaw in the keeper — it is what caring looks like when it has run out of necessary tasks. A tank in genuine alignment does not ask for much. For some keepers, that quietness is restful. For others, it produces a low-level anxiety that something is being missed, that the tank could be better, that another keeper would have noticed something to improve. That anxiety is a Keeper Rhythm reading: it tends to appear when the keeper\'s relationship with the tank is built around active intervention rather than observation. A tank that is already enough is asking for a different kind of attention — one that watches without needing to find something to fix.'),
  },

  /* ── PRESCRIPTIVE LANGUAGE FIXES ── */

  /* new-tank-syndrome: "Never replace all the media at once" */
  {
    file: 'new-tank-syndrome.html',
    replace: 'Never replace all the media at once.',
    with: 'Replacing all the media at once removes the entire colony — leaving a portion preserves continuity.',
  },

  /* new-tank-syndrome: "only when you need to" — keep, but fix "Never" above only */

  /* why-is-my-aquarium-water-cloudy: "If you must do something" */
  {
    file: 'why-is-my-aquarium-water-cloudy.html',
    replace: 'If you must do something, a 15–20% change once is fine.',
    with: 'If the urge to act is strong, a single 15–20% change is fine.',
  },
];

let patched = 0;
let skipped = 0;

for (const p of PATCHES) {
  const fp = path.join(ART_DIR, p.file);
  let html = fs.readFileSync(fp, 'utf8');
  let changed = false;

  if (p.anchor && p.insert) {
    // Check keeper block not already present
    if (html.includes('ARA · Keeper Rhythm')) {
      process.stdout.write(`  [SKIP] ${p.file} — keeper block already present\n`);
      skipped++;
      continue;
    }
    if (!html.includes(p.anchor)) {
      process.stdout.write(`  [WARN] ${p.file} — anchor not found, skipping\n`);
      skipped++;
      continue;
    }
    html = html.replace(p.anchor, p.insert + p.anchor);
    changed = true;
    process.stdout.write(`  [OK]   ${p.file} — keeper block added\n`);
  }

  if (p.replace && p.with) {
    if (!html.includes(p.replace)) {
      process.stdout.write(`  [WARN] ${p.file} — prescriptive phrase not found: "${p.replace}"\n`);
    } else {
      html = html.replace(p.replace, p.with);
      changed = true;
      process.stdout.write(`  [OK]   ${p.file} — prescriptive fix applied\n`);
    }
  }

  if (changed) {
    fs.writeFileSync(fp, html, 'utf8');
    patched++;
  }
}

console.log(`\nDone. ${patched} files changed, ${skipped} skipped.`);
