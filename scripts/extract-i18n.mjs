/**
 * Extracts translatable content from English article HTML into a JSON scaffold.
 *
 * Usage:
 *   node scripts/extract-i18n.mjs --slug adding-new-fish [--lang ms]
 *   node scripts/extract-i18n.mjs --all [--lang ms]
 *
 * Outputs translations/<lang>/<slug>.json
 * Existing files are NOT overwritten unless --force is passed.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const TRANSLATIONS_DIR = path.join(ROOT, 'translations');

// Interactive tool files — skipped (handled separately when tools phase begins)
const TOOL_SLUGS = new Set(['tank-builder', 'tank-simulator', 'community-stress-lab']);

const args = process.argv.slice(2);
const slugIdx = args.indexOf('--slug');
const langIdx = args.indexOf('--lang');
const slugArg = slugIdx !== -1 ? args[slugIdx + 1] : undefined;
const langArg = langIdx !== -1 ? args[langIdx + 1] : 'ms';
const doAll = args.includes('--all');
const force = args.includes('--force');

// ── Regex helpers ────────────────────────────────────────────────────────────

function extract1(html, regex) {
  const m = html.match(regex);
  return m ? m[1].trim() : '';
}

function extractAll(html, regex) {
  const results = [];
  const g = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  let m;
  while ((m = g.exec(html)) !== null) results.push(m[1].trim());
  return results;
}

// ── Article parser ────────────────────────────────────────────────────────────

function parseArticle(html) {
  // Head meta
  const title = extract1(html, /<title>([^<]*)<\/title>/);
  const description = extract1(html, /<meta name="description" content="([^"]*)"/);
  const ogTitle = extract1(html, /<meta property="og:title" content="([^"]*)"/);
  const ogDescription = extract1(html, /<meta property="og:description" content="([^"]*)"/);

  // Intro section
  const eyebrow = extract1(html, /<span class="art-eyebrow">([^<]*)<\/span>/);
  const titleHtml = extract1(html, /<h1 class="art-main-title">([\s\S]*?)<\/h1>/);
  const subtitle = extract1(html, /<p class="art-intro-subtitle">([\s\S]*?)<\/p>/);
  const texts = extractAll(html, /<p class="art-intro-text">([\s\S]*?)<\/p>/);

  // Meta spans (the three plain <span> elements inside art-intro-meta, not meta-dot spans)
  const metaBlock = extract1(html, /<div class="art-intro-meta">([\s\S]*?)<\/div>/);
  const metaSpans = [];
  const metaSpanRx = /<span>([^<]*)<\/span>/g;
  let ms;
  while ((ms = metaSpanRx.exec(metaBlock)) !== null) metaSpans.push(ms[1].trim());

  // CTA button text (everything before the <span>→</span>)
  const ctaM = html.match(/<button class="art-begin-btn"[^>]*>([^<]*)<span/);
  const cta = ctaM ? ctaM[1].trim() : 'Start reading';

  // Module sections
  const modules = [];
  const sectionRx = /<section class="module" id="(mod-\d+)"[^>]*>([\s\S]*?)<\/section>/g;
  let sm;
  while ((sm = sectionRx.exec(html)) !== null) {
    const [, id, content] = sm;

    const tag = extract1(content, /<span class="mod-tag">([^<]*)<\/span>/);
    const modTitleHtml = extract1(content, /<h2 class="mod-title">([\s\S]*?)<\/h2>/);

    // Body — directly-nested <p> inside mod-body (no nested divs in this element)
    const bodyBlock = extract1(content, /<div class="mod-body">([\s\S]*?)<\/div>/);
    const body = extractAll(bodyBlock, /<p>([\s\S]*?)<\/p>/);

    // Pull quote (optional)
    const pqM = content.match(/<div class="pq">\s*<p>([\s\S]*?)<\/p>/);
    const pullQuote = pqM ? pqM[1].trim() : null;

    // Hint box — label + one or more paragraphs (optional)
    const hnLabelM = content.match(/<span class="hn-label">([^<]*)<\/span>/);
    const hnBlock = extract1(content, /<div class="hn">([\s\S]*?)<\/div>/);
    const hnParas = hnBlock ? extractAll(hnBlock, /<p>([\s\S]*?)<\/p>/) : [];
    const hintLabel = hnLabelM ? hnLabelM[1].trim() : null;
    const hintText = hnParas.length ? hnParas : null;

    // Navigation buttons
    const prevM = content.match(/<button class="btn-prev"[^>]*>([^<]*)<\/button>/);
    const prevBtn = prevM ? prevM[1].trim() : '';
    const nextM = content.match(/<button class="btn-next"[^>]*>([^<]*)<span/);
    const nextBtn = nextM ? nextM[1].trim() : null;

    modules.push({ id, tag, titleHtml: modTitleHtml, body, pullQuote, hintLabel, hintText, prevBtn, nextBtn });
  }

  // Related article links (btn-ar anchors at end of last module)
  const relatedLinks = [];
  const relRx = /<a href="([^"]*)" class="btn-ar"[^>]*>([^<]*)/g;
  let rl;
  while ((rl = relRx.exec(html)) !== null) {
    relatedLinks.push({ href: rl[1], text: rl[2].trim() });
  }

  // Article footer link text — scoped to art-footer to avoid matching nav links
  const footerBlock = extract1(html, /<div class="art-footer">([\s\S]*?)<\/div>/);
  const allArticles = extract1(footerBlock, /<a href="\/reading">([^<]*)<\/a>/);
  const araLink = extract1(footerBlock, /<a href="\/ara">([^<]*)<\/a>/);

  return {
    head: { title, description, ogTitle, ogDescription },
    intro: {
      eyebrow,
      titleHtml,
      subtitle,
      texts,
      metaModules: metaSpans[0] || '',
      metaTime:    metaSpans[1] || '',
      metaLevel:   metaSpans[2] || '',
      cta
    },
    modules,
    relatedLinks,
    footer: {
      allArticles: allArticles || '← All articles',
      araLink:     araLink     || 'Aquatic Rhythm Alignment'
    }
  };
}

// ── Process one slug ──────────────────────────────────────────────────────────

function processSlug(slug, lang) {
  if (TOOL_SLUGS.has(slug)) {
    console.log(`  skip (tool): ${slug}`);
    return;
  }

  const srcPath = path.join(ARTICLES_DIR, `${slug}.html`);
  if (!fs.existsSync(srcPath)) {
    console.error(`  not found: ${srcPath}`);
    return;
  }

  const langDir = path.join(TRANSLATIONS_DIR, lang);
  const outPath = path.join(langDir, `${slug}.json`);

  if (fs.existsSync(outPath) && !force) {
    console.log(`  exists (use --force to overwrite): ${outPath}`);
    return;
  }

  const html = fs.readFileSync(srcPath, 'utf8');
  const parsed = parseArticle(html);
  const scaffold = {
    _meta: { slug, lang, sourceFile: `articles/${slug}.html` },
    ...parsed
  };

  fs.mkdirSync(langDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(scaffold, null, 2) + '\n', 'utf8');
  console.log(`  written: translations/${lang}/${slug}.json`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

if (doAll) {
  const slugs = fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));
  console.log(`Extracting ${slugs.length} articles for lang=${langArg}…`);
  for (const slug of slugs) processSlug(slug, langArg);
  console.log('Done.');
} else if (slugArg) {
  processSlug(slugArg, langArg);
} else {
  console.error('Usage:\n  node scripts/extract-i18n.mjs --slug <slug> [--lang ms] [--force]\n  node scripts/extract-i18n.mjs --all [--lang ms]');
  process.exit(1);
}
