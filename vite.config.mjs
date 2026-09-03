import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  publicDir: mode === "share" ? "public-share" : "public",
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), {
    name: "preload-share-hero",
    transformIndexHtml() {
      if (mode !== "share") return [];
      return ["base", "person"].map((name) => ({
        tag: "link",
        attrs: { rel: "preload", as: "image", type: "image/webp", href: `/media/hero/${name}.webp`, fetchpriority: "high" },
        injectTo: "head",
      }));
    },
  }],
}));
