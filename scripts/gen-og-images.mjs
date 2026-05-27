/**
 * gen-og-images.mjs
 * Generates per-article OG images (1200×630 PNG) using satori + @resvg/resvg-js.
 *
 * Usage:
 *   node scripts/gen-og-images.mjs              # all articles
 *   node scripts/gen-og-images.mjs <slug>       # single article
 *   node scripts/gen-og-images.mjs --update-html # also patch og:image in HTML after generating
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

const require = createRequire(import.meta.url);

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'articles');
const OG_DIR = join(ROOT, 'og', 'articles');
const FONTS_CACHE = join(ROOT, '.font-cache');

// ── colours matching the site ──────────────────────────────────────────────
const C = {
  bg1: '#052535',
  bg2: '#073040',
  bg3: '#041e28',
  bg4: '#020810',
  text: 'rgba(235,240,236,0.94)',
  textDim: 'rgba(235,240,236,0.42)',
  accent: '#3DD6E8',
  eyebrow: 'rgba(157,191,154,0.80)',
  titleEm: 'rgba(61,214,232,0.80)',
  border: 'rgba(61,214,232,0.18)',
};

// ── font helpers ────────────────────────────────────────────────────────────
// WOFF → raw OpenType conversion (satori 0.26 only accepts TTF/OTF byte streams)
// WOFF structure: 44-byte header + table-directory entries (20 bytes each) + data
function woffToTtf(woff) {
  const numTables = woff.readUInt16BE(12);
  const flavor    = woff.readUInt32BE(4);   // same as sfVersion (0x00010000 for TTF)

  // Collect table entries from WOFF directory (starts at byte 44)
  const tables = [];
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

  // Calculate OpenType offset table values
  const n  = numTables;
  let pot  = 1; while (pot * 2 <= n) pot *= 2;
  const searchRange   = pot * 16;
  const entrySelector = Math.log2(pot);
  const rangeShift    = n * 16 - searchRange;

  // Start writing the TTF output
  const parts = [];

  // sfVersion + numTables + searchRange + entrySelector + rangeShift (12 bytes)
  const hdr = Buffer.alloc(12);
  hdr.writeUInt32BE(flavor, 0);
  hdr.writeUInt16BE(n, 4);
  hdr.writeUInt16BE(searchRange, 6);
  hdr.writeUInt16BE(entrySelector, 8);
  hdr.writeUInt16BE(rangeShift, 10);
  parts.push(hdr);

  // Table directory: 16 bytes per table (tag, checksum, offset, length)
  const DIR_SIZE = n * 16;
  const DATA_START = 12 + DIR_SIZE;
  const dir = Buffer.alloc(DIR_SIZE);
  const decomped = tables.map(t => {
    const raw = woff.subarray(t.offset, t.offset + t.compLength);
    return t.compLength < t.origLength ? inflateSync(raw) : raw;
  });

  let dataOffset = DATA_START;
  for (let i = 0; i < n; i++) {
    const t   = tables[i];
    const off = i * 16;
    dir.write(t.tag, off, 4, 'ascii');
    dir.writeUInt32BE(t.origChecksum, off + 4);
    dir.writeUInt32BE(dataOffset, off + 8);
    dir.writeUInt32BE(t.origLength, off + 12);
    // Pad data to 4-byte boundary
    const pad = (4 - decomped[i].length % 4) % 4;
    dataOffset += decomped[i].length + pad;
  }
  parts.push(dir);

  // Table data with padding
  for (const d of decomped) {
    parts.push(d);
    const pad = (4 - d.length % 4) % 4;
    if (pad) parts.push(Buffer.alloc(pad));
  }

  return Buffer.concat(parts);
}

// Fonts bundled via @fontsource — WOFF subset files (latin), converted to raw TTF
const FONT_DEFS = [
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-normal.woff', name: 'Cormorant Garamond', weight: 300, style: 'normal' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff', name: 'Cormorant Garamond', weight: 400, style: 'normal' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff', name: 'Cormorant Garamond', weight: 500, style: 'normal' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-300-italic.woff', name: 'Cormorant Garamond', weight: 300, style: 'italic' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff', name: 'Cormorant Garamond', weight: 400, style: 'italic' },
  { file: '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff', name: 'Cormorant Garamond', weight: 500, style: 'italic' },
  { file: '@fontsource/dm-sans/files/dm-sans-latin-300-normal.woff',  name: 'DM Sans', weight: 300, style: 'normal' },
  { file: '@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff',  name: 'DM Sans', weight: 400, style: 'normal' },
  { file: '@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff',  name: 'DM Sans', weight: 500, style: 'normal' },
];

async function loadFonts() {
  const fonts = [];
  for (const { file, name, weight, style } of FONT_DEFS) {
    const woff = readFileSync(require.resolve(file));
    const data = woffToTtf(woff);
    fonts.push({ name, data: data.buffer, weight, style });
  }
  return fonts;
}

// ── HTML parsing ────────────────────────────────────────────────────────────
function extractArticleData(htmlPath) {
  const html = readFileSync(htmlPath, 'utf-8');

  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ?? '';
  const ogDesc  = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] ?? '';
  const eyebrow = (
    html.match(/class="art-eyebrow"[^>]*>([^<]+)</)?.[1] ??
    html.match(/class="ara-art-eyebrow"[^>]*>([^<]+)</)?.[1] ??
    ''
  ).replace(/&amp;/g, '&').trim();

  // Strip site name suffix
  const title = ogTitle.replace(/\s*[—·]\s*Aquatic Rhythm.*$/, '').trim();
  const desc  = ogDesc.replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();

  // Split title into up to two visual lines (split on <br> or natural break)
  const rawH1 = html.match(/class="art-main-title"[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? title;
  const lines = rawH1
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<em>([\s\S]*?)<\/em>/g, '‹$1›')  // mark italic spans
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  return { title, desc, eyebrow, lines };
}

// ── layout builder ──────────────────────────────────────────────────────────
function el(type, style, children) {
  return { type, props: { style, children } };
}
function txt(text, style) {
  return { type: 'span', props: { style, children: text } };
}

function buildLayout(data, fonts) {
  const { title, desc, eyebrow, lines } = data;

  // Parse italic markers from lines
  function renderLine(line) {
    if (!line.includes('‹')) {
      return txt(line, {
        fontFamily: '"Cormorant Garamond"',
        fontWeight: 300,
        fontStyle: 'normal',
        fontSize: 68,
        color: C.text,
        lineHeight: 1.08,
      });
    }
    // Mixed line with italic parts
    const parts = line.split(/(‹[^›]+›)/);
    return {
      type: 'span',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          fontSize: 68,
          lineHeight: 1.08,
        },
        children: parts.map(part => {
          const isItalic = part.startsWith('‹') && part.endsWith('›');
          const text = isItalic ? part.slice(1, -1) : part;
          return txt(text, {
            fontFamily: '"Cormorant Garamond"',
            fontWeight: isItalic ? 400 : 300,
            fontStyle: isItalic ? 'italic' : 'normal',
            fontSize: 68,
            color: isItalic ? C.titleEm : C.text,
            lineHeight: 1.08,
          });
        }),
      },
    };
  }

  // Truncate desc to ~120 chars
  const shortDesc = desc.length > 130 ? desc.slice(0, 128).replace(/\s\S+$/, '') + '…' : desc;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: 1200,
        height: 630,
        background: `linear-gradient(155deg, ${C.bg1} 0%, ${C.bg2} 30%, ${C.bg3} 65%, ${C.bg4} 100%)`,
        padding: '64px 80px',
        fontFamily: '"DM Sans"',
        position: 'relative',
      },
      children: [
        // Brand row
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 'auto',
            },
            children: [
              txt('AQUATIC RHYTHM', {
                fontFamily: '"DM Sans"',
                fontWeight: 300,
                fontSize: 13,
                letterSpacing: '0.22em',
                color: C.accent,
                textTransform: 'uppercase',
              }),
            ],
          },
        },

        // Content block
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
            },
            children: [
              // Eyebrow
              eyebrow
                ? txt(eyebrow.toUpperCase(), {
                    fontFamily: '"DM Sans"',
                    fontWeight: 500,
                    fontSize: 11,
                    letterSpacing: '0.24em',
                    color: C.eyebrow,
                    textTransform: 'uppercase',
                    marginBottom: 28,
                  })
                : null,

              // Title lines
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: 32,
                  },
                  children: lines.map(renderLine),
                },
              },

              // Description
              shortDesc
                ? txt(shortDesc, {
                    fontFamily: '"Cormorant Garamond"',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    fontSize: 22,
                    color: C.textDim,
                    lineHeight: 1.6,
                    maxWidth: 860,
                  })
                : null,
            ].filter(Boolean),
          },
        },

        // Bottom rule + URL
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 20,
              borderTop: `1px solid ${C.border}`,
            },
            children: [
              txt('aquaticrhythm.com', {
                fontFamily: '"DM Sans"',
                fontWeight: 300,
                fontSize: 13,
                letterSpacing: '0.1em',
                color: C.textDim,
                marginLeft: 'auto',
              }),
            ],
          },
        },
      ],
    },
  };
}

// ── generate single image ───────────────────────────────────────────────────
async function generateOgImage(slug, htmlPath, fonts) {
  const data   = extractArticleData(htmlPath);
  const layout = buildLayout(data, fonts);

  const svg = await satori(layout, {
    width: 1200,
    height: 630,
    fonts,
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png   = resvg.render().asPng();

  const outPath = join(OG_DIR, `${slug}.png`);
  writeFileSync(outPath, png);
  return outPath;
}

// ── patch og:image in HTML ──────────────────────────────────────────────────
function patchOgImage(htmlPath, slug) {
  let html = readFileSync(htmlPath, 'utf-8');
  const newUrl = `https://aquaticrhythm.com/og/articles/${slug}.png`;
  const updated = html.replace(
    /<meta property="og:image" content="[^"]+"/,
    `<meta property="og:image" content="${newUrl}"`,
  );
  if (updated !== html) {
    writeFileSync(htmlPath, updated, 'utf-8');
    return true;
  }
  return false;
}

// ── main ─────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const updateHtml = args.includes('--update-html');
const targetSlug = args.find(a => !a.startsWith('--'));

mkdirSync(OG_DIR, { recursive: true });

console.log('Loading fonts…');
const fonts = await loadFonts();
console.log(`Loaded ${fonts.length} font variants.`);

const htmlFiles = readdirSync(ARTICLES_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => ({ slug: f.replace(/\.html$/, ''), path: join(ARTICLES_DIR, f) }));

const targets = targetSlug
  ? htmlFiles.filter(({ slug }) => slug === targetSlug)
  : htmlFiles;

if (targets.length === 0) {
  console.error(`No article found for slug: ${targetSlug}`);
  process.exit(1);
}

let generated = 0;
let patched   = 0;

for (const { slug, path: htmlPath } of targets) {
  process.stdout.write(`  [${slug}]… `);
  try {
    const outPath = await generateOgImage(slug, htmlPath, fonts);
    process.stdout.write(`saved → ${outPath.replace(ROOT + '/', '')}`);
    generated++;

    if (updateHtml) {
      const changed = patchOgImage(htmlPath, slug);
      if (changed) { process.stdout.write(' (og:image updated)'); patched++; }
    }
    process.stdout.write('\n');
  } catch (err) {
    process.stdout.write(`ERROR: ${err.message}\n`);
  }
}

console.log(`\nDone. Generated: ${generated}  HTML patched: ${patched}`);
