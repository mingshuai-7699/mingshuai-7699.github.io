# Design QA — 2026-08-15

## Source targets

- Broken archive state: `C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-4d0a578b-93f0-468b-8683-764185a612a3.png`
- Ecommerce card layout before curated replacement: `C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-700de456-d062-4797-9b7a-ac11f5a047c9.png`
- Contact heading clipping: `C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-3b703fc0-ec97-4331-96fa-8a8286af6a76.png`
- Curated ecommerce source folder: `E:\Codex文件夹\网页设计\作品集画廊\作品集画廊\电商设计\展示`

## Implementation evidence

- Local preview: `http://127.0.0.1:4173/`
- Stable archive capture: `qa/implementation-archive-stable-v2.png`
- Curated ecommerce card capture: `qa/implementation-ecommerce-curated-v2.png`
- Unclipped contact heading capture: `qa/implementation-contact-title-v2.png`
- Desktop browser QA viewport: 1600 × 900 CSS pixels.

## Visual findings

- The archive no longer enters an empty state. Masonry cards remain visible after scrolling up/down and after every category change.
- The ecommerce project card keeps the existing lavender card system and now uses all five curated images from the requested `展示` folder in a one-large-plus-four layout.
- Both contact-title lines retain the intended tight display rhythm while exposing the full top of every Chinese glyph.
- No remaining P0, P1, or P2 fidelity findings in the three requested regions.

## Functional QA

- Filter regression after down/up scrolling: personal 28/28 visible; ecommerce 28/28; motion 10/10; AI/IP 6/6; all 28/28.
- The Masonry component now renders visible by default, does not wait for every image to preload, and cannot be left at opacity zero by interrupted GSAP cleanup.
- Masonry measurement observes width only, avoiding feedback loops from its animated/content-driven height.
- Project videos no longer autoplay during page scrolling; they play on pointer hover and pause on pointer leave.
- Scroll entrances no longer rely on expensive blur filters; reveal duration and stagger are shortened.
- Browser console: no application warnings or errors after stable reload and filter regression.
- Media manifest: 279 entries (269 images, 10 videos), generated 2026-08-15.
- Production/offline builds: passed.
- Sites worker tests: 4 passed, 0 failed.
- Root `index.html` still supports local double-click loading through the generated `offline` bundle.

final result: passed

## Ecommerce archive ordering — 2026-08-15

- Source folder: `E:\Codex文件夹\网页设计\作品集画廊\作品集画廊\电商设计\1.跨境`.
- The media synchronizer normalizes numbered source folders (`1.跨境`, `2.国内`) to stable market labels while retaining their real source URLs.
- The `电商设计` archive filter places all 71 cross-border works first, followed by 60 domestic and 5 curated-display works.
- Initial Masonry batch: 28/28 cross-border works.
- First non-cross-border item appears at zero-based index 71, after the complete cross-border set.
- Load-more regression: 28 → 56 → 84 items; no browser errors.
- Production/offline builds passed; Sites worker tests: 4 passed, 0 failed.

final result: passed
