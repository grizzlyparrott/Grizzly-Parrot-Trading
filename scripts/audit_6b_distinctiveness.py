#!/usr/bin/env python3
"""Cross-page sameness audit for the 20-page core 6B research library."""

from __future__ import annotations

import argparse
import html
import itertools
import json
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from validate_6b_cluster import ARTICLE_DIR, CLUSTER, clean_text, normalize_heading


CLASS_FAMILIES = (
    "gb-section",
    "gb-panel",
    "gb-table",
    "gb-process",
    "gb-method",
    "gb-check-grid",
    "gb-limit-grid",
    "gb-proof-grid",
    "gb-stat-grid",
    "gb-event-card",
    "gb-caution",
    "gb-related",
    "gb-faq",
)


def strip_tags(value: str) -> str:
    return clean_text(re.sub(r"<[^>]+>", " ", value))


def capture_one(raw: str, pattern: str) -> str:
    match = re.search(pattern, raw, flags=re.I | re.S)
    return strip_tags(match.group(1)) if match else ""


def capture_many(raw: str, pattern: str) -> list[str]:
    return [strip_tags(value) for value in re.findall(pattern, raw, flags=re.I | re.S)]


def normalized_tokens(value: str) -> list[str]:
    value = html.unescape(value).lower()
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", value)


def shingles(tokens: list[str], size: int = 8) -> set[tuple[str, ...]]:
    if len(tokens) < size:
        return set()
    return {tuple(tokens[index : index + size]) for index in range(len(tokens) - size + 1)}


def jaccard(left: set, right: set) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


def structure_signature(raw: str) -> dict[str, int]:
    return {
        family: len(re.findall(rf'\bclass=["\'][^"\']*\b{re.escape(family)}\b', raw, flags=re.I))
        for family in CLASS_FAMILIES
    }


def main() -> int:
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument("--json", type=Path, help="Optional machine-readable report path")
    args = arg_parser.parse_args()

    pages: dict[str, dict] = {}
    paragraph_owners: dict[str, set[str]] = defaultdict(set)
    heading_owners: dict[str, set[str]] = defaultdict(set)
    kicker_owners: dict[str, set[str]] = defaultdict(set)
    hero_owners: dict[str, set[str]] = defaultdict(set)

    for filename in CLUSTER:
        path = ARTICLE_DIR / filename
        raw = path.read_text(encoding="utf-8", errors="strict")
        body_match = re.search(
            r"<!--\s*ARTICLE BODY START\s*-->(.*?)<!--\s*ARTICLE BODY END\s*-->",
            raw,
            flags=re.I | re.S,
        )
        body = body_match.group(1) if body_match else raw
        # Remove disclosures from lexical similarity; those should be consistent.
        body_for_similarity = re.sub(
            r'<(?:details|aside)\b[^>]*class=["\'][^"\']*\bgb-(?:sources|disclaimer)\b[^>]*>.*?</(?:details|aside)>',
            " ",
            body,
            flags=re.I | re.S,
        )
        h2s = capture_many(body, r"<h2\b[^>]*>(.*?)</h2>")
        paragraphs = [
            value
            for value in capture_many(body_for_similarity, r"<p\b[^>]*>(.*?)</p>")
            if len(normalized_tokens(value)) >= 12
            and not value.startswith("By Kyle Parrott")
            and not value.startswith("Educational and risk disclaimer")
        ]
        kickers = capture_many(body, r'<p\b[^>]*class=["\'][^"\']*\bgb-kicker\b[^"\']*["\'][^>]*>(.*?)</p>')
        hero = capture_one(body, r'<p\b[^>]*class=["\'][^"\']*\bgb-hero-lede\b[^"\']*["\'][^>]*>(.*?)</p>')
        normalized_body = " ".join(strip_tags(body_for_similarity).split())
        normalized_h2s = [normalize_heading(value) for value in h2s]

        for paragraph in paragraphs:
            paragraph_owners[" ".join(normalized_tokens(paragraph))].add(filename)
        for heading in normalized_h2s:
            if heading:
                heading_owners[heading].add(filename)
        for kicker in kickers:
            normalized = " ".join(normalized_tokens(kicker))
            if normalized:
                kicker_owners[normalized].add(filename)
        hero_key = " ".join(normalized_tokens(hero))
        if hero_key:
            hero_owners[hero_key].add(filename)

        pages[filename] = {
            "hero": hero,
            "h2s": h2s,
            "normalized_h2s": normalized_h2s,
            "paragraphs": paragraphs,
            "tokens": normalized_tokens(normalized_body),
            "signature": structure_signature(body),
            "kickers": kickers,
        }

    errors: list[str] = []
    warnings: list[str] = []
    duplicate_paragraphs = {
        paragraph: sorted(owners)
        for paragraph, owners in paragraph_owners.items()
        if len(owners) > 1
    }
    for paragraph, owners in sorted(duplicate_paragraphs.items(), key=lambda item: (-len(item[1]), item[0])):
        errors.append(f"exact substantive paragraph repeated across {owners}: {paragraph[:180]}")
    for hero, owners in hero_owners.items():
        if len(owners) > 1:
            errors.append(f"hero lede repeated across {sorted(owners)}: {hero[:180]}")

    pair_rows = []
    for left_name, right_name in itertools.combinations(CLUSTER, 2):
        left = pages[left_name]
        right = pages[right_name]
        h2_sequence = SequenceMatcher(
            None,
            " | ".join(left["normalized_h2s"]),
            " | ".join(right["normalized_h2s"]),
        ).ratio()
        hero_similarity = SequenceMatcher(None, left["hero"].lower(), right["hero"].lower()).ratio()
        lexical_overlap = jaccard(shingles(left["tokens"]), shingles(right["tokens"]))
        signature_matches = sum(
            left["signature"][family] == right["signature"][family]
            for family in CLASS_FAMILIES
        )
        structure_similarity = signature_matches / len(CLASS_FAMILIES)
        row = {
            "left": left_name,
            "right": right_name,
            "h2_sequence_similarity": round(h2_sequence, 4),
            "hero_similarity": round(hero_similarity, 4),
            "lexical_8gram_jaccard": round(lexical_overlap, 4),
            "structure_count_similarity": round(structure_similarity, 4),
        }
        pair_rows.append(row)
        if h2_sequence >= 0.82:
            warnings.append(f"very similar H2 sequence ({h2_sequence:.2f}): {left_name} <> {right_name}")
        if hero_similarity >= 0.78:
            warnings.append(f"very similar hero rhetoric ({hero_similarity:.2f}): {left_name} <> {right_name}")
        if lexical_overlap >= 0.12:
            errors.append(f"unusually high 8-word overlap ({lexical_overlap:.3f}): {left_name} <> {right_name}")
        if structure_similarity == 1.0:
            warnings.append(f"identical component-count signature: {left_name} <> {right_name}")

    repeated_h2s = {
        heading: sorted(owners)
        for heading, owners in heading_owners.items()
        if len(owners) > 1
    }
    for heading, owners in repeated_h2s.items():
        warnings.append(f"normalized H2 repeated across {owners}: {heading}")
    repeated_kickers = {
        kicker: sorted(owners)
        for kicker, owners in kicker_owners.items()
        if len(owners) >= 4
    }
    for kicker, owners in repeated_kickers.items():
        warnings.append(f"kicker reused on {len(owners)} pages: {kicker}")

    signature_counter = Counter(
        tuple(page["signature"][family] for family in CLASS_FAMILIES)
        for page in pages.values()
    )
    unique_signatures = len(signature_counter)
    if unique_signatures < 8:
        errors.append(f"only {unique_signatures} distinct component-count signatures across 20 pages")

    report = {
        "page_count": len(pages),
        "unique_component_signatures": unique_signatures,
        "errors": errors,
        "warnings": warnings,
        "repeated_h2s": repeated_h2s,
        "repeated_kickers_on_four_or_more_pages": repeated_kickers,
        "duplicate_substantive_paragraphs": duplicate_paragraphs,
        "top_pairwise_h2_similarity": sorted(
            pair_rows, key=lambda item: item["h2_sequence_similarity"], reverse=True
        )[:15],
        "top_pairwise_lexical_overlap": sorted(
            pair_rows, key=lambda item: item["lexical_8gram_jaccard"], reverse=True
        )[:15],
        "page_signatures": {name: page["signature"] for name, page in pages.items()},
    }
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    for message in errors:
        print(f"ERROR: {message}")
    for message in warnings:
        print(f"WARN:  {message}")
    print(
        f"Audited {len(pages)} pages: {unique_signatures} component signatures, "
        f"{len(errors)} errors, {len(warnings)} warnings."
    )
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
