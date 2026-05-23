# Article images

Stock images for **New Tank Syndrome** were removed from the repo so assets can be **curated and added manually** (same HTML hooks and CSS in `/css/ar-page.css` still apply when you add files under `img/articles/new-tank-syndrome/` and wire `<picture>` / `<img>` in the article HTML).

**Community / editorial photos:** keepers can offer images via **[Share your tank photos](/share-photos.html)** (Formspree — shareable image URLs in the message; no file uploads on this tier; no email required; optional topic tags; see page for permission summary).

## Layout


- One folder per article **slug**: `img/articles/<slug>/`
- Prefer **WebP** encoded at two widths for `srcset` (for example `720` and `1200` logical pixels).
- Keep originals or export notes in `SOURCES.md` inside that folder (license, photographer, URL).

## HTML conventions

- **Hero** (intro screen): `<figure class="art-hero-figure">` with `<picture>` + `fetchpriority="high"` on the `<img>`, explicit `width` / `height`, no `loading="lazy"`.
- **In-article**: `<figure class="art-inline-figure">` with `loading="lazy"` and `decoding="async"`.
- Shared styles live in `/css/ar-page.css` (`.art-intro-stack`, `.art-hero-figure`, `.art-inline-figure`, `.art-img`, `.art-img-caption`).

## Localised pages

Images are **shared by slug** across `en` / `ms` / `id` / `ja` / `es` HTML. Translate **alt** and **figcaption** text per page where it matters for accessibility.
