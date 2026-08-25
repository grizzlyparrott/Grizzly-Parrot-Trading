#!/usr/bin/env python3
"""Synchronize the two existing guide hubs with the rebuilt core 6Z pages only."""

from __future__ import annotations

import html
import re
from pathlib import Path

try:
    from .validate_6z_cluster import ARTICLE_DIR, BASE_URL, CLUSTER, ROOT
except ImportError:  # Direct execution: ``py scripts\\sync_6z_hubs.py``.
    from validate_6z_cluster import ARTICLE_DIR, BASE_URL, CLUSTER, ROOT


# Reader path for the Currency hub. The global Futures Basics hub keeps its
# established sorting and receives only in-place title/description refreshes.
CURRENCY_ORDER = (
    "what-are-6z-futures.html",
    "6z-tick-size-and-value.html",
    "6z-margin-requirements.html",
    "6z-position-sizing.html",
    "fundamental-drivers-of-6z.html",
    "how-sarb-influences-6z.html",
    "sarb-rates-impact-6z.html",
    "how-us-dollar-moves-6z.html",
    "why-6z-trades-differently.html",
    "6z-vs-6e-vs-6j-differences.html",
    "best-times-to-trade-6z-futures.html",
    "6z-liquidity-map.html",
    "6z-volatility-profile.html",
    "why-6z-slippage-hits-harder.html",
    "6z-algorithmic-behavior.html",
    "best-indicators-for-6z.html",
    "6z-seasonal-patterns.html",
    "6z-trade-management-guide.html",
    "6z-trading-psychology.html",
    "common-6z-trading-mistakes.html",
)

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.I | re.S)
DESC_RE = re.compile(
    r'<meta\s+name=["\']description["\']\s+content=(?P<quote>["\'])(?P<value>.*?)(?P=quote)',
    re.I | re.S,
)
CURRENCY_CARD_RE = re.compile(r"\n\s*<article class=\"card\">.*?</article>", re.I | re.S)
FUTURES_CARD_RE = re.compile(
    r'(?P<indent>^[ \t]*)<article class="fbh-guide-card"[^>]*>.*?</article>',
    re.I | re.S | re.M,
)
HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.I)


def extract_metadata(raw: str, label: str = "article") -> tuple[str, str]:
    title_match = TITLE_RE.search(raw)
    desc_match = DESC_RE.search(raw)
    if not title_match or not desc_match:
        raise ValueError(f"{label} is missing title or meta description")
    title = html.unescape(re.sub(r"\s+", " ", title_match.group(1))).strip()
    description = html.unescape(re.sub(r"\s+", " ", desc_match.group("value"))).strip()
    return title, description


def read_metadata(filename: str) -> tuple[str, str]:
    raw = (ARTICLE_DIR / filename).read_text(encoding="utf-8", errors="strict")
    return extract_metadata(raw, filename)


def filename_from_card(card: str) -> str:
    match = HREF_RE.search(card)
    if not match:
        return ""
    return match.group(1).split("?", 1)[0].rsplit("/", 1)[-1]


def currency_card(filename: str, title: str, description: str) -> str:
    href = f"{BASE_URL}/futures-basics/{filename}"
    return (
        '        <article class="card">\n'
        f'          <h3><a href="{html.escape(href, quote=True)}">{html.escape(title)}</a></h3>\n'
        f'          <p>{html.escape(description)}</p>\n'
        "        </article>"
    )


def futures_card(filename: str, title: str, description: str, indent: str) -> str:
    href = f"/futures-basics/{filename}"
    search = f"{title} {description} {href}"
    return (
        f'{indent}<article class="fbh-guide-card" data-category="currencies" '
        f'data-search="{html.escape(search, quote=True)}">\n'
        f"{indent}  <span>Currencies</span>\n"
        f'{indent}  <h3><a href="{href}">{html.escape(title)}</a></h3>\n'
        f"{indent}  <p>{html.escape(description)}</p>\n"
        f"{indent}</article>"
    )


def sync_currency_hub(metadata: dict[str, tuple[str, str]]) -> None:
    path = ROOT / "currencies" / "index.html"
    raw = path.read_text(encoding="utf-8", errors="strict")
    existing_cards = list(CURRENCY_CARD_RE.finditer(raw))
    cluster_cards = [match for match in existing_cards if filename_from_card(match.group(0)) in CLUSTER]
    if not cluster_cards:
        raise ValueError("Currency hub contains no existing core 6Z insertion anchor")
    insert_at = min(match.start() for match in cluster_cards)
    chunks = []
    cursor = 0
    removed_before_insert = 0
    for match in existing_cards:
        filename = filename_from_card(match.group(0))
        if filename not in CLUSTER:
            continue
        chunks.append(raw[cursor : match.start()])
        cursor = match.end()
        if match.start() < insert_at:
            removed_before_insert += match.end() - match.start()
    chunks.append(raw[cursor:])
    without_cluster = "".join(chunks)
    adjusted_insert = insert_at - removed_before_insert
    block = "\n" + "\n\n".join(
        currency_card(filename, *metadata[filename]) for filename in CURRENCY_ORDER
    )
    updated = without_cluster[:adjusted_insert] + block + without_cluster[adjusted_insert:]
    path.write_text(updated, encoding="utf-8", newline="")


def sync_futures_hub(metadata: dict[str, tuple[str, str]]) -> None:
    path = ROOT / "futures-basics" / "index.html"
    raw = path.read_text(encoding="utf-8", errors="strict")
    seen: set[str] = set()

    def replace(match: re.Match[str]) -> str:
        card = match.group(0)
        filename = filename_from_card(card)
        if filename not in CLUSTER:
            return card
        if filename in seen:
            raise ValueError(f"duplicate Futures hub card for {filename}")
        seen.add(filename)
        return futures_card(filename, *metadata[filename], indent=match.group("indent"))

    updated = FUTURES_CARD_RE.sub(replace, raw)
    missing = set(CLUSTER) - seen
    if missing:
        raise ValueError(f"Futures hub is missing core 6Z cards: {sorted(missing)}")
    path.write_text(updated, encoding="utf-8", newline="")


def main() -> int:
    if set(CURRENCY_ORDER) != set(CLUSTER) or len(CURRENCY_ORDER) != len(CLUSTER):
        raise ValueError("Currency hub order must contain each cluster page exactly once")
    metadata = {filename: read_metadata(filename) for filename in CLUSTER}
    sync_currency_hub(metadata)
    sync_futures_hub(metadata)
    print(f"Synchronized {len(CLUSTER)} core 6Z pages across both hubs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
