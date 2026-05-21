# Aquatic Rhythm

**Aligned with living systems.**

[aquaticrhythm.com](https://aquaticrhythm.com) · [hello@aquaticrhythm.com](mailto:hello@aquaticrhythm.com)

---

## What This Is

Aquatic Rhythm is a small, independent project built around one observation: most aquarium problems are not mistakes — they are misalignment.

At its core is **ARA — Aquatic Rhythm Alignment** — a conceptual framework for reading closed aquatic ecosystems through rhythm, phase, and the reality of human care. ARA treats the aquarium not as a machine to be tuned, but as a living system that responds to patterns, consistency, and time.

This repository hosts the website and all associated project files.

---

## The Framework

ARA is built on four principles:

- **Timing before technique** — the right moment matters more than the right action
- **Capacity before ambition** — honest assessment of what your real life can sustain
- **Rhythm before intensity** — small consistent care outperforms dramatic intervention
- **Observation before correction** — watch and understand before you disturb

Behind these principles is a complete ecological system of thinking — five interlocking rhythms, three phases of system maturity, and a recognition that human behaviour is not external to the ecosystem. It is part of it.

---

## Rhyssa

Rhyssa is the conversational companion of Aquatic Rhythm, shaped by ARA.

She does not answer before she understands. She does not manufacture urgency where there is none. She moves at the pace living systems actually need.

Rhyssa is available as a floating companion on every page of the site, and also lives as a custom GPT on ChatGPT:
[Meet Rhyssa](https://chatgpt.com/g/g-6a09401c8ef48191b18deb53565a7fe1-rhyssa-aquarium-companion)

---

## Labs & Tools

Three interactive tools for planning, learning, and reading your tank:

### Tank Builder
Equipment and livestock planning lab. Choose fish first and discover what equipment they need — or build your setup first and see what species it can support. Tracks all five ARA rhythms (Water, Biological, Environmental, Livestock, Human) in real time as you build.

### Tank Cycle Simulator
Interactive nitrogen cycle simulator. Choose your tank size, cycling method, and plants — then watch the cycle unfold one simulated day at a time. Make real decisions (feeding, water changes, equipment) and see how the biology responds.

### Community Stress Lab
Ecological pressure map for hypothetical freshwater communities. Add up to 6 species and see overlapping pressures across six dimensions: thermal, chemistry, space, predation, social tension, and dwarf shrimp safety. For planning and learning — not a compatibility guarantee.

---

## Reading

Aquatic Rhythm publishes short guided articles — not long-form guides. Each piece is built as a modular reading experience: one idea at a time, with interactive visuals where relevant.

Current articles (32 total):

- Adding new fish · Algae in aquarium · Aquarium filter maintenance
- Aquarium maintenance routine · Aquarium not a project · Aquarium plants not growing
- Aquarium travel & vacation · Betta fish behaviour · Caring without guilt
- Community fish tank · Cycled tank problems · Fish gasping at surface
- Fish hiding · Fish keep dying in new tank · Four principles of ARA
- How often water changes · Ich keeps coming back · Know your rhythm
- Low tech planted tank · New tank syndrome · Nitrate keeps rising
- Overfeeding aquarium · Perfect parameters but fish dying · Reading the five rhythms
- Shrimp dying · Tank builder · Tank crash recovery · Tank simulator
- When hobby stops feeling good · When is tank ready for fish · Why is water cloudy

---

## Repository Structure

```
/
├── index.html                        — main website (single-page application)
├── 404.html                          — SPA redirect for GitHub Pages routing
├── favicon.png                       — site favicon (48×48)
├── apple-touch-icon.png              — home screen icon (192×192)
├── og-image.png                      — social sharing image (1200×630)
├── manifest.json                     — PWA manifest
├── CNAME                             — custom domain (aquaticrhythm.com)
├── sitemap.xml                       — sitemap for search engine indexing
├── README.md                         — this file
│
├── operations/
│   └── security/
│       └── post-deploy-header-validation.md  — post-deploy security header checklist
│
├── docs/
│   ├── waf-github-pages.md           — WAF in front of GitHub Pages origin
│   └── community-stress-lab-mvp.md   — MVP spec: Community Stress Lab
│
├── data/
│   ├── community-stress-lab-species-v1.json   — species pack (90+ freshwater species)
│   └── community-stress-lab-species.schema.json — JSON Schema for species pack rows
│
├── articles/                         — 32 standalone HTML pages
│   ├── tank-simulator.html           — interactive nitrogen cycle simulator
│   ├── tank-builder.html             — equipment / livestock planning lab
│   ├── community-stress-lab.html     — tank mates ecological pressure map
│   └── [29 reading articles]
│
├── css/
│   ├── style.css                     — main stylesheet (SPA, ecosystem BG, animations)
│   ├── ar-page.css                   — shared styles for all article/tool pages (nav, bottom nav, Rhyssa FAB)
│   └── kofi-sheet.css                — Ko-fi support widget styles
│
└── js/
    ├── ui.js                         — SPA routing, navigation, page transitions
    ├── ar-page.js                    — shared nav logic for article/tool pages (burger, settings injection, Rhyssa FAB)
    ├── community-stress-lab.js       — Community Stress Lab rules engine + UI
    ├── rhyssa-fab-ext.js             — Rhyssa AI companion chat interface
    ├── ecosystem.js                  — background ecosystem canvas animation
    ├── fauna.js                      — fauna layer for ecosystem visual
    ├── tank-data.js                  — Tank Simulator constants and data
    └── kofi-sheet.js                 — Ko-fi support widget logic
```

---

## Design System

All pages share a unified dark aquatic identity:

- **Background**: Deep blue-black gradient (`#050a08`) with animated water caustics and light rays
- **Accent**: Cyan (`#3DD6E8`) for interactive elements, status indicators, and highlights
- **Typography**: Cormorant Garamond (serif, headings and italic accents) + DM Sans (sans-serif, UI and body)
- **Header pattern**: `[Logo · AQUATIC Rhythm] ————— [⚙]` — consistent across all pages and tools
- **Intro pattern**: All tools (Tank Builder, Tank Simulator, Community Stress Lab) open with a branded briefing screen — same visual identity, tool-specific content

### Tool-specific header extensions

**Tank Simulator** — sub-toolbar below the header:
```
[☀️ Day N · status] ————————————— [+1d] [⏸ Pause]
```

**Settings button** on articles is auto-injected by `ar-page.js` — no per-file HTML changes needed.

---

## Security Operations

Baseline deployment and WAF tuning in front of origin GitHub Pages is documented at:

- [`docs/waf-github-pages.md`](docs/waf-github-pages.md)

---

## Project Status

Aquatic Rhythm evolves slowly and deliberately.

Changes are made when understanding matures — not according to release cycles. The framework, the companion, and the website are all works in progress, shaped by use and observation over time.

This is not a finished product. It is a living exploration.

---

## Contact

[hello@aquaticrhythm.com](mailto:hello@aquaticrhythm.com)
