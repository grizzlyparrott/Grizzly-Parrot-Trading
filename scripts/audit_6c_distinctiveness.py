#!/usr/bin/env python3
"""Cross-page sameness audit for the 20-page core 6C research library."""

from __future__ import annotations

import argparse
import html
import itertools
import json
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from validate_6c_cluster import ARTICLE_DIR, CLUSTER, clean_text, normalize_heading


CLASS_FAMILIES = (
    "fx-section",
    "fx-panel",
    "fx-table",
    "fx-process",
    "fx-method",
    "fx-two-column",
    "fx-atlas",
    "fx-bars",
    "fx-calculator",
    "fx-correlation-scale",
    "fx-formula",
    "fx-market-board",
    "fx-check-grid",
    "fx-limit-grid",
    "fx-proof-grid",
    "fx-stat-grid",
    "fx-event-card",
    "fx-caution",
    "fx-decision-strip",
    "fx-decision-tree",
    "fx-checklist",
    "fx-cost-tape",
    "fx-go-card",
    "fx-trade-card",
    "fx-level-ledger",
    "fx-reaction-grid",
    "fx-contract-path",
    "fx-thesis-callout",
    "fx-three-column",
    "fx-four-grid",
    "fx-task-paths",
    "fx-window-equation",
    "fx-lifecycle",
    "fx-quote-board",
    "fx-risk-grid",
    "fx-use-cases",
    "fx-causal-map",
    "fx-falsification-tree",
    "fx-state-machine",
    "fx-estimator-spectrum",
    "fx-transition-guards",
    "fx-claim-ladder",
    "fx-related",
    "fx-faq",
)

SEQUENCE_FAMILIES = set(CLASS_FAMILIES) - {"fx-section"}
REQUIRED_REVIEW_SENTENCE = "sources and methods were reviewed august 13 2026"


def strip_tags(value: str) -> str:
    return clean_text(re.sub(r"<[^>]+>", " ", value))


def capture_one(raw: str, pattern: str) -> str:
    match = re.search(pattern, raw, flags=re.I | re.S)
    if not match:
        return ""
    value = match.groupdict().get("value") if match.groupdict() else None
    return strip_tags(value if value is not None else match.group(1))


def capture_many(raw: str, pattern: str) -> list[str]:
    return [strip_tags(value) for value in re.findall(pattern, raw, flags=re.I | re.S)]


def disclosure_paragraphs(raw: str) -> list[str]:
    paragraphs: list[str] = []
    pattern = re.compile(
        r'<(?P<tag>details|aside|section)\b[^>]*class=["\'][^"\']*\bfx-(?:sources|disclaimer)\b[^>]*>'
        r'(?P<body>.*?)</(?P=tag)>',
        flags=re.I | re.S,
    )
    for match in pattern.finditer(raw):
        paragraphs.extend(capture_many(match.group("body"), r"<p\b[^>]*>(.*?)</p>"))
    return paragraphs


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


def table_shapes(raw: str) -> list[list[int]]:
    shapes: list[list[int]] = []
    for table in re.findall(r"<table\b[^>]*>(.*?)</table>", raw, flags=re.I | re.S):
        rows = re.findall(r"<tr\b[^>]*>(.*?)</tr>", table, flags=re.I | re.S)
        shapes.append(
            [
                len(re.findall(r"<(?:th|td)\b", row, flags=re.I))
                for row in rows
            ]
        )
    return shapes


def component_profile(raw: str) -> dict[str, object]:
    process_blocks = re.findall(
        r'<(?:div|section)\b[^>]*class=["\'][^"\']*\bfx-process\b[^"\']*["\'][^>]*>(.*?)</(?:div|section)>',
        raw,
        flags=re.I | re.S,
    )
    structural_classes: list[str] = []
    for class_value in re.findall(
        r'<(?:section|div|aside|details)\b[^>]*class=["\']([^"\']+)["\']',
        raw,
        flags=re.I,
    ):
        for value in class_value.split():
            if value not in SEQUENCE_FAMILIES:
                continue
            if not structural_classes or structural_classes[-1] != value:
                structural_classes.append(value)
    return {
        "table_count": len(re.findall(r"<table\b", raw, flags=re.I)),
        "table_shapes": table_shapes(raw),
        "panel_count": len(
            re.findall(r'\bclass=["\'][^"\']*\bfx-panel\b', raw, flags=re.I)
        ),
        "card_like_count": len(
            re.findall(
                r'\bclass=["\'][^"\']*\bfx-(?:event-card|stat|proof|panel)\b',
                raw,
                flags=re.I,
            )
        ),
        "process_count": len(process_blocks),
        "process_step_counts": [
            len(re.findall(r"<article\b", block, flags=re.I)) for block in process_blocks
        ],
        "faq_present": bool(re.search(r'\bfx-faq\b', raw, flags=re.I)),
        "distinctive_sequence": structural_classes,
        "opening_structure": structural_classes[:4],
        "ending_structure": structural_classes[-4:],
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
    ending_owners: dict[str, set[str]] = defaultdict(set)
    disclosure_sentence_owners: dict[str, set[str]] = defaultdict(set)
    disclosure_shingle_owners: dict[tuple[str, ...], set[str]] = defaultdict(set)

    for filename in CLUSTER:
        path = ARTICLE_DIR / filename
        raw = path.read_text(encoding="utf-8", errors="strict")
        body_match = re.search(
            r"<!--\s*ARTICLE BODY START\s*-->(.*?)<!--\s*ARTICLE BODY END\s*-->",
            raw,
            flags=re.I | re.S,
        )
        body = body_match.group(1) if body_match else raw
        # Keep legal/source boilerplate out of whole-body lexical scoring, then
        # audit disclosure prose separately so repetition cannot hide here.
        body_for_similarity = re.sub(
            r'<(?:details|aside)\b[^>]*class=["\'][^"\']*\bfx-(?:sources|disclaimer)\b[^>]*>.*?</(?:details|aside)>',
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
        kickers = capture_many(body, r'<p\b[^>]*class=["\'][^"\']*\bfx-kicker\b[^"\']*["\'][^>]*>(.*?)</p>')
        hero = capture_one(body, r'<p\b[^>]*class=["\'][^"\']*\bfx-hero-lede\b[^"\']*["\'][^>]*>(.*?)</p>')
        normalized_body = " ".join(strip_tags(body_for_similarity).split())
        normalized_h2s = [normalize_heading(value) for value in h2s]
        description = capture_one(
            raw,
            r'<meta\s+name=["\']description["\']\s+content=(?P<quote>["\'])(?P<value>.*?)(?P=quote)',
        )
        profile = component_profile(body)
        disclosures = disclosure_paragraphs(body)

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
        ending_key = " | ".join(profile["ending_structure"])
        if ending_key:
            ending_owners[ending_key].add(filename)
        for disclosure in disclosures:
            for sentence in re.split(r"(?<=[.!?])\s+", disclosure):
                key = " ".join(normalized_tokens(sentence))
                if len(key.split()) >= 7 and key != REQUIRED_REVIEW_SENTENCE:
                    disclosure_sentence_owners[key].add(filename)
            for shingle in shingles(normalized_tokens(disclosure), size=18):
                disclosure_shingle_owners[shingle].add(filename)

        pages[filename] = {
            "hero": hero,
            "h2s": h2s,
            "normalized_h2s": normalized_h2s,
            "paragraphs": paragraphs,
            "tokens": normalized_tokens(normalized_body),
            "signature": structure_signature(body),
            "kickers": kickers,
            "description": description,
            "disclosures": disclosures,
            "profile": profile,
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

    duplicate_disclosure_sentences = {
        sentence: sorted(owners)
        for sentence, owners in disclosure_sentence_owners.items()
        if len(owners) > 1
    }
    for sentence, owners in sorted(
        duplicate_disclosure_sentences.items(), key=lambda item: (-len(item[1]), item[0])
    ):
        errors.append(f"disclosure sentence repeated across {owners}: {sentence[:180]}")
    duplicate_disclosure_shingles = {
        " ".join(shingle): sorted(owners)
        for shingle, owners in disclosure_shingle_owners.items()
        if len(owners) > 1
    }
    for shingle, owners in sorted(
        duplicate_disclosure_shingles.items(), key=lambda item: (-len(item[1]), item[0])
    ):
        errors.append(f"18-word disclosure shingle repeated across {owners}: {shingle}")

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
        description_similarity = SequenceMatcher(
            None, left["description"].lower(), right["description"].lower()
        ).ratio()
        lexical_overlap = jaccard(shingles(left["tokens"]), shingles(right["tokens"]))
        skeleton_similarity = SequenceMatcher(
            None,
            left["profile"]["distinctive_sequence"],
            right["profile"]["distinctive_sequence"],
        ).ratio()
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
            "description_similarity": round(description_similarity, 4),
            "lexical_8gram_jaccard": round(lexical_overlap, 4),
            "structural_sequence_similarity": round(skeleton_similarity, 4),
            "structure_count_similarity": round(structure_similarity, 4),
        }
        pair_rows.append(row)
        if h2_sequence >= 0.82:
            warnings.append(f"very similar H2 sequence ({h2_sequence:.2f}): {left_name} <> {right_name}")
        if hero_similarity >= 0.78:
            warnings.append(f"very similar hero rhetoric ({hero_similarity:.2f}): {left_name} <> {right_name}")
        if description_similarity >= 0.84:
            warnings.append(
                f"near-duplicate meta descriptions ({description_similarity:.2f}): "
                f"{left_name} <> {right_name}"
            )
        if lexical_overlap >= 0.12:
            errors.append(f"unusually high 8-word overlap ({lexical_overlap:.3f}): {left_name} <> {right_name}")
        if skeleton_similarity >= 0.80:
            errors.append(
                f"near-duplicate component sequence ({skeleton_similarity:.2f}): "
                f"{left_name} <> {right_name}"
            )
        if structure_similarity >= 0.975 and skeleton_similarity >= 0.80:
            errors.append(
                f"near-identical component-count signature ({structure_similarity:.2f}): "
                f"{left_name} <> {right_name}"
            )

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
    repeated_endings = {
        ending: sorted(owners)
        for ending, owners in ending_owners.items()
        if len(owners) >= 5
    }
    for ending, owners in repeated_endings.items():
        warnings.append(f"ending component sequence reused on {len(owners)} pages: {ending}")

    signature_counter = Counter(
        tuple(page["signature"][family] for family in CLASS_FAMILIES)
        for page in pages.values()
    )
    unique_signatures = len(signature_counter)
    if unique_signatures != len(CLUSTER):
        errors.append(
            f"component-count signatures must be unique for all {len(CLUSTER)} pages; "
            f"found {unique_signatures}"
        )

    report = {
        "page_count": len(pages),
        "unique_component_signatures": unique_signatures,
        "errors": errors,
        "warnings": warnings,
        "repeated_h2s": repeated_h2s,
        "repeated_kickers_on_four_or_more_pages": repeated_kickers,
        "repeated_ending_structures_on_five_or_more_pages": repeated_endings,
        "duplicate_substantive_paragraphs": duplicate_paragraphs,
        "duplicate_disclosure_sentences": duplicate_disclosure_sentences,
        "duplicate_disclosure_18_word_shingles": duplicate_disclosure_shingles,
        "top_pairwise_h2_similarity": sorted(
            pair_rows, key=lambda item: item["h2_sequence_similarity"], reverse=True
        )[:15],
        "top_pairwise_lexical_overlap": sorted(
            pair_rows, key=lambda item: item["lexical_8gram_jaccard"], reverse=True
        )[:15],
        "top_pairwise_description_similarity": sorted(
            pair_rows, key=lambda item: item["description_similarity"], reverse=True
        )[:15],
        "top_pairwise_structural_sequence_similarity": sorted(
            pair_rows, key=lambda item: item["structural_sequence_similarity"], reverse=True
        )[:15],
        "page_signatures": {name: page["signature"] for name, page in pages.items()},
        "page_component_profiles": {name: page["profile"] for name, page in pages.items()},
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
