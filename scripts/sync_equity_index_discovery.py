#!/usr/bin/env python3
"""Synchronize rebuilt equity-index metadata across site discovery surfaces."""

from __future__ import annotations

import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

try:
    from .equity_index_cluster_config import (
        ARTICLE_DIR,
        BASE_URL,
        CLUSTER,
        MODIFIED_DATES,
        ROOT,
    )
except ImportError:
    from equity_index_cluster_config import (
        ARTICLE_DIR,
        BASE_URL,
        CLUSTER,
        MODIFIED_DATES,
        ROOT,
    )


TITLE_RE = re.compile(r"<title>(.*?)</title>", re.I | re.S)
DESC_RE = re.compile(
    r'<meta\s+name=["\']description["\']\s+content=(?P<quote>["\'])(?P<value>.*?)(?P=quote)',
    re.I | re.S,
)
CARD_RE = re.compile(
    r'(?P<indent>^[ \t]*)<article class="fbh-guide-card"[^>]*>.*?</article>',
    re.I | re.S | re.M,
)
HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.I)


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def extract_metadata(raw: str, label: str = "article") -> tuple[str, str]:
    title_match = TITLE_RE.search(raw)
    desc_match = DESC_RE.search(raw)
    if not title_match or not desc_match:
        raise ValueError(f"{label} is missing title or meta description")
    return clean(title_match.group(1)), clean(desc_match.group("value"))


def read_metadata(filename: str) -> tuple[str, str]:
    return extract_metadata(
        (ARTICLE_DIR / filename).read_text(encoding="utf-8", errors="strict"),
        filename,
    )


def filename_from_card(card: str) -> str:
    match = HREF_RE.search(card)
    return match.group(1).split("?", 1)[0].rsplit("/", 1)[-1] if match else ""


def futures_card(filename: str, title: str, description: str, indent: str) -> str:
    href = f"/futures-basics/{filename}"
    search = f"{title} {description} {href}"
    return (
        f'{indent}<article class="fbh-guide-card" data-category="indexes" '
        f'data-search="{html.escape(search, quote=True)}">\n'
        f"{indent}  <span>Equity indexes</span>\n"
        f'{indent}  <h3><a href="{href}">{html.escape(title)}</a></h3>\n'
        f"{indent}  <p>{html.escape(description)}</p>\n"
        f"{indent}</article>"
    )


def sync_futures_hub(metadata: dict[str, tuple[str, str]]) -> int:
    path = ROOT / "futures-basics" / "index.html"
    raw = path.read_text(encoding="utf-8", errors="strict")
    seen: set[str] = set()
    changed = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal changed
        card = match.group(0)
        filename = filename_from_card(card)
        if filename not in CLUSTER:
            return card
        if filename in seen:
            raise ValueError(f"duplicate Futures hub card for {filename}")
        seen.add(filename)
        replacement = futures_card(filename, *metadata[filename], indent=match.group("indent"))
        if replacement != card:
            changed += 1
        return replacement

    updated = CARD_RE.sub(replace, raw)
    missing = set(CLUSTER) - seen
    if missing:
        raise ValueError(f"Futures hub is missing equity-index cards: {sorted(missing)}")
    path.write_text(updated, encoding="utf-8", newline="")
    return changed


def sync_search_index(metadata: dict[str, tuple[str, str]]) -> int:
    path = ROOT / "search-index.json"
    records = json.loads(path.read_text(encoding="utf-8", errors="strict"))
    if not isinstance(records, list):
        raise ValueError("search-index.json must contain an array")
    changed = 0
    for filename in CLUSTER:
        url = f"/futures-basics/{filename}"
        matches = [record for record in records if record.get("url") == url]
        if len(matches) != 1:
            raise ValueError(f"search index must contain one {url} entry, found {len(matches)}")
        record = matches[0]
        title, description = metadata[filename]
        if record.get("title") != title:
            record["title"] = title
            changed += 1
        if record.get("description") != description:
            record["description"] = description
            changed += 1
        if record.get("category") != "Futures Basics":
            record["category"] = "Futures Basics"
            changed += 1
    path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="",
    )
    return changed


def update_sitemap_text(raw: str) -> tuple[str, int]:
    ET.fromstring(raw)
    result = raw
    changed = 0
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
            changed += 1
    return result, changed


def sync_sitemap() -> int:
    path = ROOT / "sitemap.xml"
    updated, changed = update_sitemap_text(
        path.read_text(encoding="utf-8", errors="strict")
    )
    path.write_text(updated, encoding="utf-8", newline="")
    return changed


def main() -> int:
    metadata = {filename: read_metadata(filename) for filename in CLUSTER}
    hub_changes = sync_futures_hub(metadata)
    search_changes = sync_search_index(metadata)
    sitemap_changes = sync_sitemap()
    print(
        f"Synchronized {len(CLUSTER)} equity-index pages: "
        f"{hub_changes} hub cards, {search_changes} search fields, "
        f"{sitemap_changes} sitemap dates changed."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
