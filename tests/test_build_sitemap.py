from __future__ import annotations

import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

import build_sitemap


class BuildSitemapTests(unittest.TestCase):
    def test_git_commit_timestamp_is_converted_to_utc(self) -> None:
        completed = subprocess.CompletedProcess(
            args=["git"],
            returncode=0,
            stdout="2026-08-07T19:05:19-07:00\n",
            stderr="",
        )
        tracked = subprocess.CompletedProcess(args=["git"], returncode=0, stdout="index.html\n", stderr="")
        clean = subprocess.CompletedProcess(args=["git"], returncode=0, stdout="", stderr="")
        with patch.object(build_sitemap.subprocess, "run", side_effect=[tracked, clean, completed]):
            timestamp = build_sitemap.get_git_last_commit(Path("index.html"), Path("."))

        self.assertEqual(timestamp, "2026-08-08T02:05:19Z")

    def test_restored_untracked_file_does_not_reuse_its_deleted_history_timestamp(self) -> None:
        untracked = subprocess.CompletedProcess(args=["git"], returncode=1, stdout="", stderr="not tracked")
        with patch.object(build_sitemap.subprocess, "run", return_value=untracked) as run:
            timestamp = build_sitemap.get_git_last_commit(Path("books/restored/index.html"), Path("."))

        self.assertIsNone(timestamp)
        self.assertEqual(run.call_count, 1)

    def test_modified_tracked_file_uses_its_filesystem_timestamp_until_commit(self) -> None:
        tracked = subprocess.CompletedProcess(args=["git"], returncode=0, stdout="books/index.html\n", stderr="")
        dirty = subprocess.CompletedProcess(args=["git"], returncode=1, stdout="", stderr="")
        with patch.object(build_sitemap.subprocess, "run", side_effect=[tracked, dirty]) as run:
            timestamp = build_sitemap.get_git_last_commit(Path("books/index.html"), Path("."))

        self.assertIsNone(timestamp)
        self.assertEqual(run.call_count, 2)


if __name__ == "__main__":
    unittest.main()
