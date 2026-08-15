from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
from datetime import date
from pathlib import Path

from PIL import Image, ImageOps


SOURCE = Path(r"E:\Codex文件夹\网页设计\作品集画廊")
PROJECT = Path(r"E:\Codex文件夹\网页设计\网页设计8月版_面试作品集")
PUBLIC = PROJECT / "public"
MEDIA_DIR = PUBLIC / "media"
THUMB_DIR = PUBLIC / "thumbs"

ROOTS = [
    "主页",
    "主页轮换大图",
    "副业轮换大图",
    "icon",
    "作品集画廊",
    "视频设计",
    "Ai与IP设计",
    "背景",
]
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"}
VIDEO_EXTS = {".mp4", ".webm", ".mov"}


def hardlink_or_copy(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size == source.stat().st_size:
        return
    if target.exists():
        target.unlink()
    try:
        os.link(source, target)
    except OSError:
        shutil.copy2(source, target)


def classify(relative: Path) -> tuple[str, str, str, str | None]:
    parts = relative.parts
    if parts[0] == "作品集画廊":
        branch = parts[1] if len(parts) > 1 else "作品集"
        if branch == "练习":
            return "个人渲染作品", "键盘产品视觉渲染", "个人练习 / 键盘产品", None
        if branch == "电商设计":
            raw_market = parts[2] if len(parts) > 2 else "电商"
            market = re.sub(r"^\d+[.、_-]?\s*", "", raw_market) or raw_market
            project = parts[3] if len(parts) > 3 else market
            return "电商设计", project, f"{market} / {project}", market
        return branch, branch, branch, None
    labels = {
        "主页": "主页素材",
        "主页轮换大图": "精选主视觉",
        "副业轮换大图": "副业轮换",
        "icon": "图标素材",
        "视频设计": "视频动效",
        "Ai与IP设计": "Ai与IP设计",
        "背景": "视觉背景",
    }
    label = labels.get(parts[0], parts[0])
    return label, label, label, None


def make_thumbnail(source: Path, relative: Path) -> tuple[str | None, int | None, int | None]:
    digest = hashlib.sha1(relative.as_posix().encode("utf-8")).hexdigest()[:14]
    target = THUMB_DIR / f"{digest}.webp"
    try:
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image)
            width, height = image.size
            if not target.exists() or target.stat().st_mtime < source.stat().st_mtime:
                thumb = image.convert("RGB")
                thumb.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
                target.parent.mkdir(parents=True, exist_ok=True)
                thumb.save(target, "WEBP", quality=82, method=6)
            return f"/thumbs/{target.name}", width, height
    except Exception as exc:
        print(f"thumbnail skipped: {source} ({exc})")
        return None, None, None


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    entries: list[dict] = []
    expected_media: set[Path] = set()
    expected_thumbnails: set[Path] = set()

    for root_name in ROOTS:
        root = SOURCE / root_name
        if not root.exists():
            continue
        for source in sorted(root.rglob("*")):
            if not source.is_file():
                continue
            ext = source.suffix.lower()
            if ext not in IMAGE_EXTS | VIDEO_EXTS:
                continue

            relative = source.relative_to(SOURCE)
            media_target = MEDIA_DIR / relative
            hardlink_or_copy(source, media_target)
            expected_media.add(media_target.resolve())

            category, project_name, group, market = classify(relative)
            kind = "video" if ext in VIDEO_EXTS else "image"
            thumb, width, height = (None, None, None)
            if kind == "image":
                thumb, width, height = make_thumbnail(source, relative)
                if thumb:
                    expected_thumbnails.add((PUBLIC / thumb.lstrip("/")).resolve())

            entries.append(
                {
                    "id": hashlib.sha1(relative.as_posix().encode("utf-8")).hexdigest()[:12],
                    "kind": kind,
                    "name": source.stem,
                    "fileName": source.name,
                    "url": "/media/" + "/".join(relative.parts),
                    "thumbnail": thumb,
                    "category": category,
                    "project": project_name,
                    "group": group,
                    "market": market,
                    "width": width,
                    "height": height,
                    "aspect": round(width / height, 4) if width and height else None,
                    "sizeBytes": source.stat().st_size,
                }
            )

    # public/media and public/thumbs are generated mirrors. Prune files that no
    # longer exist in the source library so Vite never packages stale copies.
    for generated_root, expected in ((MEDIA_DIR, expected_media), (THUMB_DIR, expected_thumbnails)):
        if not generated_root.exists():
            continue
        for generated in sorted(generated_root.rglob("*"), reverse=True):
            if generated.is_file() and generated.resolve() not in expected:
                generated.unlink()
            elif generated.is_dir() and not any(generated.iterdir()):
                generated.rmdir()

    manifest = {
        "generatedAt": date.today().isoformat(),
        "source": str(SOURCE),
        "count": len(entries),
        "imageCount": sum(item["kind"] == "image" for item in entries),
        "videoCount": sum(item["kind"] == "video" for item in entries),
        "entries": entries,
    }
    (PUBLIC / "media-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({k: manifest[k] for k in ("count", "imageCount", "videoCount")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
