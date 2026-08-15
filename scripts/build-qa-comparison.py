from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


PROJECT = Path(r"E:\Codex文件夹\网页设计\网页设计8月版_面试作品集")
TEMP = Path(r"C:\Users\Administrator\AppData\Local\Temp")
PAIRS = [
    (
        "01 HERO REFERENCE",
        TEMP / "codex-clipboard-b4b5f919-8956-42c6-9f5f-9da0a4e41a6f.png",
        "01 HERO IMPLEMENTATION",
        PROJECT / "qa" / "implementation-hero-new.png",
    ),
    (
        "02 MARQUEE REFERENCE",
        TEMP / "codex-clipboard-70f13503-23a0-4704-ab56-63f006a7f3b7.png",
        "02 MARQUEE IMPLEMENTATION",
        PROJECT / "qa" / "implementation-marquee-final.png",
    ),
    (
        "03 ABOUT REFERENCE",
        TEMP / "codex-clipboard-99ae9ade-44d5-451e-861d-fddee546ad48.png",
        "03 ABOUT IMPLEMENTATION",
        PROJECT / "qa" / "implementation-about-new.png",
    ),
    (
        "04 PROJECTS REFERENCE",
        TEMP / "codex-clipboard-2c254eb4-042a-4b39-bce8-fa0eee9fdae9.png",
        "04 PROJECTS IMPLEMENTATION",
        PROJECT / "qa" / "implementation-projects-final.png",
    ),
    (
        "05 ARCHIVE REFERENCE",
        TEMP / "codex-clipboard-19b909c0-64b7-417e-a0c0-cb130c2a5673.png",
        "05 ARCHIVE IMPLEMENTATION",
        PROJECT / "qa" / "implementation-archive-new.png",
    ),
]

CELL = (760, 428)
MARGIN = 24
LABEL_HEIGHT = 30
ROW_HEIGHT = CELL[1] + LABEL_HEIGHT + MARGIN
board = Image.new("RGB", (CELL[0] * 2 + MARGIN * 3, ROW_HEIGHT * len(PAIRS) + MARGIN), "#101010")
draw = ImageDraw.Draw(board)

for row, (left_label, left_path, right_label, right_path) in enumerate(PAIRS):
    y = MARGIN + row * ROW_HEIGHT
    for column, (label, path) in enumerate(((left_label, left_path), (right_label, right_path))):
        x = MARGIN + column * (CELL[0] + MARGIN)
        draw.text((x, y), label, fill="#f4f2ed")
        with Image.open(path) as source:
            image = ImageOps.fit(source.convert("RGB"), CELL, method=Image.Resampling.LANCZOS)
        board.paste(image, (x, y + LABEL_HEIGHT))

output = PROJECT / "qa" / "reference-implementation-comparison.png"
board.save(output, "PNG", optimize=True)
print(output)
