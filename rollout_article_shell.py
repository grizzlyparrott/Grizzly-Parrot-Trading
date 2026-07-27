#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from collections import defaultdict
from dataclasses import dataclass, asdict
import subprocess
from pathlib import Path
from typing import Optional

from normalize_article_html import extract_metadata, normalize_file

START_MARKER = "<!-- ARTICLE BODY START -->"
END_MARKER = "<!-- ARTICLE BODY END -->"

EXCLUDED_TOP_LEVEL = {
    "books",
    "tools",
    "fulfillment",
}

EXCLUDED_FILENAMES = {
    "index.html",
    "about.html",
    "contact.html",
    "disclaimer.html",
    "privacy.html",
    "404.html",
    "app.html",
}

NON_ARTICLE_HINTS = (
    "purchase-confirmation",
    "confirmation",
)

OUT_DIR = Path("outputs/sitewide-article-rollout")


@dataclass
class ArticleRecord:
    path: str
    category: str
    body_byte_length: int
    body_sha256: str
    file_sha256: str
    title: Optional[str]
    canonical: Optional[str]
    marker_start_count: int
    marker_end_count: int
    marker_valid: bool
    status: str
    reason: str = ""


@dataclass
class DryRunRecord:
    path: str
    changed: bool
    body_sha_before: str
    body_sha_after: str
    canonical: str
    og_url: str
    main_entity: str
    ga_before: int
    ga_after: int
    uet_before: int
    uet_after: int
    h1_count: int
    balanced_tags: str


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def marker_counts(text: str) -> tuple[int, int]:
    return text.count(START_MARKER), text.count(END_MARKER)


def extract_body(text: str) -> str:
    start_idx = text.index(START_MARKER)
    end_idx = text.index(END_MARKER)
    if end_idx <= start_idx:
        raise ValueError("ARTICLE BODY END before start")
    return text[start_idx + len(START_MARKER) : end_idx]


def title_and_canonical_from_metadata(text: str) -> tuple[str, str]:
    try:
        md = extract_metadata(text)
        return md.title, md.canonical
    except Exception as exc:
        raise RuntimeError(f"metadata extraction failed: {exc}")


def is_excluded_path(rel: Path) -> tuple[bool, str]:
    parts = rel.parts
    if not parts:
        return True, "empty-path"

    if parts[0] in EXCLUDED_TOP_LEVEL:
        return True, f"top-level-excluded:{parts[0]}"

    if rel.name.lower() in EXCLUDED_FILENAMES:
        return True, f"filename-excluded:{rel.name}"

    lowered_name = rel.name.lower()
    for hint in NON_ARTICLE_HINTS:
        if hint in lowered_name:
            return True, f"name-hint-excluded:{hint}"

    return False, ""


def classify_inventory(root: Path) -> dict:
    html_files = sorted([p for p in root.rglob("*.html") if p.is_file()])
    eligible: list[Path] = []
    records: list[ArticleRecord] = []
    skipped_missing_markers: list[str] = []
    skipped_duplicate_markers: list[str] = []

    for path in html_files:
        rel = path.relative_to(root)
        excluded, reason = is_excluded_path(rel)
        if excluded:
            continue

        text = path.read_text(encoding="utf-8")
        start_count, end_count = marker_counts(text)
        marker_valid = start_count == 1 and end_count == 1

        if start_count == 0 or end_count == 0:
            skipped_missing_markers.append(str(rel))
            records.append(
                ArticleRecord(
                    path=str(rel).replace("\\", "/"),
                    category=rel.parts[0],
                    body_byte_length=0,
                    body_sha256="",
                    file_sha256=sha256_file(path),
                    title=None,
                    canonical=None,
                    marker_start_count=start_count,
                    marker_end_count=end_count,
                    marker_valid=False,
                    status="missing-markers",
                    reason="missing one or both article body markers",
                )
            )
            continue

        if start_count != 1 or end_count != 1:
            skipped_duplicate_markers.append(str(rel))
            records.append(
                ArticleRecord(
                    path=str(rel).replace("\\", "/"),
                    category=rel.parts[0],
                    body_byte_length=0,
                    body_sha256="",
                    file_sha256=sha256_file(path),
                    title=None,
                    canonical=None,
                    marker_start_count=start_count,
                    marker_end_count=end_count,
                    marker_valid=False,
                    status="duplicate-markers",
                    reason="more than one article body marker",
                )
            )
            continue

        body = extract_body(text)
        body_len = len(body.encode("utf-8"))
        body_sha = sha256_text(body)
        file_sha = sha256_file(path)

        try:
            title, canonical = title_and_canonical_from_metadata(text)
            status = "eligible"
            reason = ""
        except Exception as exc:
            title, canonical = None, None
            status = "metadata-extraction-failed"
            reason = str(exc)

        rec = ArticleRecord(
            path=str(rel).replace("\\", "/"),
            category=rel.parts[0],
            body_byte_length=body_len,
            body_sha256=body_sha,
            file_sha256=file_sha,
            title=title,
            canonical=canonical,
            marker_start_count=start_count,
            marker_end_count=end_count,
            marker_valid=marker_valid,
            status=status,
            reason=reason,
        )
        records.append(rec)
        if status == "eligible":
            eligible.append(path)

    inventory = {
        "total_html_files": len(html_files),
        "eligible_articles": sum(1 for r in records if r.status == "eligible"),
        "records": [asdict(r) for r in records],
        "eligible_paths": [str(p.relative_to(root)).replace("\\", "/") for p in eligible],
        "skipped_missing_markers": skipped_missing_markers,
        "skipped_duplicate_markers": skipped_duplicate_markers,
    }
    return inventory


def run_normalizer_for_batch(paths: list[Path], dry_run: bool, root: Path) -> tuple[list[DryRunRecord], list[dict]]:
    dry_records: list[DryRunRecord] = []
    failures: list[dict] = []

    for p in paths:
        rel = str(p.relative_to(root)).replace("\\", "/")
        try:
            changed, report = normalize_file(p, dry_run=dry_run)
            dr = DryRunRecord(
                path=rel,
                changed=changed,
                body_sha_before=report["body_sha_before"],
                body_sha_after=report["body_sha_after"],
                canonical=report["canonical"],
                og_url=report["og_url"],
                main_entity=report["main_entity"],
                ga_before=int(report["ga_before"]),
                ga_after=int(report["ga_after"]),
                uet_before=int(report["uet_before"]),
                uet_after=int(report["uet_after"]),
                h1_count=int(report["h1_count"]),
                balanced_tags=report["balanced_tags"],
            )
            dry_records.append(dr)
        except Exception as exc:
            failures.append({"path": rel, "error": str(exc)})

    return dry_records, failures


def build_manifest_from_dry(records: list[DryRunRecord], root: Path, manifest_path: Path, stage: str) -> dict:
    manifest = {
        "stage": stage,
        "items": [
            {
                "path": r.path,
                "body_sha_before": r.body_sha_before,
                "body_sha_after": r.body_sha_after,
                "canonical": r.canonical,
                "file_sha256": sha256_file(root / r.path),
            }
            for r in records
            if r.path and r.body_sha_before == r.body_sha_after
        ],
        "count": len(records),
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def category_batches(items: list[str], batch_size: int) -> list[list[str]]:
    return [items[i : i + batch_size] for i in range(0, len(items), batch_size)]


def run_preflight(root: Path, out_dir: Path) -> dict:
    inventory = classify_inventory(root)
    out_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "preflight": {
            "total_html_files": inventory["total_html_files"],
            "eligible_articles": inventory["eligible_articles"],
            "missing_markers": sorted(inventory["skipped_missing_markers"]),
            "duplicate_markers": sorted(inventory["skipped_duplicate_markers"]),
            "metadata_extraction_failures": [],
            "already_compliant": 0,
            "would_change": 0,
            "dry_run_failures": [],
            "duplicate_tracking_installations": [],
            "protected_hash_mismatches": 0,
            "required_correction_touching_body": 0,
            "malformed_shell_findings": [],
            "refused_or_manual_review": [],
            "batch_summaries": [],
        },
        "records": [],
    }

    eligible = []
    for rec in inventory["records"]:
        status = rec["status"]
        if status == "metadata-extraction-failed":
            report["preflight"]["metadata_extraction_failures"].append(rec["path"])
            report["preflight"]["refused_or_manual_review"].append(
                {"path": rec["path"], "reason": rec["reason"], "class": "metadata"}
            )
            continue
        if status in {"missing-markers", "duplicate-markers"}:
            report["preflight"]["refused_or_manual_review"].append(
                {"path": rec["path"], "reason": rec["reason"], "class": status}
            )
            continue
        if status != "eligible":
            continue
        eligible.append(Path(rec["path"]))

    dry_records: list[DryRunRecord] = []
    failures: list[dict] = []
    # Run dry-run for all eligible pages up front.
    for p in eligible:
        rel_path = root / p
        c_records, f = run_normalizer_for_batch([rel_path], dry_run=True, root=root)
        if f:
            failures.extend(f)
            if f:
                report["preflight"]["refused_or_manual_review"].append(
                    {"path": f[0]["path"], "reason": f[0]["error"], "class": "dry-run"}
                )
            continue
        dry_records.extend(c_records)

    for rec in dry_records:
        record = {
            "path": rec.path,
            "status": "dry-run-complete",
            "changed": rec.changed,
            "ga_before": rec.ga_before,
            "ga_after": rec.ga_after,
            "uet_before": rec.uet_before,
            "uet_after": rec.uet_after,
            "h1_count": rec.h1_count,
            "body_sha_before": rec.body_sha_before,
            "body_sha_after": rec.body_sha_after,
            "canonical": rec.canonical,
            "og_url": rec.og_url,
            "main_entity": rec.main_entity,
            "balanced_tags": rec.balanced_tags,
        }
        report["records"].append(record)
        if not rec.changed:
            report["preflight"]["already_compliant"] += 1
        else:
            report["preflight"]["would_change"] += 1

        if rec.ga_before != 1 or rec.ga_after != 1:
            report["preflight"]["duplicate_tracking_installations"].append(
                {
                    "path": rec.path,
                    "ga_before": rec.ga_before,
                    "ga_after": rec.ga_after,
                    "issue": "ga-count-not-equal-to-one",
                }
            )
        if rec.uet_before != 1 or rec.uet_after != 1:
            report["preflight"]["duplicate_tracking_installations"].append(
                {
                    "path": rec.path,
                    "uet_before": rec.uet_before,
                    "uet_after": rec.uet_after,
                    "issue": "uet-count-not-equal-to-one",
                }
            )
        if rec.body_sha_before != rec.body_sha_after:
            report["preflight"]["protected_hash_mismatches"] += 1

        if rec.balanced_tags not in {"True", True}:
            report["preflight"]["malformed_shell_findings"].append({"path": rec.path, "issue": "unbalanced-tags"})

        if rec.ga_before != rec.ga_after or rec.uet_before != rec.uet_after:
            # this indicates normalizer rewrote install script counts; acceptable only if still one each
            if not (rec.ga_after == 1 and rec.uet_after == 1):
                report["preflight"]["malformed_shell_findings"].append(
                    {"path": rec.path, "issue": "tracking-count-change"}
                )

    report["preflight"]["dry_run_failures"] = failures

    inventory_path = out_dir / "preflight_inventory.json"
    manifest_path = out_dir / "preflight_records.json"
    output_pre = {
        "preflight": report["preflight"],
        "records": inventory["records"],
    }
    inventory_path.write_text(json.dumps(output_pre, indent=2), encoding="utf-8")
    manifest_path.write_text(json.dumps(report["records"], indent=2), encoding="utf-8")

    # Full manifest requested by user
    manifest_records = []
    for rec in inventory["records"]:
        if rec["status"] == "eligible":
            manifest_records.append(
                {
                    "path": rec["path"],
                    "body_byte_length": rec["body_byte_length"],
                    "body_sha256": rec["body_sha256"],
                    "file_sha256": rec["file_sha256"],
                    "title": rec["title"],
                    "canonical": rec["canonical"],
                    "category": rec["category"],
                }
            )
    manifest_path = out_dir / "pre_normalization_manifest.json"
    manifest_path.write_text(json.dumps(manifest_records, indent=2), encoding="utf-8")

    report_path = out_dir / "preflight_summary.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    return {
        "inventory": inventory,
        "preflight": report["preflight"],
        "eligible_paths": [r["path"] for r in inventory["records"] if r["status"] == "eligible"],
        "dry_records": [asdict(r) for r in dry_records],
    }


def run_apply(root: Path, out_dir: Path, batch_size: int, continue_if_missing: bool = True) -> dict:
    pre = json.loads((out_dir / "preflight_summary.json").read_text(encoding="utf-8"))
    eligible_paths = [
        r["path"]
        for r in pre.get("records", [])
        if r.get("status") == "eligible"
    ]
    category_map: dict[str, list[str]] = defaultdict(list)
    for path in eligible_paths:
        category = path.split("/")[0]
        category_map[category].append(path)

    for path_list in category_map.values():
        path_list.sort()

    batches = []
    for category, paths in category_map.items():
        chunks = category_batches(paths, batch_size)
        for idx, chunk in enumerate(chunks, 1):
            batches.append(
                {
                    "category": category,
                    "batch": idx,
                    "paths": chunk,
                }
            )

    out_dir.mkdir(parents=True, exist_ok=True)
    batch_summaries = []
    failed_any = False

    for b in batches:
        batch_paths = [root / p for p in b["paths"]]
        batch_name = f"{b['category']}_batch_{b['batch']}"
        batch_inventory_path = out_dir / f"{batch_name}_inventory.json"
        batch_inventory_path.write_text(
            json.dumps({"category": b["category"], "batch": b["batch"], "paths": b["paths"]}, indent=2),
            encoding="utf-8",
        )

        changed_records, failures = run_normalizer_for_batch(batch_paths, dry_run=True, root=root)
        if failures:
            failed_any = True
            batch_summaries.append({"batch": batch_name, "status": "dry-run-failed", "failures": failures})
            if not continue_if_missing:
                break
            continue

        # write deterministic, idempotent output for every candidate
        for p in batch_paths:
            # normalize_file with dry_run=False rewrites each page only if needed
            normalize_file(p, dry_run=False)

        # verify idempotent
        idem_records, idem_failures = run_normalizer_for_batch(batch_paths, dry_run=True, root=root)
        if idem_failures:
            failed_any = True
            batch_summaries.append({"batch": batch_name, "status": "idempotence-failed", "failures": idem_failures})
            if not continue_if_missing:
                break

        changed_after = [r["path"] for r in idem_records if r["changed"]]
        if changed_after:
            failed_any = True
            batch_summaries.append({"batch": batch_name, "status": "not-idempotent", "changed_after_second_pass": changed_after})
            if not continue_if_missing:
                break

        # write visual queue file per batch for downstream check
        visual_file = out_dir / f"{batch_name}_pages.txt"
        visual_file.write_text("\n".join(b["paths"]) + "\n", encoding="utf-8")

        # generate batch manifest for this batch (post-run)
        post_manifest = []
        for p in batch_paths:
            text = p.read_text(encoding="utf-8")
            s_cnt, e_cnt = marker_counts(text)
            if s_cnt != 1 or e_cnt != 1:
                continue
            body = extract_body(text)
            meta = extract_metadata(text)
            post_manifest.append(
                {
                    "path": str(p.relative_to(root)).replace("\\", "/"),
                    "body_byte_length": len(body.encode("utf-8")),
                    "body_sha256": sha256_text(body),
                    "file_sha256": sha256_file(p),
                    "canonical": meta.canonical,
                    "title": meta.title,
                    "category": p.relative_to(root).parts[0],
                }
            )
        (out_dir / f"{batch_name}_post_manifest.json").write_text(
            json.dumps(post_manifest, indent=2),
            encoding="utf-8",
        )

        batch_summaries.append({
            "batch": batch_name,
            "status": "applied",
            "files": b["paths"],
            "paths_changed": [r.path for r in changed_records if r.changed],
            "count": len(b["paths"]),
            "changed_count": sum(1 for r in changed_records if r.changed),
        })

        changed = [r.path for r in changed_records if r.changed]
        if changed:
            subprocess.run(["git", "add", *changed], cwd=str(root), check=True)
            commit_msg = f"chore: normalize article shell ({b['category']}) batch {b['batch']}"
            subprocess.run(["git", "commit", "-m", commit_msg], cwd=str(root), check=True)

    summary_path = out_dir / "apply_batch_summary.json"
    summary_path.write_text(
        json.dumps({"batches": batch_summaries, "failed": failed_any}, indent=2),
        encoding="utf-8",
    )
    return {"batches": batch_summaries, "failed": failed_any}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["preflight", "apply"])
    parser.add_argument("--batch-size", type=int, default=100)
    parser.add_argument("--root", type=Path, default=Path("."))
    args = parser.parse_args()

    root = args.root.resolve()
    out_dir = root / OUT_DIR

    if args.mode == "preflight":
        run_preflight(root, out_dir)
        print("preflight complete")
        return 0

    result = run_apply(root, out_dir, args.batch_size)
    print("apply complete", result.get("failed"))
    return 1 if result.get("failed") else 0


if __name__ == "__main__":
    raise SystemExit(main())
