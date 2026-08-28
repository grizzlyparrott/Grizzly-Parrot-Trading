#!/usr/bin/env python3
"""Compare the merged equity-index release with production, file for file."""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

try:
    from .equity_index_cluster_config import BASE_URL, CLUSTER, ROOT
except ImportError:
    from equity_index_cluster_config import BASE_URL, CLUSTER, ROOT


DISCOVERY = (
    "futures-basics/index.html",
    "search-index.json",
    "sitemap.xml",
)


def normalized_bytes(value: bytes) -> bytes:
    """Remove a UTF-8 BOM and normalize only transport-neutral line endings."""
    if value.startswith(b"\xef\xbb\xbf"):
        value = value[3:]
    return value.replace(b"\r\n", b"\n").replace(b"\r", b"\n")


def digest(value: bytes) -> str:
    return hashlib.sha256(normalized_bytes(value)).hexdigest()


def fetch(url: str, timeout: float) -> tuple[int, bytes]:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "text/html,application/json,application/xml;q=0.9,*/*;q=0.8",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "User-Agent": "Grizzly-Parrot-release-verifier/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return int(response.status), response.read()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", required=True, help="merged main commit SHA")
    parser.add_argument(
        "--attempts",
        type=int,
        default=12,
        help="deployment polling rounds",
    )
    parser.add_argument("--interval", type=float, default=10.0)
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument(
        "--json",
        type=Path,
        default=ROOT / "artifacts" / "equity-index-live-verification.json",
    )
    args = parser.parse_args()

    paths = [f"futures-basics/{filename}" for filename in CLUSTER]
    paths.extend(DISCOVERY)
    records: list[dict] = []
    local_hashes: dict[str, str] = {}
    for relative in paths:
        local_path = ROOT / relative
        local_hash = digest(local_path.read_bytes())
        local_hashes[relative] = local_hash
        quoted_commit = urllib.parse.quote(args.commit, safe="")
        url = f"{BASE_URL}/{relative}?release={quoted_commit}"
        records.append(
            {
                "path": relative,
                "url": url,
                "localSha256": local_hash,
                "remoteSha256": None,
                "httpStatus": None,
                "attempts": 0,
                "exactMatch": False,
                "error": None,
            }
        )

    for attempt in range(1, args.attempts + 1):
        pending = [record for record in records if not record["exactMatch"]]
        if not pending:
            break
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(8, len(pending))) as pool:
            futures = {
                pool.submit(fetch, str(record["url"]), args.timeout): record
                for record in pending
            }
            for future, record in futures.items():
                record["attempts"] = attempt
                try:
                    status, remote = future.result()
                    remote_hash = digest(remote)
                    record["httpStatus"] = status
                    record["remoteSha256"] = remote_hash
                    record["exactMatch"] = (
                        status == 200 and remote_hash == local_hashes[str(record["path"])]
                    )
                    record["error"] = None
                except (OSError, urllib.error.URLError) as exc:
                    record["error"] = str(exc)
        if attempt < args.attempts and any(
            not record["exactMatch"] for record in records
        ):
            time.sleep(args.interval)

    for record in records:
        state = "MATCH" if record["exactMatch"] else "MISMATCH"
        print(f"{state} {record['path']} after {record['attempts']} attempt(s)")

    failures = [record for record in records if not record["exactMatch"]]
    manifest = {
        "commit": args.commit,
        "baseUrl": BASE_URL,
        "fileCount": len(records),
        "exactMatchCount": len(records) - len(failures),
        "failureCount": len(failures),
        "records": records,
    }
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline=""
    )
    print(
        f"Verified {len(records)} production files: "
        f"{len(records) - len(failures)} exact matches, {len(failures)} failures."
    )
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
