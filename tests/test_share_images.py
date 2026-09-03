"""Run after prepare-share-public.mjs: python tests/test_share_images.py."""
import hashlib
import json
from pathlib import Path
import sys
import runpy

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
HERO = runpy.run_path(str(ROOT / "scripts/prepare-share-images.py"))["HERO"]
source = ROOT / "public"
target = ROOT / "public-share"
original = json.loads((source / "media-manifest.json").read_text(encoding="utf-8"))
published = json.loads((target / "media-manifest.json").read_text(encoding="utf-8"))
by_id = {entry["id"]: entry for entry in original["entries"]}
assert len(published["entries"]) == len(original["entries"])


def pixels_equal(a, b):
    with Image.open(a) as first, Image.open(b) as second:
        first = ImageOps.exif_transpose(first).convert("RGBA")
        second = ImageOps.exif_transpose(second).convert("RGBA")
        assert first.size == second.size, (a, "dimensions changed")
        # Compare all RGBA channels, including fully transparent RGB pixels.
        assert np.array_equal(np.asarray(first), np.asarray(second)), (a, "pixel change")
        assert first.info.get("icc_profile") == second.info.get("icc_profile"), (a, "ICC profile changed")


for name, filename in HERO.items():
    pixels_equal(source / "media/主页" / filename, target / "media/hero" / f"{name}.webp")
print("PASS: six hero layers preserve every RGBA pixel, dimensions and ICC profiles", flush=True)

checked = set()
for entry in published["entries"]:
    local = target / entry["url"].lstrip("/")
    assert local.exists() and local.stat().st_size == entry["sizeBytes"], entry["id"]
    if entry["kind"] == "video":
        assert (target / entry["poster"].lstrip("/")).stat().st_size > 0
        continue
    assert entry["url"] != entry["thumbnail"], "Lightbox must not use a thumbnail"
    for key, width_key in (("thumbnail", "thumbnailWidth"), ("thumbnailSmall", "thumbnailSmallWidth")):
        with Image.open(target / entry[key].lstrip("/")) as preview:
            assert preview.width == entry[width_key]
    with Image.open(local) as full:
        full = ImageOps.exif_transpose(full)
        assert full.size == (entry["width"], entry["height"])
    if entry["url"] in checked:
        continue
    checked.add(entry["url"])
    before = source / by_id[entry["id"]]["url"].lstrip("/")
    if before.suffix.lower() == ".jpg":
        assert hashlib.sha256(before.read_bytes()).digest() == hashlib.sha256(local.read_bytes()).digest()
    else:
        pixels_equal(before, local)
print(f"PASS: {len(checked)} unique original-size images are lossless; all previews/posters resolve", flush=True)
files = [p for p in target.rglob("*") if p.is_file()]
total = sum(p.stat().st_size for p in files)
assert max(p.stat().st_size for p in files) < 95 * 1024**2
assert total < 900 * 1024**2, "Keep the publish package under the deployment safety budget"
print(f"Published assets: {total / 1024**2:.1f} MiB; full images load only on demand")
