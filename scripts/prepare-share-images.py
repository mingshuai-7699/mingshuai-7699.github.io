"""Publish derived images only: lossless hero/full-size files and small previews.

Requires Pillow. Originals under public/media are never modified (some are hardlinks).
"""
import hashlib
import io
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import shutil
import sys

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public"
TARGET = ROOT / "public-share"
HERO = {
    "base": "首页文字图层_其余全部文字与图标.png",
    "title": "首页标题图层_透明.png",
    "person": "首页人物_无橙光面罩_透明.png",
    "person-lit": "首页人物_发光橙光面罩_透明.png",
    "lines": "首页文字图层_连接线_透明.png",
    "cards": "首页文字图层_三项白色服务卡片与连接线_透明.png",
}


def lossless_webp(image):
    buffer = io.BytesIO()
    image.save(buffer, "WEBP", lossless=True, method=4, exact=True,
               icc_profile=image.info.get("icc_profile", b""))
    return buffer.getvalue()


def prepare_image(group):
    digest, entries = group
    entry = entries[0]
    source = SOURCE / entry["url"].lstrip("/")
    # Content-addressed files reuse duplicate artwork and invalidate browser caches.
    original = TARGET / "media/full" / f"{digest}{source.suffix.lower()}"
    webp = original.with_suffix(".webp")
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGBA")
        entry["width"], entry["height"] = image.size
        entry["aspect"] = round(image.width / image.height, 4)
        if source.suffix.lower() == ".png":
            if not webp.exists() and not original.exists():
                encoded = lossless_webp(image)
                if len(encoded) < source.stat().st_size:
                    webp.write_bytes(encoded)
                else:
                    shutil.copyfile(source, original)
            full = webp if webp.exists() else original
        else:
            # JPEGs are already compressed: copy byte-for-byte, never recompress.
            if not original.exists():
                shutil.copyfile(source, original)
            full = original

        small = TARGET / "thumbs" / f"{digest}-640.webp"
        image.thumbnail((640, 640), Image.Resampling.LANCZOS)
        if not small.exists():
            image.save(small, "WEBP", quality=90, method=4,
                       icc_profile=image.info.get("icc_profile", b""))
        entry["thumbnailSmall"] = "/" + small.relative_to(TARGET).as_posix()
        entry["thumbnailSmallWidth"] = image.width
    with Image.open(SOURCE / entry["thumbnail"].lstrip("/")) as thumb:
        entry["thumbnailWidth"] = thumb.width
    entry["url"] = "/" + full.relative_to(TARGET).as_posix()
    entry["sizeBytes"] = full.stat().st_size
    entry["losslessOriginal"] = True
    for duplicate in entries[1:]:
        for key in ("width", "height", "aspect", "thumbnailSmall", "thumbnailSmallWidth",
                    "thumbnailWidth", "url", "sizeBytes", "losslessOriginal"):
            duplicate[key] = entry[key]
    return len(entries)


def main():
    for directory in ("media/hero", "media/full", "thumbs"):
        (TARGET / directory).mkdir(parents=True, exist_ok=True)
    before = after = 0
    for name, filename in HERO.items():
        source = SOURCE / "media/主页" / filename
        with Image.open(source) as image:
            encoded = lossless_webp(image.convert("RGBA"))
        (TARGET / "media/hero" / f"{name}.webp").write_bytes(encoded)
        before += source.stat().st_size
        after += len(encoded)
    print(f"Hero lossless: {before:,} -> {after:,} bytes", flush=True)

    manifest = json.loads((SOURCE / "media-manifest.json").read_text(encoding="utf-8"))
    images = [entry for entry in manifest["entries"] if entry["kind"] == "image"]
    groups = {}
    for entry in images:
        source = SOURCE / entry["url"].lstrip("/")
        digest = hashlib.sha256(source.read_bytes()).hexdigest()[:20]
        groups.setdefault(digest, []).append(entry)
    # Four bounded workers, not one process per image; no source file writes.
    with ThreadPoolExecutor(max_workers=4) as pool:
        index = 0
        for count in pool.map(prepare_image, groups.items()):
            index += count
            if index % 10 < count or index == len(images):
                print(f"Prepared full-size images: {index}/{len(images)}", flush=True)
    (TARGET / "media-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
