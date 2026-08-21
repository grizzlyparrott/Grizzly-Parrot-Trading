#!/usr/bin/env python3
"""Fail-closed technical and editorial-contract checks for the core 6B library."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


BASE_URL = "https://grizzlyparrottrading.com"
REVIEW_DATE = "2026-08-13"
ROOT = Path(__file__).resolve().parents[1]
ARTICLE_DIR = ROOT / "futures-basics"
CLUSTER = (
    "6b-breakout-levels-how-to-identify-high-probability-zones.html",
    "6b-contract-specs-tick-size-and-margin.html",
    "6b-pullbacks-what-clean-retracements-look-like.html",
    "6b-volatility-compression-and-expansion-patterns.html",
    "analyzing-weekly-trends-and-swings-in-6b.html",
    "british-pound-volatility-drivers-in-6b.html",
    "common-liquidity-traps-in-6b-futures.html",
    "gbp-usd-correlation-with-6b-futures.html",
    "how-6b-reacts-to-boe-rate-decisions.html",
    "how-to-read-6b-order-flow-for-clean-entries.html",
    "how-uk-cpi-inflation-moves-6b-futures.html",
    "how-uk-economic-data-releases-impact-6b-futures.html",
    "how-uk-gdp-and-employment-data-move-6b.html",
    "how-uk-political-events-affect-6b-futures.html",
    "how-us-dollar-strength-confirms-or-invalidates-6b-setups.html",
    "london-session-volatility-patterns-in-6b.html",
    "reading-short-term-momentum-in-6b.html",
    "using-gbpusd-divergence-to-trade-6b-futures.html",
    "why-6b-reacts-differently-than-6e-in-risk-on-markets.html",
    "why-6b-trends-during-us-session.html",
)

MOJIBAKE_MARKERS = ("â€", "â€™", "â€“", "â€”", "Â", "Ã", "ðŸ")
GENERIC_H2 = {
    "frequently asked questions",
    "sources",
    "sources and method",
    "sources method and disclosure",
}


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def normalize_heading(value: str) -> str:
    value = clean_text(value).lower()
    value = re.sub(r"\b6b\b|\bbritish pound\b|\bfutures?\b", " ", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def schema_nodes(value: object):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from schema_nodes(child)
    elif isinstance(value, list):
        for child in value:
            yield from schema_nodes(child)


def schema_types(node: dict) -> set[str]:
    raw = node.get("@type", [])
    if isinstance(raw, str):
        return {raw}
    if isinstance(raw, list):
        return {item for item in raw if isinstance(item, str)}
    return set()


@dataclass
class Page:
    title_parts: list[str] = field(default_factory=list)
    metas: list[dict[str, str]] = field(default_factory=list)
    links: list[dict[str, str]] = field(default_factory=list)
    anchors: list[dict[str, str]] = field(default_factory=list)
    headings: list[tuple[int, str]] = field(default_factory=list)
    summaries: list[str] = field(default_factory=list)
    faq_summaries: list[str] = field(default_factory=list)
    jsonld_texts: list[str] = field(default_factory=list)
    ids: list[str] = field(default_factory=list)
    main_classes: list[set[str]] = field(default_factory=list)
    img_attrs: list[dict[str, str]] = field(default_factory=list)
    body_parts: list[str] = field(default_factory=list)
    lang: str = ""
    doctype: str = ""


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.page = Page()
        self.capture: list[tuple[str, list[str], int | None]] = []
        self.hidden_depth = 0
        self.faq_depth = 0

    def handle_decl(self, decl: str) -> None:
        self.page.doctype = decl.strip().lower()

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        attr = {str(k).lower(): (v or "") for k, v in attrs}
        if tag == "html":
            self.page.lang = attr.get("lang", "")
        if "id" in attr:
            self.page.ids.append(attr["id"])
        if tag == "meta":
            self.page.metas.append(attr)
        elif tag == "link":
            self.page.links.append(attr)
        elif tag == "a":
            self.page.anchors.append(attr)
        elif tag == "img":
            self.page.img_attrs.append(attr)
        elif tag == "main":
            self.page.main_classes.append(set(attr.get("class", "").split()))

        if "fx-faq" in set(attr.get("class", "").split()):
            self.faq_depth += 1

        if tag in {"script", "style", "template"}:
            self.hidden_depth += 1

        if tag == "title":
            self.capture.append((tag, [], None))
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.capture.append((tag, [], int(tag[1])))
        elif tag == "summary":
            self.capture.append((tag, [], None))
        elif tag == "script" and attr.get("type", "").lower() == "application/ld+json":
            self.capture.append(("jsonld", [], None))

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if self.capture:
            kind, parts, level = self.capture[-1]
            closes = (kind == tag) or (kind == "jsonld" and tag == "script")
            if closes:
                self.capture.pop()
                value = clean_text("".join(parts)) if kind != "jsonld" else "".join(parts).strip()
                if kind == "title":
                    self.page.title_parts.append(value)
                elif kind.startswith("h") and level is not None:
                    self.page.headings.append((level, value))
                elif kind == "summary":
                    self.page.summaries.append(value)
                    if self.faq_depth:
                        self.page.faq_summaries.append(value)
                elif kind == "jsonld":
                    self.page.jsonld_texts.append(value)
        if tag in {"script", "style", "template"} and self.hidden_depth:
            self.hidden_depth -= 1
        # FAQ sections in this library use section/details containers. Closing
        # details does not leave the enclosing FAQ section.
        if tag == "section" and self.faq_depth:
            self.faq_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.capture:
            self.capture[-1][1].append(data)
        if not self.hidden_depth and data.strip():
            self.page.body_parts.append(data)


def meta_value(page: Page, key: str, value: str) -> list[str]:
    key = key.lower()
    value = value.lower()
    return [m.get("content", "") for m in page.metas if m.get(key, "").lower() == value]


def canonical_values(page: Page) -> list[str]:
    values = []
    for link in page.links:
        rel = {item.lower() for item in link.get("rel", "").split()}
        if "canonical" in rel:
            values.append(link.get("href", ""))
    return values


def stylesheet_values(page: Page) -> list[str]:
    values = []
    for link in page.links:
        rel = {item.lower() for item in link.get("rel", "").split()}
        if "stylesheet" in rel:
            values.append(link.get("href", ""))
    return values


def resolve_internal_target(source: Path, href: str) -> tuple[Path, str] | None:
    parsed = urlparse(href)
    if parsed.scheme in {"mailto", "tel", "javascript", "data"}:
        return None
    if parsed.netloc and parsed.netloc != "grizzlyparrottrading.com":
        return None
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return None
    path_text = unquote(parsed.path)
    if not path_text:
        return source, parsed.fragment
    if path_text.startswith("/"):
        target = ROOT / path_text.lstrip("/")
    else:
        target = source.parent / path_text
    if path_text.endswith("/"):
        target = target / "index.html"
    return target.resolve(), parsed.fragment


def ids_for(path: Path, cache: dict[Path, set[str]]) -> set[str]:
    if path in cache:
        return cache[path]
    try:
        text = path.read_text(encoding="utf-8", errors="strict")
    except (OSError, UnicodeError):
        cache[path] = set()
        return cache[path]
    cache[path] = set(re.findall(r'\bid=["\']([^"\']+)["\']', text, flags=re.I))
    return cache[path]


def article_text(raw: str) -> str:
    match = re.search(
        r"<!--\s*ARTICLE BODY START\s*-->(.*?)<!--\s*ARTICLE BODY END\s*-->",
        raw,
        flags=re.I | re.S,
    )
    selected = match.group(1) if match else raw
    selected = re.sub(r"<script\b.*?</script>", " ", selected, flags=re.I | re.S)
    selected = re.sub(r"<style\b.*?</style>", " ", selected, flags=re.I | re.S)
    selected = re.sub(r"<[^>]+>", " ", selected)
    return clean_text(selected)


def visible_faq_entries(raw: str) -> list[tuple[str, str]]:
    entries: list[tuple[str, str]] = []
    sections = re.findall(
        r'<section\b[^>]*class=["\'][^"\']*\bfx-faq\b[^"\']*["\'][^>]*>(.*?)</section>',
        raw,
        flags=re.I | re.S,
    )
    for section in sections:
        for details in re.findall(r"<details\b[^>]*>(.*?)</details>", section, flags=re.I | re.S):
            question_match = re.search(r"<summary\b[^>]*>(.*?)</summary>", details, flags=re.I | re.S)
            answer_match = re.search(r"<p\b[^>]*>(.*?)</p>", details, flags=re.I | re.S)
            question = clean_text(re.sub(r"<[^>]+>", " ", question_match.group(1))) if question_match else ""
            answer = clean_text(re.sub(r"<[^>]+>", " ", answer_match.group(1))) if answer_match else ""
            entries.append((question, answer))
    return entries


def matching_card_blocks(raw: str, filename: str, css_class: str) -> list[str]:
    pattern = re.compile(
        rf'<article\b[^>]*class=["\'][^"\']*\b{re.escape(css_class)}\b[^"\']*["\'][^>]*>.*?</article>',
        flags=re.I | re.S,
    )
    return [block for block in pattern.findall(raw) if filename in block]


def card_title_description(block: str) -> tuple[str, str]:
    title_match = re.search(r"<h3\b[^>]*>.*?<a\b[^>]*>(.*?)</a>.*?</h3>", block, flags=re.I | re.S)
    desc_match = re.search(r"<p\b[^>]*>(.*?)</p>", block, flags=re.I | re.S)
    title = clean_text(re.sub(r"<[^>]+>", " ", title_match.group(1))) if title_match else ""
    description = clean_text(re.sub(r"<[^>]+>", " ", desc_match.group(1))) if desc_match else ""
    return title, description


def validate_cluster_sync(
    titles: dict[str, str], descriptions: dict[str, str]
) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    hubs = (
        (ROOT / "currencies" / "index.html", "card", False),
        (ROOT / "futures-basics" / "index.html", "fbh-guide-card", True),
    )
    for hub_path, css_class, has_search in hubs:
        try:
            raw = hub_path.read_text(encoding="utf-8", errors="strict")
        except (OSError, UnicodeError) as exc:
            errors.append(f"cannot read {hub_path.relative_to(ROOT)}: {exc}")
            continue
        for filename in CLUSTER:
            blocks = matching_card_blocks(raw, filename, css_class)
            if len(blocks) != 1:
                errors.append(
                    f"{hub_path.relative_to(ROOT)} must contain one {filename} card, found {len(blocks)}"
                )
                continue
            title, description = card_title_description(blocks[0])
            if title != titles.get(filename, ""):
                errors.append(f"{hub_path.relative_to(ROOT)} title is stale for {filename}")
            if description != descriptions.get(filename, ""):
                errors.append(f"{hub_path.relative_to(ROOT)} description is stale for {filename}")
            if has_search:
                data_search = re.search(r'\bdata-search=["\']([^"\']*)["\']', blocks[0], flags=re.I)
                decoded = clean_text(data_search.group(1)) if data_search else ""
                expected_parts = (
                    titles.get(filename, ""),
                    descriptions.get(filename, ""),
                    f"/futures-basics/{filename}",
                )
                if any(part not in decoded for part in expected_parts):
                    errors.append(f"Futures hub data-search is stale for {filename}")

    search_path = ROOT / "search-index.json"
    try:
        entries = json.loads(search_path.read_text(encoding="utf-8", errors="strict"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        errors.append(f"cannot parse search-index.json: {exc}")
        entries = []
    by_url: dict[str, list[dict]] = defaultdict(list)
    if isinstance(entries, list):
        for entry in entries:
            if isinstance(entry, dict):
                by_url[str(entry.get("url", ""))].append(entry)
    else:
        errors.append("search-index.json must contain an array")
    for filename in CLUSTER:
        url = f"/futures-basics/{filename}"
        matches = by_url.get(url, [])
        if len(matches) != 1:
            errors.append(f"search-index.json must contain one {url} entry, found {len(matches)}")
            continue
        if clean_text(str(matches[0].get("title", ""))) != titles.get(filename, ""):
            errors.append(f"search-index title is stale for {filename}")
        if clean_text(str(matches[0].get("description", ""))) != descriptions.get(filename, ""):
            errors.append(f"search-index description is stale for {filename}")
        if matches[0].get("category") != "Futures Basics":
            errors.append(f"search-index category is wrong for {filename}")

    sitemap_path = ROOT / "sitemap.xml"
    sitemap_values: dict[str, list[str]] = defaultdict(list)
    try:
        tree = ET.parse(sitemap_path)
        namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        for node in tree.findall("sm:url", namespace):
            loc = node.findtext("sm:loc", default="", namespaces=namespace)
            lastmod = node.findtext("sm:lastmod", default="", namespaces=namespace)
            sitemap_values[loc].append(lastmod)
    except (OSError, ET.ParseError) as exc:
        errors.append(f"cannot parse sitemap.xml: {exc}")
    for filename in CLUSTER:
        url = f"{BASE_URL}/futures-basics/{filename}"
        lastmods = sitemap_values.get(url, [])
        if len(lastmods) != 1:
            errors.append(f"sitemap.xml must contain one {url}, found {len(lastmods)}")
        elif lastmods[0][:10] < REVIEW_DATE:
            errors.append(f"sitemap lastmod is stale for {filename}: {lastmods[0]}")

    return errors, warnings


def validate_page(path: Path, id_cache: dict[Path, set[str]]):
    errors: list[str] = []
    warnings: list[str] = []
    try:
        raw = path.read_text(encoding="utf-8", errors="strict")
    except FileNotFoundError:
        return ["file is missing"], [], None, "", []
    except UnicodeDecodeError as exc:
        return [f"not strict UTF-8: {exc}"], [], None, "", []

    parser = PageParser()
    try:
        parser.feed(raw)
        parser.close()
    except Exception as exc:  # HTMLParser is forgiving; any exception is material.
        errors.append(f"HTML parser failure: {exc}")
    page = parser.page

    expected_canonical = f"{BASE_URL}/futures-basics/{path.name}"
    title = page.title_parts[0] if len(page.title_parts) == 1 else ""
    h1s = [text for level, text in page.headings if level == 1]
    h2s = [text for level, text in page.headings if level == 2]
    description = meta_value(page, "name", "description")

    if page.doctype != "doctype html":
        errors.append("missing HTML5 doctype")
    if page.lang.lower() not in {"en", "en-us"}:
        errors.append("html lang must be en or en-US")
    if len(page.title_parts) != 1 or not title:
        errors.append("must contain exactly one nonempty title")
    elif not 25 <= len(title) <= 68:
        warnings.append(f"title length is {len(title)} characters")
    if len(description) != 1 or not description[0]:
        errors.append("must contain exactly one meta description")
    elif not 90 <= len(description[0]) <= 170:
        warnings.append(f"meta description length is {len(description[0])} characters")
    robots = [value.lower() for value in meta_value(page, "name", "robots")]
    if len(robots) != 1 or "index" not in robots[0] or "follow" not in robots[0]:
        errors.append("robots meta must be exactly one index, follow directive")
    viewports = meta_value(page, "name", "viewport")
    if len(viewports) != 1 or "width=device-width" not in viewports[0].lower():
        errors.append("missing responsive viewport meta")
    charsets = [m.get("charset", "").lower() for m in page.metas if "charset" in m]
    if charsets != ["utf-8"]:
        errors.append("must contain exactly one UTF-8 charset meta")

    canonicals = canonical_values(page)
    if canonicals != [expected_canonical]:
        errors.append(f"canonical mismatch: {canonicals!r}")
    required_metas = (
        ("property", "og:title"),
        ("property", "og:description"),
        ("property", "og:type"),
        ("property", "og:url"),
        ("property", "og:site_name"),
        ("property", "og:image"),
        ("property", "og:image:alt"),
        ("property", "article:published_time"),
        ("property", "article:modified_time"),
        ("name", "twitter:card"),
        ("name", "twitter:title"),
        ("name", "twitter:description"),
        ("name", "twitter:image"),
        ("name", "twitter:image:alt"),
    )
    for key, value in required_metas:
        if len(meta_value(page, key, value)) != 1:
            errors.append(f"missing or duplicate {value} meta")
    if meta_value(page, "property", "og:url") not in ([expected_canonical],):
        errors.append("og:url must equal canonical")
    if meta_value(page, "property", "article:modified_time") != [REVIEW_DATE]:
        errors.append(f"article:modified_time must be {REVIEW_DATE}")
    if meta_value(page, "property", "og:type") != ["article"]:
        errors.append("og:type must be article")

    stylesheets = stylesheet_values(page)
    if "../style.css" not in stylesheets:
        errors.append("missing ../style.css")
    if "/futures-basics/currency-research-library.css?v=20260820a" not in stylesheets:
        errors.append("missing versioned 6B research stylesheet")
    if not any("currency-library" in classes for classes in page.main_classes):
        errors.append("main wrapper is missing currency-library class")

    if len(h1s) != 1:
        errors.append(f"must contain exactly one h1, found {len(h1s)}")
    previous = 0
    for level, heading in page.headings:
        if not heading:
            errors.append(f"empty h{level}")
        if previous and level > previous + 1:
            errors.append(f"heading-level jump h{previous} to h{level} near {heading!r}")
        previous = level
    duplicate_ids = [value for value, count in Counter(page.ids).items() if count > 1]
    if duplicate_ids:
        errors.append(f"duplicate ids: {duplicate_ids}")
    if any("alt" not in attrs or not attrs.get("alt", "").strip() for attrs in page.img_attrs):
        errors.append("every image must have an explicit nonempty alt")
    for anchor in page.anchors:
        if anchor.get("target", "").lower() == "_blank":
            rel = {item.lower() for item in anchor.get("rel", "").split()}
            if "noopener" not in rel:
                errors.append(f"target=_blank link lacks noopener: {anchor.get('href', '')}")

    for anchor in page.anchors:
        href = anchor.get("href", "").strip()
        if not href or href == "#":
            errors.append(f"empty placeholder anchor href: {href!r}")
            continue
        target_info = resolve_internal_target(path, href)
        if target_info is None:
            continue
        target, fragment = target_info
        try:
            target.relative_to(ROOT)
        except ValueError:
            errors.append(f"internal link escapes repository: {href}")
            continue
        if not target.exists():
            errors.append(f"broken internal link: {href}")
        elif fragment and target.suffix.lower() == ".html" and fragment not in ids_for(target, id_cache):
            errors.append(f"missing target fragment: {href}")

    schemas: list[object] = []
    for index, payload in enumerate(page.jsonld_texts, start=1):
        try:
            schemas.append(json.loads(payload))
        except json.JSONDecodeError as exc:
            errors.append(f"JSON-LD block {index} is invalid: {exc}")
    nodes = [node for schema in schemas for node in schema_nodes(schema)]
    articles = [node for node in nodes if "Article" in schema_types(node)]
    breadcrumbs = [node for node in nodes if "BreadcrumbList" in schema_types(node)]
    faqs = [node for node in nodes if "FAQPage" in schema_types(node)]
    if len(articles) != 1:
        errors.append(f"must contain exactly one Article schema, found {len(articles)}")
    else:
        article = articles[0]
        if h1s and clean_text(str(article.get("headline", ""))) != h1s[0]:
            errors.append("Article headline must equal visible h1")
        if clean_text(str(article.get("description", ""))) != clean_text(description[0] if description else ""):
            errors.append("Article description must equal meta description")
        author = article.get("author", {})
        if not isinstance(author, dict) or author.get("name") != "Kyle Parrott":
            errors.append("Article author must be Kyle Parrott")
        if article.get("dateModified") != REVIEW_DATE:
            errors.append(f"Article dateModified must be {REVIEW_DATE}")
        if article.get("url") != expected_canonical:
            errors.append("Article url must equal canonical")
        main_entity = article.get("mainEntityOfPage", "")
        main_id = main_entity.get("@id", "") if isinstance(main_entity, dict) else main_entity
        if main_id != expected_canonical:
            errors.append("Article mainEntityOfPage must equal canonical")
    if len(breadcrumbs) != 1:
        errors.append(f"must contain exactly one BreadcrumbList schema, found {len(breadcrumbs)}")
    else:
        items = breadcrumbs[0].get("itemListElement", [])
        if not isinstance(items, list) or len(items) != 3:
            errors.append("BreadcrumbList must contain three items")
        elif items[-1].get("item") != expected_canonical:
            errors.append("final breadcrumb item must equal canonical")

    if len(faqs) > 1:
        errors.append("must not contain more than one FAQPage schema")
    if faqs:
        questions = faqs[0].get("mainEntity", [])
        visible_entries = visible_faq_entries(raw)
        if not visible_entries:
            errors.append("FAQ schema exists without visible details/summary questions")
        schema_entries: list[tuple[str, str]] = []
        for item in questions if isinstance(questions, list) else []:
            if not isinstance(item, dict):
                continue
            accepted = item.get("acceptedAnswer", {})
            answer_text = accepted.get("text", "") if isinstance(accepted, dict) else ""
            schema_entries.append((clean_text(str(item.get("name", ""))), clean_text(str(answer_text))))
        if [item[0] for item in schema_entries] != [item[0] for item in visible_entries]:
            errors.append("FAQ schema questions must exactly match visible summaries in order")
        if [item[1] for item in schema_entries] != [item[1] for item in visible_entries]:
            errors.append("FAQ schema answers must exactly match visible answers in order")

    word_count = len(re.findall(r"\b[\w’'-]+\b", article_text(raw), flags=re.UNICODE))
    if word_count < 1100:
        errors.append(f"article body is too thin for this rebuild: {word_count} words")
    if "Kyle Parrott" not in article_text(raw):
        errors.append("visible article body lacks Kyle Parrott attribution")
    if "Updated August 13, 2026" not in article_text(raw):
        errors.append("visible article body lacks the review date")
    if not re.search(r'class=["\'][^"\']*fx-sources\b', raw, flags=re.I):
        errors.append("missing visible fx-sources disclosure")
    if not re.search(r'class=["\'][^"\']*fx-disclaimer\b', raw, flags=re.I):
        errors.append("missing visible fx-disclaimer")
    for marker in MOJIBAKE_MARKERS:
        if marker in raw:
            errors.append(f"mojibake marker present: {marker!r}")
    if re.search(r"\b(no-bullshit|blunt guide|blunt breakdown)\b", raw, flags=re.I):
        errors.append("stale house-language phrase remains")

    table_count = len(re.findall(r"<table\b", raw, flags=re.I))
    region_table_count = len(
        re.findall(
            r'<(?:div|section)\b[^>]*\brole=["\']region["\'][^>]*>.*?<table\b',
            raw,
            flags=re.I | re.S,
        )
    )
    if table_count and region_table_count < table_count:
        errors.append(f"all tables must be inside labeled role=region wrappers ({region_table_count}/{table_count})")

    return errors, warnings, page, title, h2s


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--warnings-as-errors", action="store_true")
    args = parser.parse_args()

    id_cache: dict[Path, set[str]] = {}
    all_errors: dict[str, list[str]] = defaultdict(list)
    all_warnings: dict[str, list[str]] = defaultdict(list)
    titles: dict[str, str] = {}
    descriptions: dict[str, str] = {}
    h1s: dict[str, str] = {}
    normalized_h2_owners: dict[str, list[str]] = defaultdict(list)

    for filename in CLUSTER:
        path = ARTICLE_DIR / filename
        errors, warnings, page, title, h2_values = validate_page(path, id_cache)
        all_errors[filename].extend(errors)
        all_warnings[filename].extend(warnings)
        if page is None:
            continue
        titles[filename] = title
        desc = meta_value(page, "name", "description")
        descriptions[filename] = desc[0] if desc else ""
        visible_h1 = [value for level, value in page.headings if level == 1]
        h1s[filename] = visible_h1[0] if len(visible_h1) == 1 else ""
        for heading in h2_values:
            normalized = normalize_heading(heading)
            if normalized and normalized not in GENERIC_H2:
                normalized_h2_owners[normalized].append(filename)

    for label, mapping in (("title", titles), ("meta description", descriptions), ("h1", h1s)):
        owners: dict[str, list[str]] = defaultdict(list)
        for filename, value in mapping.items():
            owners[clean_text(value).lower()].append(filename)
        for value, filenames in owners.items():
            if value and len(filenames) > 1:
                message = f"duplicate cluster {label}: {value!r} shared by {filenames}"
                for filename in filenames:
                    all_errors[filename].append(message)

    for heading, filenames in normalized_h2_owners.items():
        if len(set(filenames)) > 1:
            message = f"repeated normalized H2 {heading!r} across {sorted(set(filenames))}"
            for filename in set(filenames):
                all_warnings[filename].append(message)

    sync_errors, sync_warnings = validate_cluster_sync(titles, descriptions)
    all_errors["<synchronization>"].extend(sync_errors)
    all_warnings["<synchronization>"].extend(sync_warnings)

    css = ARTICLE_DIR / "currency-research-library.css"
    if not css.exists() or css.stat().st_size < 5000:
        all_errors["<shared>"].append("currency-research-library.css?v=20260820a is missing or unexpectedly small")
    else:
        css_text = css.read_text(encoding="utf-8", errors="strict")
        event_value_rule = re.search(
            r"\.fx-event-metrics\s+strong\s*\{(?P<body>.*?)\}",
            css_text,
            flags=re.I | re.S,
        )
        if not event_value_rule or not re.search(
            r"\bcolor\s*:\s*var\(--fx-ink\)\s*;",
            event_value_rule.group("body") if event_value_rule else "",
            flags=re.I,
        ):
            all_errors["<shared>"].append(
                "fx-event-metrics strong must set var(--fx-ink) to prevent low-contrast hero inheritance"
            )

    error_count = sum(len(items) for items in all_errors.values())
    warning_count = sum(len(items) for items in all_warnings.values())
    for filename in sorted(set(all_errors) | set(all_warnings)):
        errors = all_errors.get(filename, [])
        warnings = all_warnings.get(filename, [])
        if not errors and not warnings:
            continue
        print(filename)
        for message in errors:
            print(f"  ERROR: {message}")
        for message in warnings:
            print(f"  WARN:  {message}")

    print(f"Checked {len(CLUSTER)} core 6B pages: {error_count} errors, {warning_count} warnings.")
    if error_count or (args.warnings_as_errors and warning_count):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
