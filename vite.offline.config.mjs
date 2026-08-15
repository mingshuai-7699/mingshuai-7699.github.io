import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  publicDir: false,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  plugins: [react()],
  build: {
    outDir: "offline",
    emptyOutDir: true,
    assetsDir: "assets",
    cssCodeSplit: false,
    lib: {
      entry: resolve("src/main.jsx"),
      name: "PortfolioOffline",
      formats: ["iife"],
      fileName: () => "app.js",
      cssFileName: "app",
    },
  },
});
