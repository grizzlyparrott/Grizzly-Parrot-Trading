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
        with patch.object(build_sitemap.subprocess, "run", return_value=completed):
            timestamp = build_sitemap.get_git_last_commit(Path("index.html"), Path("."))

        self.assertEqual(timestamp, "2026-08-08T02:05:19Z")


if __name__ == "__main__":
    unittest.main()
