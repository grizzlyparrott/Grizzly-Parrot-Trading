#!/usr/bin/env python3
"""Submit deployed Grizzly Parrot Trading URLs through the IndexNow API.

The script deliberately fails closed: it validates the public key, the local
sitemap, and the deployed sitemap before transmitting any URLs. Automated runs
submit only URLs that changed since the preceding successful Pages deployment;
manual runs can perform a full sitemap backfill.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from typing import Callable, Iterable, Sequence
from urllib.parse import quote, urljoin, urlsplit, urlunsplit


DEFAULT_BASE_URL = "https://grizzlyparrottrading.com/"
DEFAULT_KEY_FILE = "88679a166d56460fbce57ed37803582a.txt"
DEFAULT_SITEMAP = "sitemap.xml"
DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow"
MAX_URLS_PER_REQUEST = 10_000
KEY_PATTERN = re.compile(r"[A-Za-z0-9-]{8,128}")
USER_AGENT = "GrizzlyParrotTrading-IndexNow/1.0 (+https://grizzlyparrottrading.com/)"


class IndexNowError(RuntimeError):
    """Raised when validation or submission cannot be completed safely."""


@dataclass(frozen=True)
class SiteConfig:
    repo_root: Path
    base_url: str
    host: str
    key: str
    key_location: str
    sitemap_path: Path
    endpoint: str


@dataclass(frozen=True)
class HttpResult:
    status: int
    body: str
    retry_after: str | None = None


class _CanonicalLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonical: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self.canonical is not None or tag.lower() != "link":
            return
        values = {name.lower(): value for name, value in attrs if value is not None}
        rel_tokens = {token.lower() for token in values.get("rel", "").split()}
        href = values.get("href")
        if "canonical" in rel_tokens and href:
            self.canonical = href.strip()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def normalize_base_url(raw_url: str) -> tuple[str, str]:
    parsed = urlsplit(raw_url)
    if parsed.scheme.lower() != "https" or not parsed.hostname:
        raise IndexNowError("The site base URL must be an HTTPS origin.")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise IndexNowError("The site base URL must not contain credentials, a query, or a fragment.")
    if parsed.path not in ("", "/"):
        raise IndexNowError("The site base URL must point to the host root.")
    host = parsed.hostname.lower()
    if parsed.port not in (None, 443):
        raise IndexNowError("The site base URL must use the default HTTPS port.")
    return urlunsplit(("https", host, "/", "", "")), host


def normalize_site_url(raw_url: str, base_url: str, host: str) -> str:
    parsed = urlsplit(urljoin(base_url, raw_url.strip()))
    if parsed.scheme.lower() != "https" or (parsed.hostname or "").lower() != host:
        raise IndexNowError(f"URL is outside the configured HTTPS host: {raw_url}")
    try:
        port = parsed.port
    except ValueError as exc:
        raise IndexNowError(f"URL has an invalid port: {raw_url}") from exc
    if port not in (None, 443):
        raise IndexNowError(f"URL uses an unsupported port: {raw_url}")
    if parsed.query or parsed.fragment:
        raise IndexNowError(f"Sitemap URL must not contain a query or fragment: {raw_url}")
    path = parsed.path or "/"
    return urlunsplit(("https", host, path, "", ""))


def _resolve_repo_file(repo_root: Path, relative_path: str | Path) -> Path:
    root = repo_root.resolve()
    candidate = (root / relative_path).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise IndexNowError(f"Path escapes the repository root: {relative_path}") from exc
    return candidate


def load_key(repo_root: Path, key_file: str | Path, base_url: str) -> tuple[str, str]:
    path = _resolve_repo_file(repo_root, key_file)
    if not path.is_file():
        raise IndexNowError(f"IndexNow key file does not exist: {path}")

    raw = path.read_text(encoding="utf-8-sig")
    key = raw.rstrip("\r\n")
    valid_file_forms = {key, key + "\n", key + "\r\n"}
    if (
        raw not in valid_file_forms
        or key != key.strip()
        or "\n" in key
        or "\r" in key
        or not KEY_PATTERN.fullmatch(key)
    ):
        raise IndexNowError("IndexNow key file must contain one valid 8-128 character key.")

    relative = path.relative_to(repo_root.resolve()).as_posix()
    key_location = urljoin(base_url, quote(relative, safe="/-._~"))
    return key, key_location


def parse_sitemap(data: str | bytes, base_url: str, host: str) -> dict[str, str]:
    try:
        root = ET.fromstring(data)
    except ET.ParseError as exc:
        raise IndexNowError(f"Invalid sitemap XML: {exc}") from exc

    urls: dict[str, str] = {}
    for node in root:
        if _local_name(node.tag) != "url":
            continue
        fields = {
            _local_name(child.tag): (child.text or "").strip()
            for child in node
        }
        if not fields.get("loc"):
            raise IndexNowError("Sitemap contains a URL entry without <loc>.")
        url = normalize_site_url(fields["loc"], base_url, host)
        lastmod = fields.get("lastmod", "")
        if url in urls and urls[url] != lastmod:
            raise IndexNowError(f"Sitemap contains conflicting duplicate URL entries: {url}")
        urls[url] = lastmod

    if not urls:
        raise IndexNowError("Sitemap does not contain any URL entries.")
    return urls


def load_sitemap(path: Path, base_url: str, host: str) -> dict[str, str]:
    if not path.is_file():
        raise IndexNowError(f"Sitemap does not exist: {path}")
    return parse_sitemap(path.read_bytes(), base_url, host)


def _run_git(repo_root: Path, arguments: Sequence[str], *, text: bool = False):
    result = subprocess.run(
        ["git", *arguments],
        cwd=repo_root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=text,
        check=False,
    )
    if result.returncode != 0:
        stderr = result.stderr.strip() if text else result.stderr.decode("utf-8", "replace").strip()
        raise IndexNowError(f"Git command failed: {stderr or 'unknown error'}")
    return result.stdout


def _git_file(repo_root: Path, revision: str, relative_path: str) -> bytes | None:
    result = subprocess.run(
        ["git", "show", f"{revision}:{PurePosixPath(relative_path).as_posix()}"],
        cwd=repo_root,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode == 0:
        return result.stdout
    error = result.stderr.decode("utf-8", "replace")
    if "does not exist in" in error or "exists on disk, but not in" in error:
        return None
    raise IndexNowError(f"Unable to read {relative_path} at {revision}: {error.strip()}")


def _git_changed_paths(repo_root: Path, base_revision: str, head_revision: str) -> list[tuple[str, list[str]]]:
    raw = _run_git(
        repo_root,
        ["diff", "--name-status", "--find-renames", "-z", base_revision, head_revision, "--"],
    )

    return _parse_git_name_status(raw)


def _parse_git_name_status(raw: bytes) -> list[tuple[str, list[str]]]:
    fields = raw.split(b"\0")
    if fields and fields[-1] == b"":
        fields.pop()

    changes: list[tuple[str, list[str]]] = []
    cursor = 0
    while cursor < len(fields):
        status = fields[cursor].decode("ascii", "replace")
        cursor += 1
        path_count = 2 if status[:1] in {"R", "C"} else 1
        if cursor + path_count > len(fields):
            raise IndexNowError("Unable to parse Git changed-file output.")
        paths = [fields[cursor + offset].decode("utf-8", "surrogateescape") for offset in range(path_count)]
        cursor += path_count
        changes.append((status, paths))
    return changes


def _fallback_url(relative_path: str, base_url: str, host: str) -> str:
    path = PurePosixPath(relative_path)
    if path.suffix.lower() != ".html":
        raise IndexNowError(f"Cannot derive a page URL from non-HTML path: {relative_path}")
    if path.as_posix() == "index.html":
        raw_url = base_url
    elif path.name.lower() == "index.html":
        raw_url = urljoin(base_url, f"{path.parent.as_posix().rstrip('/')}/")
    else:
        raw_url = urljoin(base_url, path.as_posix())
    return normalize_site_url(raw_url, base_url, host)


def _canonical_from_html(data: bytes, relative_path: str, base_url: str, host: str) -> str:
    parser = _CanonicalLinkParser()
    parser.feed(data.decode("utf-8", "replace"))
    if parser.canonical:
        return normalize_site_url(parser.canonical, base_url, host)
    return _fallback_url(relative_path, base_url, host)


def collect_changed_urls(
    config: SiteConfig,
    current_sitemap: dict[str, str],
    base_revision: str,
    head_revision: str,
) -> list[str]:
    sitemap_relative = config.sitemap_path.relative_to(config.repo_root).as_posix()
    previous_sitemap_blob = _git_file(config.repo_root, base_revision, sitemap_relative)
    if previous_sitemap_blob is None:
        return sorted(current_sitemap)

    previous_sitemap = parse_sitemap(previous_sitemap_blob, config.base_url, config.host)
    changed = {
        url
        for url in previous_sitemap.keys() | current_sitemap.keys()
        if previous_sitemap.get(url) != current_sitemap.get(url)
    }

    for status, paths in _git_changed_paths(config.repo_root, base_revision, head_revision):
        code = status[:1]
        if code in {"R", "C"}:
            old_path, new_path = paths
        elif code == "A":
            old_path, new_path = None, paths[0]
        elif code == "D":
            old_path, new_path = paths[0], None
        else:
            old_path = new_path = paths[0]

        if old_path and old_path.lower().endswith(".html"):
            old_blob = _git_file(config.repo_root, base_revision, old_path)
            if old_blob is not None:
                old_url = _canonical_from_html(old_blob, old_path, config.base_url, config.host)
                if old_url in previous_sitemap:
                    changed.add(old_url)

        if new_path and new_path.lower().endswith(".html"):
            current_path = _resolve_repo_file(config.repo_root, PurePosixPath(new_path))
            if current_path.is_file():
                new_url = _canonical_from_html(
                    current_path.read_bytes(), new_path, config.base_url, config.host
                )
                if new_url in current_sitemap:
                    changed.add(new_url)

    return sorted(changed)


def chunk_urls(urls: Sequence[str], size: int = MAX_URLS_PER_REQUEST) -> list[list[str]]:
    if size < 1 or size > MAX_URLS_PER_REQUEST:
        raise IndexNowError(f"Batch size must be between 1 and {MAX_URLS_PER_REQUEST}.")
    return [list(urls[index : index + size]) for index in range(0, len(urls), size)]


def _read_http_response(response) -> HttpResult:
    body = response.read().decode("utf-8", "replace")
    return HttpResult(
        status=int(response.status),
        body=body,
        retry_after=response.headers.get("Retry-After"),
    )


def _http_get(url: str, timeout: float) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Cache-Control": "no-cache"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise IndexNowError(f"GET {url} returned HTTP {response.status}.")
        return response.read().decode("utf-8-sig", "strict")


def verify_live_deployment(
    config: SiteConfig,
    expected_sitemap: dict[str, str],
    *,
    timeout_seconds: float,
    interval_seconds: float,
    request_timeout: float,
    get_text: Callable[[str, float], str] = _http_get,
) -> None:
    if timeout_seconds < 0 or interval_seconds <= 0:
        raise IndexNowError("Live-check timeout must be non-negative and interval must be positive.")

    deadline = time.monotonic() + timeout_seconds
    last_error = "live deployment did not match"
    sitemap_relative = config.sitemap_path.relative_to(config.repo_root).as_posix()
    sitemap_url = urljoin(config.base_url, quote(sitemap_relative, safe="/-._~"))

    while True:
        try:
            live_key = get_text(config.key_location, request_timeout).rstrip("\r\n")
            if live_key != config.key:
                raise IndexNowError("The deployed IndexNow key file does not match the repository key.")
            live_sitemap = parse_sitemap(
                get_text(sitemap_url, request_timeout), config.base_url, config.host
            )
            if live_sitemap != expected_sitemap:
                raise IndexNowError("The deployed sitemap does not match the checked-out sitemap.")
            return
        except (IndexNowError, UnicodeError, urllib.error.URLError, TimeoutError, OSError) as exc:
            last_error = str(exc)

        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise IndexNowError(f"Live deployment verification failed: {last_error}")
        time.sleep(min(interval_seconds, remaining))


def _http_post_json(endpoint: str, payload: dict[str, object], timeout: float) -> HttpResult:
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload, separators=(",", ":")).encode("utf-8"),
        headers={
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json, text/plain, */*",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return _read_http_response(response)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        return HttpResult(exc.code, body, exc.headers.get("Retry-After"))


def _retry_delay(result: HttpResult | None, attempt: int) -> float:
    if result and result.retry_after:
        try:
            return min(max(float(result.retry_after), 0.0), 60.0)
        except ValueError:
            pass
    return min(2.0 ** (attempt - 1), 30.0)


def post_with_retry(
    endpoint: str,
    payload: dict[str, object],
    *,
    request_timeout: float,
    max_attempts: int,
    post_json: Callable[[str, dict[str, object], float], HttpResult] = _http_post_json,
    sleeper: Callable[[float], None] = time.sleep,
) -> HttpResult:
    if max_attempts < 1:
        raise IndexNowError("Maximum attempts must be at least one.")

    last_network_error: str | None = None
    for attempt in range(1, max_attempts + 1):
        result: HttpResult | None = None
        try:
            result = post_json(endpoint, payload, request_timeout)
            if result.status in {200, 202}:
                return result
            retryable = result.status == 429 or 500 <= result.status <= 599
            if not retryable:
                detail = result.body.strip()[:500] or "no response body"
                raise IndexNowError(f"IndexNow returned HTTP {result.status}: {detail}")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_network_error = str(getattr(exc, "reason", exc))

        if attempt == max_attempts:
            if result is not None:
                detail = result.body.strip()[:500] or "no response body"
                raise IndexNowError(
                    f"IndexNow returned HTTP {result.status} after {max_attempts} attempts: {detail}"
                )
            raise IndexNowError(
                f"IndexNow request failed after {max_attempts} attempts: {last_network_error}"
            )
        sleeper(_retry_delay(result, attempt))

    raise AssertionError("unreachable")


def submit_urls(
    config: SiteConfig,
    urls: Sequence[str],
    *,
    request_timeout: float,
    max_attempts: int,
    post_json: Callable[[str, dict[str, object], float], HttpResult] = _http_post_json,
    sleeper: Callable[[float], None] = time.sleep,
) -> list[dict[str, object]]:
    results: list[dict[str, object]] = []
    for batch_number, batch in enumerate(chunk_urls(urls), start=1):
        payload: dict[str, object] = {
            "host": config.host,
            "key": config.key,
            "keyLocation": config.key_location,
            "urlList": batch,
        }
        response = post_with_retry(
            config.endpoint,
            payload,
            request_timeout=request_timeout,
            max_attempts=max_attempts,
            post_json=post_json,
            sleeper=sleeper,
        )
        results.append(
            {
                "batch": batch_number,
                "url_count": len(batch),
                "http_status": response.status,
                "state": "submitted" if response.status == 200 else "accepted_pending_key_validation",
            }
        )
    return results


def build_config(args: argparse.Namespace) -> SiteConfig:
    repo_root = Path(args.repo_root).resolve()
    if not repo_root.is_dir():
        raise IndexNowError(f"Repository root does not exist: {repo_root}")
    base_url, host = normalize_base_url(args.base_url)
    key, key_location = load_key(repo_root, args.key_file, base_url)
    sitemap_path = _resolve_repo_file(repo_root, args.sitemap)
    endpoint = urlsplit(args.endpoint)
    if endpoint.scheme.lower() != "https" or not endpoint.hostname:
        raise IndexNowError("The IndexNow endpoint must be an HTTPS URL.")
    return SiteConfig(
        repo_root=repo_root,
        base_url=base_url,
        host=host,
        key=key,
        key_location=key_location,
        sitemap_path=sitemap_path,
        endpoint=args.endpoint,
    )


def _write_report(path: str | None, report: dict[str, object]) -> None:
    if not path:
        return
    report_path = Path(path)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--key-file", default=DEFAULT_KEY_FILE)
    parser.add_argument("--sitemap", default=DEFAULT_SITEMAP)
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--all", action="store_true", help="Submit every URL in the sitemap.")
    mode.add_argument("--changed-since", metavar="GIT_SHA", help="Submit URLs changed since this commit.")
    parser.add_argument("--head", default="HEAD", help="Head revision for changed-URL detection.")
    parser.add_argument("--dry-run", action="store_true", help="Validate and report without sending URLs.")
    parser.add_argument("--skip-live-check", action="store_true", help="Skip public key and sitemap checks.")
    parser.add_argument("--live-check-timeout", type=float, default=300.0)
    parser.add_argument("--live-check-interval", type=float, default=10.0)
    parser.add_argument("--request-timeout", type=float, default=30.0)
    parser.add_argument("--max-attempts", type=int, default=4)
    parser.add_argument("--print-urls", action="store_true")
    parser.add_argument("--report", help="Write a machine-readable JSON report.")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    report: dict[str, object] = {
        "version": 1,
        "generated_at": _utc_now(),
        "status": "failed",
    }

    try:
        config = build_config(args)
        current_sitemap = load_sitemap(config.sitemap_path, config.base_url, config.host)
        if args.all:
            scope = "all"
            urls = sorted(current_sitemap)
        else:
            scope = "changed"
            urls = collect_changed_urls(config, current_sitemap, args.changed_since, args.head)

        report.update(
            {
                "scope": scope,
                "host": config.host,
                "endpoint": config.endpoint,
                "key_location": config.key_location,
                "url_count": len(urls),
                "urls": urls,
            }
        )

        print(f"IndexNow scope: {scope}")
        print(f"Validated sitemap URLs: {len(current_sitemap)}")
        print(f"URLs selected for submission: {len(urls)}")
        if args.print_urls:
            for url in urls:
                print(url)

        if not args.skip_live_check:
            verify_live_deployment(
                config,
                current_sitemap,
                timeout_seconds=args.live_check_timeout,
                interval_seconds=args.live_check_interval,
                request_timeout=args.request_timeout,
            )
            report["live_deployment_verified"] = True
            print("Live key and sitemap verification: passed")
        else:
            report["live_deployment_verified"] = False
            print("Live key and sitemap verification: skipped")

        if args.dry_run:
            report["status"] = "dry_run"
            report["batches"] = []
            print("Dry run complete; no IndexNow request was sent.")
        elif not urls:
            report["status"] = "no_urls"
            report["batches"] = []
            print("No changed URLs require submission.")
        else:
            batches = submit_urls(
                config,
                urls,
                request_timeout=args.request_timeout,
                max_attempts=args.max_attempts,
            )
            report["batches"] = batches
            report["status"] = (
                "accepted_pending_key_validation"
                if any(batch["http_status"] == 202 for batch in batches)
                else "submitted"
            )
            print(f"IndexNow submission complete: {len(batches)} batch(es).")

        _write_report(args.report, report)
        return 0
    except (IndexNowError, OSError, subprocess.SubprocessError) as exc:
        report["error"] = str(exc)
        _write_report(args.report, report)
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
