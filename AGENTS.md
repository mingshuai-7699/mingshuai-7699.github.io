# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Portfolio Direction

- Match the supplied 2025 dark editorial portfolio hero, updated to 2026.
- Use only the owner's real portfolio media from `E:\Codex文件夹\网页设计\作品集画廊`.
- Keep the complete library available in the site: 220 images and 10 videos at the time of setup.
- Preserve a dark cinematic art direction with compact technical typography, oversized year numerals, thin rules, and restrained orange accents.
- Motion should stay purposeful and lightweight: reveal, magnetic hover, tilt, marquee, and reduced-motion fallbacks.
- Keep the root `index.html` directly openable through `file://` in external browsers. After source or media-manifest changes, run `pnpm run build:offline` so the offline bundle stays synchronized.
- Archive media must remain visible after upward/downward scrolling and after every category or search change; motion may never gate default content visibility.
- The ecommerce featured card should prioritize the curated assets from `作品集画廊/作品集画廊/电商设计/展示`.
- In the archive's `电商设计` filter, show every work from `作品集画廊/作品集画廊/电商设计/1.跨境` before domestic, curated-display, or other ecommerce work.
- Contact display lines must preserve full glyph ascenders/descenders during and after entrance motion.
- Prefer lightweight transform/opacity motion, avoid filter-heavy per-item animation and repeated full-page ScrollTrigger refreshes while scrolling.
