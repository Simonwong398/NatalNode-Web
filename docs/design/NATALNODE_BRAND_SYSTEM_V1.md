# NatalNode Brand System V1

- Status: IMPLEMENTED — user visual approval required before commit
- Scope: Core Mark, website lockup, favicon, and Learn Brand Instrument
- Product source of truth: `docs/PRD.md`
- Brand direction: modern observatory astrology

## 1. Philosophy

NatalNode should feel precise, measured, instrumental, astronomical, and
quietly premium. The identity supports the product boundary rather than
substituting for it: NatalNode.com presents facts and interpretation through
the Website API / BFF, while astronomy and provider decisions remain behind the
NatalNode Engine Public API.

The identity has two layers:

1. The **Core Mark** is the registered, small-scale identity. It must remain
   recognizable without glow, gradients, motion, or supporting artwork.
2. The **Expanded Brand Instrument** is large-scale editorial brand art derived
   from the Core Mark. It is not a chart, zodiac wheel, solar system, or
   scientific data visualization.

## 2. Core Mark meaning and geometry

The mark combines an interrupted observatory ring with a vertical reference
axis and an abstract N signal. Its geometry is intentionally registration-grade:

- one circular ring with controlled interruptions at the top and bottom axis;
- one central vertical reference axis;
- one circular node at each axial end;
- left and right vertical structural strokes;
- one diagonal signal path from upper-left to lower-right;
- the three N strokes remain legible at compact sizes.

The diagonal is the only cyan stroke in the two-color version. There are no
stars, zodiac glyphs, planets, Sun/Moon/Saturn symbols, ticks, microtext, or
decorative orbiting bodies inside the Core Mark.

## 3. Approved palette

These colors belong to the identity layer only. They do not replace the
website's existing semantic page-surface palette.

| Token | HEX | RGB | Approximate CMYK* |
| --- | --- | --- | --- |
| Brand Midnight | `#0F1722` | `15, 23, 34` | `56, 32, 0, 87` |
| Signal Cyan | `#22C7D6` | `34, 199, 214` | `84, 7, 0, 16` |
| Signal Silver | `#E6E8EB` | `230, 232, 235` | `2, 1, 0, 8` |
| White | `#FFFFFF` | `255, 255, 255` | `0, 0, 0, 0` |
| Black | `#000000` | `0, 0, 0` | `0, 0, 0, 100` |

\* CMYK values are approximate print references calculated from the RGB
values, not press-proof color-management guarantees. Commercial print work
must use the printer's profile-specific conversion and proofing process.

## 4. Typography and lockups

The wordmark is the single word `NATALNODE`, set in the existing system-first
geometric sans-serif stack with medium/semibold weight and restrained tracking.
No font dependency or font binary is added for the logo.

The horizontal lockup contains only the Core Mark and `NATALNODE`. Product
messaging such as “Precise about the sky. Honest about the interpretation.”
belongs in page content, never inside the mark or production lockup.

## 5. Clear space and minimum sizes

Use clear space of at least one quarter of the Core Mark diameter on every side
when the mark is placed beside unrelated content. Do not let text, controls, or
decorative lines enter the interrupted ring or N signal.

The preferred website mark is 26–30 CSS px in the desktop header and 24–28 CSS
px on mobile. The Core Mark is designed to remain recognizable at 16, 24, 32,
48, 64, 128, and 512 px. At the smallest sizes, preserve the ring, axial
nodes, central axis, and N signal; do not add detail to compensate.

## 6. Color versions

- Use navy plus cyan on light or neutral surfaces.
- Use white plus cyan on dark surfaces.
- Use solid black or solid white for print, engraving, embossing, and
  single-color reproduction.
- The mark must never depend on a gradient, glow, transparency, or animation.

The production SVG sources are in `apps/web/public/brand/`. The inline
`BrandMark.astro` component keeps the same geometry for the live header, footer,
and expanded instrument.

## 7. Favicon and application identity

`apps/web/public/favicon.svg` is the installed first-party favicon and uses the
Core Mark on a transparent background. No PWA manifest or raster icon pipeline
exists in the current website architecture, so manifest and Apple Touch PNG
variants remain intentionally deferred rather than introducing a new build
dependency or application architecture.

## 8. Expanded Brand Instrument

The former Learn-only expanded brand instrument was removed by
`NN-WEB-FREE-BASELINE-CLEANUP-001`. The Core Mark, lockups, favicon, and active
Learn presentation components remain. This section records the retired
instrument's design direction for historical reference; it is not a current
component specification.

## 9. Reduced motion

`@media (prefers-reduced-motion: reduce)` disables both orbital animations and
the central signal breathing. The static instrument remains complete and
recognizable; no meaning depends on motion.

## 10. Prohibited usage

Do not add Sun, Moon, Saturn, zodiac, constellation, star, literal planet,
nebula, rainbow gradient, purple identity color, HUD telemetry, microtext,
decorative ticks, aggressive glow, or a slogan to the Core Mark or lockup.
Do not stretch, skew, redraw, split `NATALNODE` into separate brands, or make
the identity dependent on animation. The retired complex mark shown in earlier
reference material is not part of this production system.

## 11. Website placement

- Header: one accessible home-link lockup named `NatalNode`.
- Footer: restrained compact lockup, not a brand billboard.
- Learn: Expanded Brand Instrument, route-scoped to the editorial hero.
- Favicon: Core Mark at `/favicon.svg`.
- Other pages: continue using the frozen shared visual system without global
  brand-art propagation.

## 12. Future print/export notes

The SVG masters are the source for future print or export work. Create any
commercial raster or press-ready output from the approved vector geometry with
the target printer/profile, safe area, and reproduction size in mind. Do not
commit generated Photoshop/Illustrator binaries or font files to the website
repository.
