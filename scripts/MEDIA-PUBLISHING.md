# Portfolio image publishing

`pnpm run build:share` prepares `public-share` and builds the public site. Set
`PYTHON` to a Python executable with Pillow if the default Python lacks it.
FFmpeg is needed for video encodes and cover frames. GitHub Pages builds the
committed `public-share` output; commit regenerated media together with code.

- `public/media` is read-only artwork input (it can contain source hardlinks).
- Six hero WebPs are lossless, at the existing 3344 × 1882 size, including alpha.
- Gallery PNGs become lossless, original-size WebPs when smaller; JPEGs and PNGs
  that do not benefit are copied without recompression. Content hashes deduplicate
  identical artwork. Full files are requested only by the lightbox or its link.
- Existing 1280 previews remain available; 640 previews are quality 90 WebP.
  Browser `srcset` selects according to display size and screen pixel density.
- Videos keep their existing public encoding; posters allow `preload="none"`.
- The normal dev/offline mode retains original media paths; use
  `pnpm exec vite --mode share` to preview optimized public assets locally.

Before publishing, run `pnpm run build:offline`, `pnpm run build:share`,
`pnpm run test:media`, `pnpm run test:sites`, and
`python tests/test_share_images.py` (Pillow and NumPy required for pixel checks).
The image check compares every hero RGBA pixel, full-image pixels/ICC profiles,
byte-identical JPEGs, sizes, manifests, and poster/preview paths. Originals are
never overwritten. Cached derived assets are not globally deleted during rebuilds.
