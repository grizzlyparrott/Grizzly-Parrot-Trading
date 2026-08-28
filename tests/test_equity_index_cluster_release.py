import subprocess
import sys
import unittest
from pathlib import Path

from scripts.equity_index_cluster_config import CLUSTER, ROOT


FUTURES = ROOT / "futures-basics"
SHARED_STYLESHEET = (
    '<link rel="stylesheet" href="/futures-basics/'
    'currency-research-library.css?v=20260820a">'
)


class EquityIndexClusterReleaseTests(unittest.TestCase):
    def _run(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, *arguments],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

    def test_scope_is_the_35_existing_equity_index_pages(self):
        self.assertEqual(len(CLUSTER), 35)
        self.assertEqual(len(set(CLUSTER)), 35)
        for filename in CLUSTER:
            self.assertTrue((FUTURES / filename).is_file(), filename)

    def test_fail_closed_cluster_validator(self):
        result = self._run(
            "scripts/validate_equity_index_cluster.py",
            "--warnings-as-errors",
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("0 errors, 0 warnings", result.stdout)

    def test_fail_closed_distinctiveness_audit(self):
        result = self._run(
            "scripts/audit_equity_index_distinctiveness.py",
            "--json",
            "artifacts/equity-index-distinctiveness-report.json",
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("35 component signatures, 0 errors, 0 warnings", result.stdout)

    def test_all_pages_share_the_existing_green_black_stylesheet(self):
        self.assertTrue((FUTURES / "currency-research-library.css").is_file())
        self.assertFalse((FUTURES / "equity-index-research-library.css").exists())
        for filename in CLUSTER:
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                self.assertEqual(html.count(SHARED_STYLESHEET), 1)
                self.assertEqual(html.count("currency-library"), 1)
                self.assertNotIn("<style", html.lower())
                self.assertNotRegex(html, r"(?i)\sstyle\s*=")


if __name__ == "__main__":
    unittest.main()
