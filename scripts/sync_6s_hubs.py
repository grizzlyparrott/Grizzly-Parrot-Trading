#!/usr/bin/env python3
"""Synchronize the two existing guide hubs with the rebuilt core 6S pages only."""

from __future__ import annotations

import html
import re
from pathlib import Path

try:
    from .validate_6s_cluster import ARTICLE_DIR, BASE_URL, CLUSTER, ROOT
except ImportError:  # Direct execution: ``py scripts\\sync_6s_hubs.py``.
    from validate_6s_cluster import ARTICLE_DIR, BASE_URL, CLUSTER, ROOT


# Reader path for the Currency hub. The global Futures Basics hub keeps its
# established sorting and receives only in-place title/description refreshes.
CURRENCY_ORDER = (
    "6s-contract-specs-tick-size-margin.html",
    "6s-chf-usd-spot-vs-futures-differences.html",
    "6s-what-moves-swiss-franc-futures.html",
    "6s-how-6s-reacts-to-snb-rate-decisions.html",
    "6s-how-snb-interventions-still-impact-swiss-franc-today.html",
    "6s-how-us-economic-data-moves-swiss-franc-futures.html",
    "6s-yield-spreads-and-how-interest-rate-differentials-drive-price.html",
    "6s-intraday-yield-tracking-how-bond-moves-guide-chf-futures.html",
    "6s-macro-triggers-ranking-the-events-that-move-chf-the-most.html",
    "6s-impact-of-global-risk-events-how-chf-reacts-to-shocks.html",
    "6s-safe-haven-flows-and-why-chf-surges-in-market-panics.html",
    "6s-safe-haven-vs-jpy-which-leads-in-risk-off.html",
    "6s-behavior-during-fomc-weeks-not-just-fomc-day.html",
    "6s-best-times-of-day-to-trade-swiss-franc-futures.html",
    "6s-session-overlaps-why-europe-us-handover-moves-chf-futures.html",
    "6s-london-fix-liquidity-shifts-and-daily-flows.html",
    "6s-typical-liquidity-behavior-sweeps-fakeouts-slow-drifts.html",
    "6s-top-correlations-for-swiss-franc-futures.html",
    "6s-why-6s-has-low-volatility-and-how-to-trade-it.html",
    "6s-volatility-compression-and-breakout-behavior.html",
    "6s-mean-reversion-setups-and-why-they-work.html",
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
        raise ValueError("Currency hub contains no existing core 6S insertion anchor")
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
        raise ValueError(f"Futures hub is missing core 6S cards: {sorted(missing)}")
    path.write_text(updated, encoding="utf-8", newline="")


def main() -> int:
    if set(CURRENCY_ORDER) != set(CLUSTER) or len(CURRENCY_ORDER) != len(CLUSTER):
        raise ValueError("Currency hub order must contain each cluster page exactly once")
    metadata = {filename: read_metadata(filename) for filename in CLUSTER}
    sync_currency_hub(metadata)
    sync_futures_hub(metadata)
    print(f"Synchronized {len(CLUSTER)} core 6S pages across both hubs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
