/**
 * gen-og-images.mjs
 * Generates per-article, per-language OG images (1200×630 PNG).
 *
 * Usage:
 *   node scripts/gen-og-images.mjs                        # en only, all articles
 *   node scripts/gen-og-images.mjs --all-langs            # all languages
 *   node scripts/gen-og-images.mjs --lang ja              # one language, all articles
 *   node scripts/gen-og-images.mjs <slug>                 # one article, en only
 *   node scripts/gen-og-images.mjs <slug> --all-langs     # one article, all languages
 *   node scripts/gen-og-images.mjs --update-html          # also patch og:image in HTML
 *
 * Output paths:
 *   English:    og/articles/{slug}.png
 *   Localized:  og/articles/{slug}-{lang}.png
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { createRequire } from 'node:module';

const require   = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT       = join(__dirname, '..');
const ARTICLES_DIR  = join(ROOT, 'articles');
const TRANS_DIR     = join(ROOT, 'translations');
const OG_DIR        = join(ROOT, 'og', 'articles');
const FONTS_CACHE   = join(ROOT, '.font-cache');

const LANGS = ['ms', 'id', 'ja', 'es'];

// ── colours ─────────────────────────────────────────────────────────────────
const C = {
  bg1: '#052535', bg2: '#073040', bg3: '#041e28', bg4: '#020810',
  text: 'rgba(235,240,236,0.94)',
  textDim: 'rgba(235,240,236,0.42)',
  accent: '#3DD6E8',
  eyebrow: 'rgba(157,191,154,0.80)',
  titleEm: 'rgba(61,214,232,0.80)',
  border: 'rgba(61,214,232,0.18)',
};

// ── WOFF → raw OpenType converter ───────────────────────────────────────────
// satori 0.26 only accepts TTF/OTF byte streams (signatures 00010000 / OTTO)
function woffToTtf(woff) {
  const numTables = woff.readUInt16BE(12);
  const flavor    = woff.readUInt32BE(4);
  const tables    = [];
  for (let i = 0; i < numTables; i++) {
    const base = 44 + i * 20;
    tables.push({
      tag:          woff.toString('ascii', base, base + 4),
      offset:       woff.readUInt32BE(base + 4),
      compLength:   woff.readUInt32BE(base + 8),
      origLength:   woff.readUInt32BE(base + 12),
      origChecksum: woff.readUInt32BE(base + 16),
    });
  }
  const n   = numTables;
  let pot   = 1; while (pot * 2 <= n) pot *= 2;
  const hdr = Buffer.alloc(12);
  hdr.writeUInt32BE(flavor, 0); hdr.writeUInt16BE(n, 4);
  hdr.writeUInt16BE(pot * 16, 6); hdr.writeUInt16BE(Math.log2(pot), 8);
  hdr.writeUInt16BE(n * 16 - pot * 16, 10);
  const DIR_SIZE  = n * 16;
  const dir       = Buffer.alloc(DIR_SIZE);
  const decomped  = tables.map(t => {
    const raw = woff.subarray(t.offset, t.offset + t.compLength);
    return t.compLength < t.origLength ? inflateSync(raw) : raw;
  });
  let dataOffset = 12 + DIR_SIZE;
  for (let i = 0; i < n; i++) {
    const t = tables[i]; const off = i * 16;
    dir.write(t.tag, off, 4, 'ascii');
    dir.writeUInt32BE(t.origChecksum, off + 4);
    dir.writeUInt32BE(dataOffset, off + 8);
    dir.writeUInt32BE(t.origLength, off + 12);
    dataOffset += decomped[i].length + (4 - decomped[i].length % 4) % 4;
  }
  const parts = [hdr, dir];
  for (const d of decomped) {
    parts.push(d);
    const pad = (4 - d.length % 4) % 4;
    if (pad) parts.push(Buffer.alloc(pad));
  }
  return Buffer.concat(parts);
}

function loadWoff(pkgFile) {
  return woffToTtf(readFileSync(require.resolve(pkgFile)));
}

// ── Latin fonts (Cormorant Garamond + DM Sans) ───────────────────────────────
const LATIN_FONT_DEFS = [
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-normal.woff', name: 'Cormorant Garamond', weight: 300, style: 'normal' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff', name: 'Cormorant Garamond', weight: 400, style: 'normal' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff', name: 'Cormorant Garamond', weight: 500, style: 'normal' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-italic.woff', name: 'Cormorant Garamond', weight: 300, style: 'italic' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff', name: 'Cormorant Garamond', weight: 400, style: 'italic' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff', name: 'Cormorant Garamond', weight: 500, style: 'italic' },
  { file: '@fontsource/dm-sans/files/dm-sans-latin-300-normal.woff', name: 'DM Sans', weight: 300, style: 'normal' },
  { file: '@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff', name: 'DM Sans', weight: 400, style: 'normal' },
  { file: '@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff', name: 'DM Sans', weight: 500, style: 'normal' },
];

let _latinFonts = null;
function getLatinFonts() {
  if (_latinFonts) return _latinFonts;
  _latinFonts = LATIN_FONT_DEFS.map(({ file, name, weight, style }) => ({
    name, weight, style, data: loadWoff(file).buffer,
  }));
  return _latinFonts;
}

// ── CJK subset font loader (Noto Serif JP) ────────────────────────────────────
// Parses @fontsource CSS to find which subset WOFF files cover the text's chars.
function parseUnicodeRanges(rangeStr) {
  const ranges = [];
  for (const part of rangeStr.split(',')) {
    const m = part.trim().match(/U\+([0-9a-fA-F]+)(?:-([0-9a-fA-F]+))?/i);
    if (m) ranges.push([parseInt(m[1], 16), m[2] ? parseInt(m[2], 16) : parseInt(m[1], 16)]);
  }
  return ranges;
}

function textNeedsSubset(text, ranges) {
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    for (const [lo, hi] of ranges) {
      if (cp >= lo && cp <= hi) return true;
    }
  }
  return false;
}

let _notoSubsetMap = null;   // lazy-parsed CSS map: [{file, ranges}]
function getNotoSubsetMap(weight = 300) {
  if (_notoSubsetMap) return _notoSubsetMap;
  const cssPath = require.resolve(`@fontsource/noto-serif-jp/${weight}.css`);
  const css     = readFileSync(cssPath, 'utf8');
  const map     = [];
  for (const block of css.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
    const body   = block[1];
    const file   = body.match(/url\(\.\/files\/([^)]+\.woff)\)/)?.[1];
    const range  = body.match(/unicode-range:\s*([^;]+)/)?.[1];
    if (file && range) map.push({ file, ranges: parseUnicodeRanges(range) });
  }
  _notoSubsetMap = map;
  return map;
}

// Returns satori font entries for Noto Serif JP subsets covering `text`.
// DM Sans (already in latinFonts) covers ASCII punctuation and Latin chars.
function getJaFonts(text) {
  const map   = getNotoSubsetMap(300);
  const fonts = [];
  for (const { file, ranges } of map) {
    if (!textNeedsSubset(text, ranges)) continue;
    const woff = readFileSync(require.resolve(`@fontsource/noto-serif-jp/files/${file}`));
    fonts.push({ name: 'Noto Serif JP', weight: 300, style: 'normal', data: woffToTtf(woff).buffer });
  }
  return fonts;
}

// ── Data extraction ───────────────────────────────────────────────────────────
function parseH1Lines(rawH1) {
  return rawH1
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<em>([\s\S]*?)<\/em>/g, '‹$1›')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

// English — read from articles/*.html
function extractEnData(htmlPath) {
  const html   = readFileSync(htmlPath, 'utf-8');
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ?? '';
  const ogDesc  = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] ?? '';
  const eyebrow = (
    html.match(/class="art-eyebrow"[^>]*>([^<]+)</)?.[1] ??
    html.match(/class="ara-art-eyebrow"[^>]*>([^<]+)</)?.[1] ??
    ''
  ).replace(/&amp;/g, '&').trim();
  const rawH1 = html.match(/class="art-main-title"[^>]*>([\s\S]*?)<\/h1>/)?.[1] ??
    ogTitle.replace(/\s*[—·]\s*Aquatic Rhythm.*$/, '');
  return {
    title:   ogTitle.replace(/\s*[—·]\s*Aquatic Rhythm.*$/, '').trim(),
    desc:    ogDesc.replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim(),
    eyebrow,
    lines:   parseH1Lines(rawH1),
  };
}

// Localized — read from translations/{lang}/{slug}.json
function extractLangData(slug, lang) {
  const tPath = join(TRANS_DIR, lang, `${slug}.json`);
  if (!existsSync(tPath)) return null;
  const t = JSON.parse(readFileSync(tPath, 'utf-8'));
  const rawH1 = t.intro?.titleHtml ?? t.head?.ogTitle ?? '';
  return {
    title:   (t.head?.ogTitle ?? '').replace(/\s*[—·].*$/, '').trim(),
    desc:    (t.head?.ogDescription ?? '').replace(/&amp;/g, '&').trim(),
    eyebrow: (t.intro?.eyebrow ?? '').replace(/&amp;/g, '&').trim(),
    lines:   parseH1Lines(rawH1),
  };
}

// ── Layout builder ────────────────────────────────────────────────────────────
function txt(text, style) {
  return { type: 'span', props: { style, children: text } };
}

function buildLayout(data, titleFont, uiFont, isJa = false) {
  const { desc, eyebrow, lines } = data;
  const titleSize = lines.length > 1 ? 76 : 92;

  function renderLine(line) {
    if (!line.includes('‹') || isJa) {
      // Japanese: strip italic markers, render plain
      const text = line.replace(/[‹›]/g, '');
      return txt(text, {
        fontFamily: `"${titleFont}"`,
        fontWeight: 300,
        fontStyle: 'normal',
        fontSize: titleSize,
        color: C.text,
        lineHeight: 1.15,
      });
    }
    // Latin with italic <em> parts
    return {
      type: 'span',
      props: {
        style: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', fontSize: titleSize, lineHeight: 1.1 },
        children: line.split(/(‹[^›]+›)/).map(part => {
          const isItalic = part.startsWith('‹') && part.endsWith('›');
          return txt(isItalic ? part.slice(1, -1) : part, {
            fontFamily: `"${titleFont}"`,
            fontWeight: isItalic ? 400 : 300,
            fontStyle: isItalic ? 'italic' : 'normal',
            fontSize: titleSize,
            color: isItalic ? C.titleEm : C.text,
            lineHeight: 1.1,
          });
        }),
      },
    };
  }

  const shortDesc = desc.length > 90 ? desc.slice(0, 88).replace(/\s\S+$/, '') + '…' : desc;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', flexDirection: 'column',
        width: 1200, height: 630,
        background: `linear-gradient(155deg, ${C.bg1} 0%, ${C.bg2} 30%, ${C.bg3} 65%, ${C.bg4} 100%)`,
        padding: '56px 80px',
        fontFamily: `"${uiFont}"`,
        position: 'relative',
      },
      children: [
        // Brand
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', marginBottom: 'auto' },
            children: [txt('AQUATIC RHYTHM', {
              fontFamily: '"DM Sans"', fontWeight: 400, fontSize: 20,
              letterSpacing: '0.22em', color: C.accent, textTransform: 'uppercase',
            })],
          },
        },
        // Content
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' },
            children: [
              eyebrow ? txt(isJa ? eyebrow : eyebrow.toUpperCase(), {
                fontFamily: `"${uiFont}"`, fontWeight: 500, fontSize: 20,
                letterSpacing: isJa ? '0.08em' : '0.18em',
                color: C.eyebrow,
                textTransform: isJa ? 'none' : 'uppercase',
                marginBottom: 24,
              }) : null,
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', marginBottom: 28 },
                  children: lines.map(renderLine),
                },
              },
              shortDesc ? txt(shortDesc, {
                fontFamily: `"${titleFont}"`, fontWeight: 300,
                fontStyle: isJa ? 'normal' : 'italic',
                fontSize: 28, color: C.textDim, lineHeight: 1.5, maxWidth: 980,
              }) : null,
            ].filter(Boolean),
          },
        },
        // Footer
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', paddingTop: 20, borderTop: `2px solid ${C.border}` },
            children: [txt('aquaticrhythm.com', {
              fontFamily: '"DM Sans"', fontWeight: 300, fontSize: 20,
              letterSpacing: '0.1em', color: C.textDim, marginLeft: 'auto',
            })],
          },
        },
      ],
    },
  };
}

// ── Image generation ──────────────────────────────────────────────────────────
async function generateImage(outFile, data, extraFonts = [], titleFont = 'Cormorant Garamond', uiFont = 'DM Sans', isJa = false) {
  const layout = buildLayout(data, titleFont, uiFont, isJa);
  const fonts  = [...getLatinFonts(), ...extraFonts];
  const svg    = await satori(layout, { width: 1200, height: 630, fonts });
  const png    = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  writeFileSync(outFile, png);
}

// ── og:image patching ─────────────────────────────────────────────────────────
function patchOgImage(htmlPath, imageUrl) {
  const html    = readFileSync(htmlPath, 'utf-8');
  const updated = html.replace(
    /<meta property="og:image" content="[^"]+"/,
    `<meta property="og:image" content="${imageUrl}"`,
  );
  if (updated !== html) { writeFileSync(htmlPath, updated, 'utf-8'); return true; }
  return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const updateHtml = args.includes('--update-html');
const allLangs   = args.includes('--all-langs');
const targetLang = args.find(a => a.startsWith('--lang='))?.slice(7) ??
                   (args.indexOf('--lang') >= 0 ? args[args.indexOf('--lang') + 1] : null);
const targetSlug = args.find(a => !a.startsWith('--') && a !== targetLang);

mkdirSync(OG_DIR, { recursive: true });

// Determine which languages to process
const activeLangs = allLangs ? LANGS : targetLang ? [targetLang] : [];

// Determine which slugs to process
const allSlugs = readdirSync(ARTICLES_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => f.replace(/\.html$/, ''));
const slugs = targetSlug ? allSlugs.filter(s => s === targetSlug) : allSlugs;

if (slugs.length === 0) {
  console.error(`No article found for slug: ${targetSlug}`);
  process.exit(1);
}

console.log(`Generating en images for ${slugs.length} article(s)…`);
console.log('Loading Latin fonts…');
getLatinFonts();  // warm cache

let generated = 0;
let patched   = 0;

// ── English images ────────────────────────────────────────────────────────────
for (const slug of slugs) {
  const htmlPath = join(ARTICLES_DIR, `${slug}.html`);
  const outFile  = join(OG_DIR, `${slug}.png`);
  process.stdout.write(`  [en/${slug}]… `);
  try {
    const data = extractEnData(htmlPath);
    await generateImage(outFile, data);
    process.stdout.write(`saved → og/articles/${slug}.png`);
    generated++;
    if (updateHtml) {
      const changed = patchOgImage(htmlPath, `https://aquaticrhythm.com/og/articles/${slug}.png`);
      if (changed) { process.stdout.write(' (html patched)'); patched++; }
    }
  } catch (err) {
    process.stdout.write(`ERROR: ${err.message}`);
  }
  process.stdout.write('\n');
}

// ── Localized images ──────────────────────────────────────────────────────────
if (activeLangs.length > 0) {
  console.log(`\nGenerating localized images for [${activeLangs.join(', ')}]…`);
}

for (const lang of activeLangs) {
  const isJa = lang === 'ja';

  if (isJa) {
    console.log(`  Loading Noto Serif JP subsets for [ja] (will vary per article)…`);
  }

  for (const slug of slugs) {
    const data = extractLangData(slug, lang);
    if (!data) { console.log(`  [${lang}/${slug}] skipped (no translation)`); continue; }

    process.stdout.write(`  [${lang}/${slug}]… `);
    try {
      const outFile = join(OG_DIR, `${slug}-${lang}.png`);

      if (isJa) {
        const allText = [data.eyebrow, ...data.lines, data.desc].join('');
        const jaFonts = getJaFonts(allText);
        await generateImage(outFile, data, jaFonts, 'Noto Serif JP', 'DM Sans', true);
      } else {
        await generateImage(outFile, data);
      }

      process.stdout.write(`saved → og/articles/${slug}-${lang}.png`);
      generated++;

      if (updateHtml) {
        const langHtmlPath = join(ROOT, lang, 'articles', `${slug}.html`);
        if (existsSync(langHtmlPath)) {
          const changed = patchOgImage(langHtmlPath, `https://aquaticrhythm.com/og/articles/${slug}-${lang}.png`);
          if (changed) { process.stdout.write(' (html patched)'); patched++; }
        }
      }
    } catch (err) {
      process.stdout.write(`ERROR: ${err.message}`);
    }
    process.stdout.write('\n');
  }
}

console.log(`\nDone. Generated: ${generated}  HTML patched: ${patched}`);
