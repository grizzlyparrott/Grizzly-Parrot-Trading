#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from dataclasses import dataclass
from html import escape
from pathlib import Path
from typing import Dict, List

import sys


START_MARKER = "<!-- ARTICLE BODY START -->"
END_MARKER = "<!-- ARTICLE BODY END -->"
GA_ID = "G-JMJVR3G5YN"
UET_SRC = "/uet.js"


META_NAME = re.compile(r'<meta\b([^>]*)>', re.IGNORECASE | re.DOTALL)
LINK_TAG = re.compile(r'<link\b([^>]*)>', re.IGNORECASE | re.DOTALL)
SCRIPT_TAG = re.compile(
    r'<script\b([^>]*)>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)
ATTR_RE = re.compile(r'\b([a-zA-Z0-9:_-]+)\s*=\s*([\'"])(.*?)\2', re.DOTALL)


def html_attribute(value: str) -> str:
    return value.replace('"', "&quot;")


DOCTYPES_HEAD_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <!-- Standard Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">

  <!-- PNG Fallbacks -->
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/web-app-manifest-192x192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/web-app-manifest-512x512.png">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="robots" content="{robots}">

  <!-- Canonical -->
  <link rel="canonical" href="{canonical}">

  <!-- Open Graph -->
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{og_description}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{canonical}">
  <meta property="og:site_name" content="Grizzly Parrot Trading">
  <meta property="og:image" content="{og_image}">
  <meta property="og:image:width" content="{og_image_width}">
  <meta property="og:image:height" content="{og_image_height}">

  <!-- Twitter -->
  <meta name="twitter:card" content="{twitter_card}">
  <meta name="twitter:image" content="{twitter_image}">
  <meta name="twitter:title" content="{twitter_title}">
  <meta name="twitter:description" content="{twitter_description}">

  <link rel="stylesheet" href="{stylesheet}">

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id={ga_id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', '{ga_id}');
  </script>

  <!-- JSON-LD: Article -->
  <script type="application/ld+json">
{article_json}
  </script>

  <!-- JSON-LD: Breadcrumbs -->
  <script type="application/ld+json">
{breadcrumb_json}
  </script>

  <script src="{uet_src}" defer></script>
</head>
""".strip()


BODY_SHELL_TOP = """<body>

<header class="site-header">
  <div class="container header-inner">
    <div class="logo">
      <a href="/">
Grizzly Parrot Trading</a>
    </div>
    <nav class="main-nav">
      <ul>
        <li><a href="../futures-basics/index.html">Futures Basics</a></li>
        <li><a href="../metals/index.html">Metals</a></li>
        <li><a href="../energies/index.html">Energies</a></li>
        <li><a href="../currencies/index.html">Currencies</a></li>
        <li><a href="../prop-firm-trading/index.html">Prop Firms</a></li>
        <li><a href="../platforms-tutorials/index.html">Platforms</a></li>
        <li><a href="../market-basics/index.html">Market Basics</a></li>
        <li><a href="../tools/index.html">Tools</a></li>
      </ul>
    </nav>
  </div>
</header>

<main>
<section class="section">
<div class="container article-content">
"""


BODY_SHELL_BOTTOM = """</div>
</section>
</main>

<footer class="site-footer">
  <div class="container footer-inner">

    <div class="footer-book">
      <h3>Books</h3>
      <p>Market structure, risk, and execution frameworks.</p>
      <a href="/books/" class="footer-book-link">View All Books</a>
    </div>

    <div class="footer-links">
      <a href="/about.html">About</a>
      <a href="/disclaimer.html">Disclaimer</a>
      <a href="/privacy.html">Privacy</a>
      <a href="/contact.html">Contact</a>
    </div>

    <p class="footer-copy">
      &copy; <span id="year"></span> Grizzly Parrot Trading. All rights reserved.
    </p>
    <script>
      document.getElementById('year').textContent = new Date().getFullYear();
    </script>

  </div>
</footer>
</body>
</html>"""


@dataclass
class ValidationResult:
    title: str
    description: str
    robots: str
    canonical: str
    og_title: str
    og_description: str
    og_image: str
    og_image_width: str
    og_image_height: str
    twitter_title: str
    twitter_description: str
    twitter_card: str
    twitter_image: str
    stylesheet: str
    article_json: Dict
    breadcrumb_json: Dict
    body: str
    body_hash_before: str
    body_hash_after: str
    ga_count_before: int
    ga_count_after: int
    uet_count_before: int
    uet_count_after: int
    h1_count: int


def parse_attrs(tag_text: str) -> Dict[str, str]:
    attrs: Dict[str, str] = {}
    for name, _quote, value in ATTR_RE.findall(tag_text):
        attrs[name.lower()] = value
    return attrs


def unique_match(values: List[str], label: str) -> str:
    if len(values) != 1:
        raise ValueError(f"{label} expected exactly one match, found {len(values)}")
    return values[0]


def extract_meta_values(html: str, key: str, attr_name: str) -> List[str]:
    values: List[str] = []
    for meta in META_NAME.finditer(html):
        attrs = parse_attrs(meta.group(1))
        if attrs.get(attr_name, "").lower() == key:
            if "content" not in attrs:
                raise ValueError(f"meta {key} missing content")
            values.append(attrs["content"])
    return values


def extract_json_ld_blocks(html: str) -> List[Dict]:
    blocks: List[Dict] = []
    for match in SCRIPT_TAG.finditer(html):
        attrs = parse_attrs(match.group(1))
        if attrs.get("type", "").lower() != "application/ld+json":
            continue
        raw = match.group(2).strip()
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if isinstance(data, dict):
            blocks.append(data)
    return blocks


def extract_json_ld_by_type(html: str, expected_type: str) -> Dict:
    candidates: List[Dict] = []
    parse_failures = 0
    for match in SCRIPT_TAG.finditer(html):
        attrs = parse_attrs(match.group(1))
        if attrs.get("type", "").lower() != "application/ld+json":
            continue
        try:
            data = json.loads(match.group(2).strip())
        except Exception:
            parse_failures += 1
            continue
        if isinstance(data, dict) and data.get("@type") == expected_type:
            candidates.append(data)
    if len(candidates) != 1:
        raise ValueError(
            f"Expected exactly one @{expected_type} JSON-LD block, found {len(candidates)} (parse failures: {parse_failures})"
        )
    return candidates[0]


def extract_title(html: str) -> str:
    titles = re.findall(r"<title>(.*?)</title>", html, flags=re.IGNORECASE | re.DOTALL)
    return unique_match([t.strip() for t in titles], "title")


def count_markers(html: str, marker: str) -> int:
    return html.count(marker)


def extract_body(html: str) -> str:
    start_count = count_markers(html, START_MARKER)
    end_count = count_markers(html, END_MARKER)
    if start_count != 1 or end_count != 1:
        raise ValueError(f"body markers must be exactly one each (start={start_count}, end={end_count})")

    start = html.index(START_MARKER)
    end = html.index(END_MARKER)
    if end <= start:
        raise ValueError("ARTICLE BODY START appears after ARTICLE BODY END")
    return html[start + len(START_MARKER) : end]


def count_ga_uet(html: str) -> tuple[int, int]:
    ga_pattern = re.compile(
        fr'<script\b[^>]*src=["\']https://www\.googletagmanager\.com/gtag/js\?id={re.escape(GA_ID)}["\'][^>]*>',
        re.IGNORECASE,
    )
    ga_count = len(ga_pattern.findall(html))
    uet_count = len(re.findall(fr'<script\b[^>]*src=["\']{re.escape(UET_SRC)}["\'][^>]*>', html, flags=re.IGNORECASE))
    return ga_count, uet_count


def safe_json(data: Dict) -> str:
    return "\n".join("  " + line for line in json.dumps(data, ensure_ascii=False, indent=2).splitlines())


def validate_tags(html: str) -> bool:
    tokens = re.findall(r"<(/?)([a-zA-Z0-9]+)(?:\s[^>]*)?>", html)
    stack: List[str] = []
    self_closing = {"meta", "link", "img", "input", "br", "hr"}
    for closing, tag in tokens:
        tag = tag.lower()
        if closing == "/":
            if not stack:
                return False
            if stack[-1] != tag:
                return False
            stack.pop()
        else:
            if tag in self_closing:
                continue
            stack.append(tag)
    return len(stack) == 0


def extract_metadata(html: str) -> ValidationResult:
    title = extract_title(html)
    description = unique_match(
        extract_meta_values(html, "description", "name"),
        "meta description",
    )
    robots = unique_match(extract_meta_values(html, "robots", "name"), "meta robots")

    canonicals = []
    for link in LINK_TAG.finditer(html):
        attrs = parse_attrs(link.group(1))
        if attrs.get("rel", "").lower() == "canonical":
            if "href" not in attrs:
                raise ValueError("canonical link missing href")
            canonicals.append(attrs["href"])
    canonical = unique_match(canonicals, "canonical link")

    og_title = unique_match(extract_meta_values(html, "og:title", "property"), "og:title")
    og_description = unique_match(extract_meta_values(html, "og:description", "property"), "og:description")
    og_url = unique_match(extract_meta_values(html, "og:url", "property"), "og:url")
    og_image = unique_match(extract_meta_values(html, "og:image", "property"), "og:image")
    og_image_width = unique_match(extract_meta_values(html, "og:image:width", "property"), "og:image:width")
    og_image_height = unique_match(extract_meta_values(html, "og:image:height", "property"), "og:image:height")

    twitter_title = unique_match(extract_meta_values(html, "twitter:title", "name"), "twitter:title")
    twitter_description = unique_match(extract_meta_values(html, "twitter:description", "name"), "twitter:description")
    twitter_image = unique_match(extract_meta_values(html, "twitter:image", "name"), "twitter:image")
    twitter_card = unique_match(extract_meta_values(html, "twitter:card", "name"), "twitter:card")

    stylesheet_tags = []
    for link in LINK_TAG.finditer(html):
        attrs = parse_attrs(link.group(1))
        if attrs.get("rel", "").lower() == "stylesheet":
            stylesheet_tags.append(attrs.get("href", ""))
    stylesheet = unique_match(stylesheet_tags, "stylesheet link")
    if not stylesheet:
        raise ValueError("stylesheet href missing")

    article_json = extract_json_ld_by_type(html, "Article")
    breadcrumb_json = extract_json_ld_by_type(html, "BreadcrumbList")

    required_author = article_json.get("author", {}).get("name")
    if not required_author:
        raise ValueError("Article JSON-LD missing author.name")
    if not article_json.get("datePublished") or not article_json.get("dateModified"):
        raise ValueError("Article JSON-LD missing datePublished/dateModified")
    if not article_json.get("mainEntityOfPage"):
        raise ValueError("Article JSON-LD missing mainEntityOfPage")
    item_list = breadcrumb_json.get("itemListElement")
    if not isinstance(item_list, list) or len(item_list) < 3:
        raise ValueError("BreadcrumbList JSON-LD missing itemListElement position 3")
    if not item_list[2].get("name"):
        raise ValueError("BreadcrumbList position 3 name missing")

    if canonical != og_url:
        raise ValueError("canonical and og:url mismatch")
    if canonical != str(article_json.get("mainEntityOfPage")):
        raise ValueError("canonical and mainEntityOfPage mismatch")

    body = extract_body(html)
    h1_count = len(re.findall(r"<h1\b[^>]*>.*?</h1>", body, re.IGNORECASE | re.DOTALL))
    if h1_count != 1:
        raise ValueError(f"Expected exactly one h1 inside body, found {h1_count}")

    if not canonical.startswith("https://grizzlyparrottrading.com/"):
        raise ValueError("canonical URL is not site-local absolute URL")
    if not og_url.startswith("https://grizzlyparrottrading.com/"):
        raise ValueError("og:url is not site-local absolute URL")

    body_hash = hashlib.sha256(body.encode("utf-8")).hexdigest()
    ga_before, uet_before = count_ga_uet(html)

    return ValidationResult(
        title=title,
        description=description,
        robots=robots,
        canonical=canonical,
        og_title=og_title,
        og_description=og_description,
        og_image=og_image,
        og_image_width=og_image_width,
        og_image_height=og_image_height,
        twitter_title=twitter_title,
        twitter_description=twitter_description,
        twitter_card=twitter_card,
        twitter_image=twitter_image,
        stylesheet=stylesheet,
        article_json=article_json,
        breadcrumb_json=breadcrumb_json,
        body=body,
        body_hash_before=body_hash,
        body_hash_after=body_hash,  # will be validated by exact reinsertion
        ga_count_before=ga_before,
        uet_count_before=uet_before,
        ga_count_after=0,
        uet_count_after=0,
        h1_count=h1_count,
    )


def render_page(meta: ValidationResult) -> str:
    head = DOCTYPES_HEAD_TEMPLATE.format(
        title=html_attribute(meta.title),
        description=html_attribute(meta.description),
        robots=html_attribute(meta.robots),
        canonical=html_attribute(meta.canonical),
        og_title=html_attribute(meta.og_title),
        og_description=html_attribute(meta.og_description),
        og_image=html_attribute(meta.og_image),
        og_image_width=html_attribute(meta.og_image_width),
        og_image_height=html_attribute(meta.og_image_height),
        twitter_card=html_attribute(meta.twitter_card),
        twitter_image=html_attribute(meta.twitter_image),
        twitter_title=html_attribute(meta.twitter_title),
        twitter_description=html_attribute(meta.twitter_description),
        stylesheet=html_attribute(meta.stylesheet),
        ga_id=GA_ID,
        uet_src=escape(UET_SRC, quote=True),
        article_json=safe_json(meta.article_json),
        breadcrumb_json=safe_json(meta.breadcrumb_json),
    )

    content = (
        head
        + "\n"
        + BODY_SHELL_TOP
        + START_MARKER
        + meta.body
        + END_MARKER
        + "\n"
        + BODY_SHELL_BOTTOM
    )
    return content + "\n"


def validate_and_count_new_html(new_html: str, original: str) -> Dict[str, object]:
    ga_count_after, uet_count_after = count_ga_uet(new_html)
    ga_count_before, uet_count_before = count_ga_uet(original)
    counts = {
        "ga_count_before": ga_count_before,
        "ga_count_after": ga_count_after,
        "uet_count_before": uet_count_before,
        "uet_count_after": uet_count_after,
        "balanced_tags": validate_tags(new_html),
    }
    if "one h1" not in "":
        pass
    return counts


def normalize_file(path: Path, dry_run: bool) -> tuple[bool, Dict[str, str]]:
    original = path.read_text(encoding="utf-8")
    meta = extract_metadata(original)
    new_html = render_page(meta)
    new_meta = extract_metadata(new_html)
    new_html = new_html.rstrip("\n") + "\n"

    before_hash = meta.body_hash_before
    after_hash = hashlib.sha256(new_meta.body.encode("utf-8")).hexdigest()

    if before_hash != after_hash:
        raise ValueError("Protected article body hash mismatch after render")

    changed = original != new_html
    if not dry_run and changed:
        path.write_text(new_html, encoding="utf-8")

    counts = validate_and_count_new_html(new_html, original)
    if not counts["balanced_tags"]:
        raise ValueError("Tag imbalance detected in generated output")

    report = {
        "body_sha_before": before_hash,
        "body_sha_after": after_hash,
        "canonical": meta.canonical,
        "og_url": meta.article_json.get("mainEntityOfPage", ""),
        "main_entity": str(meta.article_json.get("mainEntityOfPage")),
        "ga_before": str(counts["ga_count_before"]),
        "ga_after": str(counts["ga_count_after"]),
        "uet_before": str(counts["uet_count_before"]),
        "uet_after": str(counts["uet_count_after"]),
        "h1_count": str(meta.h1_count),
        "balanced_tags": str(counts["balanced_tags"]),
    }
    return changed, report


def run(paths: list[str], dry_run: bool) -> int:
    exit_code = 0
    for raw in paths:
        file_path = Path(raw)
        if not file_path.is_absolute():
            file_path = (Path.cwd() / file_path).resolve()
        if not file_path.exists():
            print(f"[ERROR] Missing file: {file_path}")
            exit_code = 1
            continue

        print(f"[FILE] {file_path}")
        try:
            changed, report = normalize_file(file_path, dry_run)
        except Exception as exc:
            print(f"[ERROR] {file_path}: {exc}")
            exit_code = 1
            continue

        print(f"  changed: {changed}")
        for key, value in report.items():
            print(f"  {key}: {value}")

        print("  status: OK")

    return exit_code


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Normalize article HTML shell while preserving protected editorial body content."
    )
    parser.add_argument("paths", nargs="+", help="Explicit article HTML paths to process")
    parser.add_argument("--dry-run", action="store_true", help="Report changes without writing")
    args = parser.parse_args()
    return run(args.paths, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
