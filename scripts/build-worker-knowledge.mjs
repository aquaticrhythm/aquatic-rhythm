/**
 * build-worker-knowledge.mjs
 *
 * Generates worker/article-index.js from articles/*.html metadata.
 * Run this whenever articles are added or their titles/descriptions change.
 *
 * Usage:
 *   node scripts/build-worker-knowledge.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const ROOT        = path.join(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const OUT_FILE    = path.join(ROOT, 'worker', 'article-index.js');

/* Priority slugs that represent ARA or care-advice articles Rhyssa should know well.
   Listed first so they appear prominently in the index. */
const PRIORITY_SLUGS = [
  'four-principles-of-ara',
  'reading-the-five-rhythms',
  'ara-full-framework',
  'ara-s1-foundation',
  'ara-s2-five-rhythms',
  'ara-s3-phases',
  'ara-s4-alignment',
  'ara-s5-observation',
  'ara-s6-ethics',
  'new-tank-syndrome',
  'cycled-tank-problems',
  'fish-gasping-surface',
  'fish-keep-dying-new-tank',
  'perfect-parameters-fish-dying',
  'caring-without-guilt',
  'when-hobby-stops-feeling-good',
  'know-your-rhythm',
  'aquarium-not-a-project',
  'tank-crash-recovery',
  'adding-new-fish',
  'algae-in-aquarium',
  'aquarium-filter-maintenance',
  'how-often-water-changes',
  'nitrate-keeps-rising',
  'overfeeding-aquarium',
  'aquarium-maintenance-routine',
  'fish-hiding-what-does-it-mean',
  'betta-fish-behaviour',
  'shrimp-dying-aquarium',
  'aquarium-plants-not-growing',
  'low-tech-planted-tank',
  'community-fish-tank',
  'ich-keeps-coming-back',
  'why-is-my-aquarium-water-cloudy',
  'aquarium-travel-vacation',
  'when-is-tank-ready-for-fish',
];

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
  const title = titleMatch
    ? decodeEntities(titleMatch[1].replace(/\s*[·—\-]\s*Aquatic Rhythm.*$/i, '').trim())
    : '';

  const descMatch = html.match(/name="description"\s+content="([^"]+)"/);
  const desc = descMatch ? decodeEntities(descMatch[1].trim()) : '';

  return { title, desc };
}

function stripHtml(html) {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

/* Escape for use inside a JS template literal */
function escapeTemplateLiteral(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.html'));
const articles = [];

for (const file of files) {
  const slug = file.replace(/\.html$/, '');
  if (['tank-builder', 'tank-simulator', 'community-stress-lab'].includes(slug)) continue;
  const html = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
  const { title, desc } = extractMeta(html);
  if (!title) continue;
  articles.push({ slug, title, desc });
}

/* Sort: priority slugs first (in order), then rest alphabetically */
articles.sort((a, b) => {
  const ia = PRIORITY_SLUGS.indexOf(a.slug);
  const ib = PRIORITY_SLUGS.indexOf(b.slug);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.slug.localeCompare(b.slug);
});

const lines = articles.map(({ slug, title, desc }) =>
  `  { slug: ${JSON.stringify(slug)}, title: ${JSON.stringify(title)}, desc: ${JSON.stringify(desc)} },`
);

const output = `/* AUTO-GENERATED — run: node scripts/build-worker-knowledge.mjs */

export const ARTICLE_INDEX = [
${lines.join('\n')}
];
`;

fs.writeFileSync(OUT_FILE, output, 'utf8');
console.log(`✓ Generated worker/article-index.js — ${articles.length} articles`);
