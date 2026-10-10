#!/usr/bin/env python3
"""Render the original menu files (PDFs and photos) as web-sized JPEG pages for the "View original menu" gallery.

Usage: python3 scripts/prepare-menu-files.py <out_dir> <slug> <received YYYY-MM-DD> <file> [<file> ...]
Needs: pip install pymupdf pillow

Writes <out_dir>/<slug>/01.jpg, 02.jpg, … plus files.json ({"received", "files": [{"path", "type"}]}),
which scripts/upload-menu-files.mjs uploads. The date is when the restaurant sent the menu (use the
WhatsApp filename date when there is one); never the date we checked or extracted it.
"""
import io
import json
import os
import sys

import fitz  # PyMuPDF
from PIL import Image, ImageOps

MAX_SIDE = 1800  # long edge in px: sharp enough to read prices on a phone, small enough to load fast
QUALITY = 78


def save(img, path):
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    img.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)


def main(out_dir, slug, received, files):
    dest = os.path.join(out_dir, slug)
    os.makedirs(dest, exist_ok=True)
    n = 0
    for f in files:
        if f.lower().endswith(".pdf"):
            doc = fitz.open(f)
            for page in doc:
                zoom = MAX_SIDE / max(page.rect.width, page.rect.height)
                pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
                n += 1
                save(Image.open(io.BytesIO(pix.tobytes("png"))), os.path.join(dest, f"{n:02d}.jpg"))
        else:
            n += 1
            save(Image.open(f), os.path.join(dest, f"{n:02d}.jpg"))
    manifest = {"received": received, "files": [{"path": f"{slug}/{i:02d}.jpg", "type": "image"} for i in range(1, n + 1)]}
    json.dump(manifest, open(os.path.join(dest, "files.json"), "w"))
    size = sum(os.path.getsize(os.path.join(dest, f"{i:02d}.jpg")) for i in range(1, n + 1)) // 1024
    print(f"{slug}: {n} pages, {size} KB, received {received}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:])
