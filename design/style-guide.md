# FIAP Games — Brand Style Guide

Companion to [`brand-prompt.md`](brand-prompt.md). This file records the concrete decisions made from that brief — exact hex values, the symbol rationale, and usage rules — so every asset in this folder stays consistent.

## Symbol

The mark is a rounded-square **tile** with a triangular **play-notch** bitten out of its right edge — read simultaneously as a ▶ play button and as a single card from a game-library grid. Two shapes, evenodd cutout (no separate "hole" layer to keep in sync), high contrast, legible down to 16px.

Rejected directions: literal controller/joystick illustrations (too busy at favicon size, too close to generic "gamer" clip-art); a shopping-bag glyph (reads as generic e-commerce, loses the "games" specificity); a pure geometric "G" letterform (less iconic standalone, harder to disambiguate from unrelated brands at a glance).

## Color tokens

| Token | Hex | Use |
|---|---|---|
| `--bg-deep` | `#0B0712` | Primary dark surface / page background |
| `--surface` | `#1A1030` | Card / panel surface on top of `--bg-deep` |
| `--accent` | `#8B5CF6` | The one vivid accent — logo fill, primary CTA, links |
| `--accent-cyan` | `#22D3EE` | Secondary highlight only — sparing use (e.g. a gradient glow behind hero art). Never the primary mark color, never paired 50/50 with `--accent` |
| `--text` | `#F5F3FF` | Body/heading text on dark surfaces |

Picked within the range `brand-prompt.md` specified ("deep indigo/violet or near-black background family with one vivid accent"); not fixed by an external request, and open to revision.

## Typography

**Space Grotesk** (geometric sans, Google Fonts) — SemiBold/Bold for the wordmark, tight letter-spacing (`-0.02em` to `-0.04em` at display sizes). It's technical without being cold, matches the "confident, a little playful, not corporate" brief.

Fallback stack for anywhere the webfont isn't loaded: `'Space Grotesk', 'Sora', ui-sans-serif, system-ui, sans-serif`.

**Known limitation**: the standalone `.svg` files in this folder reference the font by name/fallback stack rather than embedding it or outlining the text to paths — there's no font-to-outline tool available in this environment. Before these assets go into a print pipeline, an app-icon build, or anywhere the font can't be guaranteed to load, outline the wordmark text to paths first (any vector editor's "Convert to Outlines"). `preview.html` sidesteps this by loading Space Grotesk from Google Fonts directly.

## Assets in this folder

| File | Purpose |
|---|---|
| `logo-mark.svg` | Color mark, 64×64 viewBox, accent fill on transparent — primary logo mark for dark surfaces |
| `logo-mark-mono.svg` | Same mark, `fill="currentColor"` — for monochrome/single-color contexts (recolor via CSS `color`) |
| `favicon.svg` | Simplified, bolder-proportioned reduction of the mark, tuned for 16–32px legibility |
| `wordmark.svg` | Horizontal lockup: mark + "FIAP" / "Games" logotype, single line |
| `wordmark-stacked.svg` | Stacked two-line variant ("FIAP" over "GAMES") with the mark above |
| `preview.html` | Visual reference sheet — all assets on light and dark backgrounds, swatches, type specimen |

## Favicon export sizes

`favicon.svg` is the source of truth and is natively supported by all modern browsers (`<link rel="icon" type="image/svg+xml" href="/favicon.svg">`). No raster (`.png`/`.ico`) exports exist yet — this environment has no SVG rasterizer (`rsvg-convert`, ImageMagick, Inkscape all absent). If raster fallbacks are needed for older browsers or app-icon manifests, export the following from `favicon.svg` with any SVG renderer:

- `favicon-16x16.png`, `favicon-32x32.png` — browser tab / bookmark
- `favicon-48x48.png` — Windows taskbar
- `apple-touch-icon.png` (180×180) — iOS home screen

## Usage rules

- **Clear space**: keep a margin around the mark equal to at least the width of the play-notch's depth (the gap between the triangle's apex and the tile's right edge) on all sides.
- **Minimum size**: don't render the mark below 16px (favicon) or the full wordmark below ~120px wide — at smaller sizes the "Games" text stops being legible before the mark does; use the mark alone.
- **Backgrounds**: the color mark and wordmark are designed for dark surfaces (`--bg-deep` / `--surface`). On a light background, use `logo-mark-mono.svg` with `color: var(--bg-deep)` rather than the accent-colored version — the violet accent loses contrast punch on white.
- **Don't**: recolor the mark to anything outside the palette above; stretch it non-uniformly; add a drop shadow or bevel (the brief explicitly avoids "trust badge" / enterprise visual language); rotate the triangle notch to a different edge (it's a fixed compositional choice, not a random flourish).
