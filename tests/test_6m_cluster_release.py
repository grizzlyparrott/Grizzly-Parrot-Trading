import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SixMClusterReleaseTests(unittest.TestCase):
    def _run(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, *arguments],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

    def test_fail_closed_cluster_validator(self):
        result = self._run("scripts/validate_6m_cluster.py", "--warnings-as-errors")

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("0 errors, 0 warnings", result.stdout)

    def test_fail_closed_distinctiveness_audit(self):
        result = self._run("scripts/audit_6m_distinctiveness.py")

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("20 component signatures, 0 errors, 0 warnings", result.stdout)


if __name__ == "__main__":
    unittest.main()
