#!/usr/bin/env python3
"""Fail-closed release checks for the rebuilt ES/MES and NQ/MNQ library."""

from __future__ import annotations

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

try:
    from .equity_index_cluster_config import (
        ARTICLE_DIR,
        BASE_URL,
        CLUSTER,
        EMPIRICAL_PROTOCOL_PAGES,
        ES_MECHANICS,
        MODIFIED_DATES,
        NQ_MECHANICS,
        PRIMARY_HOST_SUFFIXES,
        PUBLISHED_DATES,
        ROOT,
        SOURCE_REVIEW_DATE,
        VISIBLE_MODIFIED_DATES,
        required_mechanics_link,
    )
    from .validate_6z_cluster import (
        MOJIBAKE_MARKERS,
        PageParser,
        article_text,
        canonical_values,
        card_title_description,
        clean_text,
        ids_for,
        matching_card_blocks,
        meta_value,
        resolve_internal_target,
        schema_nodes,
        schema_types,
        source_disclosure,
        stylesheet_values,
        visible_faq_entries,
    )
except ImportError:
    from equity_index_cluster_config import (
        ARTICLE_DIR,
        BASE_URL,
        CLUSTER,
        EMPIRICAL_PROTOCOL_PAGES,
        ES_MECHANICS,
        MODIFIED_DATES,
        NQ_MECHANICS,
        PRIMARY_HOST_SUFFIXES,
        PUBLISHED_DATES,
        ROOT,
        SOURCE_REVIEW_DATE,
        VISIBLE_MODIFIED_DATES,
        required_mechanics_link,
    )
    from validate_6z_cluster import (
        MOJIBAKE_MARKERS,
        PageParser,
        article_text,
        canonical_values,
        card_title_description,
        clean_text,
        ids_for,
        matching_card_blocks,
        meta_value,
        resolve_internal_target,
        schema_nodes,
        schema_types,
        source_disclosure,
        stylesheet_values,
        visible_faq_entries,
    )


SHARED_STYLESHEET = "/futures-basics/currency-research-library.css?v=20260820a"
REQUIRED_PRIMARY_NAV = 'aria-label="Primary navigation"'
GENERIC_H2 = {
    "frequently asked questions",
    "sources",
    "sources reviewed",
    "sources and method",
    "sources methods and editorial disclosure",
    "related reading",
}


def normalize_heading(value: str) -> str:
    value = clean_text(value).lower()
    value = re.sub(
        r"\b(?:es|mes|nq|mnq|e-mini|micro e-mini|s&p 500|nasdaq-100|futures?)\b",
        " ",
        value,
    )
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def parse_jsonld(raw: str, errors: list[str]) -> list[dict]:
    parser = PageParser()
    parser.feed(raw)
    parser.close()
    nodes: list[dict] = []
    for index, value in enumerate(parser.page.jsonld_texts, start=1):
        try:
            data = json.loads(value)
        except json.JSONDecodeError as exc:
            errors.append(f"JSON-LD block {index} does not parse: {exc}")
            continue
        nodes.extend(node for node in schema_nodes(data) if isinstance(node, dict))
    return nodes


def primary_source_count(hrefs: list[str]) -> int:
    count = 0
    for href in hrefs:
        parsed = urlparse(href)
        host = (parsed.hostname or "").lower()
        if parsed.scheme == "https" and any(
            host == suffix or host.endswith(f".{suffix}")
            for suffix in PRIMARY_HOST_SUFFIXES
        ):
            count += 1
    return count


def validate_schema(
    raw: str,
    filename: str,
    title: str,
    description: str,
    h1: str,
    errors: list[str],
) -> None:
    canonical = f"{BASE_URL}/futures-basics/{filename}"
    nodes = parse_jsonld(raw, errors)
    articles = [node for node in nodes if "Article" in schema_types(node)]
    breadcrumbs = [node for node in nodes if "BreadcrumbList" in schema_types(node)]
    faqs = [node for node in nodes if "FAQPage" in schema_types(node)]
    if len(articles) != 1:
        errors.append(f"must contain exactly one Article schema node, found {len(articles)}")
    else:
        article = articles[0]
        if clean_text(str(article.get("headline", ""))) != h1:
            errors.append("Article headline must match the visible H1")
        if clean_text(str(article.get("description", ""))) != description:
            errors.append("Article description must match the meta description")
        if article.get("datePublished") != PUBLISHED_DATES[filename]:
            errors.append(f"Article datePublished must be {PUBLISHED_DATES[filename]}")
        if article.get("dateModified") != MODIFIED_DATES[filename]:
            errors.append(f"Article dateModified must be {MODIFIED_DATES[filename]}")
        if article.get("url") != canonical:
            errors.append("Article url must match the canonical URL")
        main_entity = article.get("mainEntityOfPage")
        main_id = main_entity.get("@id") if isinstance(main_entity, dict) else main_entity
        if main_id != canonical:
            errors.append("Article mainEntityOfPage must match the canonical URL")
        author = article.get("author")
        if not isinstance(author, dict) or author.get("name") != "Kyle Parrott":
            errors.append("Article author must identify Kyle Parrott")
    if len(breadcrumbs) != 1:
        errors.append(f"must contain exactly one BreadcrumbList, found {len(breadcrumbs)}")
    else:
        items = breadcrumbs[0].get("itemListElement", [])
        if not isinstance(items, list) or len(items) < 3:
            errors.append("BreadcrumbList must include Home, Futures Basics, and this article")
        else:
            leaf = items[-1]
            if not isinstance(leaf, dict) or leaf.get("item") != canonical:
                errors.append("Breadcrumb leaf must use the canonical article URL")
            if isinstance(leaf, dict) and clean_text(str(leaf.get("name", ""))) != h1:
                errors.append("Breadcrumb leaf name must match the visible H1")

    visible_faq = visible_faq_entries(raw)
    if faqs and not visible_faq:
        errors.append("FAQPage schema exists without a visible FAQ")
    if visible_faq and len(faqs) != 1:
        errors.append("visible FAQ requires exactly one matching FAQPage schema")
    if faqs:
        entities = faqs[0].get("mainEntity", [])
        schema_questions = []
        if isinstance(entities, list):
            for entity in entities:
                if isinstance(entity, dict):
                    schema_questions.append(clean_text(str(entity.get("name", ""))))
        if schema_questions != [question for question, _ in visible_faq]:
            errors.append("FAQ schema questions must match visible FAQ questions in order")


def validate_page(path: Path, id_cache: dict[Path, set[str]]):
    errors: list[str] = []
    warnings: list[str] = []
    try:
        raw = path.read_text(encoding="utf-8", errors="strict")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read strict UTF-8: {exc}"], [], "", ""

    parser = PageParser()
    try:
        parser.feed(raw)
        parser.close()
    except Exception as exc:
        errors.append(f"HTML parser failure: {exc}")
    page = parser.page
    filename = path.name
    canonical = f"{BASE_URL}/futures-basics/{filename}"
    expected_modified = MODIFIED_DATES[filename]
    expected_visible = VISIBLE_MODIFIED_DATES[expected_modified]

    titles = page.title_parts
    title = titles[0] if len(titles) == 1 else ""
    h1s = [value for level, value in page.headings if level == 1]
    h2s = [value for level, value in page.headings if level == 2]
    h1 = h1s[0] if len(h1s) == 1 else ""
    descriptions = meta_value(page, "name", "description")
    description = descriptions[0] if len(descriptions) == 1 else ""
    visible = clean_text(" ".join(page.body_parts))

    if page.doctype != "doctype html":
        errors.append("missing HTML5 doctype")
    if page.lang.lower() not in {"en", "en-us"}:
        errors.append("html lang must be en or en-US")
    if [meta.get("charset", "").lower() for meta in page.metas if "charset" in meta] != ["utf-8"]:
        errors.append("must contain exactly one UTF-8 charset meta")
    viewports = meta_value(page, "name", "viewport")
    if len(viewports) != 1 or "width=device-width" not in viewports[0].lower():
        errors.append("missing responsive viewport meta")
    if len(titles) != 1 or not title:
        errors.append("must contain exactly one nonempty title")
    elif not 25 <= len(title) <= 72:
        warnings.append(f"title length is {len(title)} characters")
    if len(h1s) != 1 or not h1:
        errors.append("must contain exactly one nonempty H1")
    elif title != h1:
        errors.append("title and visible H1 must agree")
    if len(descriptions) != 1 or not description:
        errors.append("must contain exactly one meta description")
    elif not 95 <= len(description) <= 180:
        warnings.append(f"meta description length is {len(description)} characters")
    if len(h2s) < 4:
        errors.append("article must contain at least four H2 sections")
    if len(set(page.ids)) != len(page.ids):
        errors.append("duplicate element IDs detected")
    if any(marker in raw for marker in MOJIBAKE_MARKERS):
        errors.append("mojibake marker detected")

    robots = [value.lower() for value in meta_value(page, "name", "robots")]
    if len(robots) != 1 or "index" not in robots[0] or "follow" not in robots[0]:
        errors.append("robots meta must be one index, follow directive")
    if canonical_values(page) != [canonical]:
        errors.append("canonical link must appear once and match the production URL")
    for key, expected in (
        (("property", "og:title"), title),
        (("property", "og:description"), description),
        (("property", "og:url"), canonical),
        (("property", "article:published_time"), PUBLISHED_DATES[filename]),
        (("property", "article:modified_time"), expected_modified),
        (("name", "twitter:title"), title),
        (("name", "twitter:description"), description),
    ):
        values = meta_value(page, *key)
        if values != [expected]:
            errors.append(f"{key[1]} must appear once and equal the approved value")

    stylesheets = stylesheet_values(page)
    if stylesheets.count("../style.css") != 1:
        errors.append("must load ../style.css exactly once")
    if stylesheets.count(SHARED_STYLESHEET) != 1:
        errors.append("must load the shared green-and-black research stylesheet exactly once")
    unexpected = [value for value in stylesheets if value not in {"../style.css", SHARED_STYLESHEET}]
    if unexpected:
        errors.append(f"page-specific or unexpected stylesheets are forbidden: {unexpected}")
    if not any("currency-library" in classes for classes in page.main_classes):
        errors.append("main wrapper must use the shared currency-library visual namespace")
    if "<style" in raw.lower():
        errors.append("inline page-specific style blocks are forbidden")
    if re.search(r"\sstyle\s*=", raw, re.I):
        errors.append("inline page-specific style attributes are forbidden")

    if raw.lower().count("<!-- article body start -->") != 1 or raw.lower().count(
        "<!-- article body end -->"
    ) != 1:
        errors.append("article body markers must each appear exactly once")
    if not re.search(r'<header\b[^>]*class=["\'][^"\']*\bsite-header\b', raw, re.I):
        errors.append("missing shared site header")
    if REQUIRED_PRIMARY_NAV not in raw:
        errors.append("primary navigation lacks its accessible label")
    if not re.search(r'<a\b[^>]*class=["\'][^"\']*\bfx-skip-link\b[^"\']*["\'][^>]*href=["\']#main-content["\']', raw, re.I):
        errors.append("missing accessible skip link")
    if not re.search(r'<footer\b[^>]*class=["\'][^"\']*\bsite-footer\b', raw, re.I):
        errors.append("missing shared site footer")
    if "/uet.js" not in raw or "G-JMJVR3G5YN" not in raw:
        errors.append("required UET or Google Analytics shell is missing")

    if visible.count(expected_visible) != 1:
        errors.append(f"visible modified date must appear once as {expected_visible!r}")
    words = re.findall(r"\b[A-Za-z0-9][A-Za-z0-9'’.-]*\b", article_text(raw))
    if len(words) < 900:
        errors.append(f"substantive article text is too short: {len(words)} words")

    source_text, source_hrefs = source_disclosure(raw)
    if not source_text:
        errors.append("missing visible fx-sources disclosure")
    else:
        if len(source_hrefs) < 3:
            errors.append("source disclosure must contain at least three descriptive links")
        if primary_source_count(source_hrefs) < 1:
            errors.append("source disclosure must include an authoritative primary source")
        review_phrase = "reviewed August 28, 2026"
        if not re.search(r"\breviewed(?:\s+on)?\s+august\s+28,\s+2026\b", source_text, re.I):
            errors.append(f"source disclosure must state that sources were {review_phrase}")
    for href in source_hrefs:
        if href.startswith("http://"):
            errors.append(f"source URL must use HTTPS: {href}")

    mechanics = required_mechanics_link(filename)
    if mechanics and mechanics not in raw:
        errors.append(f"must link to canonical mechanics page {mechanics}")
    if filename == "why-futures-lead-the-stock-market.html":
        for mechanics_page in (ES_MECHANICS, NQ_MECHANICS):
            if mechanics_page not in raw:
                errors.append(f"shared foundation page must link to {mechanics_page}")

    if filename in EMPIRICAL_PROTOCOL_PAGES:
        if not re.search(r"\b(?:protocol|hypothesis|sample|holdout|out-of-sample|falsif)\w*", visible, re.I):
            errors.append("empirical page lacks a reproducible testing vocabulary")
        if not re.search(
            r"(?:does not|do not|not|no)\s+(?:report|claim|present|constitute|provide|publish|show).{0,80}(?:result|finding|edge|probability|win rate)"
            r"|\bno\s+original\b.{0,100}\b(?:result|finding|edge|advantage|probability|win rate|estimate|study)\b"
            r"|\bno\s+original\s+study\s+(?:was|has been)\s+run\b",
            visible,
            re.I,
        ):
            errors.append("empirical page must state that an unperformed study is not a finding")

    if re.search(
        r"\b(?:guaranteed profit|surefire|cannot lose|always fills|always works|never fails|high-probability setup)\b",
        visible,
        re.I,
    ):
        errors.append("unsupported deterministic trading claim detected")
    if re.search(r"broker.{0,80}(?:day|intraday) margin.{0,80}(?:maximum|max) loss", visible, re.I):
        errors.append("broker day margin must not be presented as maximum loss")
    if "GlobexRefGd.pdf" in raw:
        errors.append("retired CME Globex Reference Guide redirect is forbidden")

    formula_requirements = {
        "best-times-to-trade-es-e-mini-sp500.html": (
            "side &times; (average fill &minus; decision benchmark) &times; contract multiplier &times; filled contracts + fees",
            "side = +1 for a buy and &minus;1 for a sell",
        ),
        "nq-best-times.html": (
            "side &times; (execution VWAP for Q &minus; decision-time midquote)",
            "contract multiplier &times; filled Q + fees",
        ),
        "nq-pullbacks-vs-breakouts.html": (
            "fill-to-fill P&amp;L &minus; reconciled actual transaction-fee ledger counted once",
            "one non-overlapping ledger",
            "never subtract modeled slippage from a fill-based result",
        ),
    }
    for required in formula_requirements.get(filename, ()):
        if required not in raw:
            errors.append("page-specific cost formula is missing required side/cost treatment")
    if filename == "nq-pullbacks-vs-breakouts.html" and re.search(
        r"realized P&amp;L.{0,120}modeled slippage", raw, re.I | re.S
    ):
        errors.append("fill-based P&L must not subtract modeled slippage a second time")
    if filename == "nq-position-sizing.html":
        stop_formula = re.search(
            r'<div class="fx-formula" aria-label="Structural stop conversion to ticks">.*?</div>',
            raw,
            re.I | re.S,
        )
        if not stop_formula or "ceiling(" not in stop_formula.group(0):
            errors.append("structural stop formula must round adverse distance with ceiling")
        elif '<i aria-hidden="true">+</i>' in stop_formula.group(0):
            errors.append("ceiling formula must not visually add a second rounding operation")

    for anchor in page.anchors:
        href = anchor.get("href", "").strip()
        if not href or href.startswith("#"):
            continue
        target = resolve_internal_target(path, href)
        if target is None:
            if anchor.get("target", "").lower() == "_blank":
                rel = {value.lower() for value in anchor.get("rel", "").split()}
                if not {"noopener", "noreferrer"}.issubset(rel):
                    errors.append(f"external target=_blank link lacks noopener noreferrer: {href}")
            continue
        target_path, fragment = target
        if not target_path.is_file():
            errors.append(f"broken internal link: {href}")
        elif fragment and fragment not in ids_for(target_path, id_cache):
            errors.append(f"broken internal fragment: {href}")
    for image in page.img_attrs:
        if not image.get("alt", "").strip():
            errors.append("image missing nonempty alt text")

    validate_schema(raw, filename, title, description, h1, errors)

    if filename == ES_MECHANICS:
        checks = {
            "ES $50 multiplier": r"(?:\$50\s*(?:x|×|times)|50\s+U\.S\. dollars?.{0,50}index point)",
            "ES 0.25-point increment": r"0\.25.{0,80}(?:point|minimum|increment|tick)",
            "ES $12.50 tick": r"\$12\.50",
            "ES 0.05-point spread tick": r"0\.05 point = \$2\.50",
            "MES $5 multiplier": r"MES.{0,200}\$5\s*(?:x|×|times)|\$5\s*(?:x|×|times).{0,200}MES",
            "MES $1.25 tick": r"\$1\.25",
            "MES 0.05-point spread tick": r"0\.05 point = \$0\.25",
            "cash settlement": r"cash[- ]settled|cash settlement",
            "quarterly lifecycle": r"March.{0,80}June.{0,80}September.{0,80}December",
            "current ES listing depth": r"21 consecutive March/June/September/December quarterly contracts",
            "current MES listing depth": r"5 consecutive March/June/September/December quarterly contracts",
            "exact standard session boundary": r"Sunday through Friday, 5:00 p\.m\. to 4:00 p\.m\. Central Time.{0,250}4:00 p\.m\. to 5:00 p\.m\. CT",
            "ES termination exchange wording": r"regularly scheduled start of NYSE trading",
            "MES termination exchange wording": r"primary listing exchange opens",
            "SOQ component basis": r"Special Opening Quotation.{0,120}component opening prices",
            "unscheduled holiday branch": r"unscheduled Market Holiday.{0,180}immediately preceding business day.{0,80}NYSE close",
            "hours and termination": r"trading hours?.{0,800}(?:terminate|termination|final settlement)|(?:terminate|termination|final settlement).{0,800}trading hours?",
            "roll risk": r"\broll(?:ing|over| risk| process| date| window)?\b",
        }
        for label, pattern in checks.items():
            if not re.search(pattern, visible, re.I | re.S):
                errors.append(f"canonical ES mechanics page is missing {label}")
        if "cmegroup.com" not in raw:
            errors.append("canonical ES mechanics page must cite CME")
    if filename == NQ_MECHANICS:
        checks = {
            "NQ $20 multiplier": r"(?:\$20\s*(?:x|×|times)|20\s+U\.S\. dollars?.{0,50}index point)",
            "NQ 0.25-point increment": r"0\.25.{0,80}(?:point|minimum|increment|tick)",
            "NQ $5 tick": r"\$5(?:\.00)?",
            "NQ 0.05-point spread tick": r"NQ spread tick at \$1(?:\.00)?",
            "MNQ $2 multiplier": r"MNQ.{0,200}\$2\s*(?:x|×|times)|\$2\s*(?:x|×|times).{0,200}MNQ",
            "MNQ $0.50 tick": r"\$0\.50",
            "MNQ 0.05-point spread tick": r"MNQ spread tick at \$0\.10",
            "cash settlement": r"cash[- ]settled|cash settlement",
            "quarterly lifecycle": r"March.{0,80}June.{0,80}September.{0,80}December",
            "current NQ listing depth": r"6 consecutive quarterly contracts plus 2 additional June and 4 additional December contracts",
            "current MNQ listing depth": r"MNQ is listed for 5 consecutive quarterly contracts",
            "exact standard session boundary": r"Sunday through Friday, 5:00 p\.m\. to 4:00 p\.m\. Central Time.{0,250}4:00 p\.m\. to 5:00 p\.m\. CT",
            "NQ termination exchange wording": r"Regularly scheduled start of Nasdaq Stock Market trading",
            "MNQ termination exchange wording": r"No trading after the Primary Listing Exchange opens",
            "NQ NOOP basis": r"each component's Nasdaq Official Opening Price \(NOOP\)",
            "MNQ component-opening basis": r"Special Opening Quotation based on component opening prices",
            "unscheduled holiday branch": r"Unscheduled Market Holiday.{0,180}immediately preceding business day.{0,80}NYSE close",
            "hours and termination": r"trading hours?.{0,800}(?:terminate|termination|final settlement)|(?:terminate|termination|final settlement).{0,800}trading hours?",
            "roll risk": r"\broll(?:ing|over| risk| process| date| window)?\b",
        }
        for label, pattern in checks.items():
            if not re.search(pattern, visible, re.I | re.S):
                errors.append(f"canonical NQ mechanics page is missing {label}")
        if "cmegroup.com" not in raw:
            errors.append("canonical NQ mechanics page must cite CME")

    return errors, warnings, title, description


def validate_discovery(titles: dict[str, str], descriptions: dict[str, str]):
    errors: list[str] = []
    path = ROOT / "futures-basics" / "index.html"
    raw = path.read_text(encoding="utf-8", errors="strict")
    for filename in CLUSTER:
        blocks = matching_card_blocks(raw, filename, "fbh-guide-card")
        if len(blocks) != 1:
            errors.append(f"Futures hub must contain one {filename} card, found {len(blocks)}")
            continue
        block = blocks[0]
        title, description = card_title_description(block)
        if title != titles[filename]:
            errors.append(f"Futures hub title is stale for {filename}")
        if description != descriptions[filename]:
            errors.append(f"Futures hub description is stale for {filename}")
        if 'data-category="indexes"' not in block or "<span>Equity indexes</span>" not in block:
            errors.append(f"Futures hub category is wrong for {filename}")
        data_search = re.search(r'\bdata-search=["\']([^"\']*)["\']', block, re.I)
        decoded = clean_text(data_search.group(1)) if data_search else ""
        for expected in (titles[filename], descriptions[filename], f"/futures-basics/{filename}"):
            if expected not in decoded:
                errors.append(f"Futures hub data-search is stale for {filename}")

    search_path = ROOT / "search-index.json"
    records = json.loads(search_path.read_text(encoding="utf-8", errors="strict"))
    by_url: dict[str, list[dict]] = defaultdict(list)
    for record in records if isinstance(records, list) else []:
        if isinstance(record, dict):
            by_url[str(record.get("url", ""))].append(record)
    for filename in CLUSTER:
        url = f"/futures-basics/{filename}"
        matches = by_url.get(url, [])
        if len(matches) != 1:
            errors.append(f"search-index must contain one {url}, found {len(matches)}")
            continue
        record = matches[0]
        if clean_text(str(record.get("title", ""))) != titles[filename]:
            errors.append(f"search-index title is stale for {filename}")
        if clean_text(str(record.get("description", ""))) != descriptions[filename]:
            errors.append(f"search-index description is stale for {filename}")
        if record.get("category") != "Futures Basics":
            errors.append(f"search-index category is wrong for {filename}")

    sitemap: dict[str, list[str]] = defaultdict(list)
    tree = ET.parse(ROOT / "sitemap.xml")
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    for node in tree.findall("sm:url", namespace):
        loc = node.findtext("sm:loc", default="", namespaces=namespace)
        lastmod = node.findtext("sm:lastmod", default="", namespaces=namespace)
        sitemap[loc].append(lastmod)
    for filename in CLUSTER:
        url = f"{BASE_URL}/futures-basics/{filename}"
        values = sitemap.get(url, [])
        expected = f"{MODIFIED_DATES[filename]}T12:00:00Z"
        if values != [expected]:
            errors.append(f"sitemap lastmod must be {expected} for {filename}: {values}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--warnings-as-errors", action="store_true")
    args = parser.parse_args()
    all_errors: dict[str, list[str]] = defaultdict(list)
    all_warnings: dict[str, list[str]] = defaultdict(list)
    titles: dict[str, str] = {}
    descriptions: dict[str, str] = {}
    id_cache: dict[Path, set[str]] = {}

    for filename in CLUSTER:
        errors, warnings, title, description = validate_page(ARTICLE_DIR / filename, id_cache)
        all_errors[filename].extend(errors)
        all_warnings[filename].extend(warnings)
        titles[filename] = title
        descriptions[filename] = description
    if all(titles.values()) and all(descriptions.values()):
        all_errors["<discovery>"].extend(validate_discovery(titles, descriptions))

    if len(CLUSTER) != 35 or set(CLUSTER) != set(MODIFIED_DATES):
        all_errors["<config>"].append("equity-index scope or date matrix is incomplete")
    if not (ARTICLE_DIR / "currency-research-library.css").is_file():
        all_errors["<shared>"].append("shared green-and-black stylesheet is missing")

    error_count = sum(len(values) for values in all_errors.values())
    warning_count = sum(len(values) for values in all_warnings.values())
    for filename in (*CLUSTER, "<discovery>", "<config>", "<shared>"):
        for message in all_errors.get(filename, []):
            print(f"ERROR [{filename}]: {message}")
        for message in all_warnings.get(filename, []):
            print(f"WARN  [{filename}]: {message}")
    print(
        f"Checked {len(CLUSTER)} equity-index pages: "
        f"{error_count} errors, {warning_count} warnings."
    )
    return 1 if error_count or (args.warnings_as_errors and warning_count) else 0


if __name__ == "__main__":
    raise SystemExit(main())
