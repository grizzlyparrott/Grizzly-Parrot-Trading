import subprocess
import sys
import unittest
from pathlib import Path

from scripts.validate_6s_cluster import CLUSTER as SIX_S_CLUSTER
from scripts.validate_6z_cluster import CLUSTER as SIX_Z_CLUSTER


ROOT = Path(__file__).resolve().parents[1]
FUTURES = ROOT / "futures-basics"
SHARED_STYLESHEET = (
    '<link rel="stylesheet" href="/futures-basics/'
    'currency-research-library.css?v=20260820a">'
)


class SixZClusterReleaseTests(unittest.TestCase):
    def _run(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, *arguments],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

    def test_fail_closed_cluster_validator(self):
        result = self._run("scripts/validate_6z_cluster.py", "--warnings-as-errors")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("0 errors, 0 warnings", result.stdout)

    def test_fail_closed_distinctiveness_audit(self):
        result = self._run("scripts/audit_6z_distinctiveness.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("20 component signatures, 0 errors, 0 warnings", result.stdout)

    def test_6s_and_6z_share_one_physical_stylesheet_and_namespace(self):
        self.assertTrue((FUTURES / "currency-research-library.css").is_file())
        self.assertFalse((FUTURES / "6z-research-library.css").exists())
        for filename in (*SIX_S_CLUSTER, *SIX_Z_CLUSTER):
            with self.subTest(filename=filename):
                html = (FUTURES / filename).read_text(encoding="utf-8")
                self.assertEqual(html.count(SHARED_STYLESHEET), 1)
                self.assertEqual(html.count("currency-library"), 1)
                self.assertNotRegex(html, r'class=["\'][^"\']*\bzar-')
                self.assertNotIn("6z-research-library.css", html)


if __name__ == "__main__":
    unittest.main()
