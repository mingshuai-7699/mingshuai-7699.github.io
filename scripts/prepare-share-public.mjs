#!/usr/bin/env node
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
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

const heroFiles = [
  "首页文字图层_其余全部文字与图标.png",
  "首页标题图层_透明.png",
  "首页人物_无橙光面罩_透明.png",
  "首页人物_发光橙光面罩_透明.png",
  "首页文字图层_连接线_透明.png",
  "首页文字图层_三项白色服务卡片与连接线_透明.png",
];

if (!existsSync(manifestPath)) {
  throw new Error(`Missing media manifest: ${manifestPath}`);
}

rmSync(sharePublic, { recursive: true, force: true });
mkdirSync(sharePublic, { recursive: true });
cpSync(path.join(sourcePublic, "thumbs"), path.join(sharePublic, "thumbs"), {
  recursive: true,
});

const heroSource = path.join(sourcePublic, "media", "主页");
const heroTarget = path.join(sharePublic, "media", "主页");
mkdirSync(heroTarget, { recursive: true });
for (const fileName of heroFiles) {
  const source = path.join(heroSource, fileName);
  if (!existsSync(source)) throw new Error(`Missing hero asset: ${source}`);
  copyFileSync(source, path.join(heroTarget, fileName));
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const videoTarget = path.join(sharePublic, "media", "videos");
mkdirSync(videoTarget, { recursive: true });

for (const entry of manifest.entries) {
  if (entry.kind === "image") {
    entry.url = entry.thumbnail;
    entry.sizeBytes = statSync(
      path.join(sharePublic, entry.thumbnail.replace(/^\//, "")),
    ).size;
    continue;
  }

  const source = path.join(sourcePublic, entry.url.replace(/^\//, ""));
  const targetRelative = path.posix.join("media", "videos", `${entry.id}.mp4`);
  const target = path.join(sharePublic, ...targetRelative.split("/"));
  const ffmpeg = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      source,
      "-vf",
      "scale=1280:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "27",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      target,
    ],
    { stdio: "inherit" },
  );
  if (ffmpeg.status !== 0) {
    throw new Error(`ffmpeg failed for ${source}`);
  }
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

console.log(`Prepared share assets: ${sharePublic}`);
