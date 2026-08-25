#!/usr/bin/env python3
"""Synchronize existing 6Z search-index entries with rebuilt page metadata."""

from __future__ import annotations

import json
from pathlib import Path

try:
    from .sync_6z_hubs import read_metadata
    from .validate_6z_cluster import CLUSTER, ROOT
except ImportError:
    from sync_6z_hubs import read_metadata
    from validate_6z_cluster import CLUSTER, ROOT


def update_index(path: Path) -> int:
    records = json.loads(path.read_text(encoding="utf-8", errors="strict"))
    if not isinstance(records, list):
        raise ValueError("search-index.json must contain an array")
    changed = 0
    for filename in CLUSTER:
        url = f"/futures-basics/{filename}"
        matches = [record for record in records if record.get("url") == url]
        if len(matches) != 1:
            raise ValueError(f"search index must contain one {url} entry, found {len(matches)}")
        title, description = read_metadata(filename)
        record = matches[0]
        if record.get("title") != title or record.get("description") != description:
            record["title"] = title
            record["description"] = description
            changed += 1
        if record.get("category") != "Futures Basics":
            record["category"] = "Futures Basics"
            changed += 1
    path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    return changed


def main() -> int:
    changed = update_index(ROOT / "search-index.json")
    print(f"Synchronized {len(CLUSTER)} core 6Z search entries ({changed} records changed).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
