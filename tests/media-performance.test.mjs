import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { previewSrcSet } from "../src/media.mjs";

test("responsive previews preserve original URL and deduplicate small images", () => {
  const entry = { url: "/full.png", thumbnail: "/large.webp", thumbnailWidth: 1280,
    thumbnailSmall: "/small.webp", thumbnailSmallWidth: 640 };
  assert.equal(previewSrcSet(entry), "/small.webp 640w, /large.webp 1280w");
  assert.equal(entry.url, "/full.png");
  assert.equal(previewSrcSet({ ...entry, thumbnailWidth: 640 }), "/large.webp 640w");
  assert.equal(previewSrcSet({ url: "/offline.png" }), undefined);
  assert.equal(previewSrcSet(entry, (url) => `./public${url}`), "./public/small.webp 640w, ./public/large.webp 1280w");
});

test("share build preloads only the base and unlit hero, not the full gallery", () => {
  const html = readFileSync(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const preloads = html.match(/<link[^>]+rel="preload"[^>]*>/g) || [];
  assert.equal(preloads.length, 2);
  assert.ok(preloads.some((tag) => tag.includes("/media/hero/base.webp")));
  assert.ok(preloads.some((tag) => tag.includes("/media/hero/person.webp")));
  assert.ok(preloads.every((tag) => tag.includes('fetchpriority="high"')));
});

test("hero is rendered before the media manifest and previews do not preload video bytes", async () => {
  const { createServer } = await import("vite");
  const server = await createServer({ mode: "share", server: { middlewareMode: true },
    ssr: { noExternal: ["gsap", "@phosphor-icons/react"] } });
  try {
    const { App } = await server.ssrLoadModule("/src/App.jsx");
    const React = await import("react");
    const { renderToString } = await import("react-dom/server");
    const previousWindow = globalThis.window;
    globalThis.window = { location: { protocol: "http:" } };
    try {
      const html = renderToString(React.createElement(App));
      assert.ok(html.includes('id="top"'));
      assert.ok(html.includes("/media/hero/person.webp"));
      assert.ok(!html.includes("/media/hero/person-lit.webp"));
      assert.ok(html.indexOf('id="top"') < html.indexOf("LOADING PORTFOLIO"));
    } finally { globalThis.window = previousWindow; }
  } finally { await server.close(); }
  const masonry = readFileSync(new URL("../src/components/Masonry.jsx", import.meta.url), "utf8");
  assert.ok(masonry.includes('preload="none"'));
  assert.ok(masonry.includes("poster={item.poster}"));
});
