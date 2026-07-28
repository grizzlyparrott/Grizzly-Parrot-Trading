#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse

ROOT = Path(__file__).resolve().parents[2]
BASE_URL = "https://grizzlyparrottrading.com"
BASE_HOST = urlparse(BASE_URL).netloc
ARTIFACT_DIR = ROOT / "artifacts" / "seo-audit"
ARTIFACT_JSON = ARTIFACT_DIR / "public-html-audit.json"
ARTIFACT_SUMMARY = ARTIFACT_DIR / "summary.md"

SKIP_DIRS = {".git", ".github", ".vscode", "__pycache__", "node_modules", "dist", "build", "site", ".idea", ".sass-cache", ".cache"}

RE_LINK = re.compile(r'<link\b[^>]*>', re.IGNORECASE)
RE_META = re.compile(r'<meta\b[^>]*>', re.IGNORECASE)
RE_A = re.compile(r'<a\b[^>]*\bhref\s*=\s*("|")([^"\']+?)\1', re.IGNORECASE)
RE_SCRIPT = re.compile(r'<script\b[^>]*>(.*?)</script>', re.IGNORECASE | re.DOTALL)
RE_TITLE = re.compile(r'<title>(.*?)</title>', re.IGNORECASE | re.DOTALL)
RE_H1 = re.compile(r'<h1\b[^>]*>(.*?)</h1>', re.IGNORECASE | re.DOTALL)
RE_ATTR = re.compile(r'(\w[\w\-:]*)\s*=\s*("|")([^"\']*?)\2', re.DOTALL)
RE_GA = re.compile(r'googletagmanager\\.com/gtag/js\?id=', re.IGNORECASE)

SEARCH_DIRS = {
    "futures-basics",
    "tools",
    "prop-firm-trading",
    "platforms-tutorials",
    "market-basics",
    "currencies",
    "energies",
    "metals",
    "books",
}

LINK_ALIAS_MAP = {
    "understanding-si-calendar-spreads.html": "si-calendar-spreads-explained.html",
    "liquidity-pools.html": "market-basics/liquidity-pools-basics.html",
    "order-flow-imbalance.html": "market-basics/order-flow-imbalance-explained.html",
    "platinum-futures-overview.html": "futures-basics/what-are-platinum-futures.html",
    "dxy-impact-on-gold-futures.html": "futures-basics/dxy-impact-on-gc.html",
    "market-correlation-basics.html": "market-basics/market-correlations-basics.html",
    "bookmap-liquidity-behavior.html": "platforms-tutorials/bookmap-liquidity-explained.html",
    "../market-basics/market-correlation-basics.html": "market-basics/market-correlations-basics.html",
    "futures-margin-explained.html": "futures-basics/futures-margin-requirements-explained.html",
    "../market-basics/risk-on-vs-risk-off.html": "market-basics/risk-on-risk-off-basics.html",
    "why-6j-moves.html": "futures-basics/why-6c-moves.html",
    "6j-contract-specs.html.html": "futures-basics/6j-contract-specs.html",
    "market-liquidity-cycles.html": "market-basics/market-liquidity-basics.html",
    "../market-basics/market-liquidity-cycles.html": "market-basics/market-liquidity-basics.html",
    "margin-policy-differences.html": "prop-firm-trading/policy-change-frequency.html",
    "../prop-firm-trading/margin-policy-differences.html": "prop-firm-trading/policy-change-frequency.html",
    "treasury-yields-explained.html": "futures-basics/6j-and-bond-yields-relationship.html",
    "market-environments-trending-ranging-chop.html": "market-basics/trending-vs-choppy-markets-how-to-spot-the-difference.html",
    "../futures-basics/market-environments-trending-ranging-chop.html": "market-basics/trending-vs-choppy-markets-how-to-spot-the-difference.html",
    "gc-news-volatility-guide.html": "futures-basics/gc-volatility-profile-atr.html",
    "contract-size-risk-explained.html": "futures-basics/contract-size-risk-impact.html",
    "order-flow-gap-causes.html": "market-basics/order-flow-imbalance-explained.html",
    "contract-specifications-6c.html": "futures-basics/6c-tick-size-tick-value.html",
    "gc-vs-si-how-they-differ.html": "futures-basics/why-si-differs-from-gc-volatility-liquidity.html",
    "volume-divergence-when-price-moves-lie.html": "market-basics/volume-divergence-when-price-moves-but-participation-doesnt.html",
    "ninjatrader-8-dom-basics.html": "platforms-tutorials/ninjatrader-dom-settings.html",
    "ninjatrader-8-fibonacci-basics.html": "platforms-tutorials/ninjatrader-8-drawing-tools-basics.html",
    "ninjatrader-crosshair-basics.html": "platforms-tutorials/ninjatrader-chart-properties-basics.html",
}

CATEGORY_LABELS = {
    "futures-basics": "Futures Basics",
    "tools": "Tools",
    "prop-firm-trading": "Prop Firm Trading",
    "platforms-tutorials": "Platforms & Tutorials",
    "market-basics": "Market Basics",
    "currencies": "Currencies",
    "energies": "Energies",
    "metals": "Metals",
    "books": "Books",
}

DEFAULT_OG_IMAGE = "https://grizzlyparrottrading.com/OG-default.png"
AUTHOR_URL = "https://grizzlyparrottrading.com/about.html"


def attrs(tag: str) -> dict:
    return {k.lower(): v for k, _q, v in RE_ATTR.findall(tag)}


def set_attr(tag: str, key: str, value: str) -> str:
    pattern = re.compile(rf'\b{re.escape(key)}\s*=\s*("|")([^"\']*?)\1', re.IGNORECASE)
    if pattern.search(tag):
        return pattern.sub(f'{key}="{value}"', tag, count=1)
    if tag.endswith('/>'):
        return tag[:-2] + f' {key}="{value}" />'
    return tag[:-1] + f' {key}="{value}" >'


def normalize_path(path: str) -> str:
    path = path or ""
    path = path.replace("\\", "/")
    path = re.sub(r"/+", "/", path)
    if not path.startswith("/"):
        path = "/" + path
    if path == "/index.html":
        return "/"
    if path.endswith("/index.html"):
        return path[:-10] + "/"
    return path


def normalize_lookup_path(path: str) -> str:
    path = path or ""
    path = path.replace("\\", "/")
    path = re.sub(r"/+", "/", path)
    if not path.startswith("/"):
        path = "/" + path
    return path


def normalize_site_url(value: str) -> str:
    if not value:
        return ""
    parsed = urlparse(value)
    if not parsed.scheme:
        parsed = urlparse(urljoin(BASE_URL + "/", value))
    if parsed.scheme not in {"http", "https"}:
        return value
    if parsed.netloc.lower() != BASE_HOST:
        return value
    path = normalize_path(parsed.path)
    return urlunparse(("https", BASE_HOST, path, "", "", ""))


def canonical_from_rel(rel: str) -> str:
    rel = rel.replace("\\", "/")
    if rel == "index.html":
        return f"{BASE_URL}/"
    if rel.endswith("/index.html"):
        return f"{BASE_URL}/{rel[:-len('index.html')]}"
    return f"{BASE_URL}/{rel}"


def classify(rel: str) -> str:
    if rel == "index.html":
        return "home"
    if rel.endswith("/index.html"):
        return "hub"
    if rel in {"about.html", "contact.html", "privacy.html", "disclaimer.html", "app.html"}:
        return "page"
    if "/" in rel:
        return "article"
    return "page"


def parse_metadata(rel: str, html: str) -> dict:
    title_tags = [t.strip() for t in RE_TITLE.findall(html)]
    h1_tags = [re.sub(r"\s+", " ", t).strip() for t in RE_H1.findall(html)]

    meta_name = defaultdict(list)
    meta_prop = defaultdict(list)
    for tag in RE_META.finditer(html):
        a = attrs(tag.group(0))
        if "name" in a:
            meta_name[a["name"].lower()].append(a.get("content", ""))
        if "property" in a:
            meta_prop[a["property"].lower()].append(a.get("content", ""))

    canonical = ""
    canonical_count = 0
    for tag in RE_LINK.finditer(html):
        a = attrs(tag.group(0))
        if "rel" in a and a.get("rel", "").lower() == "canonical":
            canonical = a.get("href", "")
            canonical_count += 1

    json_blocks = []
    json_valid = 0
    json_types = set()
    main_entities = []
    breadcrumb_urls = []

    def repair_json(raw: str) -> str:
        fixed = raw.strip()
        fixed = re.sub(r"'name'\s*:", '"name":', fixed)
        fixed = re.sub(r'(\"position\"\s*:\s*\d+)\s*\n\s*\"name\"\s*:', r'\1,\n"name":', fixed)
        return fixed

    for script in RE_SCRIPT.finditer(html):
        open_tag = html[script.start():script.start() + script.group(0).find(">") + 1]
        sa = attrs(open_tag)
        if sa.get("type", "").lower() != "application/ld+json":
            continue
        raw = script.group(1)
        parsed = None
        for candidate in (raw.strip(), repair_json(raw.strip())):
            try:
                parsed = json.loads(candidate)
                break
            except Exception:
                pass
        if parsed is None:
            json_blocks.append((script.group(0), None, False))
            continue
        json_valid += 1
        if isinstance(parsed, dict):
            t = parsed.get("@type", "")
            if isinstance(t, str):
                json_types.add(t)
            elif isinstance(t, list):
                json_types.update(str(x) for x in t)
            me = parsed.get("mainEntityOfPage")
            if isinstance(me, str):
                main_entities.append(me)
            elif isinstance(me, dict) and isinstance(me.get("@id"), str):
                main_entities.append(me.get("@id"))

            if t == "BreadcrumbList":
                for item in parsed.get("itemListElement", []) or []:
                    if isinstance(item, dict) and isinstance(item.get("item"), str):
                        breadcrumb_urls.append(item["item"])

        json_blocks.append((script.group(0), parsed, True))

    robots = next((x.lower() for x in meta_name.get("robots", [""]) if x), "")

    return {
        "path": rel,
        "classification": classify(rel),
        "indexable": rel != "404.html" and "noindex" not in robots,
        "title": title_tags[0] if title_tags else "",
        "title_count": len(title_tags),
        "description": meta_name.get("description", [""])[0],
        "description_count": len(meta_name.get("description", [])),
        "h1_texts": h1_tags,
        "h1_count": len(h1_tags),
        "canonical": canonical,
        "canonical_count": canonical_count,
        "canonical_norm": normalize_site_url(canonical),
        "canonical_self": canonical_from_rel(rel),
        "og_url": meta_prop.get("og:url", [""])[0],
        "og_fields_present": sorted({k for k in ["og:title", "og:description", "og:type", "og:url", "og:site_name", "og:image"] if meta_prop.get(k.replace("og:", ""), [])}),
        "twitter_fields_present": sorted({k for k in ["twitter:card", "twitter:title", "twitter:description", "twitter:image"] if meta_name.get(k, [])}),
        "main_entities": main_entities,
        "breadcrumb_urls": breadcrumb_urls,
        "ga4_count": len(RE_GA.findall(html)),
        "jsonld_types": sorted(json_types),
        "jsonld_invalid_count": len([1 for _, _p, ok in json_blocks if not ok]),
        "json_blocks": json_blocks,
        "raw_html": html,
        "meta_name": meta_name,
        "meta_prop": meta_prop,
    }


def replace_meta(html: str, selector: str, key: str, value: str) -> tuple[str, bool]:
    pattern = None
    replacement = False
    if selector == "name":
        pattern = re.compile(rf'<meta\b[^>]*\bname\s*=\s*("|")\s*{re.escape(key)}\s*\1[^>]*>', re.IGNORECASE)
    else:
        pattern = re.compile(rf'<meta\b[^>]*\bproperty\s*=\s*("|")\s*{re.escape(key)}\s*\1[^>]*>', re.IGNORECASE)

    m = pattern.search(html)
    if m:
        tag = m.group(0)
        new_tag = set_attr(tag, "content", value)
        return html[:m.start()] + new_tag + html[m.end():], tag != new_tag

    if "</head>" in html:
        return html.replace("</head>", f'<meta {selector}="{key}" content="{value}">\n</head>', 1), True
    return html, False


def ensure_canonical(html: str, canonical: str) -> tuple[str, bool]:
    tag_texts = [t.group(0) for t in RE_LINK.finditer(html)]
    for t in tag_texts:
        a = attrs(t)
        rel = a.get("rel", "").lower()
        if rel == "canonical":
            new_tag = set_attr(t, "href", canonical)
            if new_tag == t:
                return html, False
            return html.replace(t, new_tag, 1), True
    # insert near head
    return html.replace("</head>", f'<link rel="canonical" href="{canonical}">\n</head>', 1), True


def canonicalize_json_blocks(html: str, row: dict) -> tuple[str, int]:
    changed = 0
    blocks = [b for b in row["json_blocks"] if b[1] is not None]
    if not blocks:
        return html, changed
    # update from right to left to keep offsets stable
    html_out = html
    for block_raw, parsed, ok in reversed(blocks):
        if not ok:
            continue
        if not isinstance(parsed, dict):
            continue
        updated = False
        jtype = parsed.get("@type", "")
        if jtype == "Article":
            parsed["mainEntityOfPage"] = row["canonical_new"]
            parsed["url"] = row["canonical_new"]
            parsed["headline"] = row["title"]
            if row["description"]:
                parsed["description"] = row["description"]
            auth = parsed.get("author")
            if isinstance(auth, str):
                auth = {"@type": "Person", "name": auth}
            if not isinstance(auth, dict):
                auth = {"@type": "Person", "name": "Kyle Parrott"}
            auth["@type"] = "Person"
            auth["name"] = "Kyle Parrott"
            auth["url"] = AUTHOR_URL
            parsed["author"] = auth
            pub = parsed.get("publisher")
            if not isinstance(pub, dict):
                pub = {"@type": "Organization"}
            pub.setdefault("name", "Grizzly Parrot Trading")
            pub.setdefault("url", f"{BASE_URL}/")
            logo = pub.get("logo")
            if isinstance(logo, dict):
                logo.setdefault("@type", "ImageObject")
                logo.setdefault("url", DEFAULT_OG_IMAGE)
            else:
                logo = {"@type": "ImageObject", "url": DEFAULT_OG_IMAGE}
            pub["logo"] = logo
            parsed["publisher"] = pub
            parsed.setdefault("image", DEFAULT_OG_IMAGE)
            updated = True
        elif jtype == "BreadcrumbList":
            items = parsed.get("itemListElement")
            if isinstance(items, list) and items:
                last = items[-1]
                if isinstance(last, dict):
                    last["item"] = row["canonical_new"]
                    if row["h1_texts"]:
                        last["name"] = row["h1_texts"][0]
                    updated = True

        if updated:
            new_payload = json.dumps(parsed, ensure_ascii=False, indent=2)
            replacement = f'<script type="application/ld+json">\n{new_payload}\n</script>'
            html_out = html_out.replace(block_raw, replacement, 1)
            changed += 1
    return html_out, changed


def resolve_target(rel: str, href: str, all_paths: set[str], basename_map: dict[str, list[str]]) -> str:
    normalized = href
    alias_target = LINK_ALIAS_MAP.get(normalized)
    if alias_target is None:
        basename = Path(urlparse(normalized).path).name
        alias_target = LINK_ALIAS_MAP.get(basename)
    if alias_target is not None:
        normalized = alias_target
    # returns canonical path (relative path string) or ""

    parsed = urlparse(normalized)
    if parsed.scheme and parsed.scheme not in {"", "http", "https"}:
        return ""
    if parsed.scheme in {"http", "https"}:
        if parsed.netloc.lower() != BASE_HOST:
            return ""
        path = normalize_lookup_path(parsed.path)
    else:
        if parsed.path.startswith("#"):
            return ""
        base = BASE_URL + "/"
        parent = Path(rel).parent.as_posix()
        if parent != ".":
            base = f"{BASE_URL}/{parent}/"
        path = normalize_lookup_path(urlparse(urljoin(base, normalized)).path)

    rel_clean = path.lstrip("/")
    if rel_clean == "":
        rel_clean = "index.html"
    if rel_clean in all_paths:
        return rel_clean
    if rel_clean.endswith("/") and rel_clean + "index.html" in all_paths:
        return rel_clean + "index.html"
    if rel_clean.endswith("/index.html") and rel_clean in all_paths:
        return rel_clean
    if rel_clean.endswith(".html.html") and rel_clean[:-5] in all_paths:
        return rel_clean[:-5]
    if not rel_clean.endswith(".html"):
        html_like = rel_clean + ".html"
        if html_like in all_paths:
            return html_like
    # unique basename fallback
    if rel_clean in basename_map and len(basename_map[rel_clean]) == 1:
        return basename_map[rel_clean][0]
    stem = Path(rel_clean).name
    if stem in basename_map and len(basename_map[stem]) == 1:
        return basename_map[stem][0]
    return ""


def update_links(
    rel: str,
    html: str,
    canonical_map: dict[str, str],
    all_paths: set[str],
    basename_map: dict[str, list[str]],
    duplicate_aliases: set[str] | None = None,
) -> tuple[str, list[str], list[str], list[str]]:
    broken = []
    redirects = []
    links_found = []

    def repl(m: re.Match) -> str:
        quote = m.group(1)
        href = m.group(2)
        links_found.append(href)
        low = href.lower()
        if href.startswith("${"):
            return m.group(0)
        if href.startswith("#") or low.startswith(("mailto:", "tel:", "javascript:")):
            return m.group(0)

        parsed = urlparse(href)
        if parsed.scheme and parsed.scheme in {"mailto", "tel", "javascript"}:
            return m.group(0)

        target_rel = resolve_target(rel, href, all_paths, basename_map)
        if not target_rel:
            if parsed.scheme:
                return m.group(0)
            broken.append(href)
            return m.group(0)

        alias_hit = href in LINK_ALIAS_MAP or (
            duplicate_aliases is not None and target_rel in duplicate_aliases
        )

        new_target = canonical_map[target_rel]
        p = parsed if parsed else urlparse(href)
        compare_path = normalize_lookup_path(p.path)
        if compare_path.endswith(".html.html"):
            compare_path = compare_path[:-5]
        suffix = ""
        if p.query:
            suffix += f"?{p.query}"
        if p.fragment:
            suffix += f"#{p.fragment}"

        if not alias_hit and new_target != f"{BASE_URL}{compare_path}":
            redirects.append(f"{href} -> {new_target}")

        if p.fragment and not parsed.scheme:
            # keep in case no query
            pass
        new_href = new_target + suffix
        if href == new_href:
            return m.group(0)
        return f'<a href={quote}{new_href}{quote}'

    new_html = RE_A.sub(repl, html)
    return new_html, links_found, sorted(set(broken)), sorted(set(redirects))


def fix_searchaction_home(html: str) -> str:
    if "\"@type\": \"SearchAction\"" not in html:
        return html
    if "#articles" not in html:
        return html
    return re.sub(r',?\n\s*"potentialAction"\s*:\s*\{\s*"@type"\s*:\s*"SearchAction"[^\}]*\}\s*', '', html, flags=re.S)


def main() -> None:
    pages = []
    for p in sorted(ROOT.rglob("*.html")):
        if p == ROOT / "artifacts" / "seo-audit" / "public-html-audit.json":
            continue
        rel_parts = p.relative_to(ROOT).parts
        if any(part.startswith(".") for part in rel_parts):
            continue
        if rel_parts and rel_parts[0] in SKIP_DIRS:
            continue
        rel = p.relative_to(ROOT).as_posix()
        html = p.read_text(encoding="utf-8", errors="ignore")
        rec = parse_metadata(rel, html)
        rec["path_obj"] = p
        pages.append(rec)

    all_paths = {r["path"] for r in pages}
    basename_map = defaultdict(list)
    for rel in all_paths:
        basename_map[Path(rel).name.lower()].append(rel)

    # canonical decision from existing canonical (if valid) or fallback
    by_canonical = defaultdict(list)
    for r in pages:
        req = r["canonical_norm"] or r["canonical_self"]
        by_canonical[req].append(r)

    canonical_new = {}
    duplicate_aliases = set()

    for req, group in by_canonical.items():
        owner = next((g for g in group if g["canonical_self"] == req), None)
        if owner is None:
            owner = sorted(group, key=lambda x: x["path"])[0]
        for g in group:
            canonical_new[g["path"]] = owner["canonical_self"]
            if len(group) > 1 and g["path"] != owner["path"]:
                duplicate_aliases.add(g["path"])

    # apply duplicate-title canonicalization only when more than one indexable page
    # shares a title; keep existing noindex aliases untouched when indexable duplicates = 1.
    title_to_paths = defaultdict(list)
    for r in pages:
        if r["title"]:
            title_to_paths[r["title"]].append(r)
    for title, group in title_to_paths.items():
        indexable_members = [r for r in group if r["indexable"]]
        if len(indexable_members) <= 1:
            continue
        owner_path = sorted(indexable_members, key=lambda x: x["path"])[0]["path"]
        owner_canonical = canonical_new[owner_path]
        for r in sorted(group, key=lambda x: x["path"]):
            if r["path"] == owner_path:
                continue
            if canonical_new.get(r["path"]) != owner_canonical:
                canonical_new[r["path"]] = owner_canonical
            duplicate_aliases.add(r["path"])

    for r in pages:
        r["canonical_new"] = canonical_new[r["path"]]

    # fix content + collect final link diagnostics
    broken_total_before = 0
    broken_total_after = 0
    redirect_total = 0
    canonical_updates = 0
    og_updates = 0
    twitter_updates = 0
    og_missing = 0

    for r in pages:
        html = r["raw_html"]
        rel = r["path"]

        # canonical
        updated = False
        html, changed = ensure_canonical(html, r["canonical_new"])
        updated = updated or changed
        canonical_updates += int(changed)

        # OG required fields
        for key, val in {
            "og:title": r["title"],
            "og:description": r["description"],
            "og:type": "article" if r["classification"] == "article" else "website",
            "og:url": r["canonical_new"],
            "og:site_name": "Grizzly Parrot Trading",
            "og:image": DEFAULT_OG_IMAGE,
        }.items():
            if val:
                html, changed = replace_meta(html, "property", key, val.replace('"', '&quot;'))
                og_updates += int(changed)
        # twitter fields
        for key, val in {
            "twitter:card": "summary_large_image",
            "twitter:title": r["title"],
            "twitter:description": r["description"],
            "twitter:image": DEFAULT_OG_IMAGE,
        }.items():
            if val:
                html, changed = replace_meta(html, "name", key, val.replace('"', '&quot;'))
                twitter_updates += int(changed)

        if r["description_count"] == 0:
            # fallback missing description from title
            r["description"] = (r["title"] + " | Grizzly Parrot Trading").strip(" |")
            html, changed = replace_meta(html, "name", "description", r["description"])
            if changed:
                og_missing += 1

        # homepage SearchAction cleanup
        if rel == "index.html":
            html = fix_searchaction_home(html)

        if rel in duplicate_aliases:
            html, changed = replace_meta(html, "name", "robots", "noindex, follow")
            if changed:
                og_updates += 1

        # internal links and rewrites
        html, found_links, broken, redirects = update_links(
            rel,
            html,
            canonical_new,
            all_paths,
            basename_map,
            duplicate_aliases=duplicate_aliases,
        )
        r["links_raw"] = found_links
        r["broken_internal_links_after"] = broken
        r["redirecting_internal_links_after"] = redirects
        broken_total_after += len(broken)
        redirect_total += len(redirects)

        # json-ld updates
        html, json_changed = canonicalize_json_blocks(html, r)
        if json_changed:
            r["jsonld_fixed"] = True

        if html != r["raw_html"]:
            r["path_obj"].write_text(html, encoding="utf-8")

    # rebuild fresh metadata from updated files and finalize
    final_rows = []
    for r in pages:
        rel = r["path"]
        html = r["path_obj"].read_text(encoding="utf-8", errors="ignore")
        final = parse_metadata(rel, html)
        final["canonical"] = canonical_new[rel]
        final["canonical_norm"] = final["canonical_new"] = canonical_new[rel]
        final["canonical_url"] = canonical_new[rel]
        final["title"] = final["title"] or r["title"]
        final["h1_texts"] = final["h1_texts"] or r["h1_texts"]
        final["classification"] = r["classification"]
        final["live_http_status"] = ""

        # canonical / og / jsonld checks
        final["main_entity"] = final["main_entities"][0] if final["main_entities"] else ""
        final["canonical_matches_og"] = (final["canonical"] == normalize_site_url(final["og_url"]))
        final["canonical_matches_main_entity"] = bool(final["main_entity"] and normalize_site_url(final["main_entity"]) == final["canonical"])
        final["canonical_matches_breadcrumb"] = bool(final["breadcrumb_urls"] and final["breadcrumb_urls"][-1] == final["canonical"])

        # links
        final["internal_links"] = [link for link in r["links_raw"] if not urlparse(link).path.startswith("mailto:")]
        final["navigation_links"] = final["internal_links"]
        final["broken_internal_links"] = r["broken_internal_links_after"]
        final["broken_internal_links_count"] = len(r["broken_internal_links_after"])
        final["redirecting_internal_links"] = r["redirecting_internal_links_after"]
        final["redirecting_internal_links_count"] = len(r["redirecting_internal_links_after"])

        final_rows.append(final)

    title_counts = Counter(r["title"] for r in final_rows if r["indexable"] and r["title"])
    desc_counts = Counter(r["description"] for r in final_rows if r["indexable"] and r["description"])

    # inbound counts and orphan
    inbound = Counter()
    for fr in final_rows:
        for link in fr["internal_links"]:
            tgt = resolve_target(fr["path"], link, all_paths, basename_map)
            if tgt and tgt in all_paths:
                inbound[tgt] += 1

    for fr in final_rows:
        fr["inbound_links_count"] = inbound[fr["path"]]
        fr["orphan"] = fr["indexable"] and fr["inbound_links_count"] == 0
        fr["duplicate_title"] = title_counts.get(fr["title"], 0) > 1
        fr["duplicate_description"] = desc_counts.get(fr["description"], 0) > 1

    # canonical identity conflicts and sitemap inclusion
    canonical_to_paths = defaultdict(list)
    for fr in final_rows:
        if fr["indexable"]:
            canonical_to_paths[fr["canonical"]].append(fr["path"])

    canonical_included = set()
    for fr in final_rows:
        can = fr["canonical"]
        if not fr["indexable"]:
            continue
        if fr["canonical"] == canonical_from_rel(fr["path"]) and fr["classification"] in {"home", "hub", "article", "page"}:
            canonical_included.add(can)

    for fr in final_rows:
        fr["sitemap_included"] = fr["indexable"] and fr["canonical"] in canonical_included

    # rebuild search index
    entries = []
    for fr in final_rows:
        if not fr["indexable"]:
            continue
        if fr["classification"] != "article":
            continue
        top = fr["path"].split("/")[0]
        if top not in SEARCH_DIRS:
            continue
        if fr["canonical"] != canonical_from_rel(fr["path"]):
            continue
        entries.append({
            "title": fr["title"],
            "url": fr["canonical"].replace(BASE_URL, ""),
            "description": fr["description"],
            "category": CATEGORY_LABELS.get(top, top),
        })

    # uniqueness & sort
    dedup = {}
    for e in entries:
        if e["url"] not in dedup:
            dedup[e["url"]] = e
    search_entries = sorted(dedup.values(), key=lambda x: x["title"].lower())

    with (ROOT / "search-index.json").open("w", encoding="utf-8") as f:
        json.dump(search_entries, f, ensure_ascii=False, indent=2)

    # rewrite sitemap deterministically
    sitemap_urls = sorted(canonical_included)
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for url in sitemap_urls:
        rel = urlparse(url).path.lstrip("/")
        file_path = ROOT / rel
        if rel == "":
            file_path = ROOT / "index.html"
        if file_path.is_dir():
            file_path = file_path / "index.html"
        if not file_path.exists() and rel.endswith("/"):
            file_path = (ROOT / rel[:-1]) / "index.html"
        if not file_path.exists() and rel.endswith("/index.html"):
            file_path = ROOT / rel[:-10] / "index.html"

        if file_path.exists():
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        else:
            mtime = datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        lines.append("  <url>")
        lines.append(f"    <loc>{url}</loc>")
        lines.append(f"    <lastmod>{mtime}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")

    audit_rows = []
    for fr in final_rows:
        audit_rows.append({
            "path": fr["path"],
            "classification": fr["classification"],
            "indexable": fr["indexable"],
            "live_http_status": fr["live_http_status"],
            "title": fr["title"],
            "title_count": fr["title_count"],
            "description": fr["description"],
            "description_count": fr["description_count"],
            "h1_count": fr["h1_count"],
            "h1_texts": fr["h1_texts"],
            "canonical": fr["canonical"],
            "og_url": normalize_site_url(fr["meta_prop"].get("og:url", [""])[0]) if isinstance(fr["meta_prop"], dict) else "",
            "mainEntityOfPage": fr["main_entities"][0] if fr["main_entities"] else "",
            "breadcrumb_urls": fr["breadcrumb_urls"],
            "navigation_links": fr["navigation_links"],
            "internal_links": fr["internal_links"],
            "ga4_count": fr["ga4_count"],
            "og_fields_present": fr["og_fields_present"],
            "twitter_fields_present": fr["twitter_fields_present"],
            "jsonld_valid": fr["jsonld_invalid_count"] == 0,
            "jsonld_invalid_count": fr["jsonld_invalid_count"],
            "jsonld_types": fr["jsonld_types"],
            "sitemap_included": fr["sitemap_included"],
            "inbound_links_count": fr["inbound_links_count"],
            "orphan": fr["orphan"],
            "broken_internal_links": fr["broken_internal_links"],
            "broken_internal_links_count": fr["broken_internal_links_count"],
            "redirecting_internal_links": fr["redirecting_internal_links"],
            "redirecting_internal_links_count": fr["redirecting_internal_links_count"],
            "duplicate_title": fr["duplicate_title"],
            "duplicate_description": fr["duplicate_description"],
            "canonical_matches_og": fr["canonical_matches_og"],
            "canonical_matches_main_entity": fr["canonical_matches_main_entity"],
            "canonical_matches_breadcrumb": fr["canonical_matches_breadcrumb"],
            "canonical_identity_count": len(canonical_to_paths.get(fr["canonical"], [])) if fr["indexable"] else 0,
        })

    audit = {
        "generated_at": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_html_pages": len(final_rows),
        "indexable_pages": sum(1 for r in final_rows if r["indexable"]),
        "canonical_conflicts": sum(1 for v in canonical_to_paths.values() if len(v) > 1),
        "duplicate_titles": sum(1 for c in title_counts.values() if c > 1),
        "duplicate_descriptions": sum(1 for c in desc_counts.values() if c > 1),
        "total_broken_links": broken_total_after,
        "canonical_index_links": len(canonical_to_paths),
        "rows": audit_rows,
    }

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_JSON.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = [
        "# SEO audit summary",
        f"Total HTML pages: {audit['total_html_pages']}",
        f"Indexable pages: {audit['indexable_pages']}",
        f"Canonical conflicts: {audit['canonical_conflicts']}",
        f"Duplicate titles: {audit['duplicate_titles']}",
        f"Duplicate descriptions: {audit['duplicate_descriptions']}",
        f"Canonical updates: {canonical_updates}",
        f"JSON-LD changed blocks: {sum(1 for fr in final_rows if fr.get('jsonld_fixed', False))}",
        f"Sitemap URLs: {len(sitemap_urls)}", 
        f"Search index entries: {len(search_entries)}",
        f"Broken internal links: {broken_total_after}",
        f"Redirecting internal links: {redirect_total}",
    ]
    ARTIFACT_SUMMARY.write_text("\n".join(summary) + "\n", encoding="utf-8")

    print(f"updated_pages={len(final_rows)}")
    print(f"canonical_updates={canonical_updates}")
    print(f"sitemap_urls={len(sitemap_urls)}")
    print(f"search_entries={len(search_entries)}")
    print(f"broken_after={broken_total_after}")
    print(f"redirects={redirect_total}")
    print(f"artifact={ARTIFACT_JSON}")


if __name__ == "__main__":
    main()

