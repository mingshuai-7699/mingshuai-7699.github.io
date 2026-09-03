#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePublic = path.join(root, "public");
const sharePublic = path.join(root, "public-share");
const manifestPath = path.join(sourcePublic, "media-manifest.json");

if (!existsSync(manifestPath)) {
  throw new Error(`Missing media manifest: ${manifestPath}`);
}

// Retain content-addressed image files and unchanged video encodes between builds.
mkdirSync(sharePublic, { recursive: true });
cpSync(path.join(sourcePublic, "thumbs"), path.join(sharePublic, "thumbs"), {
  recursive: true,
});

const images = spawnSync(process.env.PYTHON || "python", [
  path.join(root, "scripts", "prepare-share-images.py"),
], { stdio: "inherit" });
if (images.status !== 0) throw new Error("Image preparation failed; use a Python runtime with Pillow.");
const manifest = JSON.parse(readFileSync(path.join(sharePublic, "media-manifest.json"), "utf8"));
const sourceManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const videoTarget = path.join(sharePublic, "media", "videos");
mkdirSync(videoTarget, { recursive: true });
const posterTarget = path.join(sharePublic, "media", "posters");
mkdirSync(posterTarget, { recursive: true });

for (const entry of manifest.entries) {
  if (entry.kind === "image") continue;

  const source = path.join(sourcePublic, entry.url.replace(/^\//, ""));
  const targetRelative = path.posix.join("media", "videos", `${entry.id}.mp4`);
  const target = path.join(sharePublic, ...targetRelative.split("/"));
  if (!existsSync(target) || statSync(source).mtimeMs > statSync(target).mtimeMs) {
    const ffmpeg = spawnSync(
      "ffmpeg",
      [
        "-hide_banner", "-loglevel", "error", "-y", "-i", source,
        "-vf", "scale=1280:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "27",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "96k", target,
      ],
      { stdio: "inherit" },
    );
    if (ffmpeg.status !== 0) throw new Error(`ffmpeg failed for ${source}`);
  }
  const poster = path.join(posterTarget, `${entry.id}.webp`);
  if (!existsSync(poster) || statSync(target).mtimeMs > statSync(poster).mtimeMs) {
    const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y",
      "-ss", "0.2", "-i", target, "-frames:v", "1", "-vf",
      "scale=640:640:force_original_aspect_ratio=decrease", "-quality", "88", poster], { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`Poster failed for ${source}`);
  }
  entry.poster = `/media/posters/${entry.id}.webp`;
  entry.url = `/${targetRelative}`;
  entry.sizeBytes = statSync(target).size;
}

manifest.generatedAt = new Date().toISOString().slice(0, 10);
manifest.shareOptimized = true;
writeFileSync(
  path.join(sharePublic, "media-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

// Dev/offline keep original URLs and gain the same lightweight video posters.
for (const entry of sourceManifest.entries) {
  if (entry.kind === "video") entry.poster = `/media/posters/${entry.id}.webp`;
}
cpSync(posterTarget, path.join(sourcePublic, "media", "posters"), { recursive: true });
writeFileSync(manifestPath, `${JSON.stringify(sourceManifest, null, 2)}\n`, "utf8");

console.log(`Prepared share assets: ${sharePublic}`);
