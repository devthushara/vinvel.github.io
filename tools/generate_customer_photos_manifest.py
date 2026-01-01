#!/usr/bin/env python3

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHOTOS_DIR = ROOT / "img" / "customer_photos"
MANIFEST_PATH = PHOTOS_DIR / "manifest.json"
ALLOWED = {".jpg", ".jpeg", ".png", ".webp", ".svg"}


def sort_key(name: str):
    m = re.search(r"vinvel_cus_(\d+)", name)
    if m:
        return (0, int(m.group(1)))
    return (1, name.lower())


def main() -> int:
    if not PHOTOS_DIR.exists() or not PHOTOS_DIR.is_dir():
        raise SystemExit(f"Missing folder: {PHOTOS_DIR}")

    files = [
        p.name
        for p in PHOTOS_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in ALLOWED and not p.name.startswith(".")
    ]
    files = sorted(files, key=sort_key)

    manifest = {
        "basePath": "img/customer_photos/",
        "files": files,
    }

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {MANIFEST_PATH.relative_to(ROOT)} with {len(files)} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
