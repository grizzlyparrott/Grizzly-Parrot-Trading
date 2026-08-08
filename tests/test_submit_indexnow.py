from __future__ import annotations

import shutil
import unittest
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator
from unittest.mock import patch

import scripts.submit_indexnow as indexnow
from scripts.submit_indexnow import (
    HttpResult,
    IndexNowError,
    MAX_URLS_PER_REQUEST,
    SiteConfig,
    chunk_urls,
    collect_changed_urls,
    load_key,
    load_sitemap,
    normalize_base_url,
    parse_sitemap,
    post_with_retry,
    submit_urls,
    verify_live_deployment,
)


BASE_URL = "https://grizzlyparrottrading.com/"
HOST = "grizzlyparrottrading.com"
KEY = "88679a166d56460fbce57ed37803582a"


def sitemap(entries: list[tuple[str, str]]) -> str:
    rows = ["<?xml version=\"1.0\" encoding=\"UTF-8\"?>", '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, lastmod in entries:
        rows.append(f"<url><loc>{url}</loc><lastmod>{lastmod}</lastmod></url>")
    rows.append("</urlset>")
    return "\n".join(rows) + "\n"


@contextmanager
def temporary_directory() -> Iterator[str]:
    # tempfile uses mode 0700, which some restricted Windows runners translate
    # to an unusable ACL. A normal workspace directory remains portable while
    # keeping every fixture isolated and recoverably scoped.
    root = Path.cwd() / "tests" / ".tmp"
    root.mkdir(parents=True, exist_ok=True)
    path = root / uuid.uuid4().hex
    path.mkdir()
    try:
        yield str(path)
    finally:
        shutil.rmtree(path)


class IndexNowTests(unittest.TestCase):
    def test_base_url_and_sitemap_reject_foreign_hosts(self) -> None:
        normalized, host = normalize_base_url(BASE_URL)
        self.assertEqual(normalized, BASE_URL)
        self.assertEqual(host, HOST)
        with self.assertRaises(IndexNowError):
            parse_sitemap(
                sitemap([("https://example.com/page.html", "2026-08-08T00:00:00Z")]),
                BASE_URL,
                HOST,
            )

    def test_key_file_must_contain_one_valid_key(self) -> None:
        with temporary_directory() as directory:
            root = Path(directory)
            key_file = root / f"{KEY}.txt"
            key_file.write_text(KEY + "\n", encoding="utf-8")
            loaded, location = load_key(root, key_file.name, BASE_URL)
            self.assertEqual(loaded, KEY)
            self.assertEqual(location, f"{BASE_URL}{KEY}.txt")

            key_file.write_text(KEY + " extra\n", encoding="utf-8")
            with self.assertRaises(IndexNowError):
                load_key(root, key_file.name, BASE_URL)

            key_file.write_text(KEY + "\n\n", encoding="utf-8")
            with self.assertRaises(IndexNowError):
                load_key(root, key_file.name, BASE_URL)

    def test_changed_collection_includes_modified_added_and_removed_pages(self) -> None:
        with temporary_directory() as directory:
            root = Path(directory)
            (root / f"{KEY}.txt").write_text(KEY + "\n", encoding="utf-8")
            (root / "a.html").write_text(
                '<link rel="canonical" href="https://grizzlyparrottrading.com/a.html"><p>new</p>',
                encoding="utf-8",
            )
            initial = sitemap(
                [
                    (f"{BASE_URL}a.html", "2026-08-01T00:00:00Z"),
                    (f"{BASE_URL}removed.html", "2026-08-01T00:00:00Z"),
                ]
            )
            # Keep a.html's lastmod unchanged to prove the HTML diff is also honored.
            (root / "new.html").write_text(
                '<link rel="canonical" href="https://grizzlyparrottrading.com/new.html">',
                encoding="utf-8",
            )
            current = sitemap(
                [
                    (f"{BASE_URL}a.html", "2026-08-01T00:00:00Z"),
                    (f"{BASE_URL}new.html", "2026-08-08T00:00:00Z"),
                ]
            )
            (root / "sitemap.xml").write_text(current, encoding="utf-8")

            config = SiteConfig(
                repo_root=root,
                base_url=BASE_URL,
                host=HOST,
                key=KEY,
                key_location=f"{BASE_URL}{KEY}.txt",
                sitemap_path=root / "sitemap.xml",
                endpoint="https://api.indexnow.org/indexnow",
            )
            current_map = load_sitemap(config.sitemap_path, BASE_URL, HOST)
            previous_blobs = {
                "sitemap.xml": initial.encode(),
                "a.html": b'<link href="https://grizzlyparrottrading.com/a.html" rel="canonical"><p>old</p>',
                "removed.html": b'<link rel="canonical" href="https://grizzlyparrottrading.com/removed.html">',
            }

            with (
                patch.object(
                    indexnow,
                    "_git_file",
                    side_effect=lambda repo, revision, path: previous_blobs.get(path),
                ),
                patch.object(
                    indexnow,
                    "_git_changed_paths",
                    return_value=[
                        ("M", ["a.html"]),
                        ("D", ["removed.html"]),
                        ("A", ["new.html"]),
                    ],
                ),
            ):
                selected = collect_changed_urls(config, current_map, "base", "head")
            self.assertEqual(
                selected,
                sorted(
                    [
                        f"{BASE_URL}a.html",
                        f"{BASE_URL}new.html",
                        f"{BASE_URL}removed.html",
                    ]
                ),
            )

    def test_git_name_status_parser_handles_renames(self) -> None:
        parsed = indexnow._parse_git_name_status(
            b"M\0a.html\0R100\0old name.html\0new name.html\0"
        )
        self.assertEqual(
            parsed,
            [("M", ["a.html"]), ("R100", ["old name.html", "new name.html"])],
        )

    def test_live_verification_requires_matching_key_and_sitemap(self) -> None:
        with temporary_directory() as directory:
            root = Path(directory)
            local_sitemap = sitemap([(BASE_URL, "2026-08-08T00:00:00Z")])
            sitemap_path = root / "sitemap.xml"
            sitemap_path.write_text(local_sitemap, encoding="utf-8")
            config = SiteConfig(
                repo_root=root,
                base_url=BASE_URL,
                host=HOST,
                key=KEY,
                key_location=f"{BASE_URL}{KEY}.txt",
                sitemap_path=sitemap_path,
                endpoint="https://api.indexnow.org/indexnow",
            )
            expected = parse_sitemap(local_sitemap, BASE_URL, HOST)

            def matching_get(url: str, timeout: float) -> str:
                del timeout
                return KEY + "\n" if url.endswith(".txt") else local_sitemap

            verify_live_deployment(
                config,
                expected,
                timeout_seconds=0,
                interval_seconds=1,
                request_timeout=1,
                get_text=matching_get,
            )

            def stale_get(url: str, timeout: float) -> str:
                del timeout
                return "wrong-key\n" if url.endswith(".txt") else local_sitemap

            with self.assertRaises(IndexNowError):
                verify_live_deployment(
                    config,
                    expected,
                    timeout_seconds=0,
                    interval_seconds=1,
                    request_timeout=1,
                    get_text=stale_get,
                )

    def test_retry_and_submission_state_are_explicit(self) -> None:
        calls: list[int] = []
        sleeps: list[float] = []

        def flaky_post(endpoint: str, payload: dict[str, object], timeout: float) -> HttpResult:
            del endpoint, payload, timeout
            calls.append(1)
            return HttpResult(429, "busy", "0") if len(calls) == 1 else HttpResult(202, "")

        response = post_with_retry(
            "https://api.indexnow.org/indexnow",
            {},
            request_timeout=1,
            max_attempts=2,
            post_json=flaky_post,
            sleeper=sleeps.append,
        )
        self.assertEqual(response.status, 202)
        self.assertEqual(len(calls), 2)
        self.assertEqual(sleeps, [0.0])

        config = SiteConfig(
            repo_root=Path("."),
            base_url=BASE_URL,
            host=HOST,
            key=KEY,
            key_location=f"{BASE_URL}{KEY}.txt",
            sitemap_path=Path("sitemap.xml"),
            endpoint="https://api.indexnow.org/indexnow",
        )
        batches = submit_urls(
            config,
            [BASE_URL],
            request_timeout=1,
            max_attempts=1,
            post_json=lambda endpoint, payload, timeout: HttpResult(202, ""),
            sleeper=lambda delay: None,
        )
        self.assertEqual(batches[0]["state"], "accepted_pending_key_validation")

        with self.assertRaises(IndexNowError):
            post_with_retry(
                "https://api.indexnow.org/indexnow",
                {},
                request_timeout=1,
                max_attempts=4,
                post_json=lambda endpoint, payload, timeout: HttpResult(403, "invalid key"),
                sleeper=lambda delay: None,
            )

    def test_batches_respect_protocol_limit(self) -> None:
        urls = [f"{BASE_URL}{index}.html" for index in range(MAX_URLS_PER_REQUEST + 1)]
        batches = chunk_urls(urls)
        self.assertEqual([len(batch) for batch in batches], [MAX_URLS_PER_REQUEST, 1])

if __name__ == "__main__":
    unittest.main()
