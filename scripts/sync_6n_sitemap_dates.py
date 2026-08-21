#!/usr/bin/env python3
"""Apply the approved staggered 6N modification dates to sitemap.xml."""

from __future__ import annotations

import xml.etree.ElementTree as ET
import re
from pathlib import Path

try:
    from .validate_6n_cluster import BASE_URL, MODIFIED_DATES, ROOT
except ImportError:  # Direct execution: ``py scripts\\sync_6n_sitemap_dates.py``.
    from validate_6n_cluster import BASE_URL, MODIFIED_DATES, ROOT


SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"


def update_sitemap_text(raw: str) -> tuple[str, int]:
    ET.fromstring(raw)  # Fail before mutation if the sitemap is not well-formed.
    result = raw
    updated = 0
    for filename, modified_date in MODIFIED_DATES.items():
        canonical = f"{BASE_URL}/futures-basics/{filename}"
        pattern = re.compile(
            rf"(<(?:[A-Za-z_][\w.-]*:)?loc>{re.escape(canonical)}"
            rf"</(?:[A-Za-z_][\w.-]*:)?loc>\s*"
            rf"<(?:[A-Za-z_][\w.-]*:)?lastmod>)([^<]*)(</(?:[A-Za-z_][\w.-]*:)?lastmod>)"
        )
        matches = list(pattern.finditer(result))
        if len(matches) != 1:
            raise ValueError(f"sitemap is missing {canonical}")
        expected = f"{modified_date}T12:00:00Z"
        if matches[0].group(2) != expected:
            result = pattern.sub(rf"\g<1>{expected}\g<3>", result, count=1)
            updated += 1
    return result, updated


def update_sitemap(path: Path) -> int:
    raw = path.read_text(encoding="utf-8", errors="strict")
    result, updated = update_sitemap_text(raw)
    path.write_text(result, encoding="utf-8", newline="")
    return updated


def main() -> int:
    path = ROOT / "sitemap.xml"
    updated = update_sitemap(path)
    print(f"Synchronized {len(MODIFIED_DATES)} core 6N sitemap dates ({updated} changed).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
