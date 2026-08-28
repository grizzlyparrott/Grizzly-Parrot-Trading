#!/usr/bin/env python3
"""Check external links in equity-index disclosures and the source basis."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import re
import socket
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

try:
    from .equity_index_cluster_config import ARTICLE_DIR, CLUSTER, ROOT
    from .validate_6z_cluster import source_disclosure
except ImportError:
    from equity_index_cluster_config import ARTICLE_DIR, CLUSTER, ROOT
    from validate_6z_cluster import source_disclosure


SOURCE_BASIS = ROOT / "artifacts" / "equity-index-source-basis.md"


def markdown_external_urls(raw: str) -> set[str]:
    return set(re.findall(r"\]\((https?://[^)\s]+)\)", raw))


def misleading_pdf_redirect(requested: str, resolved: str, content_type: str) -> bool:
    requested_pdf = urlparse(requested).path.lower().endswith(".pdf")
    resolved_pdf = urlparse(resolved).path.lower().endswith(".pdf")
    return requested_pdf and not resolved_pdf and "pdf" not in content_type.lower()


def collect_source_owners() -> dict[str, set[str]]:
    owners: dict[str, set[str]] = defaultdict(set)
    for filename in CLUSTER:
        raw = (ARTICLE_DIR / filename).read_text(encoding="utf-8", errors="strict")
        _, hrefs = source_disclosure(raw)
        for href in hrefs:
            if href.startswith(("https://", "http://")):
                owners[href].add(filename)
    source_basis_raw = SOURCE_BASIS.read_text(encoding="utf-8", errors="strict")
    for href in markdown_external_urls(source_basis_raw):
        owners[href].add("artifacts/equity-index-source-basis.md")
    return owners


def probe(url: str, timeout: float) -> dict:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "text/html,application/pdf,application/json,*/*;q=0.8",
            "Range": "bytes=0-2047",
            "User-Agent": "Mozilla/5.0 Grizzly-Parrot-source-audit/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            response.read(2048)
            status = int(response.status)
            resolved_url = response.geturl()
            content_type = response.headers.get("Content-Type", "")
            redirected_document = misleading_pdf_redirect(
                url, resolved_url, content_type
            )
            return {
                "status": status,
                "resolvedUrl": resolved_url,
                "contentType": content_type,
                "verdict": (
                    "error"
                    if redirected_document
                    else "pass" if 200 <= status < 400 else "error"
                ),
                "error": (
                    "PDF citation resolved to a non-PDF destination"
                    if redirected_document
                    else None
                ),
            }
    except urllib.error.HTTPError as exc:
        # These statuses commonly prove a protected official endpoint exists but
        # declined the automated request. They require human review, not a 404 label.
        verdict = "warning" if exc.code in {401, 403, 405, 429, 500, 502, 503, 504} else "error"
        return {
            "status": int(exc.code),
            "resolvedUrl": exc.geturl(),
            "contentType": exc.headers.get("Content-Type", "") if exc.headers else "",
            "verdict": verdict,
            "error": str(exc),
        }
    except (urllib.error.URLError, TimeoutError, socket.timeout, OSError) as exc:
        return {
            "status": None,
            "resolvedUrl": None,
            "contentType": None,
            "verdict": "warning",
            "error": str(exc),
        }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--workers", type=int, default=12)
    parser.add_argument("--warnings-as-errors", action="store_true")
    parser.add_argument(
        "--json",
        type=Path,
        default=ROOT / "artifacts" / "equity-index-source-link-report.json",
    )
    args = parser.parse_args()

    owners = collect_source_owners()

    results: dict[str, dict] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(probe, url, args.timeout): url for url in sorted(owners)
        }
        for future in concurrent.futures.as_completed(futures):
            url = futures[future]
            results[url] = future.result()

    records = []
    for url in sorted(results):
        record = {
            "url": url,
            "pages": sorted(owners[url]),
            **results[url],
        }
        records.append(record)
        if record["verdict"] != "pass":
            print(
                f"{record['verdict'].upper()} {record['status']} {url} "
                f"({', '.join(record['pages'])})"
            )

    errors = [record for record in records if record["verdict"] == "error"]
    warnings = [record for record in records if record["verdict"] == "warning"]
    manifest = {
        "pageCount": len(CLUSTER),
        "sourceBasisIncluded": True,
        "checkedDocumentCount": len(CLUSTER) + 1,
        "uniqueUrlCount": len(records),
        "passCount": len(records) - len(errors) - len(warnings),
        "warningCount": len(warnings),
        "errorCount": len(errors),
        "records": records,
    }
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline=""
    )
    print(
        f"Checked {len(records)} unique source URLs across {len(CLUSTER)} pages "
        "plus the source-basis artifact: "
        f"{len(errors)} errors, {len(warnings)} warnings."
    )
    return 1 if errors or (args.warnings_as_errors and warnings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
